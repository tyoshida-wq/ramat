-- ========================================
-- Ramat Memory System: Long-term Memory
-- ========================================

-- ユーザーのパーソナリティプロファイル（会話を通して学習）
CREATE TABLE IF NOT EXISTS user_personality (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  soulmate_id INTEGER NOT NULL,
  personality_summary TEXT,  -- 「明るい性格、猫が好き、仕事はエンジニア」など
  interests TEXT,            -- 趣味・関心事
  conversation_style TEXT,   -- 会話のスタイル
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (soulmate_id) REFERENCES soulmates(id) ON DELETE CASCADE,
  UNIQUE(user_id, soulmate_id)
);

-- 日次会話サマリー（過去30日分を参照）
CREATE TABLE IF NOT EXISTS daily_conversation_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  soulmate_id INTEGER NOT NULL,
  date DATE NOT NULL,        -- 2024-12-11
  summary TEXT NOT NULL,     -- 「デートの計画を立てた。映画とカフェに行く予定」
  topics TEXT,               -- 「デート、映画、カフェ」などのキーワード
  emotion TEXT,              -- 「楽しみ、わくわく」など
  message_count INTEGER DEFAULT 0,  -- その日のメッセージ数
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (soulmate_id) REFERENCES soulmates(id) ON DELETE CASCADE,
  UNIQUE(user_id, soulmate_id, date)
);

-- インデックス作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_user_personality_user_id ON user_personality(user_id);
CREATE INDEX IF NOT EXISTS idx_user_personality_soulmate_id ON user_personality(soulmate_id);
CREATE INDEX IF NOT EXISTS idx_daily_summary_user_id ON daily_conversation_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON daily_conversation_summary(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_summary_user_soulmate_date ON daily_conversation_summary(user_id, soulmate_id, date DESC);
