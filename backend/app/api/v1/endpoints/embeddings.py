from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.document import EmbeddingRequest, EmbeddingResponse, SimilarityRequest, SimilarityResponse
from app.services.embedding_service import embedding_service, EMBEDDING_AVAILABLE

router = APIRouter()


@router.post("", response_model=EmbeddingResponse)
def create_embedding(
    *,
    db: Session = Depends(get_db),
    request: EmbeddingRequest,
) -> EmbeddingResponse:
    """Create embedding for text"""
    if not EMBEDDING_AVAILABLE or not embedding_service:
        raise HTTPException(
            status_code=503,
            detail="Embedding service is not available. Please install sentence-transformers."
        )
    embedding = embedding_service.get_embedding(request.text, db)
    return EmbeddingResponse(
        embedding=embedding,
        dimension=len(embedding)
    )


@router.post("/similarity", response_model=SimilarityResponse)
def calculate_similarity(
    *,
    db: Session = Depends(get_db),
    request: SimilarityRequest,
) -> SimilarityResponse:
    """Calculate similarity between two texts"""
    if not EMBEDDING_AVAILABLE or not embedding_service:
        raise HTTPException(
            status_code=503,
            detail="Embedding service is not available. Please install sentence-transformers."
        )
    embedding1 = embedding_service.get_embedding(request.text1, db)
    embedding2 = embedding_service.get_embedding(request.text2, db)
    
    similarity = embedding_service.cosine_similarity(embedding1, embedding2)
    
    return SimilarityResponse(similarity=similarity)
