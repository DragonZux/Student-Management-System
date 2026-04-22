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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request, call_next):
    # Skip logging for WebSocket connections to avoid potential protocol upgrade issues
    if request.headers.get("upgrade", "").lower() == "websocket":
        return await call_next(request)
        
    import time
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    print(f"DEBUG: {request.method} {request.url.path} - Status: {response.status_code} - Duration: {duration:.4f}s")
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
