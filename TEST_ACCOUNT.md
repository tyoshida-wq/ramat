# 🧪 Ramat テストアカウント情報

## テストアカウント詳細

### ログイン情報

```
📧 メールアドレス: test@ramat.app
🔒 パスワード: Test1234
👤 ユーザー名: テストユーザー
```

---

## 使用方法

### 1. 本番環境でテスト

```
1. https://ramat.pages.dev/login にアクセス
2. 「ログイン」タブをクリック
3. 以下の情報を入力：
   - メールアドレス: test@ramat.app
   - パスワード: Test1234
4. 「ログイン」ボタンをクリック
5. 全機能にアクセス可能
```

### 2. 開発環境でテスト

```
1. https://3000-i1w5j0r4k4fnfaobo1q5r-c07dda5e.sandbox.novita.ai/login にアクセス
2. 上記と同じログイン情報を使用
```

---

## テストアカウント詳細情報

### データベースレコード

```sql
-- User ID
user_test_1733872800_abc123

-- Email
test@ramat.app

-- Password (Plain Text - テスト用のみ)
Test1234

-- Password Hash (SHA-256)
8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918

-- Username
テストユーザー

-- Email Verified
1 (確認済み)
```

---

## テスト可能な機能

### ✅ 認証機能
- [x] ログイン
- [x] ログアウト
- [x] セッション維持（30日間）
- [x] 認証チェック（全ページ）

### ✅ 生成機能
- [x] ソウルメイト生成
- [x] プロフィール表示
- [x] 画像生成
- [x] D1への保存

### ✅ チャット機能
- [x] メッセージ送信
- [x] AI返信（Gemini）
- [x] 会話履歴保存
- [x] スクロール機能

### ✅ マイページ機能
- [x] プロフィール表示
- [x] 統計情報表示
- [x] データエクスポート
- [x] データ削除

### ✅ 管理者機能
- [x] ダッシュボード表示
- [x] 統計情報
- [x] グラフ表示

---

## 注意事項

### ⚠️ セキュリティ

- このアカウントはテスト用です
- 本番環境で公開されているため、機密情報は入力しないでください
- パスワードは簡単なものにしています

### 🔄 リセット方法

テストアカウントをリセットする場合：

```bash
# 1. テストユーザーのデータを削除
npx wrangler d1 execute ramat-production --remote --command="DELETE FROM chat_messages WHERE user_id = 'user_test_1733872800_abc123'"
npx wrangler d1 execute ramat-production --remote --command="DELETE FROM soulmates WHERE user_id = 'user_test_1733872800_abc123'"
npx wrangler d1 execute ramat-production --remote --command="DELETE FROM user_stats WHERE user_id = 'user_test_1733872800_abc123'"

# 2. テストユーザーを再作成
npx wrangler d1 execute ramat-production --remote --file=./create_test_user.sql
```

---

## 追加のテストアカウント作成

必要に応じて追加のテストアカウントを作成できます：

```sql
-- 例: test2@ramat.app / Test1234
INSERT INTO users (id, email, password_hash, username, email_verified) 
VALUES (
  'user_test2_1733872800_xyz789',
  'test2@ramat.app',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  'テストユーザー2',
  1
);
```

---

## パスワードハッシュ生成方法

新しいパスワードのハッシュを生成する場合：

```javascript
// ブラウザのコンソールで実行
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  console.log(hashHex)
}

hashPassword('YourNewPassword')
```

---

## 問題が発生した場合

### ログインできない
- メールアドレスとパスワードを再確認
- ブラウザのCookieをクリア
- シークレットモードで試す

### データが表示されない
- 一度ソウルメイトを生成してください
- チャットでメッセージを送信してください
- ページをリロードしてください

---

**作成日**: 2025-12-10
**最終更新**: 2025-12-10
