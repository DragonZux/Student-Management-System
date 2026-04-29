from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.db.database import connect_to_mongo, close_mongo_connection
from app.core.config import settings
from app.routers.main_router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await connect_to_mongo()
    yield
    # Shutdown logic
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Professional Student Management System API",
    version=settings.VERSION,
    lifespan=lifespan,
    redirect_slashes=True
)

import time
from fastapi.middleware.gzip import GZipMiddleware

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://smile-carpentry-depose.ngrok-free.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GZip compression (Optimizes response size)
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.middleware("http")
async def log_requests(request, call_next):
    # Skip logging for WebSocket connections
    if request.headers.get("upgrade", "").lower() == "websocket":
        return await call_next(request)
        
    start_time = time.perf_counter()
    response = await call_next(request)
    
    # Handle absolute redirects that might point to internal Docker hostnames
    if response.status_code in (301, 302, 303, 307, 308) and "location" in response.headers:
        location = response.headers["location"]
        # Match various internal hostname variants
        internal_hosts = ("backend", "localhost", "127.0.0.1", "backend:8000", "0.0.0.0", "host.docker.internal")
        
        if any(h in location for h in internal_hosts) or location.startswith("/"):
            # Force relative path for redirect if it points to internal hosts
            from urllib.parse import urlparse
            parsed = urlparse(location)
            
            # If it's an absolute URL pointing to internal host, make it relative
            if any(h in location for h in internal_hosts):
                relative_location = parsed.path
                if parsed.query:
                    relative_location += f"?{parsed.query}"
            else:
                relative_location = location
            
            # Ensure the /api prefix is preserved if needed
            if request.url.path.startswith("/api") and not relative_location.startswith("/api"):
                # Handle leading slash
                relative_location = f"/api{relative_location if relative_location.startswith('/') else '/' + relative_location}"
            
            # Prevent trivial loops
            if relative_location == request.url.path + (f"?{request.url.query}" if request.url.query else ""):
                return response

            response.headers["location"] = relative_location

    if settings.DEBUG:
        process_time = (time.perf_counter() - start_time) * 1000
        print(f"DEBUG: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.2f}ms")
        
    return response


# Include All Routers
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/docs",
        "version": settings.VERSION
    }
