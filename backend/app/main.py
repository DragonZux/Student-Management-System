from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import connect_to_mongo, close_mongo_connection
from app.core.config import settings
from app.api.main_router import api_router

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
    lifespan=lifespan
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
