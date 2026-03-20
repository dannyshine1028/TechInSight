from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.db.base import Base


class SearchLog(Base):
    """検索キーワードのログ記録"""
    __tablename__ = "search_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    query = Column(String(255), nullable=False, index=True)
    search_type = Column(String(50), nullable=False)  # "keyword" or "semantic"
    result_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), index=True)
