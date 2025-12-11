// ストアページのJavaScript

// ページ読み込み時に待ち受け画像の状態を確認
document.addEventListener('DOMContentLoaded', async () => {
  await checkWallpaperStatus();
  initializeCategoryFilter();
});

// 待ち受け画像の状態を確認
async function checkWallpaperStatus() {
  try {
    const response = await fetch('/api/profile', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error('Failed to fetch profile');
      return;
    }

    const profile = await response.json();
    const soulmateId = profile.soulmate?.id;

    if (!soulmateId) {
      console.log('No soulmate found');
      return;
    }

    // 待ち受け画像の状態を取得
    const wallpaperResponse = await fetch(`/api/wallpapers/${soulmateId}`, {
      credentials: 'include'
    });

    if (!wallpaperResponse.ok) {
      // 待ち受け未生成状態を表示
      showWallpaperGenerateButton(soulmateId);
      return;
    }

    const wallpapers = await wallpaperResponse.json();

    if (wallpapers.exists) {
      // 生成済みの待ち受けを表示
      showWallpaperProducts(wallpapers);
    } else {
      // 待ち受け未生成状態を表示
      showWallpaperGenerateButton(soulmateId);
    }

  } catch (error) {
    console.error('Failed to check wallpaper status:', error);
  }
}

// 待ち受け生成ボタンを表示
function showWallpaperGenerateButton(soulmateId) {
  const container = document.getElementById('wallpaperSection');
  if (!container) return;

  container.innerHTML = `
    <div class="wallpaper-hero">
      <div class="hero-icon">🖼️✨</div>
      <h2>あなたのソウルメイトの待ち受け画像</h2>
      <p class="hero-description">
        スマートフォンとPCの壁紙を生成できます<br>
        あなたのソウルメイトが美しい背景と共に蘇ります
      </p>
      
      <div class="wallpaper-not-generated">
        <div class="preview-placeholder">
          <div class="placeholder-content">
            <span class="placeholder-icon">📱 💻</span>
            <p>待ち受け画像はまだ生成されていません</p>
          </div>
        </div>
        
        <button class="generate-wallpaper-btn" onclick="generateWallpapers('${soulmateId}')">
          <span class="btn-icon">✨</span>
          <span class="btn-text">待ち受け画像を生成する</span>
          <span class="btn-cost">(約¥9)</span>
        </button>
        
        <div class="generation-note">
          <p>💡 生成には約30〜60秒かかります</p>
          <p>📱 スマホ用（9:16）とPC用（16:9）の2枚が生成されます</p>
        </div>
      </div>
    </div>
  `;
}

// 待ち受け画像を生成
async function generateWallpapers(soulmateId) {
  try {
    const container = document.getElementById('wallpaperSection');
    
    // 生成中UIを表示
    container.innerHTML = `
      <div class="wallpaper-generating">
        <div class="loading-animation">
          <div class="spinner"></div>
          <div class="loading-steps">
            <div class="step active" id="step1">
              <span class="step-icon">📱</span>
              <span class="step-text">スマホ待ち受けを生成中...</span>
            </div>
            <div class="step" id="step2">
              <span class="step-icon">💻</span>
              <span class="step-text">PC待ち受けを生成中...</span>
            </div>
          </div>
        </div>
        <p class="generating-message">
          あなたのソウルメイトの待ち受けを作成しています✨<br>
          このまましばらくお待ちください（約30〜60秒）
        </p>
        <div class="progress-bar">
          <div class="progress-fill" id="generationProgress"></div>
        </div>
      </div>
    `;

    // プログレスバーアニメーション
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 1;
      const progressBar = document.getElementById('generationProgress');
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
      
      // ステップ2をアクティブに（50%で切り替え）
      if (progress === 50) {
        document.getElementById('step2')?.classList.add('active');
      }
      
      if (progress >= 90) {
        clearInterval(progressInterval);
      }
    }, 600); // 60秒で90%まで到達

    // API呼び出し
    const response = await fetch('/api/wallpapers/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ soulmateId })
    });

    clearInterval(progressInterval);

    if (!response.ok) {
      throw new Error('Generation failed');
    }

    const result = await response.json();

    if (result.success) {
      // プログレスバーを100%に
      const progressBar = document.getElementById('generationProgress');
      if (progressBar) {
        progressBar.style.width = '100%';
      }

      // 完了メッセージを表示
      setTimeout(() => {
        alert('✨ 待ち受け画像が生成されました！');
        location.reload();
      }, 500);
    } else {
      throw new Error(result.error || 'Generation failed');
    }

  } catch (error) {
    console.error('Generation failed:', error);
    alert('❌ 生成に失敗しました。もう一度お試しください。');
    location.reload();
  }
}

// 生成済み待ち受け商品を表示
function showWallpaperProducts(wallpapers) {
  const container = document.getElementById('wallpaperSection');
  if (!container) return;

  container.innerHTML = `
    <div class="wallpaper-products">
      <h2 class="section-title">🖼️ 待ち受け画像</h2>
      <div class="product-grid">
        <!-- スマホ待ち受け -->
        <div class="product-card digital" data-category="wallpaper" data-type="mobile">
          <div class="product-badge">📱 スマホ用</div>
          <div class="product-image">
            <img src="${wallpapers.mobileUrl}" alt="スマホ待ち受け" loading="lazy">
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

        <!-- PC待ち受け -->
        <div class="product-card digital" data-category="wallpaper" data-type="pc">
          <div class="product-badge">💻 PC用</div>
          <div class="product-image">
            <img src="${wallpapers.pcUrl}" alt="PC待ち受け" loading="lazy">
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

        <!-- セット販売 -->
        <div class="product-card digital featured" data-category="wallpaper" data-type="set">
          <div class="product-badge popular">🌟 お得セット</div>
          <div class="product-image dual">
            <img src="${wallpapers.mobileUrl}" alt="スマホ" class="dual-image" loading="lazy">
            <img src="${wallpapers.pcUrl}" alt="PC" class="dual-image" loading="lazy">
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
  `;
}

// カテゴリーフィルター初期化
function initializeCategoryFilter() {
  const categoryTabs = document.querySelectorAll('.category-tab');
  const productCards = document.querySelectorAll('.product-card');

  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // アクティブタブの切り替え
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const category = tab.dataset.category;

      // 商品のフィルタリング
      productCards.forEach(card => {
        if (category === 'all') {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 10);
        } else {
          if (card.dataset.category === category) {
            card.style.display = 'flex';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
            }, 10);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 300);
          }
        }
      });
    });
  });
});

// 商品購入処理
async function purchaseItem(itemType, price) {
  try {
    // ユーザーIDを取得
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('ログインが必要です');
      window.location.href = '/login';
      return;
    }

    // ソウルメイト情報を取得
    const response = await fetch(`/api/mypage/profile/${userId}`);
    if (!response.ok) {
      alert('ソウルメイトを生成してください');
      window.location.href = '/generate';
      return;
    }

    const data = await response.json();
    const soulmateName = data.soulmate.name;
    const soulmateAnimal = data.soulmate.animal;

    // 商品名を取得
    const productNames = {
      'wallpaper_mobile': 'スマホ待ち受け画像',
      'wallpaper_pc': 'PC待ち受け画像',
      'wallpaper_set': '待ち受けセット',
      'keychain': 'アクリルキーホルダー',
      'acrylic_stand': 'アクリルスタンド',
      'mug': 'マグカップ'
    };

    const productName = productNames[itemType] || '商品';

    // 確認ダイアログ
    const confirmed = confirm(
      `${productName}を購入しますか？\n\n` +
      `ソウルメイト: ${soulmateName}（${soulmateAnimal}）\n` +
      `価格: ¥${price.toLocaleString()}\n\n` +
      `※現在はデモ版のため、実際の決済は行われません。`
    );

    if (!confirmed) {
      return;
    }

    // デモ版の処理
    showPurchaseSuccess(productName, itemType);

  } catch (error) {
    console.error('Purchase error:', error);
    alert('購入処理に失敗しました。もう一度お試しください。');
  }
}

// 購入成功時の処理
function showPurchaseSuccess(productName, itemType) {
  // モーダルを作成
  const modal = document.createElement('div');
  modal.className = 'purchase-modal';
  modal.innerHTML = `
    <div class="purchase-modal-content">
      <div class="purchase-success-icon">🎉</div>
      <h2 class="purchase-title">購入ありがとうございます！</h2>
      <p class="purchase-message">
        ${productName}の購入が完了しました。
      </p>
      ${itemType.startsWith('wallpaper') ? `
        <div class="purchase-download">
          <p>ダウンロードの準備ができました</p>
          <button class="download-btn" onclick="downloadWallpaper('${itemType}')">
            📥 ダウンロード
          </button>
        </div>
      ` : `
        <div class="purchase-shipping">
          <p>📦 製作・発送までに1〜2週間かかります</p>
          <p>配送先の登録はマイページから行えます</p>
        </div>
      `}
      <button class="purchase-close-btn" onclick="this.closest('.purchase-modal').remove()">
        閉じる
      </button>
    </div>
  `;

  // スタイルを追加
  const style = document.createElement('style');
  style.textContent = `
    .purchase-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s;
    }
    .purchase-modal-content {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.3s;
    }
    .purchase-success-icon {
      font-size: 4rem;
      margin-bottom: 16px;
    }
    .purchase-title {
      font-size: 1.5rem;
      color: #FF69B4;
      margin-bottom: 16px;
    }
    .purchase-message {
      color: #666;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .purchase-download,
    .purchase-shipping {
      background: #FFF5F7;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .purchase-download p,
    .purchase-shipping p {
      color: #666;
      font-size: 0.9rem;
      margin: 8px 0;
    }
    .download-btn {
      background: linear-gradient(135deg, #FFB6D9 0%, #FFC9E3 100%);
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 25px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 12px;
      font-size: 1rem;
    }
    .download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255, 105, 180, 0.4);
    }
    .purchase-close-btn {
      background: #f0f0f0;
      color: #666;
      border: none;
      padding: 12px 32px;
      border-radius: 25px;
      font-weight: 600;
      cursor: pointer;
    }
    .purchase-close-btn:hover {
      background: #e0e0e0;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(modal);

  // 背景クリックで閉じる
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// 待ち受け画像のダウンロード
async function downloadWallpaper(itemType) {
  try {
    alert('デモ版のため、実際のダウンロードは行われません。\n\n本番環境では、ソウルメイトの高画質画像がダウンロードされます。');
    
    // 本番環境では以下のような処理を実装
    // const userId = localStorage.getItem('userId');
    // const response = await fetch(`/api/store/download/${itemType}?userId=${userId}`);
    // const blob = await response.blob();
    // const url = window.URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = `soulmate_${itemType}.png`;
    // a.click();
    
  } catch (error) {
    console.error('Download error:', error);
    alert('ダウンロードに失敗しました');
  }
}
