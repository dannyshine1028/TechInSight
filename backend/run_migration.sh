#!/bin/bash
# マイグレーション実行スクリプト

set -e

cd "$(dirname "$0")"
source venv/bin/activate

echo "============================================================"
echo "マイグレーション実行スクリプト"
echo "============================================================"

# 1. データベース接続をテスト
echo "1. データベース接続をテスト..."
if python -c "from app.db.session import engine; conn = engine.connect(); print('✓ 接続成功！'); conn.close()" 2>/dev/null; then
    echo "✓ データベース接続成功"
else
    echo "✗ データベース接続失敗"
    echo ""
    echo "接続エラーの解決方法:"
    echo "1. .envファイルが正しく設定されているか確認"
    echo "2. MySQLサーバーが起動しているか確認"
    echo "3. ユーザー名とパスワードが正しいか確認"
    echo "4. データベース 'techinsight' が存在するか確認"
    echo ""
    echo ".envファイルの確認:"
    echo "  cat .env | grep DATABASE_URL"
    exit 1
fi

echo ""

# 2. マイグレーションファイルの確認と生成
echo "2. マイグレーションファイルを確認..."
if [ -z "$(alembic history | grep -v '^$')" ]; then
    echo "マイグレーションファイルが存在しないため、生成します..."
    if alembic revision --autogenerate -m "Add author category published_at to documents" 2>/dev/null; then
        echo "✓ マイグレーションファイルを生成しました"
    else
        echo "✗ マイグレーションファイルの生成に失敗しました"
        exit 1
    fi
else
    echo "✓ 既存のマイグレーションファイルを使用します"
fi

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
