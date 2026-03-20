#!/bin/bash
# WorkデバイスにPythonモジュールをインストールするスクリプト

set -e

cd "$(dirname "$0")"

echo "============================================================"
echo "TechInSight 依存関係インストール"
echo "============================================================"

# 仮想環境の確認
if [ ! -d "venv" ]; then
    echo "仮想環境が見つかりません。作成します..."
    python3 -m venv venv
    echo "✓ 仮想環境を作成しました"
fi

# 仮想環境を有効化
echo ""
echo "仮想環境を有効化..."
source venv/bin/activate

# pipのアップグレード
echo ""
echo "1. pipをアップグレード..."
pip install --upgrade pip

# 依存関係のインストール
echo ""
echo "2. 依存関係をインストール..."
echo "   (これには数分かかる場合があります)"
echo ""

pip install -r requirements.txt

echo ""
echo "============================================================"
echo "✓ インストールが完了しました！"
echo "============================================================"
echo ""
echo "インストールされたパッケージを確認:"
pip list | grep -E "(fastapi|uvicorn|sqlalchemy|pymysql|sentence-transformers)"

echo ""
echo "次のステップ:"
echo "1. データベースマイグレーション: ./run_migration.sh"
echo "2. CSVデータのインポート: python -m app.scripts.import_articles"
echo "3. サーバーの起動: ./start_server.sh"
