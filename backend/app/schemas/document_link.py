from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.document import DocumentResponse


class DocumentLinkCreate(BaseModel):
    source_document_id: int
    target_document_id: int
    link_type: str = "manual"  # "manual" or "auto"
    similarity_score: Optional[float] = None


class DocumentLinkResponse(BaseModel):
    id: int
    source_document_id: int
    target_document_id: int
    link_type: str
    similarity_score: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class DocumentLinkWithTarget(BaseModel):
    id: int
    target_document: DocumentResponse
    link_type: str
    similarity_score: Optional[float] = None
    created_at: datetime


class AutoLinkRequest(BaseModel):
    document_id: int
    threshold: float = 0.7
    limit: int = 5
