// 待ち受け画像生成スクリプト

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
