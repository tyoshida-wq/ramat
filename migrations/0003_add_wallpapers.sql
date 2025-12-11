-- ソウルメイト待ち受け画像テーブル
CREATE TABLE IF NOT EXISTS soulmate_wallpapers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  soulmate_id TEXT NOT NULL,
  mobile_wallpaper_url TEXT,
  pc_wallpaper_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (soulmate_id) REFERENCES soulmates(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_wallpapers_soulmate_id ON soulmate_wallpapers(soulmate_id);
