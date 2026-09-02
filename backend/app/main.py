from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.api.endpoints import router as api_router
from backend.app.services.rag_engine import rag_engine
from backend.app.services.ml_engine import ml_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database tables and load policies / models
    print(f"Initializing database at {settings.DATABASE_URL}...")
    await init_db()
    print("Database tables initialized.")

    print("Indexing RAG policy knowledge base...")
    rag_engine.load_and_index_policies()
    print(f"Indexed {len(rag_engine.clauses)} policy clauses.")

    print("Checking ML Risk Model...")
    loaded = ml_engine.load_model_if_exists()
    if loaded:
        print(f"ML Model loaded: {ml_engine.model_metadata.get('model_name', 'Unknown')}")
    else:
        print("Warning: ML model not found in artifacts, will use heuristic fallback until trained.")

    yield
    print("Shutting down AI Payment Risk Copilot Backend.")

app = FastAPI(
    title="Razorpay AI Payment Risk Copilot API",
    description="Enterprise-grade autonomous AI risk management system for the Razorpay AI Buildathon.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Endpoints FIRST
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {
        "status": "OK",
        "ml_model_loaded": ml_engine.pipeline is not None,
        "policies_indexed": len(rag_engine.clauses),
        "app_env": settings.APP_ENV
    }

# Mount built frontend if dist exists AFTER API routes
dist_dir = settings.BASE_DIR / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")

    @app.get("/")
    async def serve_frontend():
        return FileResponse(dist_dir / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = dist_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_dir / "index.html")
else:
    @app.get("/")
    async def root():
        return {
            "service": settings.APP_NAME,
            "version": "1.0.0",
            "status": "HEALTHY",
            "docs": "/docs",
            "env": settings.APP_ENV
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
