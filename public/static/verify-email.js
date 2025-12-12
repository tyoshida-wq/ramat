// メール認証処理
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  const content = document.getElementById('verificationContent')
  const footer = document.getElementById('verificationFooter')

  if (!token) {
    content.innerHTML = `
      <div class="verification-error">
        <div class="error-icon">❌</div>
        <h2>エラー</h2>
        <p>認証トークンが見つかりません。</p>
        <p>メール内のリンクを再度クリックしてください。</p>
      </div>
    `
    footer.style.display = 'block'
    return
  }

  try {
    // メール認証API呼び出し
    const response = await fetch(`/api/auth/verify-email?token=${token}`)
    const data = await response.json()

    if (response.ok) {
      // 成功
      content.innerHTML = `
        <div class="verification-success">
          <div class="success-icon">✅</div>
          <h2>認証完了！</h2>
          <p>${data.message || 'メールアドレスの認証が完了しました。'}</p>
          ${data.alreadyVerified ? '' : '<p>自動的にログインしました。</p>'}
          <p>3秒後にホームページに移動します...</p>
        </div>
      `
      footer.style.display = 'block'

      // 3秒後にチャットページへリダイレクト（初回訪問時は生成モーダルが表示される）
      setTimeout(() => {
        window.location.href = '/chat'
      }, 3000)
    } else {
      // エラー
      let errorMessage = data.error || 'メール認証に失敗しました'
      let showResendButton = false

      if (response.status === 410) {
        // トークン期限切れ
        errorMessage = '認証トークンの有効期限が切れています。'
        showResendButton = true
      }

      content.innerHTML = `
        <div class="verification-error">
          <div class="error-icon">❌</div>
          <h2>認証失敗</h2>
          <p>${errorMessage}</p>
          ${showResendButton ? '<button onclick="showResendForm()" class="resend-btn">確認メールを再送信する</button>' : ''}
        </div>
      `
      footer.style.display = 'block'
    }
  } catch (error) {
    console.error('Verification error:', error)
    content.innerHTML = `
      <div class="verification-error">
        <div class="error-icon">❌</div>
        <h2>エラー</h2>
        <p>ネットワークエラーが発生しました。</p>
        <p>インターネット接続を確認して、再度お試しください。</p>
      </div>
    `
    footer.style.display = 'block'
  }
})

// 確認メール再送信フォーム表示
function showResendForm() {
  const content = document.getElementById('verificationContent')
  content.innerHTML = `
    <div class="resend-form">
      <h2>確認メールの再送信</h2>
      <p>メールアドレスを入力してください。</p>
      <form id="resendForm" onsubmit="resendVerification(event)">
        <input 
          type="email" 
          id="resendEmail" 
          class="auth-input" 
          placeholder="example@mail.com" 
          required 
        />
        <div id="resendStatus" style="margin-top: 1rem;"></div>
        <button type="submit" class="auth-submit-btn" id="resendBtn">
          <span class="btn-icon">📧</span>
          <span class="btn-text">再送信する</span>
        </button>
      </form>
    </div>
  `
}

// 確認メール再送信処理
async function resendVerification(event) {
  event.preventDefault()

  const email = document.getElementById('resendEmail').value
  const btn = document.getElementById('resendBtn')
  const status = document.getElementById('resendStatus')

  btn.disabled = true
  btn.querySelector('.btn-text').textContent = '送信中...'

  try {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    })

    const data = await response.json()

    if (response.ok) {
      status.innerHTML = `
        <div style="background: #d4edda; color: #155724; padding: 1rem; border-radius: 8px;">
          ${data.message || '確認メールを再送信しました。メールをご確認ください。'}
        </div>
      `
      
      // フォームをクリア
      document.getElementById('resendForm').reset()
    } else {
      status.innerHTML = `
        <div style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 8px;">
          ${data.error || 'エラーが発生しました'}
        </div>
      `
    }
  } catch (error) {
    console.error('Resend error:', error)
    status.innerHTML = `
      <div style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 8px;">
        ネットワークエラーが発生しました
      </div>
    `
  } finally {
    btn.disabled = false
    btn.querySelector('.btn-text').textContent = '再送信する'
  }
}
