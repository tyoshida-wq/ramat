// チャットページのJavaScript

// DOM要素の取得
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');

// 現在時刻を取得する関数
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// メッセージを追加する関数
function addMessage(content, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = isUser ? 'message-user' : 'message-soulmate';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  // テキストをpタグで分割（改行対応）
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    const p = document.createElement('p');
    p.textContent = line;
    contentDiv.appendChild(p);
  });
  
  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  timeDiv.textContent = getCurrentTime();
  
  messageDiv.appendChild(contentDiv);
  messageDiv.appendChild(timeDiv);
  chatMessages.appendChild(messageDiv);
  
  // 最新メッセージまでスクロール
  scrollToBottom();
}

// タイピングインジケーターを表示する関数
function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'typing-indicator';
  typingDiv.id = 'typingIndicator';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'typing-dot';
    contentDiv.appendChild(dot);
  }
  
  typingDiv.appendChild(contentDiv);
  chatMessages.appendChild(typingDiv);
  scrollToBottom();
}

// タイピングインジケーターを削除する関数
function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// 最新メッセージまでスクロールする関数
function scrollToBottom() {
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 100);
}

// ソウルメイトの返信を生成する関数（モック）
function generateSoulmateReply(userMessage) {
  // 簡易的な返信ロジック（後でGemini APIに置き換え）
  const replies = [
    'そうなんだね✨\nあなたの気持ち、よくわかるよ。',
    '大丈夫だよ🌸\nいつもあなたの味方だからね。',
    'それは素敵だね！\n話してくれてありがとう💕',
    'そっか...\nゆっくり休んでね🦊',
    'わかるよ、その気持ち。\n一緒に乗り越えていこうね✨'
  ];
  
  // キーワードに基づく簡易マッチング
  if (userMessage.includes('疲れ') || userMessage.includes('つかれ')) {
    return '無理しないでね🌸\nゆっくり休んで、明日また頑張ろう！';
  } else if (userMessage.includes('悲し') || userMessage.includes('かなし')) {
    return '悲しいときは、泣いてもいいんだよ。\n私がそばにいるからね💕';
  } else if (userMessage.includes('嬉し') || userMessage.includes('うれし')) {
    return 'わぁ！それは良かったね！✨\n嬉しいことがあると、私も嬉しいよ🦊';
  } else if (userMessage.includes('ありがと')) {
    return 'どういたしまして🌸\nいつでも話しかけてね！';
  } else if (userMessage.includes('こんにちは') || userMessage.includes('こんばんは')) {
    return 'こんにちは！✨\n今日はどんな一日だった？';
  }
  
  // ランダムに返信を選択
  return replies[Math.floor(Math.random() * replies.length)];
}

// ユーザーIDを生成または取得する関数
function getUserId() {
  let userId = localStorage.getItem('ramat_user_id');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('ramat_user_id', userId);
  }
  return userId;
}

// メッセージ送信処理（実API接続版）
async function sendMessage() {
  const message = chatInput.value.trim();
  
  if (!message) {
    return;
  }
  
  // 入力フィールドをクリア
  chatInput.value = '';
  
  // 送信ボタンを無効化
  chatSendBtn.disabled = true;
  
  // ユーザーのメッセージを追加
  addMessage(message, true);
  
  // タイピングインジケーターを表示
  showTypingIndicator();
  
  try {
    // 実APIにリクエスト送信
    const userId = getUserId();
    const response = await fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        message: message
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    
    // タイピングインジケーターを削除
    hideTypingIndicator();
    
    // ソウルメイトの返信を追加
    if (data.success && data.reply) {
      addMessage(data.reply, false);
      
      // チャット履歴をLocalStorageに保存（バックアップ用）
      saveMessageToLocalStorage(message, data.reply);
    } else {
      throw new Error('Invalid response');
    }
    
  } catch (error) {
    console.error('チャット送信エラー:', error);
    
    // タイピングインジケーターを削除
    hideTypingIndicator();
    
    // エラー時はモック返信にフォールバック
    const reply = generateSoulmateReply(message);
    addMessage(reply, false);
    
    // エラーメッセージを表示
    addMessage('⚠️ 通信エラーが発生しました。オフラインモードで動作しています。', false);
  } finally {
    // 送信ボタンを再度有効化
    chatSendBtn.disabled = false;
    
    // 入力フィールドにフォーカス
    chatInput.focus();
  }
}

// チャット履歴をLocalStorageに保存する関数
function saveMessageToLocalStorage(userMessage, soulmateReply) {
  try {
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    history.push({
      user: userMessage,
      soulmate: soulmateReply,
      timestamp: new Date().toISOString()
    });
    // 最新100件のみ保持
    if (history.length > 100) {
      history.shift();
    }
    localStorage.setItem('chatHistory', JSON.stringify(history));
  } catch (error) {
    console.error('履歴保存エラー:', error);
  }
}

// イベントリスナーの設定
chatSendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// 初期化時に最新メッセージまでスクロール
scrollToBottom();

// ソウルメイトの情報を読み込む（API + LocalStorage併用）
async function loadSoulmateInfo() {
  try {
    const userId = getUserId();
    
    // まずLocalStorageから読み込み（即座に表示）
    const savedProfile = localStorage.getItem('soulmateProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      updateSoulmateUI(profile);
    }
    
    // APIから最新情報を取得
    try {
      const response = await fetch(`/api/mypage/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile) {
          // UIを更新
          updateSoulmateUI(data.profile);
          // LocalStorageも更新
          localStorage.setItem('soulmateProfile', JSON.stringify(data.profile));
        }
      }
    } catch (apiError) {
      console.log('API呼び出し失敗、LocalStorageのデータを使用:', apiError);
    }
    
  } catch (error) {
    console.log('ソウルメイト情報の読み込みに失敗しました:', error);
  }
}

// ソウルメイトのUIを更新する関数
function updateSoulmateUI(profile) {
  const nameElement = document.getElementById('soulmateName');
  const conceptElement = document.getElementById('soulmateConcept');
  const avatarElement = document.getElementById('soulmateAvatar');
  
  if (nameElement && profile.name) {
    nameElement.textContent = profile.name;
  }
  
  if (conceptElement && profile.concept) {
    conceptElement.textContent = profile.concept;
  }
  
  if (avatarElement && profile.image) {
    avatarElement.src = profile.image;
  }
}

// ページ読み込み時にソウルメイト情報を読み込む
loadSoulmateInfo();

// ウェルカムメッセージのカスタマイズ（ソウルメイトの性格に基づく、将来の実装用）
function customizeWelcomeMessage() {
  try {
    const savedProfile = localStorage.getItem('soulmateProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      const name = profile.name || 'ユキヒメ';
      
      // 既存のウェルカムメッセージを更新
      const firstMessage = chatMessages.querySelector('.message-soulmate .message-content');
      if (firstMessage && profile.tone) {
        // 性格に基づいたメッセージ（将来的にGemini APIで生成）
        firstMessage.innerHTML = `
          <p>こんにちは！✨</p>
          <p>私はあなたの守護動物、${name}だよ。</p>
          <p>何でも話してね🌸</p>
        `;
      }
    }
  } catch (error) {
    console.log('ウェルカムメッセージのカスタマイズに失敗しました:', error);
  }
}

// カスタマイズを実行
customizeWelcomeMessage();

// スクロール時のヘッダー縮小機能（修正版）
// メッセージエリアが一定量溜まったら縮小
const chatHeader = document.getElementById('chatHeader');
let isHeaderScrolled = false; // 状態管理フラグ

// メッセージ数が一定数を超えたらヘッダーを縮小
function checkHeaderState() {
  const messages = chatMessages.querySelectorAll('.message-user, .message-soulmate');
  
  // メッセージが3件以上あれば縮小（状態が変わるときのみ実行）
  if (messages.length >= 3 && !isHeaderScrolled) {
    chatHeader.classList.add('scrolled');
    isHeaderScrolled = true;
  } else if (messages.length < 3 && isHeaderScrolled) {
    chatHeader.classList.remove('scrolled');
    isHeaderScrolled = false;
  }
}

// MutationObserverでメッセージの追加を監視（デバウンス付き）
let headerCheckTimeout;
const messageObserver = new MutationObserver(() => {
  // 短時間の連続実行を防ぐ
  clearTimeout(headerCheckTimeout);
  headerCheckTimeout = setTimeout(() => {
    checkHeaderState();
  }, 100);
});

// メッセージエリアの子要素の変更を監視
if (chatMessages) {
  messageObserver.observe(chatMessages, {
    childList: true,
    subtree: false
  });
}

// 初期状態チェック
checkHeaderState();

console.log('💬 チャットページが読み込まれました');
