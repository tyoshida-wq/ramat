-- ========================================
-- Ramat Database Schema
-- ========================================

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ソウルメイトテーブル
CREATE TABLE IF NOT EXISTS soulmates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  concept TEXT NOT NULL,
  personality TEXT NOT NULL,
  tone TEXT NOT NULL,
  animal TEXT NOT NULL,
  image_base64 TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- チャットメッセージテーブル
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  soulmate_id INTEGER NOT NULL,
  sender TEXT NOT NULL CHECK(sender IN ('user', 'soulmate')),
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (soulmate_id) REFERENCES soulmates(id) ON DELETE CASCADE
);

-- ユーザー統計テーブル
CREATE TABLE IF NOT EXISTS user_stats (
  user_id TEXT PRIMARY KEY,
  total_messages INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_soulmates_user_id ON soulmates(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_soulmate_id ON chat_messages(soulmate_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
