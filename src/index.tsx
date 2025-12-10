import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

app.get('/', (c) => {
  return c.render(
    <div class="container">
      <header class="header">
        <h1 class="title">✨ ソウルメイト</h1>
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

      <footer class="footer">
        <p>© 2024 Soulmate Generator</p>
      </footer>
    </div>
  )
})

export default app
