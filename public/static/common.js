// 共通JavaScript

// 管理者かどうかをチェックして、ナビゲーションに管理者リンク・ログアウトボタンを表示
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 認証トークンを取得
    const token = getCookie('auth_token');
    if (!token) {
      return;
    }

    // ユーザー情報を取得して管理者かチェック
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    
    // 管理者メールアドレスのリスト
    const adminEmails = ['admin@ramat.app', 'test@ramat.app'];
    
    // 管理者の場合、ナビゲーションに管理者リンクを追加
    if (data.user && adminEmails.includes(data.user.email)) {
      addAdminNavItem();
    }
    
    // 全ユーザーにログアウトボタンを追加
    addLogoutButton();
  } catch (error) {
    console.error('Failed to check admin status:', error);
  }
});

// ナビゲーションに管理者リンクを追加
function addAdminNavItem() {
  const navs = document.querySelectorAll('.bottom-nav');
  
  navs.forEach(nav => {
    // 既に管理者リンクがある場合はスキップ
    if (nav.querySelector('.nav-item[href="/admin"]')) {
      return;
    }

    // 管理者リンクを作成
    const adminLink = document.createElement('a');
    adminLink.href = '/admin';
    adminLink.className = 'nav-item';
    if (window.location.pathname === '/admin') {
      adminLink.classList.add('active');
    }
    
    adminLink.innerHTML = `
      <span class="nav-icon">✱</span>
      <span class="nav-label">管理者</span>
    `;
    
    // ナビゲーションの最後に追加
    nav.appendChild(adminLink);
  });
}

// ナビゲーションにログアウトボタンを追加
function addLogoutButton() {
  const navs = document.querySelectorAll('.bottom-nav');
  
  navs.forEach(nav => {
    // 既にログアウトボタンがある場合はスキップ
    if (nav.querySelector('#logoutBtn')) {
      return;
    }

    // ログアウトボタンを作成
    const logoutBtn = document.createElement('a');
    logoutBtn.href = '#';
    logoutBtn.id = 'logoutBtn';
    logoutBtn.className = 'nav-item logout-btn';
    
    logoutBtn.innerHTML = `
      <span class="nav-icon">🚪</span>
      <span class="nav-label">ログアウト</span>
    `;
    
    // ログアウト処理を追加
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (confirm('ログアウトしますか？')) {
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
          });
          
          if (response.ok) {
            // ログアウト成功、ログインページへリダイレクト
            window.location.href = '/login';
          } else {
            alert('ログアウトに失敗しました');
          }
        } catch (error) {
          console.error('Logout error:', error);
          alert('ログアウトに失敗しました');
        }
      }
    });
    
    // ナビゲーションの最後に追加
    nav.appendChild(logoutBtn);
  });
}

// Cookieを取得するヘルパー関数
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
