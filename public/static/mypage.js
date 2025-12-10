// マイページのJavaScript

// LocalStorageからソウルメイト情報を読み込む
function loadSoulmateProfile() {
  try {
    const savedProfile = localStorage.getItem('soulmateProfile');
    
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      
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
        profileAnimal.textContent = profile.animal.ja || profile.animal;
      }
      
      // 生成日
      const profileDate = document.getElementById('profileDate');
      if (profileDate) {
        const createdDate = profile.createdAt || new Date().toISOString();
        const date = new Date(createdDate);
        profileDate.textContent = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
        
        // 出会った日数を計算
        calculateDaysSince(createdDate);
      }
      
      console.log('✅ ソウルメイト情報を読み込みました');
    } else {
      console.log('⚠️ ソウルメイト情報が見つかりません');
      showNoProfileMessage();
    }
  } catch (error) {
    console.error('❌ ソウルメイト情報の読み込みに失敗:', error);
    showNoProfileMessage();
  }
}

// 出会った日数を計算
function calculateDaysSince(createdDate) {
  const daysCount = document.getElementById('daysCount');
  const statDays = document.getElementById('statDays');
  
  if (!createdDate) {
    if (daysCount) daysCount.textContent = '1';
    if (statDays) statDays.textContent = '1';
    return;
  }
  
  const created = new Date(createdDate);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (daysCount) {
    daysCount.textContent = diffDays;
  }
  
  if (statDays) {
    statDays.textContent = diffDays;
  }
}

// 統計情報を読み込む
function loadStatistics() {
  try {
    // 会話数（LocalStorageから取得）
    const chatHistory = localStorage.getItem('chatHistory');
    let messageCount = 0;
    
    if (chatHistory) {
      const history = JSON.parse(chatHistory);
      messageCount = Array.isArray(history) ? history.length : 0;
    }
    
    const statMessages = document.getElementById('statMessages');
    if (statMessages) {
      statMessages.textContent = messageCount;
    }
    
    // お気に入り数（将来実装）
    const statFavorites = document.getElementById('statFavorites');
    if (statFavorites) {
      statFavorites.textContent = '0';
    }
    
    console.log(`📊 統計: ${messageCount}件の会話`);
  } catch (error) {
    console.error('統計情報の読み込みに失敗:', error);
  }
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
    exportData.addEventListener('click', () => {
      exportUserData();
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

// データエクスポート機能
function exportUserData() {
  try {
    const soulmateProfile = localStorage.getItem('soulmateProfile');
    const chatHistory = localStorage.getItem('chatHistory');
    
    const exportData = {
      exportDate: new Date().toISOString(),
      soulmateProfile: soulmateProfile ? JSON.parse(soulmateProfile) : null,
      chatHistory: chatHistory ? JSON.parse(chatHistory) : [],
      version: '1.0'
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
    localStorage.removeItem('soulmateProfile');
    localStorage.removeItem('chatHistory');
    
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
