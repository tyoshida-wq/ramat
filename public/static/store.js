// ストアページのJavaScript

// カテゴリーフィルター
document.addEventListener('DOMContentLoaded', () => {
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
