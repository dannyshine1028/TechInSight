from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.crud import analytics as crud_analytics

router = APIRouter()


@router.get("/search-keywords")
def get_top_search_keywords(
    *,
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=100),
    days: int = Query(30, ge=1, le=365),
):
    """人気検索キーワードを取得"""
    return crud_analytics.get_top_search_keywords(db=db, limit=limit, days=days)


@router.get("/view-stats")
def get_view_count_stats(
    *,
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=365),
):
    """閲覧数統計を取得"""
    return crud_analytics.get_view_count_stats(db=db, days=days)


@router.get("/update-frequency")
def get_update_frequency_stats(
    *,
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=365),
):
    """更新頻度統計を取得"""
    return crud_analytics.get_update_frequency_stats(db=db, days=days)
