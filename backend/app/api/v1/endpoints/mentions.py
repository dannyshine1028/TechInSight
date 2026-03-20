from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.crud import mention as crud_mention
from app.schemas.mention import MentionCreate, MentionResponse

router = APIRouter()


@router.post("", response_model=MentionResponse, status_code=201)
def create_mention(
    *,
    db: Session = Depends(get_db),
    mention_in: MentionCreate,
) -> MentionResponse:
    """メンションを作成"""
    mention = crud_mention.create(
        db=db,
        document_id=mention_in.document_id,
        mentioned_document_id=mention_in.mentioned_document_id,
        mention_text=mention_in.mention_text,
        position_start=mention_in.position_start,
        position_end=mention_in.position_end,
    )
    return mention


@router.get("/document/{document_id}", response_model=List[MentionResponse])
def get_mentions_by_document(
    *,
    db: Session = Depends(get_db),
    document_id: int,
) -> List[MentionResponse]:
    """ドキュメントのメンション一覧を取得"""
    return crud_mention.get_by_document(db=db, document_id=document_id)


@router.get("/to-document/{document_id}", response_model=List[MentionResponse])
def get_mentions_to_document(
    *,
    db: Session = Depends(get_db),
    document_id: int,
) -> List[MentionResponse]:
    """ドキュメントへのメンション一覧を取得（バックリンク）"""
    return crud_mention.get_mentions_to_document(db=db, document_id=document_id)


@router.delete("/{mention_id}", response_model=dict)
def delete_mention(
    *,
    db: Session = Depends(get_db),
    mention_id: int,
) -> dict:
    """メンションを削除"""
    success = crud_mention.delete(db=db, mention_id=mention_id)
    if not success:
        raise HTTPException(status_code=404, detail="Mention not found")
    return {"message": "Mention deleted successfully"}
