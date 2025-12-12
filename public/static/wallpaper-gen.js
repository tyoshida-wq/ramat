// 待ち受け画像生成スクリプト

// 準備中モーダルを表示する関数
function showComingSoonModal() {
  const modal = document.getElementById('coming-soon-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// 準備中モーダルを閉じる関数
function closeComingSoonModal() {
  const modal = document.getElementById('coming-soon-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// ページロード時にモーダルを表示
document.addEventListener('DOMContentLoaded', () => {
  showComingSoonModal();
  
  // モーダル外クリックで閉じる
  const modal = document.getElementById('coming-soon-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeComingSoonModal();
      }
    });
  }
});

async function generateWallpaper(soulmateId) {
  const btn = event.target.closest('button');
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">生成中...</span>';
  
  try {
    const response = await fetch('/api/wallpapers/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ soulmateId })
    });
    
    if (response.ok) {
      alert('✨ 待ち受け画像が生成されました！');
      location.reload();
    } else {
      const error = await response.json();
      alert('❌ エラー: ' + (error.error || '生成に失敗しました'));
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">✨</span><span class="btn-text">待ち受け画像を生成する</span><span class="btn-cost">(約¥72)</span>';
    }
  } catch (error) {
    alert('❌ 通信エラー: ' + error.message);
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">✨</span><span class="btn-text">待ち受け画像を生成する</span><span class="btn-cost">(約¥72)</span>';
  }
}
