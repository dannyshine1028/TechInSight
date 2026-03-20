from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.session import get_db


def get_database() -> Session:
    """Dependency for getting database session"""
    return Depends(get_db)
