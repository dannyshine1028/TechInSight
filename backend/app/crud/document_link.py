from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
from app.models.document_link import DocumentLink
from app.models.document import Document
from app.services.embedding_service import embedding_service, EMBEDDING_AVAILABLE


class CRUDDocumentLink:
    def create(
        self,
        db: Session,
        *,
        source_document_id: int,
        target_document_id: int,
        link_type: str = "manual",
        similarity_score: Optional[float] = None,
    ) -> DocumentLink:
        """関連記事リンクを作成"""
        # 既存のリンクをチェック（重複防止）
        existing = db.query(DocumentLink).filter(
            DocumentLink.source_document_id == source_document_id,
            DocumentLink.target_document_id == target_document_id
        ).first()
        
        if existing:
            # 既存のリンクを更新
            existing.link_type = link_type
            if similarity_score is not None:
                existing.similarity_score = str(similarity_score)
            db.commit()
            db.refresh(existing)
            return existing
        
        link = DocumentLink(
            source_document_id=source_document_id,
            target_document_id=target_document_id,
            link_type=link_type,
            similarity_score=str(similarity_score) if similarity_score is not None else None,
        )
        db.add(link)
        db.commit()
        db.refresh(link)
        return link
    
    def get_outgoing_links(self, db: Session, *, document_id: int) -> List[DocumentLink]:
        """ドキュメントからのリンク一覧を取得"""
        return db.query(DocumentLink).filter(
            DocumentLink.source_document_id == document_id
        ).all()
    
    def get_incoming_links(self, db: Session, *, document_id: int) -> List[DocumentLink]:
        """ドキュメントへのリンク一覧を取得（バックリンク）"""
        return db.query(DocumentLink).filter(
            DocumentLink.target_document_id == document_id
        ).all()
    
    def delete(self, db: Session, *, link_id: int) -> bool:
        """リンクを削除"""
        link = db.query(DocumentLink).filter(DocumentLink.id == link_id).first()
        if not link:
            return False
        db.delete(link)
        db.commit()
        return True
    
    def generate_auto_links(
        self,
        db: Session,
        *,
        document_id: int,
        threshold: float = 0.7,
        limit: int = 5,
    ) -> List[DocumentLink]:
        """自動リンク生成（Embeddingベース）"""
        if not EMBEDDING_AVAILABLE or not embedding_service:
            return []
        
        # 対象ドキュメントを取得
        source_doc = db.query(Document).filter(Document.id == document_id).first()
        if not source_doc or not source_doc.embedding:
            return []
        
        source_embedding = source_doc.embedding if isinstance(source_doc.embedding, list) else source_doc.embedding
        
        # 他のドキュメントを取得
        other_docs = db.query(Document).filter(
            Document.id != document_id,
            Document.embedding.isnot(None)
        ).all()
        
        # 類似度を計算
        similarities = []
        for doc in other_docs:
            if doc.embedding:
                doc_embedding = doc.embedding if isinstance(doc.embedding, list) else doc.embedding
                if doc_embedding:
                    similarity = embedding_service.cosine_similarity(
                        source_embedding, doc_embedding
                    )
                    if similarity >= threshold:
                        similarities.append((doc.id, similarity))
        
        # 類似度でソート
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # リンクを作成
        created_links = []
        for target_id, similarity in similarities[:limit]:
            link = self.create(
                db=db,
                source_document_id=document_id,
                target_document_id=target_id,
                link_type="auto",
                similarity_score=similarity,
            )
            created_links.append(link)
        
        return created_links
    
    def get_recommended_links(
        self,
        db: Session,
        *,
        document_id: int,
        limit: int = 5,
    ) -> List[Tuple[Document, float]]:
        """関連記事を推薦（既存リンク + 自動推薦）"""
        # 既存のリンクを取得
        existing_links = self.get_outgoing_links(db=db, document_id=document_id)
        existing_target_ids = {link.target_document_id for link in existing_links}
        
        # 自動推薦（Embeddingベース）
        recommendations = []
        if EMBEDDING_AVAILABLE and embedding_service:
            source_doc = db.query(Document).filter(Document.id == document_id).first()
            if source_doc and source_doc.embedding:
                source_embedding = source_doc.embedding if isinstance(source_doc.embedding, list) else source_doc.embedding
                
                other_docs = db.query(Document).filter(
                    Document.id != document_id,
                    Document.id.notin_(existing_target_ids),
                    Document.embedding.isnot(None)
                ).all()
                
                for doc in other_docs:
                    if doc.embedding:
                        doc_embedding = doc.embedding if isinstance(doc.embedding, list) else doc.embedding
                        if doc_embedding:
                            similarity = embedding_service.cosine_similarity(
                                source_embedding, doc_embedding
                            )
                            recommendations.append((doc, similarity))
                
                # 類似度でソート
                recommendations.sort(key=lambda x: x[1], reverse=True)
        
        return recommendations[:limit]


document_link = CRUDDocumentLink()
