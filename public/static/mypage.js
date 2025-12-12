// マイページのJavaScript

// ユーザーIDを取得する関数（chat.jsと共通）
function getUserId() {
  let userId = localStorage.getItem('ramat_user_id');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('ramat_user_id', userId);
  }
  return userId;
}

// ソウルメイト情報を読み込む（API + LocalStorage併用）
async function loadSoulmateProfile() {
  try {
    const userId = getUserId();
    
    // まずLocalStorageから読み込み（即座に表示）
    const savedProfile = localStorage.getItem('soulmateProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      updateProfileUI(profile);
    }
    
    // APIから最新情報を取得
    try {
      const response = await fetch(`/api/mypage/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile) {
          updateProfileUI(data.profile);
          // LocalStorageも更新
          localStorage.setItem('soulmateProfile', JSON.stringify(data.profile));
        }
      } else if (response.status === 404) {
        // ソウルメイトが見つからない
        showNoProfileMessage();
      }
    } catch (apiError) {
      console.log('API呼び出し失敗、LocalStorageのデータを使用:', apiError);
      if (!savedProfile) {
        showNoProfileMessage();
      }
    }
    
  } catch (error) {
    console.error('❌ ソウルメイト情報の読み込みに失敗:', error);
    showNoProfileMessage();
  }
}

// プロフィールUIを更新する関数
function updateProfileUI(profile) {
  // 画像
  const profileImage = document.getElementById('profileImage');
  if (profileImage && profile.image) {
    profileImage.src = profile.image;
  }
  
  // 名前
  const profileName = document.getElementById('profileName');
  if (profileName && profile.name) {
    profileName.textContent = profile.name;
  }
  
  // コンセプト
  const profileConcept = document.getElementById('profileConcept');
  if (profileConcept && profile.concept) {
    profileConcept.textContent = profile.concept;
  }
  
  // 動物種類
  const profileAnimal = document.getElementById('profileAnimal');
  if (profileAnimal && profile.animal) {
    profileAnimal.textContent = profile.animal;
  }
  
  // 生成日
  const profileDate = document.getElementById('profileDate');
  if (profileDate && profile.createdAt) {
    const date = new Date(profile.createdAt);
    profileDate.textContent = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  }
  
  console.log('✅ ソウルメイト情報を読み込みました');
}

// 統計情報を読み込む（API + LocalStorage併用）
async function loadStatistics() {
  try {
    const userId = getUserId();
    
    // まずLocalStorageから読み込み（即座に表示）
    const chatHistory = localStorage.getItem('chatHistory');
    let localMessageCount = 0;
    if (chatHistory) {
      const history = JSON.parse(chatHistory);
      localMessageCount = Array.isArray(history) ? history.length : 0;
    }
    
    // UIに反映
    updateStatsUI({
      totalMessages: localMessageCount,
      totalConversations: 0,
      favoriteCount: 0,
      daysSince: 1
    });
    
    // APIから最新統計を取得
    try {
      const response = await fetch(`/api/mypage/stats/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          updateStatsUI(data.stats);
        }
      }
    } catch (apiError) {
      console.log('統計API呼び出し失敗、LocalStorageのデータを使用:', apiError);
    }
    
  } catch (error) {
    console.error('統計情報の読み込みに失敗:', error);
  }
}

// 統計UIを更新する関数
function updateStatsUI(stats) {
  // 出会った日数
  const daysCount = document.getElementById('daysCount');
  const daysSince = stats.daysSince || 1;
  
  if (daysCount) {
    daysCount.textContent = daysSince;
  }
  
  console.log(`📊 統計: ${stats.totalMessages || 0}件の会話, ${daysSince}日`);
}

// プロフィールがない場合のメッセージ表示
function showNoProfileMessage() {
  const profileCard = document.querySelector('.soulmate-profile-card');
  if (profileCard) {
    profileCard.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 20px;">🦊</div>
        <h3 style="font-size: 1.5rem; margin-bottom: 10px; color: var(--text-primary);">
          まだソウルメイトがいません
        </h3>
        <p style="color: var(--text-secondary); margin-bottom: 30px;">
          生成ページであなただけの守護動物を呼びましょう
        </p>
        <a href="/generate" style="
          display: inline-block;
          padding: 15px 30px;
          background: linear-gradient(135deg, var(--sakura-accent), var(--sakura-deep));
          color: white;
          text-decoration: none;
          border-radius: 25px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(255, 107, 157, 0.3);
        ">
          ✨ ソウルメイトを生成する
        </a>
      </div>
    `;
  }
}

// 設定ボタンのイベントハンドラー
function setupSettingsHandlers() {
  // 通知設定
  const notificationSettings = document.getElementById('notificationSettings');
  if (notificationSettings) {
    notificationSettings.addEventListener('click', () => {
      alert('🔔 通知設定\n\n※ この機能は今後実装予定です');
    });
  }
  
  // テーマ変更
  const themeSettings = document.getElementById('themeSettings');
  if (themeSettings) {
    themeSettings.addEventListener('click', () => {
      alert('🎨 テーマ変更\n\n※ この機能は今後実装予定です');
    });
  }
  
  // データエクスポート
  const exportData = document.getElementById('exportData');
  if (exportData) {
    exportData.addEventListener('click', async () => {
      await exportUserData();
    });
  }
  
  // データ削除
  const deleteData = document.getElementById('deleteData');
  if (deleteData) {
    deleteData.addEventListener('click', () => {
      confirmDeleteData();
    });
  }
}

// データエクスポート機能（API統合版）
async function exportUserData() {
  try {
    const userId = getUserId();
    
    // LocalStorageデータを取得
    const soulmateProfile = localStorage.getItem('soulmateProfile');
    const chatHistory = localStorage.getItem('chatHistory');
    
    // APIから最新データを取得
    let apiProfile = null;
    let apiHistory = [];
    let apiStats = null;
    
    try {
      // プロフィール取得
      const profileResponse = await fetch(`/api/mypage/profile/${userId}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        apiProfile = profileData.profile;
      }
      
      // 履歴取得
      const historyResponse = await fetch(`/api/mypage/history/${userId}?limit=1000`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        apiHistory = historyData.history;
      }
      
      // 統計取得
      const statsResponse = await fetch(`/api/mypage/stats/${userId}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        apiStats = statsData.stats;
      }
    } catch (apiError) {
      console.log('API呼び出しエラー（一部データのみエクスポート）:', apiError);
    }
    
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: userId,
      soulmateProfile: apiProfile || (soulmateProfile ? JSON.parse(soulmateProfile) : null),
      chatHistory: apiHistory.length > 0 ? apiHistory : (chatHistory ? JSON.parse(chatHistory) : []),
      statistics: apiStats,
      version: '2.0',
      source: 'Ramat Web App'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ramat-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('💾 データをエクスポートしました\n\nダウンロードフォルダを確認してください。');
  } catch (error) {
    console.error('データエクスポートに失敗:', error);
    alert('❌ データのエクスポートに失敗しました');
  }
}

// データ削除確認
function confirmDeleteData() {
  const confirmed = confirm(
    '⚠️ データ削除の確認\n\n' +
    'すべてのデータ（ソウルメイト情報、会話履歴）が削除されます。\n' +
    'この操作は取り消せません。\n\n' +
    '本当に削除しますか？'
  );
  
  if (confirmed) {
    const doubleConfirmed = confirm(
      '最終確認\n\n' +
      '本当にすべてのデータを削除してよろしいですか？'
    );
    
    if (doubleConfirmed) {
      deleteAllData();
    }
  }
}

// すべてのデータを削除
function deleteAllData() {
  try {
    // LocalStorageをクリア
    localStorage.removeItem('soulmateProfile');
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('ramat_user_id'); // ユーザーIDもクリア
    
    // TODO: 将来的にはAPIでサーバー側のデータも削除
    // DELETE /api/mypage/user/:userId
    
    alert('🗑️ すべてのデータを削除しました\n\nページをリロードします。');
    window.location.reload();
  } catch (error) {
    console.error('データ削除に失敗:', error);
    alert('❌ データの削除に失敗しました');
  }
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
  loadSoulmateProfile();
  loadStatistics();
  setupSettingsHandlers();
  
  console.log('👤 マイページが読み込まれました');
});
