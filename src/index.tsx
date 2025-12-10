import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'
import { animals } from './data/animals'
import { names } from './data/names'
import { generateProfile, generateImage } from './services/gemini'

type Bindings = {
  GEMINI_API_KEY: string
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
        <a href="/admin" class="nav-item">
          <span class="nav-icon">⚙️</span>
          <span class="nav-label">管理者</span>
        </a>
      </nav>

      <script src="/static/app.js"></script>
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
    
    if (!apiKey) {
      return c.json({ error: 'API key not configured' }, 500)
    }

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
