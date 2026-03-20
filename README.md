# TechInSight

AI/MLを活用したドキュメント管理システム。テキストのベクトル化（Embedding）機能を実装しています。

## 技術スタック

- **Backend**: Python / FastAPI / MySQL
- **Frontend**: Next.js / TypeScript / React
- **AI/ML**: sentence-transformers (Embedding)

## プロジェクト構造

```
TechInSight/
├── backend/              # FastAPI バックエンド
│   ├── alembic/         # データベースマイグレーション
│   ├── services/        # ビジネスロジック
│   ├── main.py          # FastAPI アプリケーション
│   ├── models.py        # データベースモデル
│   ├── schemas.py       # Pydantic スキーマ
│   ├── database.py      # データベース接続
│   ├── config.py        # 設定管理
│   ├── BACKEND_GUIDE.md # バックエンド完全ガイド
│   └── requirements.txt # Python依存関係
├── frontend/            # Next.js フロントエンド
│   ├── app/             # Next.js App Router
│   ├── package.json     # Node.js依存関係
│   ├── README.md        # フロントエンドガイド
│   └── tsconfig.json    # TypeScript設定
└── README.md
```

## クイックスタート

### 1. バックエンドのセットアップ

詳細な手順は [backend/BACKEND_GUIDE.md](backend/BACKEND_GUIDE.md) を参照してください。

```bash
cd backend
source venv/bin/activate
python -m app.main
```

バックエンドAPIは `http://localhost:8000` で起動します。

### 2. フロントエンドのセットアップ

詳細な手順は [frontend/README.md](frontend/README.md) を参照してください。

```bash
cd frontend
npm install
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

## 起動手順

### 1. バックエンドサーバーの起動

**ターミナル1**で実行：

```bash
cd backend
source venv/bin/activate
python -m app.main
```

または、起動スクリプトを使用：

```bash
cd backend
./start_server.sh
```

サーバーが起動すると、以下のメッセージが表示されます：
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 2. フロントエンドサーバーの起動

**ターミナル2**で実行：

```bash
cd frontend
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## 機能

- ドキュメントの作成・一覧表示・更新・削除
- キーワード検索
- セマンティック検索（sentence-transformersがインストールされている場合）
- CSVファイルのアップロードとインポート
- ページネーション

## API エンドポイント

APIドキュメントはバックエンド起動後、`http://localhost:8000/docs` で確認できます。

主なエンドポイント：
- `GET /api/documents` - ドキュメント一覧取得（ページネーション対応）
- `POST /api/documents` - ドキュメント作成
- `GET /api/documents/{id}` - 特定ドキュメント取得
- `PUT /api/documents/{id}` - ドキュメント更新
- `DELETE /api/documents/{id}` - ドキュメント削除
- `POST /api/documents/search` - ドキュメント検索（キーワード/セマンティック、ページネーション対応）
- `POST /api/files/upload` - CSVファイルアップロード
- `GET /api/files` - CSVファイル一覧取得
- `POST /api/files/{file_id}/import` - CSVファイルをドキュメントとしてインポート

## トラブルシューティング

### Network Error の解決方法

**エラー**: `AxiosError: Network Error`

このエラーは、フロントエンドがバックエンドAPIに接続できないことを示しています。

#### 解決手順

1. **バックエンドサーバーが起動しているか確認**
   ```bash
   curl http://localhost:8000/health
   ```
   正常な場合、`{"status":"healthy"}`が返ります。

2. **環境変数の確認**
   - バックエンド: `backend/.env`ファイルを確認
   - フロントエンド: `frontend/.env.local`ファイルを確認（`NEXT_PUBLIC_API_URL=http://localhost:8000`）

3. **CORS設定の確認**
   - `backend/main.py`のCORS設定を確認
   - `.env`ファイルに`ENVIRONMENT=development`が設定されているか確認

4. **データベース接続の確認**
   ```bash
   cd backend
   source venv/bin/activate
   python -c "from database import engine; conn = engine.connect(); print('✓ 接続成功'); conn.close()"
   ```

詳細なトラブルシューティングは [backend/BACKEND_GUIDE.md](backend/BACKEND_GUIDE.md) を参照してください。

## 開発

### バックエンドの開発

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### フロントエンドの開発

```bash
cd frontend
npm run dev
```

### データベースマイグレーション

```bash
cd backend
source venv/bin/activate
alembic revision --autogenerate -m "Migration description"
alembic upgrade head
```

詳細は [backend/BACKEND_GUIDE.md](backend/BACKEND_GUIDE.md) を参照してください。

## 注意事項

- 初回起動時、sentence-transformersモデルのダウンロードに時間がかかる場合があります
- 本番環境では、`.env`ファイルの`SECRET_KEY`を適切に設定してください
- MySQLの接続情報は環境に応じて変更してください

## ライセンス

MIT
