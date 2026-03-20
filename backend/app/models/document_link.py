from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class DocumentLink(Base):
    """関連記事リンク（手動/自動）"""
    __tablename__ = "document_links"
    
    id = Column(Integer, primary_key=True, index=True)
    source_document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    target_document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    link_type = Column(String(50), nullable=False, default="manual")  # "manual" or "auto"
    similarity_score = Column(String(50), nullable=True)  # 自動リンクの場合の類似度スコア
    created_at = Column(DateTime, server_default=func.now())
    
    # リレーション
    source_document = relationship("Document", foreign_keys=[source_document_id], backref="outgoing_links")
    target_document = relationship("Document", foreign_keys=[target_document_id], backref="incoming_links")
