from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Mention(Base):
    """@メンション機能"""
    __tablename__ = "mentions"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    mentioned_document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    mention_text = Column(Text, nullable=True)  # メンションされたテキスト部分
    position_start = Column(Integer, nullable=True)  # メンション開始位置
    position_end = Column(Integer, nullable=True)  # メンション終了位置
    created_at = Column(DateTime, server_default=func.now())
    
    # リレーション
    # backrefを削除（mentionsテーブルが現在使用されていないため）
    # document = relationship("Document", foreign_keys=[document_id], backref="mentions_from")
    # mentioned_document = relationship("Document", foreign_keys=[mentioned_document_id], backref="mentions_to")
