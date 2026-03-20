# TechInSight バックエンド完全ガイド

このガイドは、TechInSightバックエンドのセットアップから運用まで、すべての手順を網羅しています。

## 📋 目次

1. [概要](#概要)
2. [前提条件](#前提条件)
3. [セットアップ手順](#セットアップ手順)
4. [環境変数の設定](#環境変数の設定)
5. [データベースマイグレーション](#データベースマイグレーション)
6. [CSVデータのインポート](#csvデータのインポート)
7. [サーバーの起動](#サーバーの起動)
8. [CORS設定](#cors設定)
9. [トラブルシューティング](#トラブルシューティング)

---

## 概要

TechInSightバックエンドは、FastAPIとMySQLを使用したRESTful APIサーバーです。

### 技術スタック

- **Python 3.9+**
- **FastAPI**: モダンなWebフレームワーク
- **SQLAlchemy**: ORM
- **Alembic**: データベースマイグレーション
- **MySQL 8.0+**: リレーショナルデータベース
- **PyMySQL**: MySQL接続ドライバー

### 主な機能

- ドキュメント管理（CRUD操作）
- キーワード検索
- セマンティック検索（オプション、sentence-transformersが必要）
- CSVデータの一括インポート
- ページネーション対応

---

## 前提条件

以下のソフトウェアがインストールされている必要があります：

- **Python 3.9以上** (推奨: 3.11以上)
- **MySQL 8.0以上**
- **Git** (リポジトリのクローン用)

---

## セットアップ手順

### 1. プロジェクトのクローン（既にクローン済みの場合はスキップ）

```bash
git clone <repository-url>
cd TechInSight/backend
```

### 2. 仮想環境の作成と有効化

```bash
cd /media/user/Work/work/TechInsight/TechInSight/backend

# 仮想環境の作成
python3 -m venv venv

# 仮想環境の有効化
source venv/bin/activate  # Linux/Mac
# Windows: venv\Scripts\activate
```

### 3. MySQLデータベースのセットアップ

#### 3.1 MySQLサーバーの起動確認

```bash
# MySQLの状態を確認
sudo systemctl status mysql
# または
sudo systemctl status mysqld

# 起動していない場合
sudo systemctl start mysql
```

#### 3.2 データベースとユーザーの作成

```bash
# MySQLに接続
mysql -u root -p
```

MySQLプロンプトで以下を実行：

```sql
-- データベースを作成
CREATE DATABASE techinsight CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ユーザーを作成（オプション、既存のユーザーを使用する場合はスキップ）
CREATE USER 'techinsight_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON techinsight.* TO 'techinsight_user'@'localhost';
FLUSH PRIVILEGES;

-- 終了
EXIT;
```

**注意**: 既存のユーザーを使用する場合は、そのユーザー名とパスワードをメモしておいてください。

### 4. 依存関係のインストール

#### 方法1: 自動インストールスクリプト（推奨）

```bash
cd /media/user/Work/work/TechInsight/TechInSight/backend
./install_dependencies.sh
```

#### 方法2: 手動インストール

```bash
cd /media/user/Work/work/TechInsight/TechInSight/backend
source venv/bin/activate

# pipをアップグレード
pip install --upgrade pip

# すべての依存関係をインストール
pip install -r requirements.txt
```

#### インストールの確認

```bash
# インストールされたパッケージを確認
pip list | grep -E "(fastapi|uvicorn|sqlalchemy|pymysql|pydantic)"

# パッケージの依存関係を確認
pip check
```

**注意**: `sentence-transformers`はオプションです。インストールしない場合、セマンティック検索機能は無効になりますが、その他の機能は正常に動作します。

---

## 環境変数の設定

### .envファイルの作成

`backend/.env`ファイルを作成し、以下の内容を設定してください：

```bash
cd /media/user/Work/work/TechInsight/TechInSight/backend
cat > .env << 'EOF'
DATABASE_URL=mysql+pymysql://techinsight_user:your_password@localhost:3306/techinsight
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
ENVIRONMENT=development
EOF
```

### 環境変数の説明

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | MySQL接続URL | `mysql+pymysql://user:password@localhost:3306/techinsight` |
| `SECRET_KEY` | セキュリティキー（本番環境では必ず変更） | `your-secret-key-here` |
| `ALGORITHM` | JWTアルゴリズム | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | アクセストークンの有効期限（分） | `30` |
| `EMBEDDING_MODEL` | Embeddingモデル名（オプション） | `sentence-transformers/all-MiniLM-L6-v2` |
| `ENVIRONMENT` | 環境設定 | `development` または `production` |

### 接続文字列の形式

```
mysql+pymysql://ユーザー名:パスワード@ホスト:ポート/データベース名
```

**例**:
- カスタムユーザー: `mysql+pymysql://techinsight_user:password@localhost:3306/techinsight`
- rootユーザー: `mysql+pymysql://root:password@localhost:3306/techinsight`
- カスタムポート: `mysql+pymysql://user:password@localhost:3307/techinsight`

### .envファイルの権限設定

```bash
chmod 600 .env
```

### データベース接続の確認

```bash
cd /media/user/Work/work/TechInsight/TechInSight/backend
source venv/bin/activate

# 接続テスト
python -c "from database import engine; conn = engine.connect(); print('✓ 接続成功！'); conn.close()"
```

---

## データベースマイグレーション

### 方法1: 自動スクリプトを使用（推奨）

```bash
cd /media/user/Work/work/TechInsight/TechInSight/backend
source venv/bin/activate
./run_migration.sh
```

### 方法2: 手動で実行

#### ステップ1: マイグレーションファイルの生成

```bash
cd /media/user/Work/work/TechInsight/TechInSight/backend
source venv/bin/activate

# マイグレーションファイルの生成
alembic revision --autogenerate -m "Initial migration"
```

**注意**: 既にマイグレーションファイルが存在する場合は、このステップをスキップして直接`alembic upgrade head`を実行してください。

#### ステップ2: マイグレーションの実行

```bash
alembic upgrade head
```

### マイグレーションの確認

```bash
# テーブル一覧を確認
mysql -u techinsight_user -p techinsight -e "SHOW TABLES;"

# documentsテーブルの構造を確認
mysql -u techinsight_user -p techinsight -e "DESCRIBE documents;"
```

期待されるテーブル：
- `documents` - 記事データ
- `embedding_cache` - 埋め込みキャッシュ（オプション）
- `alembic_version` - Alembicのバージョン管理

### マイグレーションのリセット（必要に応じて）

既存のテーブルを削除して再マイグレーションする場合：

```bash
cd /media/user/Work/work/TechInsight/TechInSight/backend
source venv/bin/activate
./reset_and_migrate.sh
```

または手動で：

```bash
# MySQLに接続
mysql -u techinsight_user -p techinsight

# 既存のテーブルを削除（注意：データが失われます）
DROP TABLE IF EXISTS embedding_cache;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS alembic_version;
EXIT;

# マイグレーションを再実行
alembic upgrade head
```

---

## CSVデータのインポート

### インポート方法

```bash
cd /media/user/Work/work/TechInsight/TechInSight/backend
source venv/bin/activate

# デフォルトパス（プロジェクトルートのarticles.csv）を使用
python import_articles.py

# または、カスタムパスを指定
python import_articles.py /path/to/articles.csv
```

### インポートスクリプトの特徴

1. **バッチ処理**: 500件ずつ処理（1万件規模に対応）
2. **バルクインサート**: `bulk_insert_mappings`を使用して効率的に挿入
3. **トランザクション管理**: バッチごとにコミット
4. **エラーハンドリング**: エラー発生時は個別処理にフォールバック
5. **重複チェック**: 既存データをスキップ（デフォルト）

### インポート結果の確認

#### 方法1: 確認スクリプトを使用（推奨）

```bash
cd /media/user/Work/work/TechInsight/TechInSight/backend
source venv/bin/activate
python check_import.py
```

#### 方法2: データベースに直接接続

```bash
mysql -u techinsight_user -p techinsight

# レコード数を確認
SELECT COUNT(*) FROM documents;

# サンプルデータを確認
SELECT id, title, author, category FROM documents LIMIT 10;

EXIT;
```

#### 方法3: APIエンドポイントで確認（サーバー起動後）

```bash
curl http://localhost:8000/api/documents?limit=10
```

### ログ出力例

```
2025-02-24 20:00:00 - INFO - CSVファイルから 1000 件の記事を読み込みました
2025-02-24 20:00:01 - INFO - 既存データをスキップ: 1000 件中 1000 件をインポートします
2025-02-24 20:00:02 - INFO - 処理中: バッチ 1/2 (500 件)
2025-02-24 20:00:03 - INFO - バッチ 1: 500 件をインポートしました
2025-02-24 20:00:04 - INFO - 処理中: バッチ 2/2 (500 件)
2025-02-24 20:00:05 - INFO - バッチ 2: 500 件をインポートしました
2025-02-24 20:00:05 - INFO - インポート完了: 合計 1000 件の記事をインポートしました
```

---

## サーバーの起動

### 方法1: main.pyを使用

```bash
cd /media/user/Work/work/TechInsight/TechInSight/backend
source venv/bin/activate
python -m app.main
```

または、起動スクリプトを使用：

```bash
cd /media/user/Work/work/TechInsight/TechInSight/backend
./start_server.sh
```

### 方法2: uvicornを直接使用

```bash
cd /media/user/Work/work/TechInsight/TechInSight/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 方法3: 起動スクリプトを使用

```bash
cd /media/user/Work/work/TechInsight/TechInSight/backend
./start_server.sh
```

### サーバーの確認

サーバーが正常に起動すると、以下のURLでアクセスできます：

- **API**: http://localhost:8000
- **APIドキュメント（Swagger UI）**: http://localhost:8000/docs
- **APIドキュメント（ReDoc）**: http://localhost:8000/redoc
- **ヘルスチェック**: http://localhost:8000/health

### ヘルスチェック

```bash
curl http://localhost:8000/health
```

正常な場合、`{"status":"healthy"}`が返ります。

---

## CORS設定

### CORSとは

CORS（Cross-Origin Resource Sharing）は、異なるオリジン（ドメイン、ポート、プロトコル）からのリクエストを許可するためのメカニズムです。

**重要**: FastAPIでは、CORSは`fastapi`パッケージに含まれているため、**別途インストールする必要はありません**。

### 現在の設定

#### 開発環境

開発環境では、以下のオリジンからのリクエストを許可しています：

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3001`
- `http://localhost:5173` (Viteのデフォルトポート)
- `http://127.0.0.1:5173`

`.env`ファイルで`ENVIRONMENT=development`と設定することで有効になります。

#### 本番環境

本番環境では、特定のオリジンのみを許可するように設定されています。`.env`ファイルで`ENVIRONMENT=production`と設定し、`main.py`の`cors_origins`リストに本番環境のドメインを追加してください。

### CORS設定の確認

`backend/main.py`のCORS設定を確認：

```python
if settings.environment == "development":
    cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # ...
    ]
else:
    cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://your-production-domain.com",
    ]
```

### CORSヘッダーの確認

```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:8000/api/documents \
     -v
```

正常な場合、レスポンスに以下のヘッダーが含まれます：

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: *
Access-Control-Allow-Headers: *
```

---

## トラブルシューティング

### データベース接続エラー

#### エラー: "Can't connect to MySQL server"

**原因**: MySQLサーバーが起動していない

**解決方法**:
```bash
# MySQLの状態を確認
sudo systemctl status mysql

# 起動していない場合
sudo systemctl start mysql
```

#### エラー: "Access denied for user"

**原因**: `.env`ファイルのユーザー名またはパスワードが間違っている

**解決方法**:
1. `.env`ファイルの`DATABASE_URL`を確認
2. MySQLのユーザーが存在するか確認：
   ```bash
   mysql -u root -p -e "SELECT user, host FROM mysql.user;"
   ```
3. 必要に応じてユーザーを作成またはパスワードをリセット

#### エラー: "Unknown database 'techinsight'"

**原因**: データベースが存在しない

**解決方法**:
```bash
mysql -u root -p
CREATE DATABASE techinsight CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### マイグレーションエラー

#### エラー: "BLOB/TEXT column 'text' used in key specification without a key length"

**原因**: MySQLでは、TEXT型のカラムにUNIQUEインデックスを作成する際、キー長を指定する必要があります。

**解決方法**: このエラーは既に修正済みです。`EmbeddingCache`モデルの`text`カラムは`String(100)`に設定されています。

#### エラー: "relation already exists"

**原因**: テーブルが既に存在している

**解決方法**:
```bash
# 既存のテーブルを確認
mysql -u techinsight_user -p techinsight -e "SHOW TABLES;"

# 必要に応じてテーブルを削除（注意：データが失われます）
mysql -u techinsight_user -p techinsight -e "DROP TABLE IF EXISTS documents;"
mysql -u techinsight_user -p techinsight -e "DROP TABLE IF EXISTS embedding_cache;"
mysql -u techinsight_user -p techinsight -e "DROP TABLE IF EXISTS alembic_version;"

# 再度マイグレーションを実行
alembic upgrade head
```

#### エラー: "Target database is not up to date"

**原因**: マイグレーションファイルが既に存在している

**解決方法**:
```bash
# 直接マイグレーションを実行
alembic upgrade head
```

### モジュールインストールエラー

#### エラー: "ModuleNotFoundError: No module named 'xxx'"

**原因**: 仮想環境が有効化されていない、またはパッケージがインストールされていない

**解決方法**:
```bash
# 仮想環境を有効化
source venv/bin/activate

# 依存関係を再インストール
pip install -r requirements.txt
```

#### エラー: "externally-managed-environment"

**原因**: システムのPythonを使用している

**解決方法**: 必ず仮想環境を使用してください：
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### エラー: "Failed to build 'numpy'"

**原因**: Python 3.13とnumpy 1.24.3の互換性問題

**解決方法**: `requirements.txt`の`numpy`を`>=1.26.0`に更新（既に修正済み）

### CORSエラー

#### エラー: "Access to XMLHttpRequest ... has been blocked by CORS policy"

**原因**: バックエンドサーバーが起動していない、またはCORS設定が正しくない

**解決方法**:
1. バックエンドサーバーが起動しているか確認：
   ```bash
   curl http://localhost:8000/health
   ```
2. `.env`ファイルに`ENVIRONMENT=development`を設定
3. バックエンドサーバーを再起動

### CSVインポートエラー

#### エラー: "Permission denied: '.env'"

**原因**: `.env`ファイルの権限が正しくない

**解決方法**:
```bash
chmod 600 .env
```

#### エラー: "重複エラー"

**原因**: 同じIDのデータが既に存在している

**解決方法**: デフォルトで既存データはスキップされます。すべてのデータを再インポートする場合は、スクリプトを修正して`skip_existing=False`に設定してください。

### サーバー起動エラー

#### エラー: "Address already in use"

**原因**: ポート8000が既に使用されている

**解決方法**:
```bash
# ポート8000を使用しているプロセスを確認
lsof -i :8000

# プロセスを終了
kill -9 <PID>
```

または、別のポートを使用：
```bash
uvicorn app.main:app --reload --port 8001
```

---

## よくある質問

### Q: sentence-transformersは必須ですか？

A: いいえ、オプションです。インストールしない場合、セマンティック検索機能は無効になりますが、その他の機能（キーワード検索、CRUD操作など）は正常に動作します。

### Q: MySQLのポート番号は？

A: デフォルトは3306です。別のポートを使用している場合は、接続文字列で指定してください。

### Q: 接続文字列の形式が分かりません

A: 形式は `mysql+pymysql://ユーザー名:パスワード@ホスト:ポート/データベース名` です。
- `mysql+pymysql`はPyMySQLドライバーを使用することを示します
- パスワードに特殊文字が含まれる場合はURLエンコードが必要です

### Q: JSON型のカラムにembeddingを保存できますか？

A: はい、MySQL 5.7以降ではJSON型がサポートされています。embeddingはJSON配列として保存されます。

### Q: データベースをリセットしたい

A: 以下のコマンドでテーブルを削除して再マイグレーションできます：
```bash
./reset_and_migrate.sh
```

---

## 参考資料

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)

---

## サポート

問題が解決しない場合は、以下を確認してください：

1. ログファイルを確認
2. ブラウザのコンソールでエラーメッセージを確認
3. データベース接続を確認
4. 環境変数の設定を確認
