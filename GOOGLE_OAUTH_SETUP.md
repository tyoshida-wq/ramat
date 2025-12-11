# Google OAuth 設定手順

このドキュメントは、Ramat WebアプリにGoogle認証を設定する手順を説明します。

## 1. Google Cloud Consoleでの設定

### 1.1 プロジェクトの作成または選択
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成または既存のプロジェクトを選択

### 1.2 OAuth同意画面の設定
1. 左メニューから「APIとサービス」→「OAuth同意画面」を選択
2. ユーザータイプ: **外部** を選択して「作成」
3. アプリ情報を入力:
   - アプリ名: **Ramat**
   - ユーザーサポートメール: あなたのメールアドレス
   - デベロッパーの連絡先情報: あなたのメールアドレス
4. 「保存して次へ」をクリック
5. スコープの設定はスキップ（デフォルトでOK）
6. テストユーザーの追加（必要に応じて）
7. 「保存して次へ」で完了

### 1.3 OAuth クライアントIDの作成
1. 左メニューから「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「OAuthクライアントID」をクリック
3. アプリケーションの種類: **ウェブアプリケーション** を選択
4. 名前: **Ramat Web App**
5. 承認済みのリダイレクトURIを追加:
   ```
   https://ramat.pages.dev/auth/google/callback
   ```
   
   ※ ローカル開発用に以下も追加可能:
   ```
   http://localhost:3000/auth/google/callback
   ```

6. 「作成」をクリック
7. **クライアントID**と**クライアントシークレット**をコピーして保存

## 2. Cloudflare Pagesへのシークレット設定

### 2.1 本番環境のシークレット設定
ターミナルで以下のコマンドを実行:

```bash
# Google Client IDを設定
echo "YOUR_GOOGLE_CLIENT_ID" | npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name ramat

# Google Client Secretを設定
echo "YOUR_GOOGLE_CLIENT_SECRET" | npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name ramat
```

**注意**: `YOUR_GOOGLE_CLIENT_ID`と`YOUR_GOOGLE_CLIENT_SECRET`を実際の値に置き換えてください。

### 2.2 ローカル開発環境の設定
`.dev.vars`ファイルに以下を追加（既に追加されている場合は値を更新）:

```bash
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

**注意**: `.dev.vars`ファイルは`.gitignore`に含まれており、Gitにコミットされません。

## 3. デプロイと動作確認

### 3.1 デプロイ
```bash
npm run build
npx wrangler pages deploy dist --project-name ramat
```

### 3.2 動作確認
1. https://ramat.pages.dev/login にアクセス
2. 「Googleでログイン」または「Googleで登録」ボタンをクリック
3. Googleアカウント選択画面が表示される
4. アカウントを選択すると、Ramatにログイン完了

## 4. トラブルシューティング

### エラー: "redirect_uri_mismatch"
- Google Cloud Consoleの承認済みリダイレクトURIが正しく設定されているか確認
- URIは完全一致する必要があります（末尾のスラッシュにも注意）

### エラー: "Google OAuth not configured"
- Cloudflare Pages Secretsが正しく設定されているか確認
- `npx wrangler pages secret list --project-name ramat` で確認可能

### ローカル開発でのエラー
- `.dev.vars`ファイルが正しく設定されているか確認
- `npm run build`を実行してから`pm2 start ecosystem.config.cjs`でサーバーを起動

## 5. データベース構造

Google OAuth認証により、以下のカラムがusersテーブルに追加されています:

```sql
- oauth_provider: TEXT (例: 'google')
- oauth_id: TEXT (GoogleユーザーID)
- avatar_url: TEXT (プロフィール画像URL)
```

## 6. セキュリティ上の注意

- クライアントシークレットは絶対に公開しないでください
- `.dev.vars`ファイルをGitにコミットしないでください
- 本番環境ではHTTPSを使用してください（Cloudflare Pagesはデフォルトで有効）
- StateパラメータによるCSRF対策が実装されています

## 7. 参考リンク

- [Google OAuth 2.0ドキュメント](https://developers.google.com/identity/protocols/oauth2)
- [Cloudflare Workers OAuth実装](https://developers.cloudflare.com/workers/)
- [Wrangler CLI ドキュメント](https://developers.cloudflare.com/workers/wrangler/)
