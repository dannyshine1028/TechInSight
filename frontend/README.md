# TechInSight Frontend

Next.jsベースのフロントエンドアプリケーション

## 前提条件

1. バックエンドサーバーが起動していること
2. データベースにデータがインポートされていること（オプション）

## セットアップ

### 1. 依存関係のインストール

```bash
cd frontend
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の内容を設定してください：

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

## ビルド

```bash
npm run build
npm start
```

## 機能

- ドキュメントの作成・一覧表示・更新・削除
- キーワード検索
- セマンティック検索（sentence-transformersがインストールされている場合）
- CSVファイルのアップロードとインポート
- ページネーション

## トラブルシューティング

### 記事が表示されない

1. **バックエンドサーバーが起動しているか確認**
   ```bash
   cd backend
   source venv/bin/activate
   python main.py
   ```

2. **データベースにデータが入っているか確認**
   ```bash
   # バックエンドでCSVインポートを実行
   cd backend
   source venv/bin/activate
   python import_articles.py
   ```

3. **ブラウザのコンソールを確認**
   - F12キーを押して開発者ツールを開く
   - Consoleタブでエラーメッセージを確認
   - NetworkタブでAPIリクエストが正しく送信されているか確認

4. **CORSエラーの確認**
   - バックエンドの`main.py`でCORS設定を確認
   - `allow_origins`に`http://localhost:3000`が設定されているか確認

### API接続エラー

- `.env.local`の`NEXT_PUBLIC_API_URL`が正しいか確認
- バックエンドサーバーが`http://localhost:8000`で起動しているか確認

### データが表示されない

- データベースにデータがインポートされているか確認
- ブラウザのコンソールでAPIレスポンスを確認
- ネットワークタブでAPIリクエストのステータスコードを確認

## 開発時の注意点

- フロントエンドとバックエンドは別々のターミナルで起動する必要があります
- バックエンドサーバーを再起動した場合、フロントエンドもリロードが必要な場合があります
- データベースの変更は、フロントエンドをリロードするだけで反映されます
