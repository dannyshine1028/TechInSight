# マイグレーションガイド

新機能追加に伴うデータベースマイグレーション手順

## 追加されたテーブル

以下の3つのテーブルが追加されました：

1. **search_logs** - 検索キーワードのログ記録
2. **mentions** - @メンション機能
3. **document_links** - 関連記事リンク

## マイグレーション手順

### 1. マイグレーションファイルの生成

```bash
cd backend
source venv/bin/activate
alembic revision --autogenerate -m "Add analytics, mentions and document_links tables"
```

### 2. マイグレーションファイルの確認

生成されたマイグレーションファイル（`alembic/versions/xxxxx_add_analytics_mentions_and_document_links_tables.py`）を確認し、必要に応じて修正してください。

### 3. マイグレーションの実行

```bash
alembic upgrade head
```

### 4. テーブルの確認

```bash
mysql -u techinsight_user -p techinsight -e "SHOW TABLES;"
```

以下のテーブルが追加されていることを確認：
- `search_logs`
- `mentions`
- `document_links`

## テーブル構造

### search_logs

```sql
CREATE TABLE search_logs (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    query VARCHAR(255) NOT NULL,
    search_type VARCHAR(50) NOT NULL,
    result_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_query (query),
    INDEX idx_created_at (created_at)
);
```

### mentions

```sql
CREATE TABLE mentions (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    document_id INTEGER NOT NULL,
    mentioned_document_id INTEGER NOT NULL,
    mention_text TEXT,
    position_start INTEGER,
    position_end INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id),
    FOREIGN KEY (mentioned_document_id) REFERENCES documents(id),
    INDEX idx_document_id (document_id),
    INDEX idx_mentioned_document_id (mentioned_document_id)
);
```

### document_links

```sql
CREATE TABLE document_links (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    source_document_id INTEGER NOT NULL,
    target_document_id INTEGER NOT NULL,
    link_type VARCHAR(50) NOT NULL DEFAULT 'manual',
    similarity_score VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_document_id) REFERENCES documents(id),
    FOREIGN KEY (target_document_id) REFERENCES documents(id),
    INDEX idx_source_document_id (source_document_id),
    INDEX idx_target_document_id (target_document_id)
);
```

## トラブルシューティング

### エラー: "Table already exists"

既存のテーブルがある場合：

```bash
# テーブルを削除（注意：データが失われます）
mysql -u techinsight_user -p techinsight -e "DROP TABLE IF EXISTS document_links;"
mysql -u techinsight_user -p techinsight -e "DROP TABLE IF EXISTS mentions;"
mysql -u techinsight_user -p techinsight -e "DROP TABLE IF EXISTS search_logs;"

# 再度マイグレーションを実行
alembic upgrade head
```

### エラー: "Foreign key constraint fails"

ドキュメントが存在しない場合、先にドキュメントを作成してください。
