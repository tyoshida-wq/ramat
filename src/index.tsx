import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'
import { animals } from './data/animals'
import { names } from './data/names'
import { generateProfile, generateImage } from './services/gemini'
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  verifyToken,
  validateEmail,
  validatePassword,
  validateUsername
} from './utils/auth'
import { Resend } from 'resend'

type Bindings = {
  GEMINI_API_KEY: string
  RESEND_API_KEY: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  DB: D1Database
  R2: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// JWT Secret（環境変数から取得、なければデフォルト値）
const JWT_SECRET = 'ramat-jwt-secret-key-change-in-production'

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './public' }))

// CORS設定
app.use('/api/*', cors())

// 認証ミドルウェア（ログインページ以外のすべてのページで認証チェック）
app.use('*', async (c, next) => {
  const path = c.req.path
  
  // ログインページと認証APIは認証不要
  const publicPaths = ['/login', '/api/auth/register', '/api/auth/login', '/static']
  const isPublic = publicPaths.some(p => path.startsWith(p))
  
  if (isPublic) {
    return next()
  }
  
  // トークンチェック
  const token = getCookie(c, 'auth_token')
  
  if (!token) {
    // 未ログインの場合、ログインページにリダイレクト
    if (path.startsWith('/api/')) {
      // API呼び出しの場合はJSON返却
      return c.json({ error: 'Authentication required' }, 401)
    }
    return c.redirect('/login')
  }
  
  // トークン検証
  const payload = await verifyToken(token, JWT_SECRET)
  
  if (!payload) {
    // 無効なトークンの場合、Cookieを削除してログインページへ
    deleteCookie(c, 'auth_token', { path: '/' })
    if (path.startsWith('/api/')) {
      return c.json({ error: 'Invalid token' }, 401)
    }
    return c.redirect('/login')
  }
  
  // 認証成功、ユーザーIDをコンテキストに保存
  c.set('userId', payload.userId)
  
  return next()
})

app.use(renderer)

// ログイン/新規登録ページ
app.get('/login', (c) => {
  return c.render(
    <div class="auth-container">
      <div class="auth-card">
        <header class="auth-header">
          <h1 class="auth-title">🌸 Ramat 🌸</h1>
          <p class="auth-subtitle">あなただけの守護動物</p>
        </header>

        {/* タブ切り替え */}
        <div class="auth-tabs">
          <button class="auth-tab active" id="loginTab">ログイン</button>
          <button class="auth-tab" id="registerTab">新規登録</button>
        </div>

        {/* ログインフォーム */}
        <form class="auth-form" id="loginForm">
          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">📧</span>
              <span>メールアドレス</span>
            </label>
            <input 
              type="email" 
              class="auth-input" 
              id="loginEmail"
              placeholder="example@mail.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">🔒</span>
              <span>パスワード</span>
            </label>
            <input 
              type="password" 
              class="auth-input" 
              id="loginPassword"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>

          <div class="form-error" id="loginError"></div>

          <button type="submit" class="auth-submit-btn" id="loginSubmitBtn">
            <span class="btn-icon">✨</span>
            <span class="btn-text">ログイン</span>
          </button>

          <div class="auth-divider">
            <span>または</span>
          </div>

          <a href="/auth/google" class="google-btn">
            <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Googleでログイン</span>
          </a>

          <div class="auth-footer">
            <a href="/reset-password" class="auth-link">パスワードをお忘れですか？</a>
          </div>
        </form>

        {/* 新規登録フォーム */}
        <form class="auth-form" id="registerForm" style="display: none;">
          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">👤</span>
              <span>ユーザー名</span>
            </label>
            <input 
              type="text" 
              class="auth-input" 
              id="registerUsername"
              placeholder="あなたの名前"
              required
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">📧</span>
              <span>メールアドレス</span>
            </label>
            <input 
              type="email" 
              class="auth-input" 
              id="registerEmail"
              placeholder="example@mail.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              <span class="label-icon">🔒</span>
              <span>パスワード</span>
            </label>
            <input 
              type="password" 
              class="auth-input" 
              id="registerPassword"
              placeholder="8文字以上（英数字含む）"
              required
              autocomplete="new-password"
            />
          </div>

          <div class="form-error" id="registerError"></div>

          <button type="submit" class="auth-submit-btn" id="registerSubmitBtn">
            <span class="btn-icon">🌸</span>
            <span class="btn-text">新規登録</span>
          </button>

          <div class="auth-divider">
            <span>または</span>
          </div>

          <a href="/auth/google" class="google-btn">
            <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Googleで登録</span>
          </a>

          <div class="auth-footer">
            <p class="auth-note">
              登録することで、<a href="/terms" class="auth-link">利用規約</a>に同意したものとみなされます
            </p>
          </div>
        </form>

        {/* 説明テキスト */}
        <div class="auth-description">
          <p class="auth-desc-icon">🦊</p>
          <p class="auth-desc-text">ログインして<br />あなたのソウルメイトに会いましょう</p>
        </div>
      </div>

      <script src="/static/login.js"></script>
    </div>
  )
})

// トップページ（ランディングページ）
app.get('/', (c) => {
  return c.render(
    <div class="landing-page">
      {/* ヘッダー */}
      <header class="landing-header">
        <h1 class="landing-logo">Ramat 🌸</h1>
        <div class="landing-nav">
          <a href="/login" class="landing-nav-link">ログイン</a>
          <a href="/chat" class="landing-nav-btn">始める</a>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section class="landing-hero">
        <div class="landing-hero-content">
          <div class="landing-hero-image">
            <img src="/static/hero-cat.png" alt="可愛い守護動物" class="hero-illustration" />
          </div>
          <div class="landing-hero-text">
            <h2 class="landing-hero-title">
              あなたの心に寄り添う<br />
              小さな守護動物
            </h2>
            <p class="landing-hero-description">
              いつもそばにいて、話を聞いてくれる<br />
              あなただけの特別な存在
            </p>
            <div class="landing-hero-buttons">
              <a href="/chat" class="landing-primary-btn">
                <span class="btn-icon">🌸</span>
                <span class="btn-text">出会いを探す</span>
              </a>
              <a href="/auth/google" class="landing-google-btn">
                <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Googleでログイン</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section class="landing-features">
        <h3 class="landing-features-title">💝 できること</h3>
        <div class="landing-features-grid">
          <div class="landing-feature-card">
            <div class="feature-icon">🌙</div>
            <h4 class="feature-title">いつでも話せる</h4>
            <p class="feature-description">
              疲れた時、嬉しい時、<br />
              いつでもあなたの話を聞きます
            </p>
          </div>
          <div class="landing-feature-card">
            <div class="feature-icon">🎨</div>
            <h4 class="feature-title">あなただけの姿</h4>
            <p class="feature-description">
              75種類の動物から、<br />
              あなたに合った子が見つかります
            </p>
          </div>
          <div class="landing-feature-card">
            <div class="feature-icon">💌</div>
            <h4 class="feature-title">思い出を形に</h4>
            <p class="feature-description">
              待ち受けやグッズで<br />
              いつも一緒にいられます
            </p>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer class="landing-footer">
        <div class="landing-footer-links">
          <a href="/privacy">プライバシーポリシー</a>
          <span class="footer-separator">|</span>
          <a href="/terms">利用規約</a>
          <span class="footer-separator">|</span>
          <a href="/legal">特定商取引法</a>
          <span class="footer-separator">|</span>
          <a href="/contact">お問い合わせ</a>
        </div>
        <p class="landing-footer-copyright">&copy; 2025 Ramat. All rights reserved.</p>
      </footer>
    </div>
  )
})

// 生成ページ（旧トップページの機能）
// 生成ページはチャットに統合されたため、リダイレクト
app.get('/generate', (c) => {
  return c.redirect('/chat')
})

// チャットページ
app.get('/chat', (c) => {
  return c.render(
    <div class="chat-container">
      {/* ソウルメイト生成モーダル（初回のみ表示） */}
      <div class="generation-modal" id="generationModal" style="display: none;">
        <div class="generation-modal-content">
          {/* 初期画面 */}
          <div class="generation-step" id="stepWelcome">
            <div class="generation-icon">✨</div>
            <h2 class="generation-title">あなたのソウルメイトを<br />呼びましょう</h2>
            <div class="generation-sparkles">🌸 ✨ 🌙</div>
            <p class="generation-description">
              心に寄り添う特別な存在が<br />
              あなたを待っています
            </p>
            <button class="generation-btn" id="startGenerationBtn">
              <span class="btn-icon">🌸</span>
              <span class="btn-text">ソウルメイトを呼ぶ</span>
            </button>
          </div>

          {/* 生成中画面 */}
          <div class="generation-step" id="stepGenerating" style="display: none;">
            <div class="generation-loading">
              <div class="loading-circle"></div>
              <div class="loading-sparkles">
                <span class="sparkle">✨</span>
                <span class="sparkle">🌸</span>
                <span class="sparkle">🌙</span>
              </div>
            </div>
            <h2 class="generation-title">あなたのソウルメイトに<br />出会っています...</h2>
            <div class="generation-progress">
              <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
              </div>
              <p class="progress-text" id="progressText">準備中...</p>
            </div>
          </div>

          {/* 完了画面 */}
          <div class="generation-step" id="stepComplete" style="display: none;">
            <div class="generation-result">
              <div class="result-image-wrapper">
                <img src="" alt="ソウルメイト" class="result-image" id="resultImage" />
              </div>
              <h2 class="result-greeting" id="resultGreeting">こんにちは！</h2>
              <h3 class="result-name" id="resultName">ユキヒメ</h3>
              <p class="result-concept" id="resultConcept">星影のホッキョクオオカミ</p>
              <div class="result-details">
                <p class="result-personality" id="resultPersonality"></p>
              </div>
              <button class="start-chat-btn" id="startChatBtn">
                <span class="btn-icon">💬</span>
                <span class="btn-text">チャットを始める</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ソウルメイトヘッダー（固定） */}
      <header class="chat-header" id="chatHeader">
        <div class="soulmate-avatar-wrapper">
          <img 
            src="https://via.placeholder.com/200/FFB7C5/FFFFFF?text=🦊" 
            alt="ソウルメイト" 
            class="soulmate-avatar"
            id="soulmateAvatar"
          />
        </div>
        <div class="soulmate-info">
          <h2 class="soulmate-name" id="soulmateName">読み込み中...</h2>
          <p class="soulmate-concept" id="soulmateConcept">...</p>
        </div>
        <div class="soulmate-status">
          <span class="status-indicator">🟢</span>
          <span class="status-text">オンライン</span>
        </div>
      </header>

      {/* チャットメッセージエリア（スクロール可能） */}
      <main class="chat-messages" id="chatMessages">
        {/* メッセージは動的に追加 */}
      </main>

      {/* 入力エリア（固定） */}
      <footer class="chat-input-area">
        <input 
          type="text" 
          class="chat-input" 
          id="chatInput"
          placeholder="メッセージを入力..."
          autocomplete="off"
        />
        <button class="chat-send-btn" id="chatSendBtn">
          <span>📤</span>
        </button>
      </footer>

      {/* 下部ナビゲーション */}
      <nav class="bottom-nav">
        <a href="/" class="nav-item">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          <span class="nav-label">ホーム</span>
        </a>

        <a href="/chat" class="nav-item active">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <span class="nav-label">チャット</span>
        </a>
        <a href="/store" class="nav-item">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </span>
          <span class="nav-label">ストア</span>
        </a>
        <a href="/mypage" class="nav-item">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <span class="nav-label">マイページ</span>
        </a>
        <a href="/admin" class="nav-item">
          <span class="nav-icon">✱</span>
          <span class="nav-label">管理者</span>
        </a>
      </nav>

      <script src="/static/common.js"></script>
      <script src="/static/chat.js"></script>
    </div>
  )
})

// マイページ
app.get('/mypage', (c) => {
  return c.render(
    <div class="mypage-container">
      {/* ヘッダー */}
      <header class="mypage-header">
        <h1 class="mypage-title">👤 マイページ</h1>
        <p class="mypage-subtitle">あなたとソウルメイトの絆</p>
      </header>

      {/* メインコンテンツ */}
      <main class="mypage-main">
        {/* ソウルメイトプロフィールカード */}
        <section class="soulmate-profile-card">
          <div class="profile-image-wrapper">
            <img 
              src="https://via.placeholder.com/150/FFB7C5/FFFFFF?text=🦊" 
              alt="ソウルメイト" 
              class="profile-image"
              id="profileImage"
            />
          </div>
          <h2 class="profile-name" id="profileName">ユキヒメ</h2>
          <p class="profile-concept" id="profileConcept">星影のホッキョクオオカミ</p>
          <div class="profile-meta">
            <div class="meta-item">
              <span class="meta-icon">🐾</span>
              <span class="meta-text" id="profileAnimal">北極オオカミ</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">📅</span>
              <span class="meta-text" id="profileDate">2025/12/10</span>
            </div>
          </div>
          <div class="profile-days">
            <span class="days-icon">🎂</span>
            <span class="days-text">あなたと出会って</span>
            <span class="days-count" id="daysCount">1</span>
            <span class="days-unit">日</span>
          </div>
        </section>

        {/* 設定メニュー */}
        <section class="settings-section">
          <h2 class="section-title">🔧 設定</h2>
          <div class="settings-menu">
            <button class="setting-item" id="notificationSettings">
              <span class="setting-icon">🔔</span>
              <span class="setting-text">通知設定</span>
              <span class="setting-arrow">›</span>
            </button>
            <button class="setting-item" id="themeSettings">
              <span class="setting-icon">🎨</span>
              <span class="setting-text">テーマ変更</span>
              <span class="setting-arrow">›</span>
            </button>
            <button class="setting-item" id="exportData">
              <span class="setting-icon">💾</span>
              <span class="setting-text">データエクスポート</span>
              <span class="setting-arrow">›</span>
            </button>
            <button class="setting-item danger" id="deleteData">
              <span class="setting-icon">🗑️</span>
              <span class="setting-text">データ削除</span>
              <span class="setting-arrow">›</span>
            </button>
          </div>
        </section>
      </main>

      {/* 下部ナビゲーション */}
      <nav class="bottom-nav">
        <a href="/" class="nav-item">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          <span class="nav-label">ホーム</span>
        </a>

        <a href="/chat" class="nav-item">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <span class="nav-label">チャット</span>
        </a>
        <a href="/mypage" class="nav-item active">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <span class="nav-label">マイページ</span>
        </a>
        <a href="/admin" class="nav-item">
          <span class="nav-icon">✱</span>
          <span class="nav-label">管理者</span>
        </a>
      </nav>

      <script src="/static/common.js"></script>
      <script src="/static/mypage.js"></script>
    </div>
  )
})

// ストアページ
app.get('/store', async (c) => {
  const db = c.env.DB
  const userId = c.get('userId')

  // ユーザーのソウルメイト情報を取得
  let soulmate = null
  let wallpapers = null
  
  try {
    soulmate = await db.prepare(
      'SELECT * FROM soulmates WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first()

    if (soulmate) {
      // 待ち受け画像の状態を確認
      wallpapers = await db.prepare(
        'SELECT * FROM soulmate_wallpapers WHERE soulmate_id = ? ORDER BY created_at DESC LIMIT 1'
      ).bind(soulmate.id).first()
    }
  } catch (error) {
    console.error('Failed to fetch store data:', error)
  }

  return c.render(
    <div class="store-container">
      {/* 準備中モーダル */}
      <div class="coming-soon-modal" id="coming-soon-modal">
        <div class="coming-soon-content">
          <div class="coming-soon-icon">🚧</div>
          <h2 class="coming-soon-title">ストア機能は準備中です</h2>
          <p class="coming-soon-description">
            現在、決済システムとの連携を準備しております。<br />
            もうしばらくお待ちください。
          </p>
          <div class="coming-soon-features">
            <div class="feature-item">
              <span class="feature-icon">🖼️</span>
              <span class="feature-text">待ち受け画像</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🎨</span>
              <span class="feature-text">カスタムグッズ</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💝</span>
              <span class="feature-text">特別アイテム</span>
            </div>
          </div>
          <button class="coming-soon-close-btn" onclick="window.location.href='/chat'">
            <span class="btn-icon">💬</span>
            <span class="btn-text">チャットに戻る</span>
          </button>
        </div>
      </div>

      <header class="store-header">
        <h1 class="store-title">🛍️ ソウルメイトストア</h1>
        <p class="store-subtitle">あなたのソウルメイトをグッズに</p>
      </header>

      <main class="store-main">
        {/* 待ち受け画像セクション */}
        {soulmate ? (
          <section class="wallpaper-section">
            {wallpapers ? (
              // 生成済み
              <div class="wallpaper-products">
                <h2 class="section-title">🖼️ 待ち受け画像</h2>
                <div class="product-grid">
                  <div class="product-card digital">
                    <div class="product-badge">📱 スマホ用</div>
                    <div class="product-image">
                      <img src={wallpapers.mobile_wallpaper_url} alt="スマホ待ち受け" loading="lazy" />
                    </div>
                    <div class="product-info">
                      <h3 class="product-name">スマホ待ち受け</h3>
                      <p class="product-description">1080×1920px 高解像度（9:16）</p>
                      <div class="product-footer">
                        <span class="product-price">¥500</span>
                        <button class="buy-btn" onclick="purchaseItem('wallpaper_mobile', 500)">
                          購入する
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="product-card digital">
                    <div class="product-badge">💻 PC用</div>
                    <div class="product-image">
                      <img src={wallpapers.pc_wallpaper_url} alt="PC待ち受け" loading="lazy" />
                    </div>
                    <div class="product-info">
                      <h3 class="product-name">PC待ち受け</h3>
                      <p class="product-description">1920×1080px 高解像度（16:9）</p>
                      <div class="product-footer">
                        <span class="product-price">¥500</span>
                        <button class="buy-btn" onclick="purchaseItem('wallpaper_pc', 500)">
                          購入する
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="product-card digital featured">
                    <div class="product-badge popular">🌟 お得セット</div>
                    <div class="product-image dual">
                      <img src={wallpapers.mobile_wallpaper_url} alt="スマホ" class="dual-image" loading="lazy" />
                      <img src={wallpapers.pc_wallpaper_url} alt="PC" class="dual-image" loading="lazy" />
                    </div>
                    <div class="product-info">
                      <h3 class="product-name">待ち受けセット</h3>
                      <p class="product-description">スマホ＋PC セット割引</p>
                      <div class="product-footer">
                        <span class="product-price original">¥1,000</span>
                        <span class="product-price sale">¥800</span>
                        <button class="buy-btn primary" onclick="purchaseItem('wallpaper_set', 800)">
                          セット購入
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // 未生成
              <div class="wallpaper-hero">
                <div class="hero-icon">🖼️✨</div>
                <h2>あなたのソウルメイトの待ち受け画像</h2>
                <p class="hero-description">
                  スマートフォンとPCの壁紙を生成できます<br />
                  あなたのソウルメイトが美しい背景と共に蘇ります
                </p>
                
                <div class="wallpaper-not-generated">
                  <div class="preview-placeholder">
                    <div class="placeholder-content">
                      <span class="placeholder-icon">📱 💻</span>
                      <p>待ち受け画像はまだ生成されていません</p>
                    </div>
                  </div>
                  
                  <button class="generate-wallpaper-btn" onclick={`generateWallpaper('${soulmate.id}')`}>
                    <span class="btn-icon">✨</span>
                    <span class="btn-text">待ち受け画像を生成する</span>
                    <span class="btn-cost">(約¥72)</span>
                  </button>
                  
                  <div class="generation-note">
                    <p>💡 生成には約30〜60秒かかります</p>
                    <p>📱 スマホ用（9:16）とPC用（16:9）の2枚が生成されます</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : null}

        {/* 商品カテゴリー */}
        <section class="category-section">
          <h2 class="section-title">🎁 その他のグッズ</h2>
          <div class="category-tabs">
            <button class="category-tab active" data-category="all">すべて</button>
            <button class="category-tab" data-category="goods">グッズ</button>
          </div>
        </section>

        {/* 商品グリッド */}
        <section class="products-section">
          <div class="products-grid" id="productsGrid">
            {/* アクリルキーホルダー */}
            <div class="product-card" data-category="goods">
              <div class="product-image">
                <img src="https://via.placeholder.com/300x300/FFB7C5/FFFFFF?text=🔑" alt="キーホルダー" />
                <span class="product-badge">配送</span>
              </div>
              <div class="product-info">
                <h3 class="product-name">アクリルキーホルダー</h3>
                <p class="product-desc">いつでも持ち歩けるソウルメイト</p>
                <div class="product-specs">
                  <span class="spec-item">📏 5cm角</span>
                  <span class="spec-item">🎨 両面印刷</span>
                </div>
                <div class="product-footer">
                  <span class="product-price">¥1,200</span>
                  <button class="product-btn" onclick="purchaseItem('keychain', 1200)">
                    <span>購入する</span>
                  </button>
                </div>
              </div>
            </div>

            {/* アクリルスタンド */}
            <div class="product-card" data-category="goods">
              <div class="product-image">
                <img src="https://via.placeholder.com/300x400/FFB7C5/FFFFFF?text=🎭" alt="アクスタ" />
                <span class="product-badge">配送</span>
              </div>
              <div class="product-info">
                <h3 class="product-name">アクリルスタンド</h3>
                <p class="product-desc">デスクに飾れる癒しの相棒</p>
                <div class="product-specs">
                  <span class="spec-item">📏 10cm高</span>
                  <span class="spec-item">🎨 台座付き</span>
                </div>
                <div class="product-footer">
                  <span class="product-price">¥1,800</span>
                  <button class="product-btn" onclick="purchaseItem('acrylic_stand', 1800)">
                    <span>購入する</span>
                  </button>
                </div>
              </div>
            </div>

            {/* マグカップ */}
            <div class="product-card" data-category="goods">
              <div class="product-image">
                <img src="https://via.placeholder.com/300x300/FFB7C5/FFFFFF?text=☕" alt="マグカップ" />
                <span class="product-badge">配送</span>
              </div>
              <div class="product-info">
                <h3 class="product-name">マグカップ</h3>
                <p class="product-desc">毎日のコーヒータイムに</p>
                <div class="product-specs">
                  <span class="spec-item">☕ 300ml</span>
                  <span class="spec-item">🎨 全面印刷</span>
                </div>
                <div class="product-footer">
                  <span class="product-price">¥1,500</span>
                  <button class="product-btn" onclick="purchaseItem('mug', 1500)">
                    <span>購入する</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 注意事項 */}
        <section class="notice-section">
          <h3 class="notice-title">📝 ご注意事項</h3>
          <ul class="notice-list">
            <li>デジタル商品は購入後すぐにダウンロードできます</li>
            <li>物理グッズは製作・配送に1〜2週間かかります</li>
            <li>返品・交換は不良品の場合のみ対応いたします</li>
            <li>ソウルメイトの画像は自動的に反映されます</li>
          </ul>
        </section>
      </main>

      {/* ナビゲーション */}
      <nav class="bottom-nav">
        <a href="/" class="nav-item">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          <span class="nav-label">ホーム</span>
        </a>

        <a href="/chat" class="nav-item">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <span class="nav-label">チャット</span>
        </a>
        <a href="/store" class="nav-item active">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </span>
          <span class="nav-label">ストア</span>
        </a>
        <a href="/mypage" class="nav-item">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <span class="nav-label">マイページ</span>
        </a>
      </nav>
      <script src="/static/common.js"></script>
      <script src="/static/wallpaper-gen.js"></script>
    </div>
  )
})

// 管理者ページ
app.get('/admin', (c) => {
  return c.render(
    <div class="admin-container">
      <header class="admin-header">
        <h1 class="admin-title">⚙️ 管理者ダッシュボード</h1>
        <p class="admin-subtitle">Ramat システム管理</p>
      </header>

      <main class="admin-main">
        {/* 統計カード */}
        <section class="stats-section">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-label">総生成数</div>
              <div class="stat-value" id="totalGenerations">0</div>
              <div class="stat-change">↑ 12% (先週比)</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-label">ユーザー数</div>
              <div class="stat-value" id="totalUsers">0</div>
              <div class="stat-change">↑ 8% (先週比)</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-content">
              <div class="stat-label">今日の生成</div>
              <div class="stat-value" id="todayGenerations">0</div>
              <div class="stat-change">→ 0% (昨日比)</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-content">
              <div class="stat-label">API使用率</div>
              <div class="stat-value" id="apiUsage">0%</div>
              <div class="stat-progress">
                <div class="stat-progress-bar" style="width: 0%"></div>
              </div>
            </div>
          </div>
        </section>

        {/* クイックアクション */}
        <section class="quick-actions">
          <h2 class="section-title">🎯 クイックアクション</h2>
          <div class="action-buttons">
            <button class="action-btn primary">
              <span class="btn-icon">✨</span>
              <span>新規生成</span>
            </button>
            <button class="action-btn secondary">
              <span class="btn-icon">📜</span>
              <span>履歴確認</span>
            </button>
          </div>
        </section>

        {/* グラフエリア */}
        <section class="charts-section">
          <div class="chart-card">
            <h3 class="chart-title">📈 週間生成数推移</h3>
            <canvas id="weeklyChart" class="chart-canvas"></canvas>
          </div>
        </section>

        {/* 最近の生成履歴 */}
        <section class="history-section">
          <h2 class="section-title">📝 最近の生成履歴</h2>
          <div class="history-table">
            <div class="table-header">
              <div class="col-image">画像</div>
              <div class="col-name">名前</div>
              <div class="col-animal">動物</div>
              <div class="col-time">生成時刻</div>
              <div class="col-actions">操作</div>
            </div>
            <div class="table-body" id="historyTableBody">
              <div class="table-row">
                <div class="col-image">
                  <div class="history-thumbnail">🦊</div>
                </div>
                <div class="col-name">ユキヒメ</div>
                <div class="col-animal">北極ギツネ</div>
                <div class="col-time">2分前</div>
                <div class="col-actions">
                  <button class="icon-btn view" title="詳細">👁️</button>
                  <button class="icon-btn delete" title="削除">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ユーザー管理 */}
        <section class="users-section">
          <h2 class="section-title">👥 ユーザー管理</h2>
          <div class="users-table">
            <div class="table-header">
              <div class="col-user-id">ユーザーID</div>
              <div class="col-soulmate">ソウルメイト</div>
              <div class="col-messages">メッセージ数</div>
              <div class="col-last-active">最終活動</div>
              <div class="col-actions">操作</div>
            </div>
            <div class="table-body" id="usersTableBody">
              <div class="loading">読み込み中...</div>
            </div>
          </div>
        </section>

        {/* お問い合わせ管理 */}
        <section class="contacts-section">
          <h2 class="section-title">📧 お問い合わせ管理</h2>
          <div class="contacts-table">
            <div class="table-header">
              <div class="col-contact-id">ID</div>
              <div class="col-contact-name">名前</div>
              <div class="col-contact-email">メールアドレス</div>
              <div class="col-contact-subject">件名</div>
              <div class="col-contact-status">ステータス</div>
              <div class="col-contact-date">受信日時</div>
              <div class="col-actions">操作</div>
            </div>
            <div class="table-body" id="contactsTableBody">
              <div class="loading">読み込み中...</div>
            </div>
          </div>
        </section>

        {/* システム設定 */}
        <section class="settings-section">
          <h2 class="section-title">⚙️ システム設定</h2>
          <div class="settings-grid">
            <div class="setting-card">
              <h3>🔑 API管理</h3>
              <p>API制限とレート設定</p>
              <button class="setting-btn">設定を開く</button>
            </div>
            <div class="setting-card">
              <h3>💾 データベース</h3>
              <p>バックアップと復元</p>
              <button class="setting-btn">管理する</button>
            </div>
            <div class="setting-card">
              <h3>📊 メモリーシステム</h3>
              <p>長期記憶とサマリー管理</p>
              <button class="setting-btn">管理する</button>
            </div>
            <div class="setting-card">
              <h3>🎨 動物・名前管理</h3>
              <p>リスト編集と追加</p>
              <button class="setting-btn">編集する</button>
            </div>
          </div>
        </section>
      </main>

      <nav class="bottom-nav">
        <a href="/" class="nav-item">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          <span class="nav-label">ホーム</span>
        </a>

        <a href="/chat" class="nav-item">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <span class="nav-label">チャット</span>
        </a>
        <a href="/mypage" class="nav-item">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <span class="nav-label">マイページ</span>
        </a>
        <a href="/admin" class="nav-item active">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
            </svg>
          </span>
          <span class="nav-label">管理者</span>
        </a>
      </nav>

      <script src="/static/common.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script src="/static/admin.js"></script>
    </div>
  )
})

// API: ソウルメイト生成
app.post('/api/generate', async (c) => {
  try {
    const apiKey = c.env.GEMINI_API_KEY
    const db = c.env.DB
    
    if (!apiKey) {
      return c.json({ error: 'API key not configured' }, 500)
    }

    const body = await c.req.json()
    const { userId } = body

    // ランダムに動物と名前を選択
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)]
    const randomName = names[Math.floor(Math.random() * names.length)]

    console.log(`Selected: ${randomAnimal.en} (${randomAnimal.ja}) - ${randomName}`)

    // ステップ1: プロフィール生成
    const profile = await generateProfile(
      randomAnimal.en,
      randomName,
      apiKey
    )

    console.log('Profile generated:', profile)

    // ステップ2: 画像生成
    const imageDataUrl = await generateImage(profile.imagePrompt, apiKey)

    // D1データベースに保存（userIdがある場合）
    if (userId && db) {
      try {
        // ユーザー存在確認・作成
        const user = await db.prepare('SELECT * FROM users WHERE id = ?')
          .bind(userId)
          .first()

        if (!user) {
          await db.prepare('INSERT INTO users (id) VALUES (?)')
            .bind(userId)
            .run()
        }

        // ソウルメイト保存
        await db.prepare(
          'INSERT INTO soulmates (user_id, name, concept, personality, tone, animal, image_base64) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          userId,
          profile.name,
          profile.concept,
          profile.personality,
          profile.tone,
          randomAnimal.ja,
          imageDataUrl
        ).run()

        console.log('Soulmate saved to database')
      } catch (dbError) {
        console.error('Database save error:', dbError)
        // エラーが発生してもレスポンスは返す
      }
    }

    return c.json({
      success: true,
      animal: randomAnimal,
      profile: {
        ...profile,
        image: imageDataUrl,
      }
    })
  } catch (error) {
    console.error('Generation error:', error)
    return c.json({ 
      error: 'Failed to generate soulmate',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: チャットメッセージ送信（D1統合版）
app.post('/api/chat/send', async (c) => {
  try {
    const apiKey = c.env.GEMINI_API_KEY
    const db = c.env.DB
    
    if (!apiKey) {
      return c.json({ error: 'API key not configured' }, 500)
    }

    const body = await c.req.json()
    const { userId, message } = body

    if (!userId || !message) {
      return c.json({ error: 'userId and message are required' }, 400)
    }

    // ユーザー存在確認・作成
    let user = await db.prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first()

    if (!user) {
      await db.prepare('INSERT INTO users (id) VALUES (?)')
        .bind(userId)
        .run()
    } else {
      // 最終アクティブ時刻更新
      await db.prepare('UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(userId)
        .run()
    }

    // ソウルメイト情報取得
    const soulmate = await db.prepare(
      'SELECT * FROM soulmates WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first()

    if (!soulmate) {
      return c.json({ error: 'Soulmate not found. Please generate one first.' }, 404)
    }

    // ユーザーメッセージをDBに保存
    await db.prepare(
      'INSERT INTO chat_messages (user_id, soulmate_id, sender, message) VALUES (?, ?, ?, ?)'
    ).bind(userId, soulmate.id, 'user', message).run()

    // 性格情報取得
    const personality = soulmate.personality || '優しく穏やかな性格'
    const tone = soulmate.tone || '柔らかく温かい口調'
    const name = soulmate.name || 'ソウルメイト'
    const concept = soulmate.concept || '守護動物'

    // 【長期記憶】ユーザーのパーソナリティプロファイル取得
    const userProfile = await db.prepare(
      'SELECT personality_summary, interests, conversation_style FROM user_personality WHERE user_id = ? AND soulmate_id = ?'
    ).bind(userId, soulmate.id).first()

    // 【中期記憶】過去30日分の日次サマリー取得
    const dailySummaries = await db.prepare(
      `SELECT date, summary, topics, emotion FROM daily_conversation_summary 
       WHERE user_id = ? AND soulmate_id = ? 
       AND date >= date('now', '-30 days')
       ORDER BY date DESC`
    ).bind(userId, soulmate.id).all()

    // 【短期記憶】今日の直近10件の会話取得
    const recentMessages = await db.prepare(
      'SELECT sender, message FROM chat_messages WHERE user_id = ? AND soulmate_id = ? ORDER BY created_at DESC LIMIT 10'
    ).bind(userId, soulmate.id).all()

    // 会話履歴を逆順にして時系列順に（絵文字を除去して文脈のみ学習）
    const conversationHistory = recentMessages.results.reverse().map((msg: any) => {
      // 絵文字を除去
      const messageWithoutEmoji = msg.message.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{FE00}-\u{FE0F}\u{203C}\u{2049}\u{20E3}\u{2139}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{231A}-\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{2604}\u{260E}\u{2611}\u{2614}-\u{2615}\u{2618}\u{261D}\u{2620}\u{2622}-\u{2623}\u{2626}\u{262A}\u{262E}-\u{262F}\u{2638}-\u{263A}\u{2640}\u{2642}\u{2648}-\u{2653}\u{265F}-\u{2660}\u{2663}\u{2665}-\u{2666}\u{2668}\u{267B}\u{267E}-\u{267F}\u{2692}-\u{2697}\u{2699}\u{269B}-\u{269C}\u{26A0}-\u{26A1}\u{26A7}\u{26AA}-\u{26AB}\u{26B0}-\u{26B1}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26C8}\u{26CE}-\u{26CF}\u{26D1}\u{26D3}-\u{26D4}\u{26E9}-\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '')
      return `${msg.sender === 'user' ? 'ユーザー' : name}: ${messageWithoutEmoji.trim()}`
    }).join('\n')

    // 日次サマリーのフォーマット
    const dailySummariesText = dailySummaries.results.length > 0 
      ? dailySummaries.results.map((s: any) => `${s.date}: ${s.summary}`).join('\n')
      : '（まだ過去の会話サマリーはありません）'

    // ユーザープロファイルのフォーマット
    const userProfileText = userProfile 
      ? `性格: ${userProfile.personality_summary || '不明'}\n趣味・関心: ${userProfile.interests || '不明'}\n会話スタイル: ${userProfile.conversation_style || '不明'}`
      : '（まだユーザーのプロファイルは学習されていません）'

    // Gemini APIでソウルメイトの返信を生成（長期・中期・短期記憶を統合）
    const systemPrompt = `あなたは「${name}」という名前の守護動物です。
コンセプト: ${concept}
性格: ${personality}
口調: ${tone}

【ユーザーについて覚えていること】
${userProfileText}

【過去30日間の会話の要約】
${dailySummariesText}

【今日の会話】
${conversationHistory}

以下のガイドラインに従って、ユーザーと対話してください：
1. ${name}として、性格と口調を忠実に再現してください
2. 過去の会話の流れを理解し、文脈に沿った返信をしてください
3. 簡潔に、2〜3文程度で返信してください
4. 絵文字を適度に使用してください。毎回同じ絵文字ではなく、会話の内容や雰囲気に合わせて多様な絵文字を選んでください
5. 返信は必ず質問で終わるか、相手の反応を促す形で終わってください
6. 例外: ユーザーが「行ってきます」「おやすみ」「またね」「バイバイ」など、明確に会話を終わらせる挨拶をした場合のみ、「行ってらっしゃい」「おやすみ」「またね」などの締めの言葉で応答してください

現在のユーザーのメッセージ: ${message}

あなたの返信:`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemPrompt
            }]
          }],
          generationConfig: {
            temperature: 1.2,
            maxOutputTokens: 250,
            topP: 0.9,
            topK: 40
          }
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return c.json({ error: 'Failed to generate response' }, 500)
    }

    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!reply) {
      return c.json({ error: 'No response generated' }, 500)
    }

    // ソウルメイトの返信をDBに保存
    await db.prepare(
      'INSERT INTO chat_messages (user_id, soulmate_id, sender, message) VALUES (?, ?, ?, ?)'
    ).bind(userId, soulmate.id, 'soulmate', reply.trim()).run()

    // 統計情報更新
    const stats = await db.prepare('SELECT * FROM user_stats WHERE user_id = ?')
      .bind(userId)
      .first()

    if (!stats) {
      await db.prepare(
        'INSERT INTO user_stats (user_id, total_messages, total_conversations) VALUES (?, ?, ?)'
      ).bind(userId, 2, 1).run()
    } else {
      await db.prepare(
        'UPDATE user_stats SET total_messages = total_messages + 2, last_updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
      ).bind(userId).run()
    }

    // 【メモリーシステム】10メッセージごとにパーソナリティ更新をバックグラウンド実行
    const totalMessages = stats ? (stats.total_messages as number) : 2
    if (totalMessages % 10 === 0) {
      // 非同期でパーソナリティ更新（レスポンスを待たない）
      updateUserPersonality(db, userId, soulmate.id, apiKey).catch(err => 
        console.error('Failed to update personality:', err)
      )
    }

    // 【メモリーシステム】日次サマリー生成（前日分がまだない場合）
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const yesterdaySummary = await db.prepare(
      'SELECT id FROM daily_conversation_summary WHERE user_id = ? AND soulmate_id = ? AND date = ?'
    ).bind(userId, soulmate.id, yesterday).first()

    if (!yesterdaySummary) {
      // 非同期で日次サマリー生成（レスポンスを待たない）
      generateDailySummary(db, userId, soulmate.id, yesterday, apiKey).catch(err =>
        console.error('Failed to generate daily summary:', err)
      )
    }

    return c.json({
      success: true,
      reply: reply.trim(),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return c.json({ 
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: チャットメッセージ送信（旧版・互換性維持）
app.post('/api/chat/message', async (c) => {
  try {
    const apiKey = c.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return c.json({ error: 'API key not configured' }, 500)
    }

    const body = await c.req.json()
    const { message, soulmateProfile } = body

    if (!message) {
      return c.json({ error: 'Message is required' }, 400)
    }

    // ソウルメイトの性格情報を取得
    const personality = soulmateProfile?.personality || '優しく穏やかな性格'
    const tone = soulmateProfile?.tone || '柔らかく温かい口調'
    const name = soulmateProfile?.name || 'ソウルメイト'
    const concept = soulmateProfile?.concept || '守護動物'

    // Gemini APIでソウルメイトの返信を生成
    const systemPrompt = `あなたは「${name}」という名前の守護動物です。
コンセプト: ${concept}
性格: ${personality}
口調: ${tone}

以下のガイドラインに従って、ユーザーのメッセージに返信してください：
1. ${name}として、性格と口調を忠実に再現してください
2. ユーザーの気持ちに寄り添い、温かく励ます返信を心がけてください
3. 簡潔に、2〜3文程度で返信してください
4. 絵文字を適度に使用してください（✨🌸💕など）
5. キャラクターの一人称は使わず、自然な会話を心がけてください`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nユーザーのメッセージ: ${message}\n\nあなたの返信:`
            }]
          }],
          generationConfig: {
            temperature: 1.2,
            maxOutputTokens: 200,
            topP: 0.95,
            topK: 40
          }
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return c.json({ error: 'Failed to generate response' }, 500)
    }

    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!reply) {
      return c.json({ error: 'No response generated' }, 500)
    }

    return c.json({
      success: true,
      reply: reply.trim(),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return c.json({ 
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: マイページ - プロフィール取得
app.get('/api/mypage/profile/:userId', async (c) => {
  try {
    const db = c.env.DB
    const userId = c.req.param('userId')

    // ソウルメイト情報取得
    const soulmate = await db.prepare(
      'SELECT * FROM soulmates WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first()

    if (!soulmate) {
      return c.json({ error: 'Soulmate not found' }, 404)
    }

    return c.json({
      success: true,
      profile: {
        name: soulmate.name,
        concept: soulmate.concept,
        personality: soulmate.personality,
        tone: soulmate.tone,
        animal: soulmate.animal,
        image: soulmate.image_base64,
        createdAt: soulmate.created_at
      }
    })

  } catch (error) {
    console.error('MyPage profile API error:', error)
    return c.json({ 
      error: 'Failed to fetch profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: マイページ - 統計情報取得
app.get('/api/mypage/stats/:userId', async (c) => {
  try {
    const db = c.env.DB
    const userId = c.req.param('userId')

    // 統計情報取得
    const stats = await db.prepare('SELECT * FROM user_stats WHERE user_id = ?')
      .bind(userId)
      .first()

    // ソウルメイト生成日取得
    const soulmate = await db.prepare(
      'SELECT created_at FROM soulmates WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first()

    // 出会った日数を計算
    let daysSince = 1
    if (soulmate?.created_at) {
      const created = new Date(soulmate.created_at)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - created.getTime())
      daysSince = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    }

    // 最終チャット日時取得
    const lastMessage = await db.prepare(
      'SELECT created_at FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first()

    return c.json({
      success: true,
      stats: {
        totalMessages: stats?.total_messages || 0,
        totalConversations: stats?.total_conversations || 0,
        favoriteCount: stats?.favorite_count || 0,
        daysSince,
        lastChatDate: lastMessage?.created_at || null
      }
    })

  } catch (error) {
    console.error('MyPage stats API error:', error)
    return c.json({ 
      error: 'Failed to fetch statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: マイページ - チャット履歴取得
app.get('/api/mypage/history/:userId', async (c) => {
  try {
    const db = c.env.DB
    const userId = c.req.param('userId')
    const limit = parseInt(c.req.query('limit') || '50')

    // チャット履歴取得
    const messages = await db.prepare(
      'SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(userId, limit).all()

    return c.json({
      success: true,
      history: messages.results || []
    })

  } catch (error) {
    console.error('MyPage history API error:', error)
    return c.json({ 
      error: 'Failed to fetch chat history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: マイページ統計データ取得（旧版・互換性維持）
app.post('/api/mypage/stats', async (c) => {
  try {
    // クライアントから送られたデータを取得
    const body = await c.req.json()
    const { chatHistory, soulmateProfile } = body

    // 統計データを計算
    const messageCount = Array.isArray(chatHistory) ? chatHistory.length : 0
    
    // 出会った日数を計算
    let daysSince = 1
    if (soulmateProfile?.createdAt) {
      const created = new Date(soulmateProfile.createdAt)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - created.getTime())
      daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    // お気に入り数（将来実装）
    const favoriteCount = 0

    return c.json({
      success: true,
      stats: {
        messageCount,
        daysSince,
        favoriteCount,
        lastChatDate: chatHistory && chatHistory.length > 0 
          ? chatHistory[chatHistory.length - 1]?.timestamp 
          : null
      }
    })

  } catch (error) {
    console.error('MyPage stats API error:', error)
    return c.json({ 
      error: 'Failed to calculate statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// ========================================
// 法的ページ
// ========================================

// プライバシーポリシー
app.get('/privacy', (c) => {
  return c.render(
    <div class="legal-container">
      <div class="legal-content">
        <h1>プライバシーポリシー</h1>
        <p class="update-date">最終更新日: 2025年12月11日</p>
        
        <section>
          <h2>1. 個人情報の収集</h2>
          <p>Ramat（以下「当サービス」）では、以下の個人情報を収集します：</p>
          <ul>
            <li>メールアドレス</li>
            <li>ユーザー名</li>
            <li>生成されたコンテンツ（ソウルメイト画像、チャット履歴）</li>
          </ul>
        </section>

        <section>
          <h2>2. 個人情報の利用目的</h2>
          <p>収集した個人情報は以下の目的で利用します：</p>
          <ul>
            <li>サービスの提供・運営</li>
            <li>ユーザー認証</li>
            <li>お問い合わせ対応</li>
            <li>サービス改善のための分析</li>
          </ul>
        </section>

        <section>
          <h2>3. 個人情報の第三者提供</h2>
          <p>当サービスは、以下の場合を除き、個人情報を第三者に提供しません：</p>
          <ul>
            <li>ユーザーの同意がある場合</li>
            <li>法令に基づく場合</li>
          </ul>
        </section>

        <section>
          <h2>4. Cookie</h2>
          <p>当サービスでは、認証のためにCookieを使用します。</p>
        </section>

        <section>
          <h2>5. お問い合わせ</h2>
          <p>プライバシーポリシーに関するお問い合わせは、<a href="/contact">お問い合わせフォーム</a>よりご連絡ください。</p>
        </section>
      </div>
      
      <nav class="bottom-nav">
        <a href="/" class="nav-item"><i class="fas fa-home"></i><span>ホーム</span></a>
        <a href="/chat" class="nav-item"><i class="fas fa-comment"></i><span>チャット</span></a>
        <a href="/mypage" class="nav-item"><i class="fas fa-user"></i><span>マイページ</span></a>
      </nav>
      <script src="/static/common.js"></script>
    </div>
  )
})

// 利用規約
app.get('/terms', (c) => {
  return c.render(
    <div class="legal-container">
      <div class="legal-content">
        <h1>利用規約</h1>
        <p class="update-date">最終更新日: 2025年12月11日</p>
        
        <section>
          <h2>第1条（適用）</h2>
          <p>本規約は、Ramat（以下「当サービス」）の利用に関する条件を定めるものです。</p>
        </section>

        <section>
          <h2>第2条（禁止事項）</h2>
          <p>ユーザーは、以下の行為を行ってはなりません：</p>
          <ul>
            <li>法令または公序良俗に反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>当サービスの運営を妨害する行為</li>
            <li>他のユーザーに迷惑をかける行為</li>
          </ul>
        </section>

        <section>
          <h2>第3条（知的財産権）</h2>
          <p>生成されたコンテンツの著作権は、ユーザーに帰属します。ただし、当サービスはサービス改善のために利用する権利を有します。</p>
        </section>

        <section>
          <h2>第4条（免責事項）</h2>
          <p>当サービスは、以下について一切の責任を負いません：</p>
          <ul>
            <li>サービスの中断、停止、終了</li>
            <li>生成されたコンテンツの内容</li>
            <li>ユーザー間のトラブル</li>
          </ul>
        </section>

        <section>
          <h2>第5条（規約の変更）</h2>
          <p>当サービスは、必要に応じて本規約を変更することができます。</p>
        </section>
      </div>
      
      <nav class="bottom-nav">
        <a href="/" class="nav-item"><i class="fas fa-home"></i><span>ホーム</span></a>
        <a href="/chat" class="nav-item"><i class="fas fa-comment"></i><span>チャット</span></a>
        <a href="/mypage" class="nav-item"><i class="fas fa-user"></i><span>マイページ</span></a>
      </nav>
      <script src="/static/common.js"></script>
    </div>
  )
})

// 特定商取引法に基づく表記
app.get('/legal', (c) => {
  return c.render(
    <div class="legal-container">
      <div class="legal-content">
        <h1>特定商取引法に基づく表記</h1>
        <p class="update-date">最終更新日: 2025年12月11日</p>
        
        <section>
          <h2>販売業者</h2>
          <p>合同会社and.</p>
        </section>

        <section>
          <h2>運営責任者</h2>
          <p>吉田　拓未</p>
        </section>

        <section>
          <h2>所在地</h2>
          <p>〒399-0101 長野県諏訪郡富士見町境10555-2</p>
        </section>

        <section>
          <h2>電話番号</h2>
          <p>080-3083-6050</p>
        </section>

        <section>
          <h2>メールアドレス</h2>
          <p>t.yoshida@andllc1108.com</p>
        </section>

        <section>
          <h2>販売価格</h2>
          <p>各商品ページに記載の通り</p>
        </section>

        <section>
          <h2>支払方法</h2>
          <p>クレジットカード決済（実装予定）</p>
        </section>

        <section>
          <h2>商品代金以外の必要料金</h2>
          <p>なし</p>
        </section>

        <section>
          <h2>引渡時期</h2>
          <p>デジタルコンテンツ：決済完了後、即時ダウンロード可能<br />
          物理商品：決済完了後、7-14営業日以内に発送</p>
        </section>

        <section>
          <h2>返品・交換</h2>
          <p>デジタルコンテンツの性質上、返品・返金は原則として受け付けておりません。<br />
          物理商品の不良品については、到着後7日以内にご連絡ください。</p>
        </section>
      </div>
      
      <nav class="bottom-nav">
        <a href="/" class="nav-item"><i class="fas fa-home"></i><span>ホーム</span></a>
        <a href="/chat" class="nav-item"><i class="fas fa-comment"></i><span>チャット</span></a>
        <a href="/mypage" class="nav-item"><i class="fas fa-user"></i><span>マイページ</span></a>
      </nav>
      <script src="/static/common.js"></script>
    </div>
  )
})

// お問い合わせ
// メール認証完了ページ
app.get('/verify-email', (c) => {
  return c.render(
    <div class="auth-container">
      <div class="auth-card">
        <header class="auth-header">
          <h1 class="auth-title">🌸 Ramat 🌸</h1>
          <p class="auth-subtitle">メールアドレスの確認</p>
        </header>

        <div class="verification-content" id="verificationContent">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>メールアドレスを確認中...</p>
          </div>
        </div>

        <div class="auth-footer" id="verificationFooter" style="display: none;">
          <a href="/" class="auth-link">ホームに戻る</a>
        </div>
      </div>

      <script src="/static/verify-email.js"></script>
    </div>
  )
})

app.get('/contact', (c) => {
  return c.render(
    <div class="legal-container">
      <div class="legal-content">
        <h1>お問い合わせ</h1>
        
        <section>
          <p>サービスに関するお問い合わせは、以下のフォームよりご連絡ください。</p>
          
          <form class="contact-form" id="contactForm">
            <div class="form-group">
              <label>お名前 <span class="required">必須</span></label>
              <input type="text" name="name" id="contactName" required />
            </div>
            
            <div class="form-group">
              <label>メールアドレス <span class="required">必須</span></label>
              <input type="email" name="email" id="contactEmail" required />
            </div>
            
            <div class="form-group">
              <label>件名 <span class="required">必須</span></label>
              <input type="text" name="subject" id="contactSubject" required />
            </div>
            
            <div class="form-group">
              <label>お問い合わせ内容 <span class="required">必須</span></label>
              <textarea name="message" id="contactMessage" rows="10" required></textarea>
            </div>
            
            <div id="contactStatus" style="margin-bottom: 1rem; display: none;"></div>
            
            <button type="submit" class="submit-btn" id="contactSubmitBtn">送信する</button>
          </form>
          
          <script src="/static/contact.js"></script>
        </section>
      </div>
      
      <nav class="bottom-nav">
        <a href="/" class="nav-item"><i class="fas fa-home"></i><span>ホーム</span></a>
        <a href="/chat" class="nav-item"><i class="fas fa-comment"></i><span>チャット</span></a>
        <a href="/mypage" class="nav-item"><i class="fas fa-user"></i><span>マイページ</span></a>
      </nav>
      <script src="/static/common.js"></script>
    </div>
  )
})

// ========================================
// お問い合わせAPI
// ========================================

// API: お問い合わせフォーム送信
app.post('/api/contact', async (c) => {
  try {
    const resendApiKey = c.env.RESEND_API_KEY
    const db = c.env.DB
    
    if (!resendApiKey) {
      return c.json({ error: 'Resend API key not configured' }, 500)
    }

    const body = await c.req.json()
    const { name, email, subject, message } = body

    // バリデーション
    if (!name || !email || !subject || !message) {
      return c.json({ error: '全ての項目を入力してください' }, 400)
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return c.json({ error: '正しいメールアドレスを入力してください' }, 400)
    }

    // データベースに保存
    let contactId = null
    if (db) {
      try {
        const result = await db.prepare(
          'INSERT INTO contacts (name, email, subject, message, status) VALUES (?, ?, ?, ?, ?)'
        ).bind(name, email, subject, message, 'pending').run()
        
        contactId = result.meta.last_row_id
        console.log('Contact saved to database:', contactId)
      } catch (dbError) {
        console.error('Database save error:', dbError)
        // DB保存エラーでもメール送信は続行
      }
    }

    // Resend初期化
    const resend = new Resend(resendApiKey)

    // 管理者宛メール
    const adminEmail = await resend.emails.send({
      from: 'Ramat Contact <onboarding@resend.dev>',
      to: 't.yoshida@andllc1108.com',
      subject: `【Ramat】お問い合わせ: ${subject}`,
      html: `
        <h2>新しいお問い合わせがありました</h2>
        <p><strong>お問い合わせID:</strong> #${contactId || 'N/A'}</p>
        <p><strong>お名前:</strong> ${name}</p>
        <p><strong>メールアドレス:</strong> ${email}</p>
        <p><strong>件名:</strong> ${subject}</p>
        <h3>お問い合わせ内容:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">このメールはRamatのお問い合わせフォームから送信されました。</p>
        <p style="color: #666; font-size: 12px;">管理画面: https://ramat.pages.dev/admin</p>
      `
    })

    // ユーザー宛確認メール
    const userEmail = await resend.emails.send({
      from: 'Ramat <onboarding@resend.dev>',
      to: email,
      subject: '【Ramat】お問い合わせを受け付けました',
      html: `
        <h2>お問い合わせありがとうございます</h2>
        <p>${name} 様</p>
        <p>お問い合わせを受け付けました。内容を確認の上、2〜3営業日以内にご返信いたします。</p>
        ${contactId ? `<p><strong>お問い合わせ番号:</strong> #${contactId}</p>` : ''}
        <h3>お問い合わせ内容:</h3>
        <p><strong>件名:</strong> ${subject}</p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">このメールに心当たりがない場合は、お手数ですが破棄してください。</p>
        <p style="color: #666; font-size: 12px;">Ramat - あなたの守護動物チャット</p>
      `
    })

    console.log('Contact form submitted:', { contactId, name, email, subject })
    console.log('Admin email:', adminEmail)
    console.log('User email:', userEmail)

    return c.json({ 
      success: true,
      contactId,
      message: 'お問い合わせを受け付けました。確認メールをご確認ください。'
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return c.json({ 
      error: 'メールの送信に失敗しました。しばらくしてから再度お試しください。',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: お問い合わせ一覧取得（管理者用）
app.get('/api/admin/contacts', async (c) => {
  try {
    const db = c.env.DB
    
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }

    // 全てのお問い合わせを取得（最新順）
    const contacts = await db.prepare(
      'SELECT id, name, email, subject, message, status, created_at, replied_at FROM contacts ORDER BY created_at DESC LIMIT 100'
    ).all()

    return c.json({ 
      success: true,
      contacts: contacts.results || []
    })
  } catch (error) {
    console.error('Get contacts error:', error)
    return c.json({ 
      error: 'お問い合わせ一覧の取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: お問い合わせ詳細取得（管理者用）
app.get('/api/admin/contacts/:id', async (c) => {
  try {
    const db = c.env.DB
    const contactId = c.req.param('id')
    
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }

    const contact = await db.prepare(
      'SELECT * FROM contacts WHERE id = ?'
    ).bind(contactId).first()

    if (!contact) {
      return c.json({ error: 'お問い合わせが見つかりません' }, 404)
    }

    return c.json({ 
      success: true,
      contact
    })
  } catch (error) {
    console.error('Get contact error:', error)
    return c.json({ 
      error: 'お問い合わせの取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: お問い合わせステータス更新（管理者用）
app.put('/api/admin/contacts/:id/status', async (c) => {
  try {
    const db = c.env.DB
    const contactId = c.req.param('id')
    const { status, replyMessage } = await c.req.json()
    
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }

    // ステータスバリデーション
    const validStatuses = ['pending', 'replied', 'closed']
    if (!validStatuses.includes(status)) {
      return c.json({ error: '無効なステータスです' }, 400)
    }

    // ステータス更新
    if (status === 'replied' && replyMessage) {
      await db.prepare(
        'UPDATE contacts SET status = ?, replied_at = CURRENT_TIMESTAMP, reply_message = ? WHERE id = ?'
      ).bind(status, replyMessage, contactId).run()
    } else {
      await db.prepare(
        'UPDATE contacts SET status = ? WHERE id = ?'
      ).bind(status, contactId).run()
    }

    console.log('Contact status updated:', { contactId, status })

    return c.json({ 
      success: true,
      message: 'ステータスを更新しました'
    })
  } catch (error) {
    console.error('Update contact status error:', error)
    return c.json({ 
      error: 'ステータスの更新に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// ========================================
// 待ち受け画像生成API
// ========================================

// API: 待ち受け画像生成
app.post('/api/wallpapers/generate', async (c) => {
  try {
    const db = c.env.DB
    const userId = c.get('userId')
    const { soulmateId } = await c.req.json()

    console.log(`[Wallpaper Generation] User: ${userId}, Soulmate: ${soulmateId}`)

    // ソウルメイト情報取得
    const soulmate = await db.prepare(
      'SELECT * FROM soulmates WHERE id = ? AND user_id = ?'
    ).bind(soulmateId, userId).first()

    if (!soulmate) {
      return c.json({ error: 'Soulmate not found' }, 404)
    }

    // 既に生成済みかチェック
    const existing = await db.prepare(
      'SELECT * FROM soulmate_wallpapers WHERE soulmate_id = ?'
    ).bind(soulmateId).first()

    if (existing) {
      return c.json({
        success: true,
        mobileUrl: existing.mobile_wallpaper_url,
        pcUrl: existing.pc_wallpaper_url,
        message: 'Wallpapers already exist'
      })
    }

    // 参考画像（ソウルメイトの基本画像）
    const referenceImage = soulmate.image_base64 as string

    // プロンプト作成
    const basePrompt = `名前: ${soulmate.name}
コンセプト: ${soulmate.concept}
動物: ${soulmate.animal}
性格: ${soulmate.personality}`

    // 動的インポート
    const { generateWallpaper, uploadToR2 } = await import('./services/wallpaper')

    console.log('[Wallpaper Generation] Generating mobile wallpaper...')
    // スマホ待ち受け生成（9:16）
    const mobileWallpaper = await generateWallpaper(
      referenceImage,
      basePrompt + '\n背景: 幻想的な朝焼けの空、桜の花びらが舞う風景',
      '9:16',
      c.env.GEMINI_API_KEY
    )

    console.log('[Wallpaper Generation] Generating PC wallpaper...')
    // PC待ち受け生成（16:9）
    const pcWallpaper = await generateWallpaper(
      referenceImage,
      basePrompt + '\n背景: 広大な星空、オーロラが輝く幻想的な夜の風景',
      '16:9',
      c.env.GEMINI_API_KEY
    )

    // R2にアップロード
    console.log('[Wallpaper Generation] Uploading to R2...')
    const mobileKey = `wallpapers/${soulmateId}/mobile_${Date.now()}.png`
    const pcKey = `wallpapers/${soulmateId}/pc_${Date.now()}.png`

    const mobileUrl = await uploadToR2(c.env.R2, mobileKey, mobileWallpaper)
    const pcUrl = await uploadToR2(c.env.R2, pcKey, pcWallpaper)

    // データベースに保存
    console.log('[Wallpaper Generation] Saving to database...')
    await db.prepare(`
      INSERT INTO soulmate_wallpapers (soulmate_id, mobile_wallpaper_url, pc_wallpaper_url)
      VALUES (?, ?, ?)
    `).bind(soulmateId, mobileUrl, pcUrl).run()

    console.log('[Wallpaper Generation] Success!')
    return c.json({
      success: true,
      mobileUrl,
      pcUrl
    })

  } catch (error) {
    console.error('[Wallpaper Generation] Error:', error)
    return c.json({
      error: 'Failed to generate wallpapers',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// API: 待ち受け画像取得
app.get('/api/wallpapers/:soulmateId', async (c) => {
  try {
    const db = c.env.DB
    const userId = c.get('userId')
    const soulmateId = c.req.param('soulmateId')

    console.log(`[Wallpaper Get] User: ${userId}, Soulmate: ${soulmateId}`)

    // 権限チェック
    const soulmate = await db.prepare(
      'SELECT * FROM soulmates WHERE id = ? AND user_id = ?'
    ).bind(soulmateId, userId).first()

    if (!soulmate) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    // 待ち受け画像取得
    const wallpapers = await db.prepare(
      'SELECT * FROM soulmate_wallpapers WHERE soulmate_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(soulmateId).first()

    if (!wallpapers) {
      return c.json({
        exists: false,
        message: 'No wallpapers generated yet'
      })
    }

    return c.json({
      exists: true,
      mobileUrl: wallpapers.mobile_wallpaper_url,
      pcUrl: wallpapers.pc_wallpaper_url,
      createdAt: wallpapers.created_at
    })

  } catch (error) {
    console.error('[Wallpaper Get] Error:', error)
    return c.json({ error: 'Failed to fetch wallpapers' }, 500)
  }
})

// ========================================
// 認証API
// ========================================

// API: 新規登録
app.post('/api/auth/register', async (c) => {
  try {
    const db = c.env.DB
    const resendApiKey = c.env.RESEND_API_KEY
    const body = await c.req.json()
    const { email, password, username } = body

    // バリデーション
    if (!email || !password || !username) {
      return c.json({ error: 'メールアドレス、パスワード、ユーザー名は必須です' }, 400)
    }

    if (!validateEmail(email)) {
      return c.json({ error: '有効なメールアドレスを入力してください' }, 400)
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return c.json({ error: passwordValidation.message }, 400)
    }

    const usernameValidation = validateUsername(username)
    if (!usernameValidation.valid) {
      return c.json({ error: usernameValidation.message }, 400)
    }

    // メールアドレスの重複チェック
    const existingUser = await db.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existingUser) {
      return c.json({ error: 'このメールアドレスは既に登録されています' }, 409)
    }

    // パスワードハッシュ化
    const passwordHash = await hashPassword(password)

    // ユーザーID生成
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)

    // メール認証トークン生成（32文字のランダム文字列）
    const verificationToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // トークン有効期限（24時間後）
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // ユーザー作成（email_verified=0, 認証トークン付き）
    await db.prepare(
      'INSERT INTO users (id, email, password_hash, username, email_verified, verification_token, verification_token_expires) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(userId, email, passwordHash, username, 0, verificationToken, expiresAt).run()

    // メール認証リンクを送信
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey)
        const verificationUrl = `https://ramat.pages.dev/verify-email?token=${verificationToken}`

        await resend.emails.send({
          from: 'Ramat <onboarding@resend.dev>',
          to: email,
          subject: '【Ramat】メールアドレスの確認',
          html: `
            <h2>Ramatへようこそ！</h2>
            <p>${username} 様</p>
            <p>ご登録ありがとうございます。以下のリンクをクリックして、メールアドレスを確認してください。</p>
            <p style="margin: 2rem 0;">
              <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #FF69B4; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                メールアドレスを確認する
              </a>
            </p>
            <p style="color: #666; font-size: 0.9rem;">または、以下のURLをコピーしてブラウザに貼り付けてください：</p>
            <p style="color: #666; font-size: 0.9rem; word-break: break-all;">${verificationUrl}</p>
            <hr style="margin: 2rem 0;">
            <p style="color: #999; font-size: 0.8rem;">このリンクは24時間有効です。</p>
            <p style="color: #999; font-size: 0.8rem;">このメールに心当たりがない場合は、無視してください。</p>
            <p style="color: #999; font-size: 0.8rem;">Ramat - あなたの守護動物チャット</p>
          `
        })

        console.log('Verification email sent to:', email)
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError)
        // メール送信失敗してもユーザー登録は継続
      }
    }

    // 注意: メール認証前なのでログインはさせない（トークン発行なし）
    return c.json({
      success: true,
      message: '登録が完了しました。確認メールを送信しましたので、メールをご確認ください。',
      emailSent: true,
      user: {
        id: userId,
        email,
        username
      }
    })

  } catch (error) {
    console.error('Register error:', error)
    return c.json({ 
      error: '登録処理に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: ログイン
app.post('/api/auth/login', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json()
    const { email, password } = body

    // バリデーション
    if (!email || !password) {
      return c.json({ error: 'メールアドレスとパスワードは必須です' }, 400)
    }

    // ユーザー検索
    const user = await db.prepare(
      'SELECT id, email, password_hash, username FROM users WHERE email = ?'
    ).bind(email).first()

    if (!user) {
      return c.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
    }

    // パスワード検証
    const isValidPassword = await verifyPassword(password, user.password_hash as string)
    if (!isValidPassword) {
      return c.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
    }

    // 最終アクティブ時刻を更新
    await db.prepare(
      'UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run()

    // JWTトークン生成
    const token = await generateToken(user.id as string, JWT_SECRET)

    // Cookieにトークンを保存
    setCookie(c, 'auth_token', token, {
      maxAge: 30 * 24 * 60 * 60, // 30日間
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/'
    })

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return c.json({ 
      error: 'ログイン処理に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: ログアウト
app.post('/api/auth/logout', (c) => {
  deleteCookie(c, 'auth_token', {
    path: '/'
  })

  return c.json({ success: true })
})

// API: メール認証
app.get('/api/auth/verify-email', async (c) => {
  try {
    const db = c.env.DB
    const token = c.req.query('token')

    if (!token) {
      return c.json({ error: '認証トークンが指定されていません' }, 400)
    }

    // トークンでユーザーを検索
    const user = await db.prepare(
      'SELECT id, email, username, email_verified, verification_token_expires FROM users WHERE verification_token = ?'
    ).bind(token).first()

    if (!user) {
      return c.json({ error: '無効な認証トークンです' }, 404)
    }

    // 既に認証済み
    if (user.email_verified === 1) {
      return c.json({ 
        success: true,
        message: 'このメールアドレスは既に認証済みです',
        alreadyVerified: true
      })
    }

    // トークンの有効期限チェック
    const expiresAt = new Date(user.verification_token_expires)
    if (expiresAt < new Date()) {
      return c.json({ error: '認証トークンの有効期限が切れています。再度登録してください。' }, 410)
    }

    // メール認証を完了
    await db.prepare(
      'UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?'
    ).bind(user.id).run()

    // JWTトークン生成（自動ログイン）
    const jwtToken = await generateToken(user.id, JWT_SECRET)

    // Cookieにトークンを保存
    setCookie(c, 'auth_token', jwtToken, {
      maxAge: 30 * 24 * 60 * 60, // 30日間
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/'
    })

    console.log('Email verified for user:', user.email)

    return c.json({
      success: true,
      message: 'メールアドレスの認証が完了しました！',
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return c.json({ 
      error: 'メール認証処理に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: 認証メール再送信
app.post('/api/auth/resend-verification', async (c) => {
  try {
    const db = c.env.DB
    const resendApiKey = c.env.RESEND_API_KEY
    const body = await c.req.json()
    const { email } = body

    if (!email) {
      return c.json({ error: 'メールアドレスは必須です' }, 400)
    }

    // ユーザー検索
    const user = await db.prepare(
      'SELECT id, email, username, email_verified FROM users WHERE email = ?'
    ).bind(email).first()

    if (!user) {
      return c.json({ error: 'このメールアドレスは登録されていません' }, 404)
    }

    // 既に認証済み
    if (user.email_verified === 1) {
      return c.json({ error: 'このメールアドレスは既に認証済みです' }, 400)
    }

    // 新しい認証トークン生成
    const verificationToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // トークン有効期限（24時間後）
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // トークン更新
    await db.prepare(
      'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?'
    ).bind(verificationToken, expiresAt, user.id).run()

    // 認証メール送信
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      const verificationUrl = `https://ramat.pages.dev/verify-email?token=${verificationToken}`

      await resend.emails.send({
        from: 'Ramat <onboarding@resend.dev>',
        to: email,
        subject: '【Ramat】メールアドレスの確認（再送）',
        html: `
          <h2>Ramatへようこそ！</h2>
          <p>${user.username} 様</p>
          <p>メールアドレス確認メールを再送信しました。以下のリンクをクリックして、メールアドレスを確認してください。</p>
          <p style="margin: 2rem 0;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #FF69B4; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              メールアドレスを確認する
            </a>
          </p>
          <p style="color: #666; font-size: 0.9rem;">または、以下のURLをコピーしてブラウザに貼り付けてください：</p>
          <p style="color: #666; font-size: 0.9rem; word-break: break-all;">${verificationUrl}</p>
          <hr style="margin: 2rem 0;">
          <p style="color: #999; font-size: 0.8rem;">このリンクは24時間有効です。</p>
          <p style="color: #999; font-size: 0.8rem;">Ramat - あなたの守護動物チャット</p>
        `
      })

      console.log('Verification email resent to:', email)
    }

    return c.json({
      success: true,
      message: '確認メールを再送信しました。メールをご確認ください。'
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    return c.json({ 
      error: '確認メールの再送信に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// ========================================
// Google OAuth認証
// ========================================

// API: Google OAuth開始
app.get('/auth/google', (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID
  
  if (!clientId) {
    return c.json({ error: 'Google OAuth not configured' }, 500)
  }

  // stateパラメータ（CSRF対策）
  const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // stateをCookieに保存
  setCookie(c, 'oauth_state', state, {
    maxAge: 10 * 60, // 10分
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/'
  })

  // Google OAuth認証URLを構築
  const redirectUri = 'https://ramat.pages.dev/auth/google/callback'
  const scope = 'openid email profile'
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('access_type', 'online')
  authUrl.searchParams.set('prompt', 'select_account')

  // Googleの認証ページにリダイレクト
  return c.redirect(authUrl.toString())
})

// API: Google OAuthコールバック
app.get('/auth/google/callback', async (c) => {
  try {
    const db = c.env.DB
    const clientId = c.env.GOOGLE_CLIENT_ID
    const clientSecret = c.env.GOOGLE_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      return c.json({ error: 'Google OAuth not configured' }, 500)
    }

    // パラメータ取得
    const code = c.req.query('code')
    const state = c.req.query('state')
    const savedState = getCookie(c, 'oauth_state')

    // stateの検証（CSRF対策）
    if (!state || !savedState || state !== savedState) {
      return c.redirect('/login?error=invalid_state')
    }

    // stateクッキー削除
    deleteCookie(c, 'oauth_state', { path: '/' })

    if (!code) {
      return c.redirect('/login?error=no_code')
    }

    // アクセストークン取得
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: 'https://ramat.pages.dev/auth/google/callback',
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return c.redirect('/login?error=token_exchange_failed')
    }

    const tokenData = await tokenResponse.json() as {
      access_token: string
      id_token: string
    }

    // ユーザー情報取得
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    if (!userInfoResponse.ok) {
      console.error('User info fetch failed')
      return c.redirect('/login?error=user_info_failed')
    }

    const googleUser = await userInfoResponse.json() as {
      id: string
      email: string
      name: string
      picture: string
      verified_email: boolean
    }

    console.log('Google user:', googleUser)

    // 既存ユーザーをOAuth IDで検索
    let user = await db.prepare(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?'
    ).bind('google', googleUser.id).first()

    if (!user) {
      // メールアドレスで既存ユーザーを検索（メール/パスワードで登録済みの場合）
      const existingUser = await db.prepare(
        'SELECT * FROM users WHERE email = ?'
      ).bind(googleUser.email).first()

      if (existingUser) {
        // 既存アカウントにOAuth情報を追加
        await db.prepare(
          'UPDATE users SET oauth_provider = ?, oauth_id = ?, avatar_url = ?, email_verified = 1 WHERE id = ?'
        ).bind('google', googleUser.id, googleUser.picture, existingUser.id).run()

        user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(existingUser.id).first()
      } else {
        // 新規ユーザー作成
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
        const username = googleUser.name || googleUser.email.split('@')[0]

        await db.prepare(
          'INSERT INTO users (id, email, username, oauth_provider, oauth_id, avatar_url, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          userId,
          googleUser.email,
          username,
          'google',
          googleUser.id,
          googleUser.picture,
          1 // Googleで認証済みなのでメール認証も完了扱い
        ).run()

        user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
      }
    }

    if (!user) {
      return c.redirect('/login?error=user_creation_failed')
    }

    // JWTトークン生成
    const token = await generateToken(user.id, JWT_SECRET)

    // Cookieにトークンを保存
    setCookie(c, 'auth_token', token, {
      maxAge: 30 * 24 * 60 * 60, // 30日間
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/'
    })

    console.log('Google OAuth login successful for:', user.email)

    // チャットページにリダイレクト（初回訪問時は生成モーダルが表示される）
    return c.redirect('/chat')

  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return c.redirect('/login?error=oauth_failed')
  }
})

// API: 現在のユーザー情報取得
app.get('/api/auth/me', async (c) => {
  try {
    const db = c.env.DB
    const token = getCookie(c, 'auth_token')

    if (!token) {
      return c.json({ error: 'Not authenticated' }, 401)
    }

    // トークン検証
    const payload = await verifyToken(token, JWT_SECRET)
    if (!payload) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    // ユーザー情報取得
    const user = await db.prepare(
      'SELECT id, email, username, created_at FROM users WHERE id = ?'
    ).bind(payload.userId).first()

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.created_at
      }
    })

  } catch (error) {
    console.error('Get user error:', error)
    return c.json({ error: 'Failed to get user info' }, 500)
  }
})

// ========================================
// 管理者API
// ========================================

// API: 管理者統計データ（D1データベースから実データ取得）
app.get('/api/admin/stats', async (c) => {
  try {
    const db = c.env.DB

    // 総生成数
    const totalGenerationsResult = await db.prepare(
      'SELECT COUNT(*) as count FROM soulmates'
    ).first()
    const totalGenerations = totalGenerationsResult?.count || 0

    // 総ユーザー数
    const totalUsersResult = await db.prepare(
      'SELECT COUNT(*) as count FROM users'
    ).first()
    const totalUsers = totalUsersResult?.count || 0

    // 今日の生成数
    const today = new Date().toISOString().split('T')[0]
    const todayGenerationsResult = await db.prepare(
      'SELECT COUNT(*) as count FROM soulmates WHERE DATE(created_at) = ?'
    ).bind(today).first()
    const todayGenerations = todayGenerationsResult?.count || 0

    // API使用率（簡易計算：総生成数 / 上限 * 100）
    const apiUsageLimit = 10000 // 仮の上限
    const apiUsage = Math.min(100, Math.round((totalGenerations / apiUsageLimit) * 100))

    // 週間データ（過去7日間の生成数）
    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayResult = await db.prepare(
        'SELECT COUNT(*) as count FROM soulmates WHERE DATE(created_at) = ?'
      ).bind(dateStr).first()
      
      weeklyData.push(dayResult?.count || 0)
    }

    // トップ動物ランキング（TOP 5）
    const topAnimalsResult = await db.prepare(
      'SELECT animal, COUNT(*) as count FROM soulmates GROUP BY animal ORDER BY count DESC LIMIT 5'
    ).all()

    const topAnimals = topAnimalsResult.results.map((row: any, index: number) => {
      const percentage = totalGenerations > 0 
        ? Math.round((row.count / totalGenerations) * 100) 
        : 0
      return {
        name: row.animal,
        count: row.count,
        percentage
      }
    })

    return c.json({
      totalGenerations,
      totalUsers,
      todayGenerations,
      apiUsage,
      weeklyData,
      topAnimals
    })

  } catch (error) {
    console.error('Admin stats API error:', error)
    return c.json({ 
      error: 'Failed to fetch admin stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: 管理者生成履歴データ（全ユーザー）
app.get('/api/admin/history', async (c) => {
  try {
    const db = c.env.DB

    // 最新50件の生成履歴を取得（ユーザー情報とソウルメイト情報を結合）
    const historyResult = await db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.animal,
        s.image_base64,
        s.created_at,
        u.email,
        u.username
      FROM soulmates s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 50
    `).all()

    // 相対時間を計算する関数
    const getRelativeTime = (dateStr: string) => {
      const now = new Date()
      const created = new Date(dateStr)
      const diffMs = now.getTime() - created.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'たった今'
      if (diffMins < 60) return `${diffMins}分前`
      if (diffHours < 24) return `${diffHours}時間前`
      if (diffDays < 7) return `${diffDays}日前`
      
      // 7日以上前は日付表示
      return created.toLocaleDateString('ja-JP', { 
        month: 'short', 
        day: 'numeric' 
      })
    }

    const history = historyResult.results.map((row: any) => ({
      id: row.id,
      name: row.name,
      animal: row.animal,
      thumbnail: row.image_base64 ? row.image_base64.substring(0, 100) : null, // サムネイル用に一部取得
      image: row.image_base64, // 詳細表示用の完全な画像
      time: getRelativeTime(row.created_at),
      createdAt: row.created_at,
      userEmail: row.email || '不明',
      username: row.username || 'ゲスト'
    }))

    return c.json({
      success: true,
      history,
      total: history.length
    })

  } catch (error) {
    console.error('Admin history API error:', error)
    return c.json({ 
      error: 'Failed to fetch admin history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: ユーザー一覧取得（管理者用）
app.get('/api/admin/users', async (c) => {
  try {
    const { env } = c
    const db = env.DB

    // 全ユーザー取得
    const usersResult = await db.prepare(`
      SELECT 
        u.id as user_id,
        u.created_at,
        u.last_active_at,
        s.name as soulmate_name,
        s.animal as soulmate_animal,
        s.id as soulmate_id,
        us.total_messages,
        us.total_conversations
      FROM users u
      LEFT JOIN soulmates s ON u.id = s.user_id
      LEFT JOIN user_stats us ON u.id = us.user_id
      ORDER BY u.last_active_at DESC
    `).all()

    const users = usersResult.results.map((row: any) => ({
      userId: row.user_id,
      soulmateId: row.soulmate_id,
      soulmateName: row.soulmate_name || '未生成',
      soulmateAnimal: row.soulmate_animal || '-',
      totalMessages: row.total_messages || 0,
      totalConversations: row.total_conversations || 0,
      createdAt: row.created_at,
      lastActiveAt: row.last_active_at
    }))

    return c.json({
      success: true,
      users,
      total: users.length
    })

  } catch (error) {
    console.error('Admin users API error:', error)
    return c.json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: ユーザーのメモリー情報取得（管理者用）
app.get('/api/admin/users/:userId/memory', async (c) => {
  try {
    const { env } = c
    const db = env.DB
    const userId = c.req.param('userId')

    // ソウルメイトID取得
    const soulmate = await db.prepare(
      'SELECT id FROM soulmates WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first()

    if (!soulmate) {
      return c.json({ error: 'Soulmate not found' }, 404)
    }

    const soulmateId = soulmate.id

    // パーソナリティプロファイル取得
    const personality = await db.prepare(
      'SELECT * FROM user_personality WHERE user_id = ? AND soulmate_id = ?'
    ).bind(userId, soulmateId).first()

    // 日次サマリー取得（最新30件）
    const summaries = await db.prepare(
      `SELECT date, summary, topics, emotion, message_count 
       FROM daily_conversation_summary 
       WHERE user_id = ? AND soulmate_id = ?
       ORDER BY date DESC
       LIMIT 30`
    ).bind(userId, soulmateId).all()

    // 総メッセージ数取得
    const messageCount = await db.prepare(
      'SELECT COUNT(*) as count FROM chat_messages WHERE user_id = ? AND soulmate_id = ?'
    ).bind(userId, soulmateId).first()

    return c.json({
      success: true,
      memory: {
        personality: personality ? {
          personalitySummary: personality.personality_summary,
          interests: personality.interests,
          conversationStyle: personality.conversation_style,
          updatedAt: personality.updated_at
        } : null,
        dailySummaries: summaries.results.map((s: any) => ({
          date: s.date,
          summary: s.summary,
          topics: s.topics,
          emotion: s.emotion,
          messageCount: s.message_count
        })),
        totalMessages: messageCount?.count || 0
      }
    })

  } catch (error) {
    console.error('Admin user memory API error:', error)
    return c.json({ 
      error: 'Failed to fetch user memory',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// ========================================
// メモリーシステム: ヘルパー関数
// ========================================

/**
 * ユーザーのパーソナリティプロファイルを更新
 * 最新100件の会話から学習
 */
async function updateUserPersonality(
  db: D1Database, 
  userId: string, 
  soulmateId: number, 
  apiKey: string
) {
  try {
    // 最新100件の会話を取得
    const messages = await db.prepare(
      `SELECT sender, message FROM chat_messages 
       WHERE user_id = ? AND soulmate_id = ? 
       ORDER BY created_at DESC LIMIT 100`
    ).bind(userId, soulmateId).all()

    if (messages.results.length < 10) {
      return // メッセージが少なすぎる場合はスキップ
    }

    // ユーザーのメッセージのみ抽出
    const userMessages = messages.results
      .filter((m: any) => m.sender === 'user')
      .map((m: any) => m.message)
      .join('\n')

    // Gemini APIでパーソナリティ分析
    const analysisPrompt = `以下のユーザーのメッセージから、ユーザーのパーソナリティを分析してください。

ユーザーのメッセージ:
${userMessages}

以下の形式で簡潔に（各項目50文字以内）分析結果を出力してください：
性格: [明るい、内向的、慎重など]
趣味・関心: [映画鑑賞、読書、旅行など]
会話スタイル: [丁寧、カジュアル、感情表現豊かなど]`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 200
          }
        })
      }
    )

    if (!response.ok) {
      console.error('Personality analysis failed')
      return
    }

    const data = await response.json()
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!analysis) {
      return
    }

    // 分析結果をパース
    const lines = analysis.split('\n')
    let personalitySummary = ''
    let interests = ''
    let conversationStyle = ''

    for (const line of lines) {
      if (line.startsWith('性格:')) {
        personalitySummary = line.replace('性格:', '').trim()
      } else if (line.startsWith('趣味・関心:')) {
        interests = line.replace('趣味・関心:', '').trim()
      } else if (line.startsWith('会話スタイル:')) {
        conversationStyle = line.replace('会話スタイル:', '').trim()
      }
    }

    // DBに保存（UPSERT）
    await db.prepare(
      `INSERT INTO user_personality (user_id, soulmate_id, personality_summary, interests, conversation_style, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, soulmate_id) DO UPDATE SET
         personality_summary = excluded.personality_summary,
         interests = excluded.interests,
         conversation_style = excluded.conversation_style,
         updated_at = CURRENT_TIMESTAMP`
    ).bind(userId, soulmateId, personalitySummary, interests, conversationStyle).run()

    console.log('Personality updated for user:', userId)
  } catch (error) {
    console.error('updateUserPersonality error:', error)
  }
}

/**
 * 日次会話サマリーを生成
 */
async function generateDailySummary(
  db: D1Database,
  userId: string,
  soulmateId: number,
  date: string,
  apiKey: string
) {
  try {
    // 指定日の会話を取得
    const messages = await db.prepare(
      `SELECT sender, message FROM chat_messages 
       WHERE user_id = ? AND soulmate_id = ?
       AND date(created_at) = ?
       ORDER BY created_at ASC`
    ).bind(userId, soulmateId, date).all()

    if (messages.results.length === 0) {
      return // その日の会話がない場合はスキップ
    }

    // 会話を整形
    const conversation = messages.results
      .map((m: any) => `${m.sender === 'user' ? 'ユーザー' : 'ソウルメイト'}: ${m.message}`)
      .join('\n')

    // Gemini APIでサマリー生成
    const summaryPrompt = `以下の会話を要約してください。

会話:
${conversation}

以下の形式で簡潔に（各項目50文字以内）出力してください：
要約: [会話の要約]
トピック: [主なトピック、カンマ区切り]
感情: [ユーザーの感情]`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: summaryPrompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200
          }
        })
      }
    )

    if (!response.ok) {
      console.error('Daily summary generation failed')
      return
    }

    const data = await response.json()
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!result) {
      return
    }

    // 結果をパース
    const lines = result.split('\n')
    let summary = ''
    let topics = ''
    let emotion = ''

    for (const line of lines) {
      if (line.startsWith('要約:')) {
        summary = line.replace('要約:', '').trim()
      } else if (line.startsWith('トピック:')) {
        topics = line.replace('トピック:', '').trim()
      } else if (line.startsWith('感情:')) {
        emotion = line.replace('感情:', '').trim()
      }
    }

    // DBに保存（UPSERT）
    await db.prepare(
      `INSERT INTO daily_conversation_summary 
       (user_id, soulmate_id, date, summary, topics, emotion, message_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, soulmate_id, date) DO UPDATE SET
         summary = excluded.summary,
         topics = excluded.topics,
         emotion = excluded.emotion,
         message_count = excluded.message_count`
    ).bind(userId, soulmateId, date, summary, topics, emotion, messages.results.length).run()

    console.log('Daily summary generated for:', date)
  } catch (error) {
    console.error('generateDailySummary error:', error)
  }
}

export default app
