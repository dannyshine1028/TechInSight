from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.mention import Mention
from app.models.document import Document


class CRUDMention:
    def create(
        self,
        db: Session,
        *,
        document_id: int,
        mentioned_document_id: int,
        mention_text: Optional[str] = None,
        position_start: Optional[int] = None,
        position_end: Optional[int] = None,
    ) -> Mention:
        """メンションを作成"""
        # 既存のメンションをチェック（重複防止）
        existing = db.query(Mention).filter(
            Mention.document_id == document_id,
            Mention.mentioned_document_id == mentioned_document_id
        ).first()
        
        if existing:
            # 既存のメンションを更新
            if mention_text is not None:
                existing.mention_text = mention_text
            if position_start is not None:
                existing.position_start = position_start
            if position_end is not None:
                existing.position_end = position_end
            db.commit()
            db.refresh(existing)
            return existing
        
        mention = Mention(
            document_id=document_id,
            mentioned_document_id=mentioned_document_id,
            mention_text=mention_text,
            position_start=position_start,
            position_end=position_end,
        )
        db.add(mention)
        db.commit()
        db.refresh(mention)
        return mention
    
    def get_by_document(self, db: Session, *, document_id: int) -> List[Mention]:
        """ドキュメントのメンション一覧を取得"""
        return db.query(Mention).filter(
            Mention.document_id == document_id
        ).all()
    
    def get_mentions_to_document(self, db: Session, *, document_id: int) -> List[Mention]:
        """ドキュメントへのメンション一覧を取得（バックリンク）"""
        return db.query(Mention).filter(
            Mention.mentioned_document_id == document_id
        ).all()
    
    def delete(self, db: Session, *, mention_id: int) -> bool:
        """メンションを削除"""
        mention = db.query(Mention).filter(Mention.id == mention_id).first()
        if not mention:
            return False
        db.delete(mention)
        db.commit()
        return True
    
    def delete_by_document(self, db: Session, *, document_id: int) -> int:
        """ドキュメントのすべてのメンションを削除"""
        count = db.query(Mention).filter(
            Mention.document_id == document_id
        ).delete()
        db.commit()
        return count


mention = CRUDMention()
