// フロントエンドロジック

const generateBtn = document.getElementById('generateBtn');
const resultArea = document.getElementById('resultArea');
const imageContainer = document.getElementById('imageContainer');
const profileContainer = document.getElementById('profileContainer');

// ボタンクリックハンドラー
generateBtn.addEventListener('click', async () => {
  try {
    // ボタンを無効化
    generateBtn.disabled = true;
    generateBtn.style.opacity = '0.6';
    generateBtn.style.cursor = 'not-allowed';

    // 結果エリアを表示（ローディング状態）
    resultArea.style.display = 'block';
    imageContainer.innerHTML = '<div class="loading-spinner"></div>';
    profileContainer.innerHTML = '<p style="text-align: center; color: #8A8A8A;">生成中...</p>';

    // スムーズにスクロール
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // API呼び出し
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Generation failed');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error('Generation failed');
    }

    // 画像を表示
    imageContainer.innerHTML = `<img src="${data.profile.image}" alt="${data.profile.name}" />`;

    // プロフィールを表示
    profileContainer.innerHTML = `
      <h2 class="profile-name">${data.profile.name}</h2>
      <p class="profile-concept">${data.profile.concept}</p>
      <div class="profile-details">
        <div class="detail-section">
          <h3>性格</h3>
          <p>${data.profile.personality}</p>
        </div>
        <div class="detail-section">
          <h3>口調</h3>
          <p>${data.profile.tone}</p>
        </div>
      </div>
    `;

    // スムーズにスクロール（完成した結果へ）
    setTimeout(() => {
      resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

  } catch (error) {
    console.error('Error:', error);
    
    // エラー表示
    imageContainer.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #FF6B9D;">
        <p style="font-size: 2rem; margin-bottom: 10px;">😢</p>
        <p>生成に失敗しました</p>
        <p style="font-size: 0.9rem; margin-top: 10px; color: #8A8A8A;">${error.message}</p>
      </div>
    `;
    profileContainer.innerHTML = '';
  } finally {
    // ボタンを再度有効化
    generateBtn.disabled = false;
    generateBtn.style.opacity = '1';
    generateBtn.style.cursor = 'pointer';
  }
});
