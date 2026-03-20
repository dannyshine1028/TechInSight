from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DocumentBase(BaseModel):
    title: str
    content: str
    author: Optional[str] = None
    category: Optional[str] = None
    published_at: Optional[datetime] = None


class DocumentCreate(DocumentBase):
    pass


class DocumentResponse(DocumentBase):
    id: int
    embedding: Optional[List[float]] = None
    view_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    source_file_id: Optional[int] = None
    
    class Config:
        from_attributes = True


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    published_at: Optional[datetime] = None


class EmbeddingRequest(BaseModel):
    text: str


class EmbeddingResponse(BaseModel):
    embedding: List[float]
    dimension: int


class SimilarityRequest(BaseModel):
    text1: str
    text2: str


class SimilarityResponse(BaseModel):
    similarity: float


class SearchRequest(BaseModel):
    query: str
    search_type: str = "keyword"  # "keyword" or "semantic"
    skip: int = 0
    limit: int = 20


class PaginatedDocumentResponse(BaseModel):
    items: List[DocumentResponse]
    total: int
    skip: int
    limit: int
    page: int
    total_pages: int


class CSVFileBase(BaseModel):
    filename: str


class CSVFileCreate(CSVFileBase):
    pass


class CSVFileResponse(CSVFileBase):
    id: int
    uploaded_at: datetime
    imported_count: int
    total_rows: int
    status: str
    
    class Config:
        from_attributes = True


class PaginatedCSVFileResponse(BaseModel):
    items: List[CSVFileResponse]
    total: int
    skip: int
    limit: int
    page: int
    total_pages: int
