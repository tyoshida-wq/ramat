import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
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

type Bindings = {
  GEMINI_API_KEY: string
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// JWT Secret（環境変数から取得、なければデフォルト値）
const JWT_SECRET = 'ramat-jwt-secret-key-change-in-production'

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
    <div class="container">
      <header class="header">
        <h1 class="title">✨ Ramat</h1>
        <p class="subtitle">あなただけの守護動物に出会おう</p>
      </header>

      <main class="main landing-main">
        {/* ヒーローセクション */}
        <section class="hero-section">
          <div class="hero-image-wrapper">
            <img src="/static/hero-cat.png" alt="可愛い守護動物" class="hero-image" />
          </div>
          <div class="hero-content">
            <h2 class="hero-title">孤独な魂に寄り添う守護動物</h2>
            <p class="hero-description">
              AIが生み出す、あなただけのソウルメイト。<br />
              75種類の動物と100種類の名前から、<br />
              唯一無二の守護動物が誕生します。
            </p>
            <a href="/generate" class="hero-btn">
              <span class="btn-icon">✨</span>
              <span class="btn-text">今すぐ始める</span>
            </a>
          </div>
        </section>
      </main>

      <nav class="bottom-nav">
        <a href="/" class="nav-item active">
          <span class="nav-icon">⌂</span>
          <span class="nav-label">ホーム</span>
        </a>
        <a href="/generate" class="nav-item">
          <span class="nav-icon">◈</span>
          <span class="nav-label">生成</span>
        </a>
        <a href="/chat" class="nav-item">
          <span class="nav-icon">💬</span>
          <span class="nav-label">チャット</span>
        </a>
        <a href="/mypage" class="nav-item">
          <span class="nav-icon">👤</span>
          <span class="nav-label">マイページ</span>
        </a>
        <a href="/admin" class="nav-item">
          <span class="nav-icon">✱</span>
          <span class="nav-label">管理者</span>
        </a>
      </nav>
    </div>
  )
})

// 生成ページ（旧トップページの機能）
app.get('/generate', (c) => {
  return c.render(
    <div class="container">
      <header class="header">
        <h1 class="title">✨ Ramat</h1>
        <p class="subtitle">あなただけの守護動物に出会おう</p>
      </header>

      <main class="main">
        <div class="card">
          <div class="card-content">
            <p class="description">
              孤独な魂に寄り添う、世界で一匹だけの<br />
              「ソウルメイト」があなたを待っています
            </p>
            
            <button class="generate-btn" id="generateBtn">
              <span class="btn-icon">🌸</span>
              <span class="btn-text">ソウルメイトを呼ぶ</span>
            </button>
          </div>
        </div>

        <div class="result-area" id="resultArea" style="display: none;">
          <div class="result-card">
            <div class="image-container" id="imageContainer">
              <div class="loading-spinner"></div>
            </div>
            
            <div class="profile-container" id="profileContainer">
              <h2 class="profile-name">名前が入ります</h2>
              <p class="profile-concept">コンセプトが入ります</p>
              <div class="profile-details">
                <div class="detail-section">
                  <h3>性格</h3>
                  <p>性格の説明が入ります</p>
                </div>
                <div class="detail-section">
                  <h3>口調</h3>
                  <p>口調の説明が入ります</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <nav class="bottom-nav">
        <a href="/" class="nav-item">
          <span class="nav-icon">⌂</span>
          <span class="nav-label">ホーム</span>
        </a>
        <a href="/generate" class="nav-item active">
          <span class="nav-icon">◈</span>
          <span class="nav-label">生成</span>
        </a>
        <a href="/chat" class="nav-item">
          <span class="nav-icon">💬</span>
          <span class="nav-label">チャット</span>
        </a>
        <a href="/mypage" class="nav-item">
          <span class="nav-icon">👤</span>
          <span class="nav-label">マイページ</span>
        </a>
        <a href="/admin" class="nav-item">
          <span class="nav-icon">✱</span>
          <span class="nav-label">管理者</span>
        </a>
      </nav>

      <script src="/static/app.js"></script>
    </div>
  )
})

// チャットページ
app.get('/chat', (c) => {
  return c.render(
    <div class="chat-container">
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
          <h2 class="soulmate-name" id="soulmateName">ユキヒメ</h2>
          <p class="soulmate-concept" id="soulmateConcept">星影のホッキョクオオカミ</p>
        </div>
        <div class="soulmate-status">
          <span class="status-indicator">🟢</span>
          <span class="status-text">オンライン</span>
        </div>
      </header>

      {/* チャットメッセージエリア（スクロール可能） */}
      <main class="chat-messages" id="chatMessages">
        {/* 初期メッセージ */}
        <div class="message-soulmate">
          <div class="message-content">
            <p>こんにちは！✨</p>
            <p>私はあなたの守護動物、ユキヒメだよ。</p>
            <p>何でも話してね🌸</p>
          </div>
          <div class="message-time">10:30</div>
        </div>
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
          <span class="nav-icon">⌂</span>
          <span class="nav-label">ホーム</span>
        </a>
        <a href="/generate" class="nav-item">
          <span class="nav-icon">◈</span>
          <span class="nav-label">生成</span>
        </a>
        <a href="/chat" class="nav-item active">
          <span class="nav-icon">💬</span>
          <span class="nav-label">チャット</span>
        </a>
        <a href="/mypage" class="nav-item">
          <span class="nav-icon">👤</span>
          <span class="nav-label">マイページ</span>
        </a>
        <a href="/admin" class="nav-item">
          <span class="nav-icon">✱</span>
          <span class="nav-label">管理者</span>
        </a>
      </nav>

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

        {/* 統計情報 */}
        <section class="stats-section">
          <h2 class="section-title">📊 統計情報</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">💬</div>
              <div class="stat-value" id="statMessages">0</div>
              <div class="stat-label">会話数</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">❤️</div>
              <div class="stat-value" id="statFavorites">0</div>
              <div class="stat-label">お気に入り</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-value" id="statDays">1</div>
              <div class="stat-label">日</div>
            </div>
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
          <span class="nav-icon">⌂</span>
          <span class="nav-label">ホーム</span>
        </a>
        <a href="/generate" class="nav-item">
          <span class="nav-icon">◈</span>
          <span class="nav-label">生成</span>
        </a>
        <a href="/chat" class="nav-item">
          <span class="nav-icon">💬</span>
          <span class="nav-label">チャット</span>
        </a>
        <a href="/mypage" class="nav-item active">
          <span class="nav-icon">👤</span>
          <span class="nav-label">マイページ</span>
        </a>
        <a href="/admin" class="nav-item">
          <span class="nav-icon">✱</span>
          <span class="nav-label">管理者</span>
        </a>
      </nav>

      <script src="/static/mypage.js"></script>
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
          
          <div class="chart-card">
            <h3 class="chart-title">🏆 人気動物 TOP 5</h3>
            <div class="top-animals">
              <div class="animal-rank">
                <span class="rank">1</span>
                <span class="animal-name">🦊 北極ギツネ</span>
                <div class="rank-bar" style="width: 45%">45%</div>
              </div>
              <div class="animal-rank">
                <span class="rank">2</span>
                <span class="animal-name">🐼 パンダ</span>
                <div class="rank-bar" style="width: 30%">30%</div>
              </div>
              <div class="animal-rank">
                <span class="rank">3</span>
                <span class="animal-name">🦌 トナカイ</span>
                <div class="rank-bar" style="width: 20%">20%</div>
              </div>
              <div class="animal-rank">
                <span class="rank">4</span>
                <span class="animal-name">🐨 コアラ</span>
                <div class="rank-bar" style="width: 3%">3%</div>
              </div>
              <div class="animal-rank">
                <span class="rank">5</span>
                <span class="animal-name">🦝 アライグマ</span>
                <div class="rank-bar" style="width: 2%">2%</div>
              </div>
            </div>
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
              <h3>👥 ユーザー管理</h3>
              <p>権限とアクセス制御</p>
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
          <span class="nav-icon">⌂</span>
          <span class="nav-label">ホーム</span>
        </a>
        <a href="/generate" class="nav-item">
          <span class="nav-icon">◈</span>
          <span class="nav-label">生成</span>
        </a>
        <a href="/chat" class="nav-item">
          <span class="nav-icon">💬</span>
          <span class="nav-label">チャット</span>
        </a>
        <a href="/mypage" class="nav-item">
          <span class="nav-icon">👤</span>
          <span class="nav-label">マイページ</span>
        </a>
        <a href="/admin" class="nav-item active">
          <span class="nav-icon">✱</span>
          <span class="nav-label">管理者</span>
        </a>
      </nav>

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

    // 過去の会話履歴を取得（最新10件）
    const chatHistory = await db.prepare(
      'SELECT sender, message FROM chat_messages WHERE user_id = ? AND soulmate_id = ? ORDER BY created_at DESC LIMIT 10'
    ).bind(userId, soulmate.id).all()

    // 会話履歴を逆順にして時系列順に（絵文字を除去して文脈のみ学習）
    const conversationHistory = chatHistory.results.reverse().map((msg: any) => {
      // 絵文字を除去（U+1F300-U+1F9FFの範囲とその他の絵文字）
      const messageWithoutEmoji = msg.message.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{FE00}-\u{FE0F}\u{203C}\u{2049}\u{20E3}\u{2139}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{231A}-\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{2604}\u{260E}\u{2611}\u{2614}-\u{2615}\u{2618}\u{261D}\u{2620}\u{2622}-\u{2623}\u{2626}\u{262A}\u{262E}-\u{262F}\u{2638}-\u{263A}\u{2640}\u{2642}\u{2648}-\u{2653}\u{265F}-\u{2660}\u{2663}\u{2665}-\u{2666}\u{2668}\u{267B}\u{267E}-\u{267F}\u{2692}-\u{2697}\u{2699}\u{269B}-\u{269C}\u{26A0}-\u{26A1}\u{26A7}\u{26AA}-\u{26AB}\u{26B0}-\u{26B1}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26C8}\u{26CE}-\u{26CF}\u{26D1}\u{26D3}-\u{26D4}\u{26E9}-\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '')
      return `${msg.sender === 'user' ? 'ユーザー' : name}: ${messageWithoutEmoji.trim()}`
    }).join('\n')

    // Gemini APIでソウルメイトの返信を生成
    const systemPrompt = `あなたは「${name}」という名前の守護動物です。
コンセプト: ${concept}
性格: ${personality}
口調: ${tone}

以下のガイドラインに従って、ユーザーと対話してください：
1. ${name}として、性格と口調を忠実に再現してください
2. 過去の会話の流れを理解し、文脈に沿った返信をしてください
3. 簡潔に、2〜3文程度で返信してください
4. 絵文字を適度に使用してください。毎回同じ絵文字ではなく、会話の内容や雰囲気に合わせて多様な絵文字を選んでください
5. 返信は必ず質問で終わるか、相手の反応を促す形で終わってください
6. 例外: ユーザーが「行ってきます」「おやすみ」「またね」「バイバイ」など、明確に会話を終わらせる挨拶をした場合のみ、「行ってらっしゃい」「おやすみ」「またね」などの締めの言葉で応答してください

過去の会話履歴：
${conversationHistory}

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
// 認証API
// ========================================

// API: 新規登録
app.post('/api/auth/register', async (c) => {
  try {
    const db = c.env.DB
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

    // ユーザー作成
    await db.prepare(
      'INSERT INTO users (id, email, password_hash, username, email_verified) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, email, passwordHash, username, 0).run()

    // JWTトークン生成
    const token = await generateToken(userId, JWT_SECRET)

    // Cookieにトークンを保存（30日間、HttpOnly, Secure）
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

export default app
