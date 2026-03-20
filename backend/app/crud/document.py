from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional, Tuple
from datetime import datetime
from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.crud import mention as crud_mention
from app.crud import document_link as crud_document_link


class CRUDDocument:
    def create(self, db: Session, *, obj_in: DocumentCreate, embedding: Optional[List[float]] = None) -> Document:
        """Create a new document"""
        db_obj = Document(
            title=obj_in.title,
            content=obj_in.content,
            author=obj_in.author,
            category=obj_in.category,
            published_at=obj_in.published_at,
            embedding=embedding
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get(self, db: Session, id: int) -> Optional[Document]:
        """Get a document by ID"""
        return db.query(Document).filter(Document.id == id).first()
    
    def increment_view_count(self, db: Session, id: int) -> Optional[Document]:
        """Increment view count for a document"""
        db_obj = db.query(Document).filter(Document.id == id).first()
        if db_obj:
            db_obj.view_count = (db_obj.view_count or 0) + 1
            db.commit()
            db.refresh(db_obj)
        return db_obj
    
    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 20, 
        category: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        date_field: str = "created_at"  # "created_at" or "published_at"
    ) -> Tuple[List[Document], int]:
        """Get multiple documents with pagination"""
        query = db.query(Document)
        
        # カテゴリフィルタ
        if category:
            query = query.filter(Document.category == category)
        
        # 日付フィルタ
        if start_date or end_date:
            date_column = Document.created_at if date_field == "created_at" else Document.published_at
            if start_date and end_date:
                query = query.filter(and_(date_column >= start_date, date_column <= end_date))
            elif start_date:
                query = query.filter(date_column >= start_date)
            elif end_date:
                query = query.filter(date_column <= end_date)
        
        total = query.count()
        items = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
        return items, total
    
    def get_categories(self, db: Session) -> List[str]:
        """Get list of all unique categories"""
        categories = db.query(Document.category).distinct().filter(Document.category.isnot(None)).all()
        return [cat[0] for cat in categories if cat[0]]
    
    def update(
        self, db: Session, *, db_obj: Document, obj_in: DocumentUpdate, embedding: Optional[List[float]] = None
    ) -> Document:
        """Update a document"""
        update_data = obj_in.model_dump(exclude_unset=True)
        if embedding is not None:
            update_data['embedding'] = embedding
        
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, *, id: int) -> Document:
        """Delete a document and all related records"""
        obj = db.query(Document).filter(Document.id == id).first()
        if not obj:
            raise ValueError(f"Document with id {id} not found")
        
        # 関連レコードを先に削除（外部キー制約を回避）
        # mentionsテーブルは現在使用していないため、削除処理をスキップ
        
        try:
            # ドキュメントリンクを削除（source_document_idまたはtarget_document_idが一致するもの）
            from app.models.document_link import DocumentLink
            db.query(DocumentLink).filter(
                or_(
                    DocumentLink.source_document_id == id,
                    DocumentLink.target_document_id == id
                )
            ).delete(synchronize_session=False)
        except Exception as e:
            # document_linksテーブルが存在しない場合はスキップ
            print(f"Warning: Could not delete document links: {e}")
        
        # ドキュメントを削除
        db.delete(obj)
        db.commit()
        return obj
    
    def search_keyword(
        self, db: Session, *, query: str, skip: int = 0, limit: int = 20
    ) -> Tuple[List[Document], int]:
        """Search documents by keyword"""
        search_term = f"%{query}%"
        db_query = db.query(Document).filter(
            or_(
                Document.title.like(search_term),
                Document.content.like(search_term),
                Document.author.like(search_term),
                Document.category.like(search_term)
            )
        )
        total = db_query.count()
        items = db_query.offset(skip).limit(limit).all()
        return items, total
    
    def get_with_embeddings(self, db: Session) -> List[Document]:
        """Get all documents with embeddings"""
        return db.query(Document).filter(Document.embedding.isnot(None)).all()


document = CRUDDocument()
