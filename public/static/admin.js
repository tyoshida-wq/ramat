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

// 履歴データの読み込み
async function loadHistory() {
  // TODO: 実際のAPI実装
  const mockHistory = [
    {
      id: 1,
      name: 'ユキヒメ',
      animal: '北極ギツネ',
      thumbnail: '🦊',
      time: '2分前'
    },
    {
      id: 2,
      name: 'サクラ',
      animal: 'パンダ',
      thumbnail: '🐼',
      time: '15分前'
    },
    {
      id: 3,
      name: 'ルナ',
      animal: 'トナカイ',
      thumbnail: '🦌',
      time: '1時間前'
    }
  ];
  
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = mockHistory.map(item => `
    <div class="table-row">
      <div class="col-image">
        <div class="history-thumbnail">${item.thumbnail}</div>
      </div>
      <div class="col-name">${item.name}</div>
      <div class="col-animal">${item.animal}</div>
      <div class="col-time">${item.time}</div>
      <div class="col-actions">
        <button class="icon-btn view" onclick="viewDetail(${item.id})" title="詳細">👁️</button>
        <button class="icon-btn delete" onclick="deleteItem(${item.id})" title="削除">🗑️</button>
      </div>
    </div>
  `).join('');
}

// 詳細表示
function viewDetail(id) {
  alert(`詳細表示: ID ${id}\n\n※ 実装予定の機能です`);
}

// 削除確認
function deleteItem(id) {
  if (confirm('この生成を削除しますか？')) {
    alert(`削除しました: ID ${id}\n\n※ 実装予定の機能です`);
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
      alert(`${text}\n\n※ 実装予定の機能です`);
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
