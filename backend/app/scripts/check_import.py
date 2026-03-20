"""
CSVインポート結果を確認するためのスクリプト
"""
from app.db.session import SessionLocal
from app.models.document import Document
from sqlalchemy import func


def check_imported_data():
    """インポートされたデータを確認"""
    db = SessionLocal()
    try:
        # 総件数
        total_count = db.query(Document).count()
        print(f"\n{'='*60}")
        print(f"📊 データベース内の記事数: {total_count}件")
        print(f"{'='*60}\n")
        
        if total_count == 0:
            print("⚠️  データがインポートされていません。")
            return
        
        # カテゴリ別の集計
        category_stats = db.query(
            Document.category,
            func.count(Document.id).label('count')
        ).group_by(Document.category).all()
        
        print("📁 カテゴリ別の記事数:")
        for category, count in category_stats:
            print(f"   - {category or '(未設定)'}: {count}件")
        
        # 著者別の集計
        author_stats = db.query(
            Document.author,
            func.count(Document.id).label('count')
        ).group_by(Document.author).order_by(func.count(Document.id).desc()).limit(10).all()
        
        print(f"\n👤 著者別の記事数（上位10名）:")
        for author, count in author_stats:
            print(f"   - {author or '(未設定)'}: {count}件")
        
        # 最新の5件を表示
        print(f"\n📄 最新の記事（5件）:")
        recent_docs = db.query(Document).order_by(Document.id.desc()).limit(5).all()
        for doc in recent_docs:
            print(f"\n   ID: {doc.id}")
            print(f"   タイトル: {doc.title[:50]}...")
            print(f"   著者: {doc.author or '(未設定)'}")
            print(f"   カテゴリ: {doc.category or '(未設定)'}")
            print(f"   公開日: {doc.published_at or '(未設定)'}")
        
        # 日付範囲
        date_range = db.query(
            func.min(Document.published_at).label('min_date'),
            func.max(Document.published_at).label('max_date')
        ).first()
        
        if date_range and date_range.min_date:
            print(f"\n📅 公開日の範囲:")
            print(f"   最古: {date_range.min_date}")
            print(f"   最新: {date_range.max_date}")
        
        print(f"\n{'='*60}\n")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    check_imported_data()
