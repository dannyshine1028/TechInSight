from fastapi import APIRouter
from app.api.v1.endpoints import documents, embeddings, analytics, mentions, document_links

api_router = APIRouter()
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(embeddings.router, prefix="/embeddings", tags=["embeddings"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(mentions.router, prefix="/mentions", tags=["mentions"])
api_router.include_router(document_links.router, prefix="/document-links", tags=["document-links"])