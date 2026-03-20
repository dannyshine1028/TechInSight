"""
CSVファイルから記事データをデータベースにインポートするスクリプト

1万件規模のデータを効率的に処理するため、以下の最適化を実装：
- バッチ処理（チャンクごとに処理）
- バルクインサート（bulk_insert_mappings使用）
- トランザクション管理
- 進捗表示
- エラーハンドリング
"""

import csv
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.session import SessionLocal, engine
from app.models.document import Document
from app.db.base import Base
import logging

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# バッチサイズ（1万件を想定して500件ずつ処理）
BATCH_SIZE = 500


def parse_datetime(date_str: str) -> Optional[datetime]:
    """日時文字列をパース"""
    if not date_str or date_str.strip() == '':
        return None
    try:
        # CSVの形式: 2025-09-19 22:00:00
        return datetime.strptime(date_str.strip(), '%Y-%m-%d %H:%M:%S')
    except ValueError:
        logger.warning(f"日時パースエラー: {date_str}")
        return None


def read_csv_file(file_path: str) -> List[Dict]:
    """CSVファイルを読み込む"""
    articles = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                articles.append(row)
        logger.info(f"CSVファイルから {len(articles)} 件の記事を読み込みました")
        return articles
    except FileNotFoundError:
        logger.error(f"ファイルが見つかりません: {file_path}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"CSVファイル読み込みエラー: {e}")
        sys.exit(1)


def prepare_article_data(article: Dict) -> Dict:
    """記事データをデータベース用に整形"""
    return {
        'id': int(article['id']),
        'title': article['title'].strip(),
        'content': article['content'].strip(),
        'author': article.get('author', '').strip() or None,
        'category': article.get('category', '').strip() or None,
        'published_at': parse_datetime(article.get('published_at', '')),
        'embedding': None  # 後で生成可能
    }


def import_articles_batch(db: Session, articles_data: List[Dict], batch_num: int) -> int:
    """バッチ単位で記事をインポート"""
    try:
        # バルクインサート（効率的）
        db.bulk_insert_mappings(Document, articles_data)
        db.commit()
        logger.info(f"バッチ {batch_num}: {len(articles_data)} 件をインポートしました")
        return len(articles_data)
    except IntegrityError as e:
        db.rollback()
        logger.warning(f"バッチ {batch_num}: 重複データの可能性があります。個別処理に切り替えます。")
        # 重複エラーの場合は個別に処理
        return import_articles_individually(db, articles_data, batch_num)
    except Exception as e:
        db.rollback()
        logger.error(f"バッチ {batch_num}: エラーが発生しました: {e}")
        # エラーが発生した場合は個別に処理
        return import_articles_individually(db, articles_data, batch_num)


def import_articles_individually(db: Session, articles_data: List[Dict], batch_num: int) -> int:
    """個別に記事をインポート（エラー処理用）"""
    success_count = 0
    for article_data in articles_data:
        try:
            # 既存レコードをチェック
            existing = db.query(Document).filter(Document.id == article_data['id']).first()
            if existing:
                # 更新
                for key, value in article_data.items():
                    if key != 'id':
                        setattr(existing, key, value)
                success_count += 1
            else:
                # 新規作成
                document = Document(**article_data)
                db.add(document)
                success_count += 1
        except Exception as e:
            logger.warning(f"記事ID {article_data.get('id')} のインポートに失敗: {e}")
            db.rollback()
            continue
    
    try:
        db.commit()
        logger.info(f"バッチ {batch_num}: {success_count}/{len(articles_data)} 件をインポートしました")
    except Exception as e:
        db.rollback()
        logger.error(f"バッチ {batch_num}: コミットエラー: {e}")
    
    return success_count


def import_articles_from_csv(csv_path: str, skip_existing: bool = True):
    """CSVファイルから記事をインポート"""
    # データベーステーブルを作成（存在しない場合）
    Base.metadata.create_all(bind=engine)
    
    # CSVファイルを読み込む
    articles = read_csv_file(csv_path)
    
    if not articles:
        logger.warning("インポートする記事がありません")
        return
    
    # データを整形
    articles_data = [prepare_article_data(article) for article in articles]
    
    # 既存データをスキップする場合
    if skip_existing:
        db = SessionLocal()
        try:
            existing_ids = {row[0] for row in db.query(Document.id).all()}
            articles_data = [a for a in articles_data if a['id'] not in existing_ids]
            logger.info(f"既存データをスキップ: {len(articles)} 件中 {len(articles_data)} 件をインポートします")
        finally:
            db.close()
    
    if not articles_data:
        logger.info("インポートする新しい記事がありません")
        return
    
    # バッチ処理でインポート
    db = SessionLocal()
    total_imported = 0
    total_batches = (len(articles_data) + BATCH_SIZE - 1) // BATCH_SIZE
    
    try:
        for i in range(0, len(articles_data), BATCH_SIZE):
            batch = articles_data[i:i + BATCH_SIZE]
            batch_num = (i // BATCH_SIZE) + 1
            
            logger.info(f"処理中: バッチ {batch_num}/{total_batches} ({len(batch)} 件)")
            imported = import_articles_batch(db, batch, batch_num)
            total_imported += imported
        
        logger.info(f"インポート完了: 合計 {total_imported} 件の記事をインポートしました")
    except Exception as e:
        logger.error(f"インポート中にエラーが発生しました: {e}")
        raise
    finally:
        db.close()


def main():
    """メイン関数"""
    # CSVファイルのパスを取得（デフォルト: TechInSight/data/article.csv）
    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
    else:
        # プロジェクトルートを取得（backend/app/scripts/ から ../../ でプロジェクトルート）
        project_root = Path(__file__).parent.parent.parent.parent
        # まず article.csv を試し、存在しない場合は articles.csv を試す
        csv_path = project_root / "data" / "article.csv"
        if not csv_path.exists():
            csv_path = project_root / "data" / "articles.csv"
    
    csv_path = str(csv_path)
    
    if not Path(csv_path).exists():
        logger.error(f"CSVファイルが見つかりません: {csv_path}")
        logger.error(f"期待されるパス: {project_root / 'data' / 'article.csv'}")
        logger.error(f"または: {project_root / 'data' / 'articles.csv'}")
        sys.exit(1)
    
    logger.info(f"記事インポートを開始します: {csv_path}")
    import_articles_from_csv(csv_path)
    logger.info("記事インポートが完了しました")


if __name__ == "__main__":
    main()
