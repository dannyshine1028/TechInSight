from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False)
    author = Column(String(100), nullable=True, index=True)
    category = Column(String(100), nullable=True, index=True)
    published_at = Column(DateTime, nullable=True, index=True)
    embedding = Column(JSON, nullable=True)  # MySQLではJSON型を使用
    view_count = Column(Integer, default=0, nullable=False)  # 閲覧数
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # CSVFileとの関連付け（将来の拡張用）
    source_file_id = Column(Integer, ForeignKey("csv_files.id"), nullable=True)
    source_file = relationship("CSVFile", back_populates="documents", foreign_keys=[source_file_id])


class EmbeddingCache(Base):
    __tablename__ = "embedding_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String(100), unique=True, nullable=False, index=True)  # MySQLではString型を使用（キー長制限のため100文字）
    embedding = Column(JSON, nullable=False)  # MySQLではJSON型を使用
    model_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class CSVFile(Base):
    __tablename__ = "csv_files"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), unique=True, nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now())
    imported_count = Column(Integer, default=0)
    total_rows = Column(Integer, default=0)
    status = Column(String(50), default="uploaded")  # uploaded, importing, completed, failed
    
    documents = relationship("Document", back_populates="source_file", foreign_keys=[Document.source_file_id])
