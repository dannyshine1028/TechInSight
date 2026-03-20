from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.init_db import init_db
from app.api.v1.api import api_router
import logging

# Logging configuration
logging.basicConfig(
    level=logging.INFO if settings.environment == "development" else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Initialize database tables
init_db()

app = FastAPI(
    title="TechInSight API",
    description="AI/ML powered document management with embeddings",
    version="1.0.0"
)

# CORS configuration
# デフォルトで開発環境の設定を使用（.envファイルでENVIRONMENTが設定されていない場合）
environment = getattr(settings, 'environment', 'development')
logger.info(f"CORS configuration: environment={environment}")

if environment == "development":
    cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
else:
    cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://your-production-domain.com",
    ]

logger.info(f"CORS allowed origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
# Support both /api/v1 and /api for backward compatibility
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")  # Backward compatibility


@app.get("/")
async def root():
    return {"message": "TechInSight API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
