-- OAuth認証用のカラムを追加
ALTER TABLE users ADD COLUMN oauth_provider TEXT;
ALTER TABLE users ADD COLUMN oauth_id TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider ON users(oauth_provider);
CREATE INDEX IF NOT EXISTS idx_users_oauth_id ON users(oauth_id);

-- OAuthプロバイダーとIDの組み合わせをユニークに
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth_unique ON users(oauth_provider, oauth_id) WHERE oauth_provider IS NOT NULL;
