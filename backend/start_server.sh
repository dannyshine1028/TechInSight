#!/bin/bash
# バックエンドサーバー起動スクリプト

set -e

cd "$(dirname "$0")"

echo "============================================================"
echo "TechInSight バックエンドサーバー起動"
echo "============================================================"

# 仮想環境の確認
if [ ! -d "venv" ]; then
    echo "✗ 仮想環境が見つかりません。作成してください:"
    echo "  python -m venv venv"
    exit 1
fi

# 仮想環境を有効化
source venv/bin/activate

# 依存関係の確認
echo "1. 依存関係を確認..."
if ! python -c "import fastapi" 2>/dev/null; then
    echo "✗ 依存関係がインストールされていません。インストールしてください:"
    echo "  pip install -r requirements.txt"
    exit 1
fi

# データベース接続の確認
echo "2. データベース接続を確認..."
if python -c "from app.db.session import engine; conn = engine.connect(); print('✓ 接続成功！'); conn.close()" 2>/dev/null; then
    echo "✓ データベース接続成功"
else
    echo "⚠ データベース接続に失敗しました。.envファイルを確認してください。"
    echo "  サーバーは起動しますが、データベース機能は使用できません。"
fi

echo ""
echo "3. サーバーを起動します..."
echo "   API: http://localhost:8000"
echo "   APIドキュメント: http://localhost:8000/docs"
echo "   Ctrl+C で停止します"
echo ""

# サーバーを起動
python -m app.main
