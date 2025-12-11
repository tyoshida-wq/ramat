// お問い合わせフォーム送信処理
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm')
  const submitBtn = document.getElementById('contactSubmitBtn')
  const statusDiv = document.getElementById('contactStatus')

  if (!form) return

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    // フォームデータ取得
    const name = document.getElementById('contactName').value.trim()
    const email = document.getElementById('contactEmail').value.trim()
    const subject = document.getElementById('contactSubject').value.trim()
    const message = document.getElementById('contactMessage').value.trim()

    // バリデーション
    if (!name || !email || !subject || !message) {
      showStatus('全ての項目を入力してください', 'error')
      return
    }

    // 送信中UI
    submitBtn.disabled = true
    submitBtn.textContent = '送信中...'
    showStatus('送信中...', 'info')

    try {
      // API呼び出し
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, subject, message })
      })

      const data = await response.json()

      if (response.ok) {
        // 成功
        showStatus(data.message || 'お問い合わせを受け付けました。確認メールをご確認ください。', 'success')
        
        // フォームクリア
        form.reset()

        // 3秒後にステータスメッセージを非表示
        setTimeout(() => {
          statusDiv.style.display = 'none'
        }, 5000)
      } else {
        // エラー
        showStatus(data.error || 'エラーが発生しました', 'error')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      showStatus('ネットワークエラーが発生しました', 'error')
    } finally {
      // ボタンを元に戻す
      submitBtn.disabled = false
      submitBtn.textContent = '送信する'
    }
  })

  function showStatus(message, type) {
    statusDiv.textContent = message
    statusDiv.style.display = 'block'
    statusDiv.style.padding = '1rem'
    statusDiv.style.borderRadius = '8px'
    statusDiv.style.marginBottom = '1rem'

    if (type === 'success') {
      statusDiv.style.backgroundColor = '#d4edda'
      statusDiv.style.color = '#155724'
      statusDiv.style.border = '1px solid #c3e6cb'
    } else if (type === 'error') {
      statusDiv.style.backgroundColor = '#f8d7da'
      statusDiv.style.color = '#721c24'
      statusDiv.style.border = '1px solid #f5c6cb'
    } else if (type === 'info') {
      statusDiv.style.backgroundColor = '#d1ecf1'
      statusDiv.style.color = '#0c5460'
      statusDiv.style.border = '1px solid #bee5eb'
    }
  }
})
