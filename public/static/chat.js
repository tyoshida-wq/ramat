// チャットページのJavaScript

// DOM要素の取得
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');

// 生成モーダル関連のDOM要素
const generationModal = document.getElementById('generationModal');
const startGenerationBtn = document.getElementById('startGenerationBtn');
const startChatBtn = document.getElementById('startChatBtn');
const stepWelcome = document.getElementById('stepWelcome');
const stepGenerating = document.getElementById('stepGenerating');
const stepComplete = document.getElementById('stepComplete');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultImage = document.getElementById('resultImage');
const resultGreeting = document.getElementById('resultGreeting');
const resultName = document.getElementById('resultName');
const resultConcept = document.getElementById('resultConcept');
const resultPersonality = document.getElementById('resultPersonality');

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

// ユーザーIDを取得する関数（JWT認証から取得）
async function getUserId() {
  // まずLocalStorageをチェック（キャッシュ）
  let userId = localStorage.getItem('ramat_user_id');
  
  // APIから現在の認証ユーザーIDを取得
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user && data.user.id) {
        userId = data.user.id;
        // LocalStorageを更新
        localStorage.setItem('ramat_user_id', userId);
        return userId;
      }
    }
  } catch (error) {
    console.error('Failed to get user ID from API:', error);
  }
  
  // フォールバック: LocalStorageの値を使用
  if (userId) {
    return userId;
  }
  
  // 最終フォールバック: 一時IDを生成（通常は発生しない）
  userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  localStorage.setItem('ramat_user_id', userId);
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
    const userId = await getUserId();
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

// ==============================================
// 🌸 生成モーダル機能
// ==============================================

// ソウルメイトが存在するかチェックする関数
async function checkSoulmateExists() {
  try {
    const userId = await getUserId();
    
    // IMPORTANT: LocalStorageは他ユーザーのデータが残っている可能性があるため、APIを優先
    // APIで確認
    const response = await fetch(`/api/mypage/profile/${userId}`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.profile && data.profile.id) {
        console.log('✅ APIでソウルメイトが存在します');
        // LocalStorageも更新
        localStorage.setItem('soulmateProfile', JSON.stringify(data.profile));
        return true;
      }
    }
    
    console.log('❌ ソウルメイトが存在しません');
    return false;
    
  } catch (error) {
    console.log('ソウルメイト存在確認エラー:', error);
    // エラー時はLocalStorageのみで判定
    const savedProfile = localStorage.getItem('soulmateProfile');
    return savedProfile ? true : false;
  }
}

// 生成モーダルを表示する関数
function showGenerationModal() {
  if (generationModal) {
    generationModal.style.display = 'flex';
    stepWelcome.style.display = 'block';
    stepGenerating.style.display = 'none';
    stepComplete.style.display = 'none';
    document.body.style.overflow = 'hidden'; // スクロール無効化
    console.log('🌸 生成モーダルを表示しました');
  }
}

// 生成モーダルを非表示にする関数
function hideGenerationModal() {
  if (generationModal) {
    generationModal.style.display = 'none';
    document.body.style.overflow = ''; // スクロール復元
    console.log('🌸 生成モーダルを非表示にしました');
  }
}

// 生成開始ボタンのイベントリスナー
if (startGenerationBtn) {
  startGenerationBtn.addEventListener('click', startGeneration);
}

// チャット開始ボタンのイベントリスナー
if (startChatBtn) {
  startChatBtn.addEventListener('click', () => {
    hideGenerationModal();
    // ウェルカムメッセージを表示
    showWelcomeMessage();
  });
}

// 生成処理を開始する関数
async function startGeneration() {
  try {
    // ステップ2: 生成中画面に切り替え
    stepWelcome.style.display = 'none';
    stepGenerating.style.display = 'block';
    
    // プログレスバーのアニメーション開始
    let progress = 0;
    const progressMessages = [
      '出会いを探しています...',
      'あなたにぴったりの姿を選んでいます...',
      '心に寄り添う存在を呼んでいます...',
      'もうすぐ出会えます...'
    ];
    
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        
        progressFill.style.width = progress + '%';
        
        // メッセージを更新
        const messageIndex = Math.floor(progress / 25);
        if (progressMessages[messageIndex]) {
          progressText.textContent = progressMessages[messageIndex];
        }
      }
    }, 800);
    
    // API呼び出し: ソウルメイト生成
    const userId = await getUserId();
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      throw new Error('生成APIリクエスト失敗');
    }
    
    const data = await response.json();
    
    // プログレスバーを完了
    clearInterval(progressInterval);
    progress = 100;
    progressFill.style.width = '100%';
    progressText.textContent = '出会いました！✨';
    
    // 少し待ってから完了画面へ
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // ステップ3: 完了画面に切り替え
    stepGenerating.style.display = 'none';
    stepComplete.style.display = 'block';
    
    // 結果を表示
    if (data.image_base64) {
      resultImage.src = `data:image/png;base64,${data.image_base64}`;
    } else if (data.image) {
      resultImage.src = data.image;
    }
    
    resultName.textContent = data.name || 'ソウルメイト';
    resultConcept.textContent = data.concept || '';
    resultGreeting.textContent = data.greeting || 'こんにちは！あなたに会えて嬉しいです✨';
    
    // 性格情報を表示
    if (data.personality) {
      resultPersonality.textContent = `性格: ${data.personality}`;
    } else if (data.tone) {
      resultPersonality.textContent = `口調: ${data.tone}`;
    }
    
    // プロフィールをLocalStorageに保存
    const profileData = {
      id: data.id || Date.now(),
      name: data.name,
      concept: data.concept,
      personality: data.personality,
      tone: data.tone,
      greeting: data.greeting,
      image: data.image_base64 ? `data:image/png;base64,${data.image_base64}` : data.image
    };
    localStorage.setItem('soulmateProfile', JSON.stringify(profileData));
    
    // ヘッダー情報も更新
    updateSoulmateUI(profileData);
    
    console.log('✅ ソウルメイト生成完了:', profileData);
    
  } catch (error) {
    console.error('生成エラー:', error);
    alert('ソウルメイトの生成に失敗しました。もう一度お試しください。');
    
    // エラー時は最初の画面に戻る
    stepGenerating.style.display = 'none';
    stepWelcome.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '準備中...';
  }
}

// ウェルカムメッセージを表示する関数
function showWelcomeMessage() {
  try {
    const savedProfile = localStorage.getItem('soulmateProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      const name = profile.name || 'ソウルメイト';
      const greeting = profile.greeting || 'こんにちは！あなたに会えて嬉しいです✨';
      
      // 挨拶メッセージを追加
      addMessage(greeting, false);
    }
  } catch (error) {
    console.log('ウェルカムメッセージ表示エラー:', error);
  }
}

// 初回アクセス時のチェック
async function initializeChatPage() {
  const exists = await checkSoulmateExists();
  
  if (!exists) {
    console.log('🌸 初回アクセス: 生成モーダルを表示します');
    showGenerationModal();
  } else {
    console.log('✅ ソウルメイト存在確認済み: 通常チャット画面を表示します');
    // 既存のウェルカムメッセージをカスタマイズ
    customizeWelcomeMessage();
  }
}

// ページ読み込み時に初期化
initializeChatPage();

// ==============================================
// 🌸 既存機能
// ==============================================

// ソウルメイトの情報を読み込む（API + LocalStorage併用）
async function loadSoulmateInfo() {
  try {
    const userId = await getUserId();
    
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
