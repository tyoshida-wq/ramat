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
- **Latest Deploy**: https://dc6eacce.ramat.pages.dev
- **Sandbox Dev**: https://3000-i1w5j0r4k4fnfaobo1q5r-c07dda5e.sandbox.novita.ai

### ページ別URL
- **ランディングページ**: https://ramat.pages.dev/
- **生成ページ**: https://ramat.pages.dev/generate
- **管理者ページ**: https://ramat.pages.dev/admin

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

4. **下部ナビゲーションメニュー**
   - トップ（メイン生成ページ）
   - 生成（今後実装予定）
   - チャット（今後実装予定）
   - 管理者（管理者ダッシュボード）

5. **ランディングページ**
   - **ヒーローセクション**: アプリコンセプトの説明と「今すぐ始める」CTA
   - **特徴セクション**: 4つの主要機能（AI生成、個性的プロフィール、癒しのデザイン、多様な動物）
   - **CTAセクション**: 再度の行動喚起
   - **フローティングアニメーション**: 特徴アイコンの浮遊効果
   - **レスポンシブデザイン**: モバイル/デスクトップ完全対応

6. **管理者ダッシュボード（フル機能版）**
   - **統計カード**: 総生成数、ユーザー数、今日の生成、API使用率
   - **クイックアクション**: 新規生成、履歴確認、データ保存、システム更新
   - **週間グラフ**: Chart.jsによる週間生成数推移の可視化
   - **人気動物TOP 5**: ランキングバーチャート
   - **生成履歴テーブル**: 最近の生成履歴一覧（画像、名前、動物、時刻、操作）
   - **システム設定**: API管理、データベース、ユーザー管理、動物・名前管理
   - **リアルタイム更新**: 30秒ごとに統計を自動更新
   - **カウントアップアニメーション**: 数値の滑らかな表示

### 機能詳細

#### 生成フロー
1. ユーザーが「ソウルメイトを呼ぶ」ボタンをクリック
2. バックエンドが動物と名前をランダム選択
3. Gemini APIでプロフィール生成（コンセプト、性格、口調）
4. Gemini APIで画像生成（Base64形式）
5. 結果をUIに表示

#### API エンドポイント

**POST /api/generate** - ソウルメイト生成
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

**GET /api/admin/stats** - 管理者統計データ
- レスポンス例:
  ```json
  {
    "totalGenerations": 1234,
    "totalUsers": 456,
    "todayGenerations": 89,
    "apiUsage": 67,
    "weeklyData": [65, 78, 90, 81, 95, 88, 92],
    "topAnimals": [
      { "name": "北極ギツネ", "count": 234, "percentage": 45 },
      { "name": "パンダ", "count": 156, "percentage": 30 }
    ]
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
- **Charts**: Chart.js (週間グラフ可視化)
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

### ランディングページ
1. https://ramat.pages.dev にアクセス
2. アプリの特徴とコンセプトを確認
3. 「今すぐ始める」または「ソウルメイトを呼ぶ」ボタンをクリック
4. 生成ページに遷移

### 生成ページ（ソウルメイト生成）
1. https://ramat.pages.dev/generate にアクセス（またはランディングページから遷移）
2. 「ソウルメイトを呼ぶ」ボタンをクリック
3. AIが動物と名前を選んでプロフィールと画像を生成（約10秒）
4. あなただけの守護動物が表示されます

### 管理者ダッシュボード
1. https://ramat.pages.dev/admin にアクセス
2. 統計情報とグラフを確認
3. クイックアクションでシステム操作
4. 生成履歴の確認と管理
5. システム設定の変更

## ページ構成

- **トップ** (`/`) - ランディングページ（アプリ紹介、特徴説明、CTA）
- **生成** (`/generate`) - ソウルメイト生成ページ（AI生成機能）
- **チャット** (`/chat`) - 今後実装予定
- **管理者** (`/admin`) - 管理者ダッシュボード（実装済み）

## 今後の改善案

### 短期（Phase 1）
- 生成結果の保存機能（D1 Database）
- お気に入り機能
- ユーザー認証機能

### 中期（Phase 2）
- 生成ページ（履歴から再生成）
- チャットページ（ソウルメイトとの会話機能）
- SNSシェア機能
- データエクスポート機能

### 長期（Phase 3）
- カスタム動物・名前選択機能
- A/Bテスト機能
- より詳細な分析ダッシュボード
- 多言語対応
