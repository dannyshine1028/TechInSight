from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db.session import get_db
from app.crud import document as crud_document
from app.crud import analytics as crud_analytics
from app.schemas.document import (
    DocumentCreate,
    DocumentResponse,
    DocumentUpdate,
    SearchRequest,
    PaginatedDocumentResponse,
)
from app.services.embedding_service import embedding_service, EMBEDDING_AVAILABLE

router = APIRouter()


@router.post("", response_model=DocumentResponse, status_code=201)
def create_document(
    *,
    db: Session = Depends(get_db),
    document_in: DocumentCreate,
) -> DocumentResponse:
    """Create a new document"""
    # Generate embedding if available
    embedding = None
    if EMBEDDING_AVAILABLE and embedding_service:
        try:
            embedding = embedding_service.get_embedding(document_in.content, db)
        except Exception:
            embedding = None
    
    db_document = crud_document.create(
        db=db, obj_in=document_in, embedding=embedding
    )
    return db_document


@router.get("", response_model=PaginatedDocumentResponse)
def read_documents(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    start_date: Optional[datetime] = Query(None, description="開始日時（ISO形式）"),
    end_date: Optional[datetime] = Query(None, description="終了日時（ISO形式）"),
    date_field: str = Query("created_at", description="日付フィールド（created_at または published_at）"),
) -> PaginatedDocumentResponse:
    """Get multiple documents with pagination"""
    items, total = crud_document.get_multi(
        db=db, 
        skip=skip, 
        limit=limit, 
        category=category,
        start_date=start_date,
        end_date=end_date,
        date_field=date_field
    )
    
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
        "page": (skip // limit) + 1 if limit > 0 else 1,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1,
    }


@router.get("/categories", response_model=List[str])
def get_categories(
    *,
    db: Session = Depends(get_db),
) -> List[str]:
    """Get list of all unique categories"""
    return crud_document.get_categories(db=db)


@router.get("/{document_id}", response_model=DocumentResponse)
def read_document(
    *,
    db: Session = Depends(get_db),
    document_id: int,
    increment_view: bool = True,  # 閲覧数をインクリメントするかどうか
) -> DocumentResponse:
    """Get a document by ID"""
    db_document = crud_document.get(db=db, id=document_id)
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # 閲覧数をインクリメント
    if increment_view:
        crud_document.increment_view_count(db=db, id=document_id)
        # 最新のデータを再取得
        db.refresh(db_document)
    
    return db_document


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    *,
    db: Session = Depends(get_db),
    document_id: int,
    document_in: DocumentUpdate,
) -> DocumentResponse:
    """Update a document"""
    db_document = crud_document.get(db=db, id=document_id)
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Regenerate embedding if content is updated
    embedding = None
    if document_in.content and EMBEDDING_AVAILABLE and embedding_service:
        try:
            embedding = embedding_service.get_embedding(document_in.content, db)
        except Exception:
            embedding = None
    
    db_document = crud_document.update(
        db=db, db_obj=db_document, obj_in=document_in, embedding=embedding
    )
    return db_document


@router.delete("/{document_id}", response_model=dict)
def delete_document(
    *,
    db: Session = Depends(get_db),
    document_id: int,
) -> dict:
    """Delete a document"""
    db_document = crud_document.get(db=db, id=document_id)
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    crud_document.delete(db=db, id=document_id)
    return {"message": "Document deleted successfully"}


@router.post("/search", response_model=PaginatedDocumentResponse)
def search_documents(
    *,
    db: Session = Depends(get_db),
    search_request: SearchRequest,
) -> PaginatedDocumentResponse:
    """Search documents (keyword or semantic search)"""
    skip = search_request.skip
    limit = search_request.limit if search_request.limit > 0 else 20
    
    if search_request.search_type == "semantic":
        # Semantic search
        if not EMBEDDING_AVAILABLE or not embedding_service:
            # Fallback to keyword search
            items, total = crud_document.search_keyword(
                db=db, query=search_request.query, skip=skip, limit=limit
            )
        else:
            # Get query embedding
            query_embedding = embedding_service.get_embedding(search_request.query, db)
            
            # Get all documents with embeddings
            documents = crud_document.get_with_embeddings(db=db)
            
            # Calculate similarity and sort
            results = []
            for doc in documents:
                if doc.embedding:
                    doc_embedding = doc.embedding if isinstance(doc.embedding, list) else doc.embedding
                    if doc_embedding:
                        similarity = embedding_service.cosine_similarity(
                            query_embedding, doc_embedding
                        )
                        results.append((doc, similarity))
            
            # Sort by similarity (descending)
            results.sort(key=lambda x: x[1], reverse=True)
            
            # Apply pagination
            total = len(results)
            paginated_results = results[skip:skip + limit]
            items = [doc for doc, _ in paginated_results]
    else:
        # Keyword search
        items, total = crud_document.search_keyword(
            db=db, query=search_request.query, skip=skip, limit=limit
        )
    
    # 検索ログを記録
    try:
        crud_analytics.log_search(
            db=db,
            query=search_request.query,
            search_type=search_request.search_type,
            result_count=total
        )
    except Exception as e:
        # ログ記録のエラーは無視（検索機能には影響しない）
        pass
    
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
        "page": (skip // limit) + 1 if limit > 0 else 1,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1,
    }
