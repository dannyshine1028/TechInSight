from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
from app.models.analytics import SearchLog
from app.models.document import Document


class CRUDAnalytics:
    def log_search(self, db: Session, *, query: str, search_type: str, result_count: int) -> SearchLog:
        """検索ログを記録"""
        search_log = SearchLog(
            query=query,
            search_type=search_type,
            result_count=result_count
        )
        db.add(search_log)
        db.commit()
        db.refresh(search_log)
        return search_log
    
    def get_top_search_keywords(
        self, db: Session, *, limit: int = 10, days: int = 30
    ) -> List[Dict]:
        """人気検索キーワードを取得"""
        since = datetime.now() - timedelta(days=days)
        results = db.query(
            SearchLog.query,
            func.count(SearchLog.id).label('count'),
            func.avg(SearchLog.result_count).label('avg_results')
        ).filter(
            SearchLog.created_at >= since
        ).group_by(
            SearchLog.query
        ).order_by(
            desc('count')
        ).limit(limit).all()
        
        return [
            {
                "keyword": r.query,
                "count": r.count,
                "avg_results": float(r.avg_results) if r.avg_results else 0
            }
            for r in results
        ]
    
    def get_view_count_stats(
        self, db: Session, *, days: int = 30
    ) -> Dict:
        """閲覧数統計を取得"""
        since = datetime.now() - timedelta(days=days)
        
        # 総閲覧数
        total_views = db.query(func.sum(Document.view_count)).scalar() or 0
        
        # 平均閲覧数
        avg_views = db.query(func.avg(Document.view_count)).scalar() or 0
        
        # 最も閲覧された記事
        top_articles = db.query(
            Document.id,
            Document.title,
            Document.view_count
        ).order_by(
            desc(Document.view_count)
        ).limit(10).all()
        
        # 日別閲覧数（簡易版：更新日ベース）
        daily_stats = db.query(
            func.date(Document.updated_at).label('date'),
            func.sum(Document.view_count).label('total_views')
        ).filter(
            Document.updated_at >= since
        ).group_by(
            func.date(Document.updated_at)
        ).order_by(
            func.date(Document.updated_at)
        ).all()
        
        return {
            "total_views": int(total_views),
            "avg_views": float(avg_views) if avg_views else 0,
            "top_articles": [
                {
                    "id": a.id,
                    "title": a.title,
                    "view_count": a.view_count
                }
                for a in top_articles
            ],
            "daily_stats": [
                {
                    "date": str(d.date),
                    "total_views": int(d.total_views) if d.total_views else 0
                }
                for d in daily_stats
            ]
        }
    
    def get_update_frequency_stats(
        self, db: Session, *, days: int = 30
    ) -> Dict:
        """更新頻度統計を取得"""
        since = datetime.now() - timedelta(days=days)
        
        # 更新された記事数
        updated_count = db.query(Document).filter(
            Document.updated_at >= since
        ).count()
        
        # 新規作成された記事数
        created_count = db.query(Document).filter(
            Document.created_at >= since
        ).count()
        
        # 日別更新数
        daily_updates = db.query(
            func.date(Document.updated_at).label('date'),
            func.count(Document.id).label('count')
        ).filter(
            Document.updated_at >= since,
            Document.updated_at != Document.created_at  # 更新のみ（新規作成を除く）
        ).group_by(
            func.date(Document.updated_at)
        ).order_by(
            func.date(Document.updated_at)
        ).all()
        
        # 日別作成数
        daily_creates = db.query(
            func.date(Document.created_at).label('date'),
            func.count(Document.id).label('count')
        ).filter(
            Document.created_at >= since
        ).group_by(
            func.date(Document.created_at)
        ).order_by(
            func.date(Document.created_at)
        ).all()
        
        return {
            "updated_count": updated_count,
            "created_count": created_count,
            "daily_updates": [
                {
                    "date": str(d.date),
                    "count": d.count
                }
                for d in daily_updates
            ],
            "daily_creates": [
                {
                    "date": str(d.date),
                    "count": d.count
                }
                for d in daily_creates
            ]
        }


analytics = CRUDAnalytics()
