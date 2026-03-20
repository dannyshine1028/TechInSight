# TechInSight Backend

FastAPIベースのバックエンドAPI（MySQL対応）

## 📚 ドキュメント

**詳細なセットアップガイド**: [BACKEND_GUIDE.md](./BACKEND_GUIDE.md) を参照してください。

このガイドには以下が含まれています：
- 完全なセットアップ手順
- MySQLデータベースの設定
- 環境変数の設定
- データベースマイグレーション
- CSVデータのインポート
- CORS設定
- トラブルシューティング

## クイックスタート

### 1. 仮想環境の作成と有効化

```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 3. 環境変数の設定

`backend/.env`ファイルを作成：

```env
DATABASE_URL=mysql+pymysql://techinsight_user:your_password@localhost:3306/techinsight
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
ENVIRONMENT=development
```

### 4. データベースマイグレーション

```bash
alembic upgrade head
```

### 5. サーバーの起動

```bash
python -m app.main
```

または

```bash
./start_server.sh
```

APIドキュメント: http://localhost:8000/docs

## 詳細情報

詳細な手順、トラブルシューティング、よくある質問については、[BACKEND_GUIDE.md](./BACKEND_GUIDE.md) を参照してください。
