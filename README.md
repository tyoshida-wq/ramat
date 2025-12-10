# Ramat

## プロジェクト概要
- **名前**: Ramat
- **目的**: 孤独な魂に寄り添う、世界で一匹だけの「ソウルメイト（守護動物）」を生成するウェブアプリケーション
- **ターゲット**: 女性ユーザー向け
- **特徴**: 
  - パステルカラーの桜色グラデーションデザイン
  - モバイル最適化（レスポンシブ対応）
  - Gemini AIによる守護動物のプロフィールと画像の自動生成
  - **D1 Databaseによる永続的なデータ保存**

## URLs
- **Production**: https://ramat.pages.dev
- **Latest Deploy**: https://47002ef9.ramat.pages.dev
- **Sandbox Dev**: https://3000-i1w5j0r4k4fnfaobo1q5r-c07dda5e.sandbox.novita.ai

### ページ別URL
- **ランディングページ**: https://ramat.pages.dev/
- **生成ページ**: https://ramat.pages.dev/generate
- **チャットページ**: https://ramat.pages.dev/chat
- **マイページ**: https://ramat.pages.dev/mypage
- **管理者ページ**: https://ramat.pages.dev/admin

## 実装された機能

### ✅ 完了した機能

#### 1. **UI/UXデザイン**
- モバイル最適化されたレスポンシブレイアウト
- 桜色グラデーションの女性向けデザイン
- アニメーション効果（フェードイン、パルス、スピナー）
- ガラスモーフィズムカードデザイン

#### 2. **バックエンド機能（フル実装完了）**
- **Gemini 2.0 Flash** によるプロフィール生成
- **Gemini 2.5 Flash Image** による画像生成
- **D1 Database統合** - Cloudflare D1によるデータ永続化
- 動物75種類 × 名前100種類からランダム選択
- REST API完全実装

#### 3. **データベース（D1）**
- **users** テーブル - ユーザー管理
- **soulmates** テーブル - 生成されたソウルメイト情報
- **chat_messages** テーブル - チャット履歴
- **user_stats** テーブル - ユーザー統計情報
- ローカル開発用 `--local` モード対応
- 本番環境への自動マイグレーション

#### 4. **ランディングページ**
- **ヒーローセクション**: アプリコンセプトの説明と「今すぐ始める」CTA
- **特徴セクション**: 4つの主要機能（AI生成、個性的プロフィール、癒しのデザイン、多様な動物）
- **CTAセクション**: 再度の行動喚起
- **フローティングアニメーション**: 特徴アイコンの浮遊効果
- **レスポンシブデザイン**: モバイル/デスクトップ完全対応

#### 5. **生成ページ（ソウルメイト生成）**
- ワンクリックでAI生成
- D1データベースへの自動保存
- LocalStorage併用によるオフライン対応
- ローディング状態の表示
- エラーハンドリング

#### 6. **チャットページ（完全バックエンド統合）**
- **ヘッダー大画像デザイン**: ソウルメイト画像を200x200pxで大きく表示
- **スクロール時縮小機能**: 50px以上スクロールで60x60pxに縮小
- **Gemini API統合**: ソウルメイトの性格・口調を反映した返信生成
- **D1 Database統合**: 会話履歴をサーバー側に永続保存
- **リアルタイム会話**: メッセージ送受信機能
- **タイピングインジケーター**: AI応答中の視覚フィードバック
- **スムーズスクロール**: 自動で最新メッセージへ移動
- **API + LocalStorage併用**: オフライン対応とデータ同期
- **レスポンシブ対応**: モバイル/デスクトップ最適化

#### 7. **マイページ（完全バックエンド統合）**
- **ソウルメイトプロフィールカード**: 
  - 画像、名前、コンセプト、動物、生成日表示
  - 「出会って○日」カウンター
- **統計情報**: 
  - 会話数（D1から取得）
  - お気に入り数
  - 出会った日数
- **設定メニュー**: 
  - 通知設定（今後実装）
  - テーマ変更（今後実装）
  - データエクスポート（JSON形式、APIデータ含む）
  - データ削除（確認ダイアログ付き）
- **API + LocalStorage併用**: オフライン対応とデータ同期

#### 8. **管理者ダッシュボード（フル機能版）**
- **統計カード**: 総生成数、ユーザー数、今日の生成、API使用率
- **クイックアクション**: 新規生成、履歴確認、データ保存、システム更新
- **週間グラフ**: Chart.jsによる週間生成数推移の可視化
- **人気動物TOP 5**: ランキングバーチャート
- **生成履歴テーブル**: 最近の生成履歴一覧
- **システム設定**: API管理、データベース、ユーザー管理
- **リアルタイム更新**: 30秒ごとに統計を自動更新

## API エンドポイント

### 生成関連
**POST /api/generate** - ソウルメイト生成（D1保存対応）
- リクエスト: `{ "userId": "user_xxx" }`
- レスポンス:
  ```json
  {
    "success": true,
    "animal": { "en": "arctic wolf", "ja": "北極オオカミ" },
    "profile": {
      "concept": "星影のホッキョクオオカミ",
      "name": "アキラ",
      "personality": "物静かで穏やか...",
      "tone": "静かで優しい語り口...",
      "image": "data:image/png;base64,..."
    }
  }
  ```

### チャット関連
**POST /api/chat/send** - チャットメッセージ送信（Gemini + D1統合）
- リクエスト: `{ "userId": "user_xxx", "message": "こんにちは" }`
- レスポンス:
  ```json
  {
    "success": true,
    "reply": "こんにちは！✨ 今日はどんな一日だった？",
    "timestamp": "2025-12-10T12:34:56.789Z"
  }
  ```

**POST /api/chat/message** - 旧APIエンドポイント（互換性維持）

### マイページ関連
**GET /api/mypage/profile/:userId** - プロフィール取得
- レスポンス:
  ```json
  {
    "success": true,
    "profile": {
      "name": "アキラ",
      "concept": "星影のホッキョクオオカミ",
      "personality": "...",
      "tone": "...",
      "animal": "北極オオカミ",
      "image": "data:image/png;base64,...",
      "createdAt": "2025-12-10T12:34:56.789Z"
    }
  }
  ```

**GET /api/mypage/stats/:userId** - 統計情報取得
- レスポンス:
  ```json
  {
    "success": true,
    "stats": {
      "totalMessages": 42,
      "totalConversations": 5,
      "favoriteCount": 0,
      "daysSince": 3,
      "lastChatDate": "2025-12-10T12:34:56.789Z"
    }
  }
  ```

**GET /api/mypage/history/:userId?limit=50** - チャット履歴取得
- レスポンス:
  ```json
  {
    "success": true,
    "history": [
      {
        "id": 1,
        "sender": "user",
        "message": "こんにちは",
        "created_at": "2025-12-10T12:34:56.789Z"
      },
      {
        "id": 2,
        "sender": "soulmate",
        "message": "こんにちは！✨",
        "created_at": "2025-12-10T12:35:01.234Z"
      }
    ]
  }
  ```

### 管理者関連
**GET /api/admin/stats** - 管理者統計データ（モックデータ）

## データアーキテクチャ

### D1 Database スキーマ

#### users テーブル
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### soulmates テーブル
```sql
CREATE TABLE soulmates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  concept TEXT NOT NULL,
  personality TEXT NOT NULL,
  tone TEXT NOT NULL,
  animal TEXT NOT NULL,
  image_base64 TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### chat_messages テーブル
```sql
CREATE TABLE chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  soulmate_id INTEGER NOT NULL,
  sender TEXT NOT NULL CHECK(sender IN ('user', 'soulmate')),
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (soulmate_id) REFERENCES soulmates(id)
);
```

#### user_stats テーブル
```sql
CREATE TABLE user_stats (
  user_id TEXT PRIMARY KEY,
  total_messages INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

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

**Gemini 2.0 Flash (チャット返信):**
```javascript
{
  model: 'gemini-2.0-flash-exp',
  temperature: 1.2,      // 会話の自然さ重視
  maxOutputTokens: 200,
  topP: 0.95,
  topK: 40
}
```

## 技術スタック
- **Frontend**: HTML/CSS/JavaScript (Vanilla)
- **Backend**: Hono + TypeScript
- **Database**: Cloudflare D1 (SQLite)
- **AI**: Google Gemini API (2.0 Flash + 2.5 Flash Image)
- **Charts**: Chart.js (週間グラフ可視化)
- **Deployment**: Cloudflare Pages
- **Development**: PM2 + Wrangler
- **Version Control**: Git

## デプロイ
- **Platform**: Cloudflare Pages
- **Status**: ✅ Active
- **環境変数**: 
  - `GEMINI_API_KEY` (Cloudflare Secret)
  - `DB` (D1 Database Binding)
- **Last Updated**: 2025-12-10

## ローカル開発

### セットアップ
```bash
# 依存関係インストール
npm install

# .dev.vars ファイルを作成（ローカル開発用）
echo "GEMINI_API_KEY=your-api-key" > .dev.vars

# D1マイグレーション実行
npm run db:migrate:local
```

### 開発サーバー
```bash
# ビルド
npm run build

# PM2で起動（D1 --localモード）
pm2 start ecosystem.config.cjs

# ログ確認
pm2 logs webapp --nostream

# 停止
pm2 delete webapp
```

### D1データベース管理
```bash
# ローカルマイグレーション
npm run db:migrate:local

# 本番マイグレーション
npm run db:migrate:prod

# ローカルDBコンソール
npm run db:console:local

# 本番DBコンソール
npm run db:console:prod
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
- `.gitignore` で機密情報を保護（.dev.vars, .env, .wrangler等）

## 使用方法

### ランディングページ
1. https://ramat.pages.dev にアクセス
2. アプリの特徴とコンセプトを確認
3. 「今すぐ始める」または「ソウルメイトを呼ぶ」ボタンをクリック
4. 生成ページに遷移

### 生成ページ（ソウルメイト生成）
1. https://ramat.pages.dev/generate にアクセス
2. 「ソウルメイトを呼ぶ」ボタンをクリック
3. AIが動物と名前を選んでプロフィールと画像を生成（約10秒）
4. 生成結果がD1 Databaseに自動保存
5. あなただけの守護動物が表示されます

### チャットページ（ソウルメイトとの対話）
1. https://ramat.pages.dev/chat にアクセス
2. ソウルメイトの大きな画像と名前が表示されます
3. メッセージを入力して送信
4. Gemini APIがソウルメイトの性格・口調を反映した返信を生成
5. 会話履歴がD1 Databaseに自動保存
6. 50px以上スクロールするとヘッダーが縮小

### マイページ（統計と設定）
1. https://ramat.pages.dev/mypage にアクセス
2. ソウルメイトのプロフィールを確認
3. 統計情報（会話数、出会った日数）を確認
4. データエクスポート機能でJSONファイルをダウンロード
5. データ削除機能で全データをクリア

### 管理者ダッシュボード
1. https://ramat.pages.dev/admin にアクセス
2. 統計情報とグラフを確認
3. クイックアクションでシステム操作
4. 生成履歴の確認と管理
5. システム設定の変更

## ページ構成

- **トップ** (`/`) - ランディングページ（アプリ紹介、特徴説明、CTA）
- **生成** (`/generate`) - ソウルメイト生成ページ（AI生成機能 + D1保存）
- **チャット** (`/chat`) - ソウルメイトとの対話ページ（Gemini API + D1統合完了）
- **マイページ** (`/mypage`) - プロフィール・統計・設定（D1統合完了）
- **管理者** (`/admin`) - 管理者ダッシュボード（実装済み）

## 完了した実装（2025-12-10）

### ✅ バックエンド完全実装
1. **D1 Database統合**
   - users, soulmates, chat_messages, user_stats テーブル作成
   - ローカル・本番マイグレーション完了
   - インデックス最適化

2. **チャットAPI完全実装**
   - `/api/chat/send` エンドポイント
   - Gemini API統合（性格反映）
   - D1への会話履歴保存
   - 統計情報自動更新

3. **マイページAPI完全実装**
   - `/api/mypage/profile/:userId` - プロフィール取得
   - `/api/mypage/stats/:userId` - 統計取得
   - `/api/mypage/history/:userId` - 履歴取得

4. **フロントエンド統合**
   - chat.js を実API接続に更新
   - mypage.js を実API接続に更新
   - app.js にuserID送信機能追加
   - API + LocalStorage併用でオフライン対応

## 今後の改善案

### 短期（Phase 1） - 完了✅
- ✅ Gemini API連携でチャット返信を生成
- ✅ 生成結果の保存機能（D1 Database）
- ✅ 会話履歴の保存
- ⏳ ユーザー認証機能（今後実装）

### 中期（Phase 2）
- お気に入り機能（UI準備済み、バックエンド未実装）
- 履歴から再生成
- SNSシェア機能
- 会話のトーン調整機能
- 管理者ダッシュボードのD1統合

### 長期（Phase 3）
- カスタム動物・名前選択機能
- A/Bテスト機能
- より詳細な分析ダッシュボード
- 多言語対応
- ユーザー認証・セッション管理
