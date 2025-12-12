# Google OAuth 認証設定ガイド

## 📋 目次
1. [Google Cloud Console での設定](#1-google-cloud-console-での設定)
2. [開発環境の設定](#2-開発環境の設定)
3. [本番環境の設定](#3-本番環境の設定)
4. [動作確認](#4-動作確認)
5. [トラブルシューティング](#5-トラブルシューティング)

---

## 1. Google Cloud Console での設定

### ステップ 1.1: Google Cloud Console にアクセス

1. **Google Cloud Console** にアクセス: https://console.cloud.google.com/
2. **Googleアカウント** でログイン

### ステップ 1.2: プロジェクトの作成

1. 画面上部の **プロジェクト選択** ドロップダウンをクリック
2. **新しいプロジェクト** をクリック
3. プロジェクト名を入力（例: `Ramat Web App`）
4. **作成** をクリック
5. 作成したプロジェクトを選択

### ステップ 1.3: OAuth 同意画面の設定

1. 左側メニューから **APIとサービス** → **OAuth 同意画面** を選択
2. **ユーザータイプ** を選択:
   - **外部**: 一般ユーザー向け（推奨）
   - **内部**: Google Workspace組織内のユーザーのみ
3. **作成** をクリック

#### OAuth 同意画面の入力項目:

**アプリケーション情報:**
- **アプリ名**: `Ramat` （または任意の名前）
- **ユーザーサポートメール**: あなたのメールアドレス
- **アプリのロゴ**: （オプション）Ramatのロゴをアップロード

**アプリのドメイン:**
- **アプリのホームページ**: `https://ramat.pages.dev`
- **アプリのプライバシーポリシー**: `https://ramat.pages.dev/legal` （法律ページがある場合）
- **アプリの利用規約**: `https://ramat.pages.dev/legal` （法律ページがある場合）

**承認済みドメイン:**
- `ramat.pages.dev` を追加

**デベロッパーの連絡先情報:**
- あなたのメールアドレスを入力

4. **保存して次へ** をクリック

#### スコープの設定:

1. **スコープを追加または削除** をクリック
2. 以下のスコープを選択:
   - `openid`
   - `email`
   - `profile`
3. **更新** をクリック
4. **保存して次へ** をクリック

#### テストユーザーの追加（開発中のみ）:

1. **テストユーザーを追加** をクリック
2. テストに使用するGoogleアカウントのメールアドレスを追加
3. **保存して次へ** をクリック

5. 概要を確認して **ダッシュボードに戻る** をクリック

### ステップ 1.4: OAuth 2.0 クライアント ID の作成

1. 左側メニューから **APIとサービス** → **認証情報** を選択
2. 上部の **+認証情報を作成** をクリック
3. **OAuth クライアント ID** を選択

#### アプリケーションの種類:
- **ウェブ アプリケーション** を選択

#### 名前:
- `Ramat Web App` （または任意の名前）

#### 承認済みの JavaScript 生成元:
以下の2つを追加:
- `https://ramat.pages.dev`
- `http://localhost:3000` （開発環境用）

#### 承認済みのリダイレクト URI:
以下の2つを追加:
- `https://ramat.pages.dev/auth/google/callback`
- `http://localhost:3000/auth/google/callback` （開発環境用）

4. **作成** をクリック

### ステップ 1.5: クライアント ID とクライアント シークレットをコピー

作成完了後、ポップアップが表示されます:
- **クライアント ID**: `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`
- **クライアント シークレット**: `GOCSPX-abcdefghijklmnopqrstuvwxyz`

⚠️ **重要**: この情報は後で使用するので、メモ帳などにコピーして保存してください。

---

## 2. 開発環境の設定

### ステップ 2.1: `.dev.vars` ファイルの更新

プロジェクトのルートディレクトリにある `.dev.vars` ファイルを編集します:

```bash
GEMINI_API_KEY=AIzaSyAHy_NSFLMdBOMlQi7B_tCN1ePRcMWZ-iY
RESEND_API_KEY=re_c8tgTAb7_PTPmxMwAUkNbShPhS6E7dtH2
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```

⚠️ **注意**: 
- `GOOGLE_CLIENT_ID` と `GOOGLE_CLIENT_SECRET` を、ステップ1.5でコピーした実際の値に置き換えてください
- このファイルは `.gitignore` に含まれているため、Gitにコミットされません

### ステップ 2.2: 開発サーバーの再起動

```bash
cd /home/user/webapp
npm run build
pm2 restart webapp
```

### ステップ 2.3: 動作確認（開発環境）

1. ブラウザで `http://localhost:3000/login` にアクセス
2. **Googleでログイン** ボタンをクリック
3. Googleのログイン画面が表示されることを確認
4. テストユーザーでログイン
5. `/chat` にリダイレクトされることを確認

---

## 3. 本番環境の設定

### ステップ 3.1: Cloudflare Pages に環境変数を設定

#### 方法A: Cloudflare Dashboard から設定

1. **Cloudflare Dashboard** にアクセス: https://dash.cloudflare.com/
2. **Pages** セクションに移動
3. **ramat** プロジェクトを選択
4. **設定 (Settings)** タブをクリック
5. **環境変数 (Environment variables)** セクションを探す
6. **変数を追加** をクリック

**追加する環境変数:**

| 変数名 | 値 | 環境 |
|--------|-----|------|
| `GOOGLE_CLIENT_ID` | `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com` | Production |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-abcdefghijklmnopqrstuvwxyz` | Production |

7. それぞれの環境変数について:
   - **変数名** を入力
   - **値** を入力
   - **環境** で `Production` を選択
   - **暗号化** にチェックを入れる（シークレットの場合）
   - **保存** をクリック

8. すべての環境変数を追加したら、プロジェクトを再デプロイ

#### 方法B: Wrangler CLI から設定（推奨）

コマンドラインから設定する場合:

```bash
# Cloudflare にログイン（初回のみ）
npx wrangler login

# GOOGLE_CLIENT_ID を設定
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name ramat

# プロンプトが表示されたら、クライアントIDを入力してEnter

# GOOGLE_CLIENT_SECRET を設定
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name ramat

# プロンプトが表示されたら、クライアントシークレットを入力してEnter
```

### ステップ 3.2: 設定の確認

設定された環境変数を確認:

```bash
npx wrangler pages secret list --project-name ramat
```

以下のように表示されれば成功:
```
The "production" environment of your Pages project "ramat" has access to the following secrets:
  - GEMINI_API_KEY: Value Encrypted
  - RESEND_API_KEY: Value Encrypted
  - GOOGLE_CLIENT_ID: Value Encrypted
  - GOOGLE_CLIENT_SECRET: Value Encrypted
```

### ステップ 3.3: 本番環境へデプロイ

```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name ramat
```

---

## 4. 動作確認

### ステップ 4.1: 本番環境での動作確認

1. ブラウザで `https://ramat.pages.dev/login` にアクセス
2. **Googleでログイン** ボタンをクリック
3. Googleのログイン画面が表示される
4. Googleアカウントでログイン
5. 初回の場合、アプリへのアクセス許可を求められる
6. **許可** をクリック
7. `/chat` にリダイレクトされる
8. 初回ユーザーの場合、生成モーダルが表示される

### ステップ 4.2: データベースの確認

ユーザーがデータベースに保存されているか確認:

```bash
npx wrangler d1 execute ramat-production --remote --command="SELECT id, email, username, email_verified FROM users ORDER BY created_at DESC LIMIT 5"
```

---

## 5. トラブルシューティング

### 問題 1: "Google OAuth not configured" エラー

**原因**: 環境変数が設定されていない

**解決方法**:
1. `.dev.vars` ファイルを確認（開発環境）
2. Cloudflare Pages の環境変数を確認（本番環境）
3. 環境変数名が正確か確認: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### 問題 2: "redirect_uri_mismatch" エラー

**原因**: Google Cloud Console で承認済みリダイレクト URI が設定されていない

**解決方法**:
1. Google Cloud Console → **認証情報** を開く
2. OAuth 2.0 クライアント ID を選択
3. **承認済みのリダイレクト URI** に以下を追加:
   - `https://ramat.pages.dev/auth/google/callback`
   - `http://localhost:3000/auth/google/callback`

### 問題 3: "access_denied" エラー

**原因**: OAuth同意画面が未公開、またはテストユーザーに追加されていない

**解決方法**:
1. Google Cloud Console → **OAuth 同意画面** を開く
2. **公開ステータス** を確認
3. テスト中の場合、**テストユーザー** にログインユーザーを追加

### 問題 4: ログイン後に `/chat` にリダイレクトされない

**原因**: JWT トークンが生成されていない、またはCookieが保存されていない

**解決方法**:
1. ブラウザの開発者ツールを開く
2. **Application** → **Cookies** を確認
3. `auth_token` クッキーが存在するか確認
4. なければ、サーバーログを確認:
   ```bash
   pm2 logs webapp --nostream
   ```

### 問題 5: "token_exchange_failed" エラー

**原因**: クライアントシークレットが間違っている

**解決方法**:
1. Google Cloud Console で正しいクライアントシークレットを確認
2. `.dev.vars` または Cloudflare Pages の環境変数を更新
3. 開発サーバーまたは本番環境を再起動

---

## 📝 チェックリスト

### Google Cloud Console
- [ ] プロジェクトを作成
- [ ] OAuth 同意画面を設定
- [ ] OAuth 2.0 クライアント ID を作成
- [ ] 承認済みの JavaScript 生成元を追加
- [ ] 承認済みのリダイレクト URI を追加
- [ ] クライアント ID をコピー
- [ ] クライアント シークレットをコピー

### 開発環境
- [ ] `.dev.vars` ファイルを更新
- [ ] 開発サーバーを再起動
- [ ] ローカルでログインをテスト

### 本番環境
- [ ] Cloudflare Pages に環境変数を設定
- [ ] 本番環境にデプロイ
- [ ] 本番環境でログインをテスト
- [ ] データベースにユーザーが保存されることを確認

---

## 🔐 セキュリティのベストプラクティス

1. **クライアントシークレットを公開しない**
   - GitHubにコミットしない
   - `.dev.vars` は `.gitignore` に含める

2. **本番環境では必ず HTTPS を使用**
   - Cloudflare Pages は自動的に HTTPS を提供

3. **CSRF 対策**
   - `state` パラメータを使用（実装済み）

4. **定期的なトークンの更新**
   - 必要に応じてクライアントシークレットをローテーション

5. **スコープの最小化**
   - 必要最小限のスコープのみを要求（`openid`, `email`, `profile`）

---

## 📞 サポート

問題が解決しない場合:
1. [Google OAuth 2.0 ドキュメント](https://developers.google.com/identity/protocols/oauth2)
2. [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
3. Ramatプロジェクトの GitHub Issues

---

## ✅ 完了！

これで Google OAuth 認証が正しく設定されました。ユーザーは Google アカウントでログインできるようになります。
