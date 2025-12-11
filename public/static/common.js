// 共通JavaScript

// 管理者かどうかをチェックして、ナビゲーションに管理者リンクを表示
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

// Cookieを取得するヘルパー関数
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
