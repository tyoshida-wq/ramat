-- テストユーザーの作成
-- メール: test@ramat.app
-- パスワード: Test1234
-- パスワードハッシュ (SHA-256): Test1234 のハッシュ値

INSERT INTO users (id, email, password_hash, username, email_verified, created_at, last_active_at) 
VALUES (
  'user_test_1733872800_abc123',
  'test@ramat.app',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  'テストユーザー',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
