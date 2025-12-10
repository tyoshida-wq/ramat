-- ========================================
-- Add Authentication Fields to Users Table
-- ========================================

-- usersテーブルに認証フィールドを追加
-- 既存のユーザーIDシステムと統合

-- email フィールド追加（UNIQUE制約）
ALTER TABLE users ADD COLUMN email TEXT;

-- password_hash フィールド追加
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- email_verified フィールド追加（0: 未確認, 1: 確認済み）
ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;

-- username フィールド追加（表示名）
ALTER TABLE users ADD COLUMN username TEXT;

-- emailのインデックス作成（高速検索用）
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 既存データとの互換性のため、既存レコードにはNULL許容
-- 新規登録時はNOT NULL制約をアプリケーション側で実施
