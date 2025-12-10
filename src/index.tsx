import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'
import { animals } from './data/animals'
import { names } from './data/names'
import { generateProfile, generateImage } from './services/gemini'

type Bindings = {
  GEMINI_API_KEY: string
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定
app.use('/api/*', cors())

app.use(renderer)

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

        {/* 特徴セクション */}
        <section class="features-section">
          <h2 class="section-heading">Ramatの特徴</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🎨</div>
              <h3 class="feature-title">AI生成アート</h3>
              <p class="feature-desc">Gemini AIが生み出す、世界に一つだけのKawaiiイラスト</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💭</div>
              <h3 class="feature-title">個性的なプロフィール</h3>
              <p class="feature-desc">性格、口調、コンセプトまで細かく設定された唯一無二のキャラクター</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌸</div>
              <h3 class="feature-title">癒しのデザイン</h3>
              <p class="feature-desc">パステルカラーの桜色グラデーションで心を包む優しいUI</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🦊</div>
              <h3 class="feature-title">多様な動物</h3>
              <p class="feature-desc">哺乳類55種 + 幻想的生物20種から運命の出会い</p>
            </div>
          </div>
        </section>

        {/* CTAセクション */}
        <section class="cta-section">
          <h2 class="cta-title">あなたのソウルメイトに会いに行こう</h2>
          <p class="cta-description">たった一度のクリックで、運命の守護動物があなたのもとに</p>
          <a href="/generate" class="cta-btn">
            <span class="btn-icon">🌸</span>
            <span class="btn-text">ソウルメイトを呼ぶ</span>
          </a>
        </section>
      </main>

      <nav class="bottom-nav">
        <a href="/" class="nav-item active">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">トップ</span>
        </a>
        <a href="/generate" class="nav-item">
          <span class="nav-icon">✨</span>
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
          <span class="nav-icon">⚙️</span>
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
          <span class="nav-icon">🏠</span>
          <span class="nav-label">トップ</span>
        </a>
        <a href="/generate" class="nav-item active">
          <span class="nav-icon">✨</span>
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
          <span class="nav-icon">⚙️</span>
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
          <span class="nav-icon">🏠</span>
          <span class="nav-label">トップ</span>
        </a>
        <a href="/generate" class="nav-item">
          <span class="nav-icon">✨</span>
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
          <span class="nav-icon">⚙️</span>
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
          <span class="nav-icon">🏠</span>
          <span class="nav-label">トップ</span>
        </a>
        <a href="/generate" class="nav-item">
          <span class="nav-icon">✨</span>
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
          <span class="nav-icon">⚙️</span>
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
            <button class="action-btn info">
              <span class="btn-icon">💾</span>
              <span>データ保存</span>
            </button>
            <button class="action-btn warning">
              <span class="btn-icon">🔄</span>
              <span>システム更新</span>
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
          <span class="nav-icon">🏠</span>
          <span class="nav-label">トップ</span>
        </a>
        <a href="/generate" class="nav-item">
          <span class="nav-icon">✨</span>
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
          <span class="nav-icon">⚙️</span>
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

// API: 管理者統計データ
app.get('/api/admin/stats', (c) => {
  // TODO: 実際のデータベースから取得
  return c.json({
    totalGenerations: 1234,
    totalUsers: 456,
    todayGenerations: 89,
    apiUsage: 67,
    weeklyData: [65, 78, 90, 81, 95, 88, 92],
    topAnimals: [
      { name: '北極ギツネ', count: 234, percentage: 45 },
      { name: 'パンダ', count: 156, percentage: 30 },
      { name: 'トナカイ', count: 104, percentage: 20 },
      { name: 'コアラ', count: 16, percentage: 3 },
      { name: 'アライグマ', count: 10, percentage: 2 },
    ]
  })
})

export default app
