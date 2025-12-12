// チャット＆生成統合版JavaScript

// グローバル変数
let userId = null;
let soulmateData = null;
let chatHistory = [];

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Chat] Page loaded');
  
  // ユーザーIDを取得
  userId = localStorage.getItem('ramat_user_id');
  
  if (!userId) {
    console.warn('[Chat] No user ID found, redirecting to login');
    window.location.href = '/login';
    return;
  }

  console.log('[Chat] User ID:', userId);
  
  // ソウルメイト情報を取得
  await checkSoulmate();
  
  // チャット機能の初期化
  initChat();
});

// ソウルメイトの存在確認
async function checkSoulmate() {
  try {
    // ユーザー情報取得
    const meResponse = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    if (!meResponse.ok) {
      console.error('[Chat] Failed to get user info');
      window.location.href = '/login';
      return;
    }

    const meData = await meResponse.json();
    userId = meData.user.id;
    
    // プロフィール取得
    const profileResponse = await fetch(`/api/mypage/profile/${userId}`, {
      credentials: 'include'
    });
    
    if (!profileResponse.ok) {
      console.error('[Chat] Failed to get profile');
      return;
    }

    const profileData = await profileResponse.json();
    
    if (profileData.soulmate) {
      // ソウルメイトが存在する場合
      soulmateData = profileData.soulmate;
      console.log('[Chat] Soulmate found:', soulmateData);
      updateChatHeader(soulmateData);
      loadChatHistory();
    } else {
      // ソウルメイトが存在しない場合 → 生成モーダル表示
      console.log('[Chat] No soulmate found, showing generation modal');
      showGenerationModal();
    }
  } catch (error) {
    console.error('[Chat] Error checking soulmate:', error);
  }
}

// 生成モーダルを表示
function showGenerationModal() {
  const modal = document.getElementById('generationModal');
  modal.style.display = 'flex';
  
  // ボタンイベント設定
  document.getElementById('startGenerationBtn').addEventListener('click', startGeneration);
}

// 生成開始
async function startGeneration() {
  console.log('[Generation] Starting...');
  
  // ステップ切り替え
  document.getElementById('stepWelcome').style.display = 'none';
  document.getElementById('stepGenerating').style.display = 'block';
  
  // プログレスバー更新
  updateProgress(0, '準備中...');
  
  try {
    // 生成API呼び出し
    updateProgress(20, 'ソウルメイトを呼んでいます...');
    
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error('Generation failed');
    }

    updateProgress(50, '性格を作っています...');
    
    const data = await response.json();
    
    updateProgress(80, '姿を形にしています...');
    
    console.log('[Generation] Success:', data);
    soulmateData = data.profile;
    
    // 完了画面に遷移
    setTimeout(() => {
      showGenerationComplete(data);
    }, 1000);
    
  } catch (error) {
    console.error('[Generation] Error:', error);
    alert('ソウルメイトの呼び出しに失敗しました。もう一度お試しください。');
    
    // 初期画面に戻る
    document.getElementById('stepGenerating').style.display = 'none';
    document.getElementById('stepWelcome').style.display = 'block';
  }
}

// プログレスバー更新
function updateProgress(percent, text) {
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  progressFill.style.width = percent + '%';
  progressText.textContent = text;
}

// 生成完了画面を表示
function showGenerationComplete(data) {
  document.getElementById('stepGenerating').style.display = 'none';
  document.getElementById('stepComplete').style.display = 'block';
  
  // 結果表示
  document.getElementById('resultImage').src = data.profile.image;
  document.getElementById('resultGreeting').textContent = 'こんにちは！';
  document.getElementById('resultName').textContent = data.profile.name;
  document.getElementById('resultConcept').textContent = data.profile.concept;
  document.getElementById('resultPersonality').textContent = data.profile.personality;
  
  // チャット開始ボタン
  document.getElementById('startChatBtn').addEventListener('click', () => {
    closeGenerationModal();
    updateChatHeader(data.profile);
    
    // 初回メッセージを追加
    const greeting = `こんにちは！✨ 私は${data.profile.name}だよ。${data.profile.concept}として、いつもあなたのそばにいるね。何でも話してね🌸`;
    addMessage(greeting, 'soulmate');
  });
}

// モーダルを閉じる
function closeGenerationModal() {
  const modal = document.getElementById('generationModal');
  modal.style.display = 'none';
}

// チャットヘッダー更新
function updateChatHeader(soulmate) {
  document.getElementById('soulmateAvatar').src = soulmate.image || soulmate.image_base64;
  document.getElementById('soulmateName').textContent = soulmate.name;
  document.getElementById('soulmateConcept').textContent = soulmate.concept;
}

// チャット履歴読み込み
async function loadChatHistory() {
  try {
    const response = await fetch(`/api/chat/message?userId=${userId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.warn('[Chat] No chat history found');
      return;
    }

    const data = await response.json();
    chatHistory = data.messages || [];
    
    console.log('[Chat] Loaded history:', chatHistory.length, 'messages');
    
    // メッセージを表示
    chatHistory.forEach(msg => {
      addMessage(msg.content, msg.role, false);
    });
    
    scrollToBottom();
  } catch (error) {
    console.error('[Chat] Error loading history:', error);
  }
}

// チャット機能の初期化
function initChat() {
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  
  // 送信ボタン
  chatSendBtn.addEventListener('click', sendMessage);
  
  // Enterキーで送信
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// メッセージ送信
async function sendMessage() {
  const chatInput = document.getElementById('chatInput');
  const message = chatInput.value.trim();
  
  if (!message || !soulmateData) {
    return;
  }
  
  // ユーザーメッセージ表示
  addMessage(message, 'user');
  chatInput.value = '';
  
  // ローディング表示
  const loadingId = addMessage('...', 'soulmate', true);
  
  try {
    // APIに送信
    const response = await fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        userId: userId,
        message: message
      })
    });
    
    if (!response.ok) {
      throw new Error('Chat API failed');
    }
    
    const data = await response.json();
    
    // ローディング削除
    removeMessage(loadingId);
    
    // ソウルメイトの返信表示
    addMessage(data.reply, 'soulmate');
    
  } catch (error) {
    console.error('[Chat] Send error:', error);
    removeMessage(loadingId);
    addMessage('ごめんね、今うまく話せないみたい...もう一度話しかけてくれる？', 'soulmate');
  }
}

// メッセージ追加
function addMessage(content, role, isLoading = false) {
  const chatMessages = document.getElementById('chatMessages');
  const messageId = 'msg-' + Date.now();
  
  const messageDiv = document.createElement('div');
  messageDiv.id = messageId;
  messageDiv.className = role === 'user' ? 'message-user' : 'message-soulmate';
  
  if (isLoading) {
    messageDiv.classList.add('loading');
  }
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;
  
  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  const now = new Date();
  timeDiv.textContent = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
  
  messageDiv.appendChild(contentDiv);
  messageDiv.appendChild(timeDiv);
  
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
  
  return messageId;
}

// メッセージ削除
function removeMessage(messageId) {
  const message = document.getElementById(messageId);
  if (message) {
    message.remove();
  }
}

// スクロール
function scrollToBottom() {
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
