from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MentionCreate(BaseModel):
    document_id: int
    mentioned_document_id: int
    mention_text: Optional[str] = None
    position_start: Optional[int] = None
    position_end: Optional[int] = None


class MentionResponse(BaseModel):
    id: int
    document_id: int
    mentioned_document_id: int
    mention_text: Optional[str] = None
    position_start: Optional[int] = None
    position_end: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
