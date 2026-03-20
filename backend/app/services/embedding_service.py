from sqlalchemy.orm import Session
from app.models.document import EmbeddingCache
from app.core.config import settings
from typing import List, Optional

# sentence_transformersをオプショナルに
try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SentenceTransformer = None
    np = None
    SENTENCE_TRANSFORMERS_AVAILABLE = False


class EmbeddingService:
    def __init__(self):
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise ImportError("sentence-transformers is not installed")
        self.model = SentenceTransformer(settings.embedding_model)
        self.model_name = settings.embedding_model
    
    def get_embedding(self, text: str, db: Session) -> List[float]:
        """テキストをベクトル化する。キャッシュがあれば使用する。"""
        # テキストが100文字を超える場合は切り詰める（MySQLのキー長制限のため）
        cache_key = text[:100] if len(text) > 100 else text
        
        # キャッシュを確認
        cached = db.query(EmbeddingCache).filter(
            EmbeddingCache.text == cache_key,
            EmbeddingCache.model_name == self.model_name
        ).first()
        
        if cached:
            # MySQLのJSON型からリストに変換
            if isinstance(cached.embedding, list):
                return cached.embedding
            return cached.embedding if cached.embedding else []
        
        # ベクトル化を実行（元のテキスト全体を使用）
        embedding = self.model.encode(text, convert_to_numpy=True).tolist()
        
        # キャッシュに保存（キーは切り詰めたもの）
        cache_entry = EmbeddingCache(
            text=cache_key,
            embedding=embedding,
            model_name=self.model_name
        )
        db.add(cache_entry)
        db.commit()
        
        return embedding
    
    def get_embeddings_batch(self, texts: List[str], db: Session) -> List[List[float]]:
        """複数のテキストを一括でベクトル化する。"""
        embeddings = []
        texts_to_encode = []
        indices_to_encode = []
        
        # キャッシュを確認
        for idx, text in enumerate(texts):
            # テキストが200文字を超える場合は切り詰める（MySQLのキー長制限のため）
            cache_key = text[:200] if len(text) > 200 else text
            
            cached = db.query(EmbeddingCache).filter(
                EmbeddingCache.text == cache_key,
                EmbeddingCache.model_name == self.model_name
            ).first()
            
            if cached:
                # MySQLのJSON型からリストに変換
                emb = cached.embedding if isinstance(cached.embedding, list) else cached.embedding
                embeddings.append((idx, emb))
            else:
                texts_to_encode.append(text)
                indices_to_encode.append(idx)
        
        # キャッシュにないテキストを一括でベクトル化
        if texts_to_encode:
            new_embeddings = self.model.encode(
                texts_to_encode,
                convert_to_numpy=True
            ).tolist()
            
            # キャッシュに保存（キーは切り詰めたもの）
            for text, embedding in zip(texts_to_encode, new_embeddings):
                cache_key = text[:200] if len(text) > 200 else text
                cache_entry = EmbeddingCache(
                    text=cache_key,
                    embedding=embedding,
                    model_name=self.model_name
                )
                db.add(cache_entry)
            
            db.commit()
            
            # 結果をマージ
            for idx, embedding in zip(indices_to_encode, new_embeddings):
                embeddings.append((idx, embedding))
        
        # インデックス順にソート
        embeddings.sort(key=lambda x: x[0])
        return [emb for _, emb in embeddings]
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """コサイン類似度を計算する。"""
        if not SENTENCE_TRANSFORMERS_AVAILABLE or np is None:
            raise ImportError("numpy is required for cosine similarity calculation")
        vec1_np = np.array(vec1)
        vec2_np = np.array(vec2)
        
        dot_product = np.dot(vec1_np, vec2_np)
        norm1 = np.linalg.norm(vec1_np)
        norm2 = np.linalg.norm(vec2_np)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))


# Embedding service instance (optional, can be None if sentence-transformers is not installed)
try:
    if SENTENCE_TRANSFORMERS_AVAILABLE:
        embedding_service = EmbeddingService()
        EMBEDDING_AVAILABLE = True
    else:
        embedding_service = None
        EMBEDDING_AVAILABLE = False
except Exception as e:
    embedding_service = None
    EMBEDDING_AVAILABLE = False
