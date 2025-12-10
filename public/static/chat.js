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

// メッセージ送信処理
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
  
  // 1〜2秒待機（AI応答のシミュレーション）
  const delay = 1000 + Math.random() * 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // タイピングインジケーターを削除
  hideTypingIndicator();
  
  // ソウルメイトの返信を追加
  const reply = generateSoulmateReply(message);
  addMessage(reply, false);
  
  // 送信ボタンを再度有効化
  chatSendBtn.disabled = false;
  
  // 入力フィールドにフォーカス
  chatInput.focus();
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

// localStorage からソウルメイトの情報を読み込む（将来の実装用）
function loadSoulmateInfo() {
  try {
    const savedProfile = localStorage.getItem('soulmateProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      
      // ヘッダー情報を更新
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
  } catch (error) {
    console.log('ソウルメイト情報の読み込みに失敗しました:', error);
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

// スクロール時のヘッダー縮小機能
const chatHeader = document.getElementById('chatHeader');
const scrollThreshold = 50; // スクロール閾値（px）

function handleScroll() {
  const scrollPosition = window.scrollY || window.pageYOffset;
  
  if (scrollPosition > scrollThreshold) {
    // 50px以上スクロールしたら縮小
    chatHeader.classList.add('scrolled');
  } else {
    // 50px以下なら元に戻す
    chatHeader.classList.remove('scrolled');
  }
}

// スクロールイベントリスナー（パフォーマンス最適化版）
let scrollTimeout;
window.addEventListener('scroll', () => {
  if (!scrollTimeout) {
    scrollTimeout = setTimeout(() => {
      handleScroll();
      scrollTimeout = null;
    }, 10); // 10msごとに実行
  }
});

// 初期状態チェック
handleScroll();

console.log('💬 チャットページが読み込まれました');
