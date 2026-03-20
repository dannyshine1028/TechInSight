from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.crud import document_link as crud_document_link
from app.schemas.document_link import (
    DocumentLinkCreate,
    DocumentLinkResponse,
    DocumentLinkWithTarget,
    AutoLinkRequest,
)
from app.crud import document as crud_document

router = APIRouter()


@router.post("", response_model=DocumentLinkResponse, status_code=201)
def create_document_link(
    *,
    db: Session = Depends(get_db),
    link_in: DocumentLinkCreate,
) -> DocumentLinkResponse:
    """関連記事リンクを作成"""
    link = crud_document_link.create(
        db=db,
        source_document_id=link_in.source_document_id,
        target_document_id=link_in.target_document_id,
        link_type=link_in.link_type,
        similarity_score=link_in.similarity_score,
    )
    return link


@router.get("/from/{document_id}", response_model=List[DocumentLinkWithTarget])
def get_outgoing_links(
    *,
    db: Session = Depends(get_db),
    document_id: int,
) -> List[DocumentLinkWithTarget]:
    """ドキュメントからのリンク一覧を取得"""
    links = crud_document_link.get_outgoing_links(db=db, document_id=document_id)
    result = []
    for link in links:
        target_doc = crud_document.get(db=db, id=link.target_document_id)
        if target_doc:
            result.append({
                "id": link.id,
                "target_document": target_doc,
                "link_type": link.link_type,
                "similarity_score": float(link.similarity_score) if link.similarity_score else None,
                "created_at": link.created_at,
            })
    return result


@router.get("/to/{document_id}", response_model=List[DocumentLinkWithTarget])
def get_incoming_links(
    *,
    db: Session = Depends(get_db),
    document_id: int,
) -> List[DocumentLinkWithTarget]:
    """ドキュメントへのリンク一覧を取得（バックリンク）"""
    links = crud_document_link.get_incoming_links(db=db, document_id=document_id)
    result = []
    for link in links:
        source_doc = crud_document.get(db=db, id=link.source_document_id)
        if source_doc:
            result.append({
                "id": link.id,
                "target_document": source_doc,  # バックリンクなのでsourceがtarget
                "link_type": link.link_type,
                "similarity_score": float(link.similarity_score) if link.similarity_score else None,
                "created_at": link.created_at,
            })
    return result


@router.post("/auto", response_model=List[DocumentLinkResponse])
def generate_auto_links(
    *,
    db: Session = Depends(get_db),
    request: AutoLinkRequest,
) -> List[DocumentLinkResponse]:
    """自動リンク生成"""
    links = crud_document_link.generate_auto_links(
        db=db,
        document_id=request.document_id,
        threshold=request.threshold,
        limit=request.limit,
    )
    return links


@router.get("/recommended/{document_id}", response_model=List[DocumentLinkWithTarget])
def get_recommended_links(
    *,
    db: Session = Depends(get_db),
    document_id: int,
    limit: int = Query(5, ge=1, le=20),
) -> List[DocumentLinkWithTarget]:
    """関連記事を推薦"""
    recommendations = crud_document_link.get_recommended_links(
        db=db,
        document_id=document_id,
        limit=limit,
    )
    return [
        {
            "id": 0,  # 推薦リンクはまだ作成されていない
            "target_document": doc,
            "link_type": "recommended",
            "similarity_score": score,
            "created_at": doc.created_at,
        }
        for doc, score in recommendations
    ]


@router.delete("/{link_id}", response_model=dict)
def delete_document_link(
    *,
    db: Session = Depends(get_db),
    link_id: int,
) -> dict:
    """リンクを削除"""
    success = crud_document_link.delete(db=db, link_id=link_id)
    if not success:
        raise HTTPException(status_code=404, detail="Link not found")
    return {"message": "Link deleted successfully"}
