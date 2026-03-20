#!/bin/bash
# データベースをリセットしてマイグレーションを実行するスクリプト

set -e

cd "$(dirname "$0")"
source venv/bin/activate

echo "============================================================"
echo "データベースリセット & マイグレーション実行"
echo "============================================================"

# 1. データベース接続をテスト
echo "1. データベース接続をテスト..."
if python -c "from app.db.session import engine; conn = engine.connect(); print('✓ 接続成功！'); conn.close()" 2>/dev/null; then
    echo "✓ データベース接続成功"
else
    echo "✗ データベース接続失敗"
    exit 1
fi

echo ""

# 2. 既存のテーブルを削除（警告付き）
echo "2. 既存のテーブルを確認..."
python << 'PYTHON_SCRIPT'
from app.db.session import engine
from sqlalchemy import inspect, text

inspector = inspect(engine)
tables = inspector.get_table_names()

if tables:
    print(f"既存のテーブル: {', '.join(tables)}")
    print("これらのテーブルを削除してからマイグレーションを実行します。")
    
    with engine.connect() as conn:
        for table in tables:
            conn.execute(text(f"DROP TABLE IF EXISTS {table}"))
        conn.commit()
    print("✓ 既存のテーブルを削除しました")
else:
    print("既存のテーブルはありません")
PYTHON_SCRIPT

echo ""

# 3. マイグレーションの実行
echo "3. マイグレーションを実行..."
if alembic upgrade head; then
    echo ""
    echo "============================================================"
    echo "✓ マイグレーションが正常に完了しました！"
    echo "============================================================"
    echo ""
    echo "次のステップ:"
    echo "1. データベースにテーブルが作成されたか確認:"
    echo "   python -m app.scripts.check_import"
    echo ""
    echo "2. CSVデータをインポート:"
    echo "   python -m app.scripts.import_articles"
else
    echo "✗ マイグレーションの実行に失敗しました"
    exit 1
fi
