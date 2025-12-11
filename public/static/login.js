// ログイン/新規登録ページのJavaScript

// DOM要素取得
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');

// タブ切り替え
loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
  clearErrors();
});

registerTab.addEventListener('click', () => {
  registerTab.classList.add('active');
  loginTab.classList.remove('active');
  registerForm.style.display = 'block';
  loginForm.style.display = 'none';
  clearErrors();
});

// エラー表示をクリア
function clearErrors() {
  loginError.textContent = '';
  loginError.classList.remove('show');
  registerError.textContent = '';
  registerError.classList.remove('show');
}

// エラー表示
function showError(element, message) {
  element.textContent = message;
  element.classList.add('show');
}

// ログインフォーム送信
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const submitBtn = document.getElementById('loginSubmitBtn');

  // バリデーション
  if (!email || !password) {
    showError(loginError, 'メールアドレスとパスワードを入力してください');
    return;
  }

  // ボタン無効化
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // ログイン成功
      console.log('ログイン成功:', data.user);
      
      // ユーザーIDをLocalStorageに保存（互換性維持）
      localStorage.setItem('ramat_user_id', data.user.id);
      
      // ホームページにリダイレクト
      window.location.href = '/';
    } else {
      // エラー表示
      showError(loginError, data.error || 'ログインに失敗しました');
    }
  } catch (error) {
    console.error('ログインエラー:', error);
    showError(loginError, '通信エラーが発生しました');
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
  }
});

// 新規登録フォーム送信
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const submitBtn = document.getElementById('registerSubmitBtn');

  // バリデーション
  if (!username || !email || !password) {
    showError(registerError, 'すべての項目を入力してください');
    return;
  }

  // メールアドレス形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError(registerError, '有効なメールアドレスを入力してください');
    return;
  }

  // パスワード強度チェック
  if (password.length < 8) {
    showError(registerError, 'パスワードは8文字以上である必要があります');
    return;
  }
  if (!/[A-Za-z]/.test(password)) {
    showError(registerError, 'パスワードには英字を含める必要があります');
    return;
  }
  if (!/[0-9]/.test(password)) {
    showError(registerError, 'パスワードには数字を含める必要があります');
    return;
  }

  // ユーザー名チェック
  if (username.length < 2) {
    showError(registerError, 'ユーザー名は2文字以上である必要があります');
    return;
  }
  if (username.length > 20) {
    showError(registerError, 'ユーザー名は20文字以内である必要があります');
    return;
  }

  // ボタン無効化
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // 登録成功
      console.log('登録成功:', data.user);
      
      // メール認証が必要な場合
      if (data.emailSent) {
        // 成功メッセージを表示
        registerError.style.background = '#d4edda';
        registerError.style.color = '#155724';
        registerError.style.border = '1px solid #c3e6cb';
        showError(registerError, data.message || '登録が完了しました。確認メールを送信しましたので、メールをご確認ください。');
        
        // フォームをクリア
        registerForm.reset();
        
        // 5秒後にログインタブに切り替え
        setTimeout(() => {
          loginTab.click();
        }, 5000);
      } else {
        // 従来の動作（メール認証なし）
        localStorage.setItem('ramat_user_id', data.user.id);
        window.location.href = '/';
      }
    } else {
      // エラー表示
      showError(registerError, data.error || '登録に失敗しました');
    }
  } catch (error) {
    console.error('登録エラー:', error);
    showError(registerError, '通信エラーが発生しました');
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
  }
});

// Enterキーでフォーム送信
document.getElementById('loginEmail').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('loginPassword').focus();
  }
});

document.getElementById('loginPassword').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loginForm.dispatchEvent(new Event('submit'));
  }
});

document.getElementById('registerUsername').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('registerEmail').focus();
  }
});

document.getElementById('registerEmail').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('registerPassword').focus();
  }
});

document.getElementById('registerPassword').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    registerForm.dispatchEvent(new Event('submit'));
  }
});

console.log('🔐 ログインページが読み込まれました');
