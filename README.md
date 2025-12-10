# Ramat

## プロジェクト概要
- **名前**: Ramat
- **目的**: 孤独な魂に寄り添う、世界で一匹だけの「ソウルメイト（守護動物）」を生成するウェブアプリケーション
- **ターゲット**: 女性ユーザー向け
- **特徴**: 
  - パステルカラーの桜色グラデーションデザイン
  - モバイル最適化（レスポンシブ対応）
  - Gemini AIによる守護動物のプロフィールと画像の自動生成

## URLs
- **Production**: https://ramat.pages.dev
- **Latest Deploy**: https://321c1dc5.ramat.pages.dev
- **Sandbox Dev**: https://3000-i1w5j0r4k4fnfaobo1q5r-c07dda5e.sandbox.novita.ai

## 実装された機能

### ✅ 完了した機能
1. **UI/UXデザイン**
   - モバイル最適化されたレスポンシブレイアウト
   - 桜色グラデーションの女性向けデザイン
   - アニメーション効果（フェードイン、パルス、スピナー）
   - ガラスモーフィズムカードデザイン

2. **バックエンド機能**
   - Gemini 2.0 Flash によるプロフィール生成
   - Gemini 2.5 Flash Image による画像生成
   - 動物75種類 × 名前100種類からランダム選択
   - REST API (`/api/generate`)

3. **フロントエンド機能**
   - ボタンクリックでAPI呼び出し
   - ローディング状態の表示
   - 生成結果のスムーズな表示
   - エラーハンドリング

### 機能詳細

#### 生成フロー
1. ユーザーが「ソウルメイトを呼ぶ」ボタンをクリック
2. バックエンドが動物と名前をランダム選択
3. Gemini APIでプロフィール生成（コンセプト、性格、口調）
4. Gemini APIで画像生成（Base64形式）
5. 結果をUIに表示

#### API エンドポイント
- **POST /api/generate**
  - レスポンス例:
    ```json
    {
      "success": true,
      "animal": {
        "en": "arctic wolf",
        "ja": "北極オオカミ"
      },
      "profile": {
        "concept": "星影のホッキョクオオカミ",
        "name": "アキラ",
        "personality": "物静かで穏やか...",
        "tone": "静かで優しい語り口...",
        "imagePrompt": "...",
        "image": "data:image/png;base64,..."
      }
    }
    ```

## データアーキテクチャ

### 動物リスト（全75種類）
- **哺乳類**: 55種類
  - 小動物系（11）: レッサーパンダ、カワウソ、アザラシ、フェネック等
  - ネコ科（5）: ユキヒョウ、オオヤマネコ、カラカル等
  - イヌ科（5）: オオカミ、コヨーテ、ディンゴ等
  - シカ科（6）: シカ、トナカイ、ヘラジカ等
  - 海洋哺乳類（6）: イルカ、クジラ、シロイルカ等
  - その他（22）: パンダ、コアラ、ウサギ、ハムスター等

- **幻想的生物**: 20種類
  - 西洋系（10）: フェニックス、ペガサス、グリフォン等
  - 東洋系（10）: 麒麟、九尾の狐、白虎、朱雀等

### 名前リスト（全100種類）
- **カタカナ系**: 50種類
  - 星・光系: シリウス、ルミナ、ステラ等
  - 自然系: サクラ、カエデ、スミレ等
  - 音楽系: アルト、メロ、ハーモニー等
  - 宝石系: アメジスト、サファイア、ルビー等

- **ひらがな系**: 50種類
  - 季節系: はる、ゆい、あおい等
  - 自然系: つむぎ、かすみ、しずく等
  - 短い名前: れん、みお、ゆう、りん等

### AI生成パラメータ

**Gemini 2.0 Flash (テキスト生成):**
```javascript
{
  model: 'gemini-2.0-flash-exp',
  temperature: 1.8,      // 高い創造性
  maxOutputTokens: 500,
  topP: 0.98,
  topK: 50
}
```

**Gemini 2.5 Flash Image (画像生成):**
```javascript
{
  model: 'gemini-2.5-flash-image',
  responseModalities: ['image']
}
```

## 技術スタック
- **Frontend**: HTML/CSS/JavaScript (Vanilla)
- **Backend**: Hono + TypeScript
- **AI**: Google Gemini API (2.0 Flash + 2.5 Flash Image)
- **Deployment**: Cloudflare Pages
- **Development**: PM2 + Wrangler
- **Version Control**: Git

## デプロイ
- **Platform**: Cloudflare Pages
- **Status**: ✅ Active
- **環境変数**: GEMINI_API_KEY (Cloudflare Secret)
- **Last Updated**: 2025-12-10

## ローカル開発

### セットアップ
```bash
# 依存関係インストール
npm install

# .dev.vars ファイルを作成（ローカル開発用）
echo "GEMINI_API_KEY=your-api-key" > .dev.vars
```

### 開発サーバー
```bash
# ビルド
npm run build

# PM2で起動
pm2 start ecosystem.config.cjs

# ログ確認
pm2 logs webapp --nostream

# 停止
pm2 delete webapp
```

### デプロイ
```bash
# ビルド & デプロイ
npm run build
npx wrangler pages deploy dist --project-name ramat

# シークレット設定
npx wrangler pages secret put GEMINI_API_KEY --project-name ramat
```

## プロジェクト管理
- Git履歴で全変更を追跡
- 定期的なコミットで開発進捗を記録
- `.gitignore` で機密情報を保護（.dev.vars, .env等）

## 使用方法
1. https://ramat.pages.dev にアクセス
2. 「ソウルメイトを呼ぶ」ボタンをクリック
3. AIが動物と名前を選んでプロフィールと画像を生成
4. あなただけの守護動物が表示されます

## 今後の改善案
- 生成結果の保存機能
- お気に入り機能
- SNSシェア機能
- 複数回生成の履歴表示
- カスタム動物・名前選択機能
