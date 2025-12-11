// 管理者ページのJavaScript

// 統計データの読み込みとアニメーション
async function loadStats() {
  try {
    const response = await fetch('/api/admin/stats');
    const data = await response.json();
    
    // カウントアップアニメーション
    animateCounter('totalGenerations', 0, data.totalGenerations, 2000);
    animateCounter('totalUsers', 0, data.totalUsers, 2000);
    animateCounter('todayGenerations', 0, data.todayGenerations, 2000);
    animateCounter('apiUsage', 0, data.apiUsage, 2000, '%');
    
    // プログレスバーのアニメーション
    setTimeout(() => {
      document.querySelector('.stat-progress-bar').style.width = data.apiUsage + '%';
    }, 500);
    
    // グラフの描画
    if (data.weeklyData) {
      drawWeeklyChart(data.weeklyData);
    }
    
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// カウントアップアニメーション
function animateCounter(elementId, start, end, duration, suffix = '') {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const startTime = performance.now();
  const range = end - start;
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // イージング関数（ease-out）
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + range * eased);
    
    element.textContent = current.toLocaleString() + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// 週間グラフの描画
function drawWeeklyChart(weeklyData) {
  const canvas = document.getElementById('weeklyChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['月', '火', '水', '木', '金', '土', '日'],
      datasets: [{
        label: '生成数',
        data: weeklyData,
        borderColor: '#FF6B9D',
        backgroundColor: 'rgba(255, 107, 157, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#FF6B9D',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              size: 12
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12
            }
          }
        }
      }
    }
  });
}

// 履歴データの読み込み（実API接続版）
async function loadHistory() {
  try {
    const response = await fetch('/api/admin/history');
    
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }
    
    const data = await response.json();
    
    if (!data.success || !data.history) {
      throw new Error('Invalid response format');
    }
    
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    // 履歴が空の場合
    if (data.history.length === 0) {
      tbody.innerHTML = `
        <div class="table-row" style="justify-content: center; padding: 40px; opacity: 0.6;">
          <p>まだ生成履歴がありません</p>
        </div>
      `;
      return;
    }
    
    // 履歴データを表示
    tbody.innerHTML = data.history.map(item => {
      // サムネイル表示（画像があればimg、なければ絵文字）
      const thumbnailHTML = item.image 
        ? `<img src="${item.image}" alt="${item.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` 
        : getAnimalEmoji(item.animal);
      
      return `
        <div class="table-row">
          <div class="col-image">
            <div class="history-thumbnail">${thumbnailHTML}</div>
          </div>
          <div class="col-name">${escapeHtml(item.name)}</div>
          <div class="col-animal">${escapeHtml(item.animal)}</div>
          <div class="col-time" title="${item.createdAt}">${escapeHtml(item.time)}</div>
          <div class="col-actions">
            <button class="icon-btn view" onclick="viewDetail(${item.id}, '${escapeHtml(item.name)}', '${escapeHtml(item.animal)}', '${item.createdAt}', '${escapeHtml(item.username)}')" title="詳細">👁️</button>
            <button class="icon-btn delete" onclick="deleteItem(${item.id}, '${escapeHtml(item.name)}')" title="削除">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Failed to load history:', error);
    
    const tbody = document.getElementById('historyTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <div class="table-row" style="justify-content: center; padding: 40px; color: #ff6b9d;">
          <p>⚠️ 履歴の読み込みに失敗しました</p>
        </div>
      `;
    }
  }
}

// 動物の絵文字を取得する関数
function getAnimalEmoji(animal) {
  const emojiMap = {
    '北極ギツネ': '🦊',
    'パンダ': '🐼',
    'トナカイ': '🦌',
    'コアラ': '🐨',
    'アライグマ': '🦝',
    'ペンギン': '🐧',
    'ウサギ': '🐰',
    'クマ': '🐻',
    '猫': '🐱',
    '犬': '🐶',
    '鹿': '🦌',
    '狐': '🦊',
    '狼': '🐺',
    'フクロウ': '🦉',
    'ハリネズミ': '🦔',
    'リス': '🐿️',
    'ユニコーン': '🦄',
    'ドラゴン': '🐉',
    'フェニックス': '🔥'
  };
  return emojiMap[animal] || '✨';
}

// HTMLエスケープ関数（XSS対策）
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// 詳細表示（モーダル表示）
function viewDetail(id, name, animal, createdAt, username) {
  // 日時をフォーマット
  const date = new Date(createdAt);
  const formattedDate = date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  alert(`📋 生成詳細\n\n` +
        `ID: ${id}\n` +
        `名前: ${name}\n` +
        `動物: ${animal}\n` +
        `生成日時: ${formattedDate}\n` +
        `ユーザー: ${username}\n\n` +
        `※ 詳細モーダル表示は今後実装予定です`);
}

// 削除確認（将来的にAPI実装）
function deleteItem(id, name) {
  if (confirm(`「${name}」の生成データを削除しますか？\n\n※ この操作は取り消せません`)) {
    // TODO: DELETE /api/admin/history/:id を実装
    alert(`削除しました: ${name} (ID: ${id})\n\n※ API実装は今後予定です`);
    loadHistory(); // リロード
  }
}

// アクションボタンのイベント
document.addEventListener('DOMContentLoaded', () => {
  // 統計とグラフを読み込み
  loadStats();
  
  // 履歴を読み込み
  loadHistory();
  
  // クイックアクションボタン
  const actionButtons = document.querySelectorAll('.action-btn');
  actionButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const text = e.currentTarget.textContent.trim();
      
      // 履歴確認ボタンの場合は履歴セクションへスクロール
      if (text.includes('履歴確認')) {
        const historySection = document.querySelector('.history-section');
        if (historySection) {
          historySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // ハイライト効果
          historySection.style.transition = 'all 0.3s ease';
          historySection.style.transform = 'scale(1.02)';
          setTimeout(() => {
            historySection.style.transform = 'scale(1)';
          }, 300);
        }
        return;
      }
      
      // 新規生成ボタンの場合は生成ページへ遷移
      if (text.includes('新規生成')) {
        window.location.href = '/generate';
        return;
      }
    });
  });
  
  // 設定ボタン
  const settingButtons = document.querySelectorAll('.setting-btn');
  settingButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.setting-card');
      const title = card.querySelector('h3').textContent;
      alert(`${title}\n\n※ 実装予定の機能です`);
    });
  });
  
  // 自動更新（30秒ごと）
  setInterval(() => {
    loadStats();
    loadHistory();
  }, 30000);
});

// アニメーション効果
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '0';
      entry.target.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        entry.target.style.transition = 'all 0.6s ease';
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, 100);
      
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// セクションにアニメーションを適用
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.stats-section, .quick-actions, .charts-section, .history-section, .settings-section');
  sections.forEach(section => observer.observe(section));
});
