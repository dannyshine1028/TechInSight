from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import pymysql

# PyMySQLをMySQLドライバーとして使用
pymysql.install_as_MySQLdb()

# MySQL接続URLの形式: mysql+pymysql://user:password@host:port/database
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # 接続の有効性を確認
    pool_recycle=3600    # 1時間で接続を再利用
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
