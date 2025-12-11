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
  
  // ユーザー管理の読み込み
  loadUsers();
  
  // 自動更新（30秒ごと）
  setInterval(() => {
    loadStats();
    loadHistory();
    loadUsers();
  }, 30000);
});

// ユーザー一覧の読み込み
async function loadUsers() {
  try {
    const response = await fetch('/api/admin/users', {
      credentials: 'include'
    });
    
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (!response.ok) {
      const error = await response.json();
      tbody.innerHTML = `<div class="error">エラー: ${error.error || '読み込みに失敗'}</div>`;
      return;
    }
    
    const data = await response.json();
    
    if (!data.success || !data.users || data.users.length === 0) {
      tbody.innerHTML = '<div class="no-data">ユーザーがまだいません</div>';
      return;
    }
    
    tbody.innerHTML = data.users.map(user => `
      <div class="table-row">
        <div class="col-user-id" title="${escapeHtml(user.userId)}">${escapeHtml(user.userId.substring(0, 8))}...</div>
        <div class="col-soulmate">
          ${getAnimalEmoji(user.soulmateAnimal)} ${escapeHtml(user.soulmateName)}
        </div>
        <div class="col-messages">${user.totalMessages.toLocaleString()}件</div>
        <div class="col-last-active">${getRelativeTime(user.lastActiveAt)}</div>
        <div class="col-actions">
          <button class="icon-btn view" onclick="viewUserMemory('${escapeHtml(user.userId)}', '${escapeHtml(user.soulmateName)}')" title="メモリー情報">🧠</button>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Failed to load users:', error);
    const tbody = document.getElementById('usersTableBody');
    if (tbody) {
      tbody.innerHTML = '<div class="error">ユーザーの読み込みに失敗しました</div>';
    }
  }
}

// ユーザーのメモリー情報を表示
async function viewUserMemory(userId, soulmateName) {
  try {
    const response = await fetch(`/api/admin/users/${userId}/memory`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (!data.success) {
      alert('メモリー情報の取得に失敗しました');
      return;
    }
    
    const memory = data.memory;
    
    // モーダルの内容を構築
    let content = `
      <div class="memory-modal">
        <h2>🧠 ${escapeHtml(soulmateName)} のメモリー情報</h2>
        <p class="user-id">ユーザーID: ${escapeHtml(userId.substring(0, 16))}...</p>
        
        <div class="memory-section">
          <h3>📊 統計</h3>
          <p>総メッセージ数: <strong>${memory.totalMessages.toLocaleString()}件</strong></p>
        </div>
        
        <div class="memory-section">
          <h3>👤 パーソナリティプロファイル</h3>
    `;
    
    if (memory.personality) {
      content += `
        <div class="personality-info">
          <p><strong>性格:</strong> ${escapeHtml(memory.personality.personalitySummary || '未学習')}</p>
          <p><strong>趣味・関心:</strong> ${escapeHtml(memory.personality.interests || '未学習')}</p>
          <p><strong>会話スタイル:</strong> ${escapeHtml(memory.personality.conversationStyle || '未学習')}</p>
          <p class="updated-at">最終更新: ${getRelativeTime(memory.personality.updatedAt)}</p>
        </div>
      `;
    } else {
      content += '<p class="no-data">まだパーソナリティは学習されていません（10メッセージ以上で自動学習）</p>';
    }
    
    content += '</div><div class="memory-section"><h3>📅 日次サマリー（過去30日）</h3>';
    
    if (memory.dailySummaries && memory.dailySummaries.length > 0) {
      content += '<div class="summaries-list">';
      memory.dailySummaries.forEach(summary => {
        content += `
          <div class="summary-item">
            <div class="summary-date">${summary.date}</div>
            <div class="summary-content">
              <p><strong>要約:</strong> ${escapeHtml(summary.summary)}</p>
              <p><strong>トピック:</strong> ${escapeHtml(summary.topics || '-')}</p>
              <p><strong>感情:</strong> ${escapeHtml(summary.emotion || '-')}</p>
              <p class="message-count">メッセージ数: ${summary.messageCount}件</p>
            </div>
          </div>
        `;
      });
      content += '</div>';
    } else {
      content += '<p class="no-data">まだ日次サマリーはありません（前日分を自動生成）</p>';
    }
    
    content += '</div></div>';
    
    // モーダルを表示
    showModal(content);
    
  } catch (error) {
    console.error('Failed to load user memory:', error);
    alert('メモリー情報の読み込みに失敗しました');
  }
}

// モーダル表示
function showModal(content) {
  // 既存のモーダルを削除
  const existingModal = document.querySelector('.modal-overlay');
  if (existingModal) {
    existingModal.remove();
  }
  
  // モーダルを作成
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      ${content}
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // 背景クリックで閉じる
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// 相対時間表示
function getRelativeTime(datetime) {
  if (!datetime) return '不明';
  
  const now = new Date();
  const past = new Date(datetime);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  
  return past.toLocaleDateString('ja-JP');
}

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
  
  // お問い合わせ管理の初期化
  loadContacts();
});

// お問い合わせ一覧の読み込み
async function loadContacts() {
  try {
    const response = await fetch('/api/admin/contacts', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }
    
    const data = await response.json();
    const contactsTableBody = document.getElementById('contactsTableBody');
    
    if (!contactsTableBody) return;
    
    if (!data.contacts || data.contacts.length === 0) {
      contactsTableBody.innerHTML = '<div class="no-data">お問い合わせはまだありません</div>';
      return;
    }
    
    contactsTableBody.innerHTML = data.contacts.map(contact => {
      const date = new Date(contact.created_at);
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
      
      const statusClass = {
        'pending': 'status-pending',
        'replied': 'status-replied',
        'closed': 'status-closed'
      }[contact.status] || 'status-pending';
      
      const statusText = {
        'pending': '未対応',
        'replied': '返信済み',
        'closed': '完了'
      }[contact.status] || '未対応';
      
      return `
        <div class="table-row">
          <div class="col-contact-id">#${contact.id}</div>
          <div class="col-contact-name">${escapeHtml(contact.name)}</div>
          <div class="col-contact-email">${escapeHtml(contact.email)}</div>
          <div class="col-contact-subject">${escapeHtml(contact.subject)}</div>
          <div class="col-contact-status">
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
          <div class="col-contact-date">${formattedDate}</div>
          <div class="col-actions">
            <button class="icon-btn view" onclick="viewContact(${contact.id})" title="詳細">👁️</button>
            <button class="icon-btn reply" onclick="replyContact(${contact.id})" title="返信">✉️</button>
            ${contact.status === 'pending' ? 
              `<button class="icon-btn check" onclick="markAsReplied(${contact.id})" title="返信済みにする">✓</button>` : 
              `<button class="icon-btn close" onclick="markAsClosed(${contact.id})" title="完了にする">✖</button>`
            }
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Failed to load contacts:', error);
    const contactsTableBody = document.getElementById('contactsTableBody');
    if (contactsTableBody) {
      contactsTableBody.innerHTML = '<div class="error">お問い合わせの読み込みに失敗しました</div>';
    }
  }
}

// お問い合わせ詳細表示
async function viewContact(contactId) {
  try {
    const response = await fetch(`/api/admin/contacts/${contactId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch contact');
    }
    
    const data = await response.json();
    const contact = data.contact;
    
    const date = new Date(contact.created_at);
    const formattedDate = date.toLocaleString('ja-JP');
    
    alert(`
【お問い合わせ詳細 #${contact.id}】

お名前: ${contact.name}
メールアドレス: ${contact.email}
件名: ${contact.subject}
受信日時: ${formattedDate}
ステータス: ${contact.status}

お問い合わせ内容:
${contact.message}

${contact.reply_message ? `返信内容:\n${contact.reply_message}` : ''}
    `.trim());
    
  } catch (error) {
    console.error('Failed to view contact:', error);
    alert('お問い合わせの詳細取得に失敗しました');
  }
}

// お問い合わせへの返信
function replyContact(contactId) {
  const email = prompt('返信先のメールアドレスに直接メールを送信してください。\n\nこの機能は今後実装予定です。');
  // TODO: メール返信機能の実装
}

// 返信済みにする
async function markAsReplied(contactId) {
  const replyMessage = prompt('返信内容を入力してください（記録用）:');
  
  if (!replyMessage) return;
  
  try {
    const response = await fetch(`/api/admin/contacts/${contactId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        status: 'replied',
        replyMessage: replyMessage
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update status');
    }
    
    alert('返信済みにしました');
    loadContacts(); // リロード
    
  } catch (error) {
    console.error('Failed to mark as replied:', error);
    alert('ステータスの更新に失敗しました');
  }
}

// 完了にする
async function markAsClosed(contactId) {
  if (!confirm('このお問い合わせを完了にしますか？')) return;
  
  try {
    const response = await fetch(`/api/admin/contacts/${contactId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        status: 'closed'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update status');
    }
    
    alert('完了にしました');
    loadContacts(); // リロード
    
  } catch (error) {
    console.error('Failed to mark as closed:', error);
    alert('ステータスの更新に失敗しました');
  }
}

// HTMLエスケープ関数
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
