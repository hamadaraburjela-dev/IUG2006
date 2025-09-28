// assets/js/statusBar.js (Final Mobile-First Design)

const guideEmojis = {
    medicine: '⚕️', engineering: '🏗️', it: '💻', nursing: '🩺',
    health_sciences: '🧬', sciences: '🔬', arts: '📚', law: '⚖️',
    religion: '🕌', education: '👩‍🏫', economics: '💼'
};

function getPlayerRank(score) {
    if (score >= 81) return "خبير جامعي 🎓";
    if (score >= 51) return "باحث أكاديمي ✍️";
    if (score >= 21) return "طالب مجتهد ⭐";
    return "طالب مستجد 🌱";
}

if (document.getElementById('status-bar')) {
    console.warn("Status bar script was loaded a second time. Execution aborted to prevent conflicts.");
} else {
    const statusBarHTML = `
    <div id="status-bar" class="hidden">
        <div class="status-section player-info-section">
            <div id="player-info-display">
                <div id="player-avatar" class="status-bar-avatar">👤</div>
                <div class="player-details">
                    <span id="player-name-span"></span>
                    <span id="player-rank-span"></span>
                </div>
            </div>
            <div id="player-score-display">
                <i class="fas fa-coins icon"></i>
                <span>0 نقطة</span>
            </div>
        </div>
        <div class="status-section progress-section">
            <div class="progress-bar-container">
                <div id="game-progress-bar" class="progress-bar-fill"></div>
                <span id="progress-bar-text" class="progress-bar-label">التقدم نحو الشهادة</span>
            </div>
        </div>
        <div class="status-section controls-section">
            <button id="profile-btn" class="status-bar-btn" aria-label="الملف الشخصي" title="الملف الشخصي"><i class="fas fa-star icon"></i><span class="btn-text">الملف الشخصي</span></button>
            <button id="back-to-map-btn" class="status-bar-btn" aria-label="العودة إلى الخريطة" title="الخريطة"><i class="fas fa-map-marked-alt icon"></i><span class="btn-text">الخريطة</span></button>
            <button id="logout-btn" class="status-bar-btn" aria-label="الخروج وبدء رحلة جديدة" title="الخروج"><i class="fas fa-sign-out-alt icon"></i><span class="btn-text">خروج</span></button>
        </div>
    </div>`;

    let placeholder = document.getElementById('status-bar-placeholder');
    if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.id = 'status-bar-placeholder';
        document.body.prepend(placeholder);
    }
    placeholder.innerHTML = statusBarHTML;

    function updateStatusBarDisplay() {
        const savedState = localStorage.getItem('iugGameProgress');
        const statusBarDiv = document.getElementById('status-bar');

        if (savedState && statusBarDiv) {
            const gameState = JSON.parse(savedState);
            
            // --- تحديث الواجهة ---
            document.getElementById('player-avatar').textContent = guideEmojis[gameState.selectedGuide] || '👤';
            
            // *** التعديل المهم: عرض الاسم الأول فقط ***
            const firstName = (gameState.playerName || 'زائر').split(' ')[0];
            document.getElementById('player-name-span').textContent = firstName;

            document.getElementById('player-rank-span').textContent = getPlayerRank(gameState.score || 0);
            document.querySelector('#player-score-display span').textContent = `${gameState.score || 0} نقطة`;
            
            const progressBar = document.getElementById('game-progress-bar');
            const progressBarText = document.getElementById('progress-bar-text');
            const currentScore = gameState.score || 0;
            const targetScore = 50;
            const progressPercentage = Math.min((currentScore / targetScore) * 100, 100);
            progressBar.style.width = `${progressPercentage}%`;
            progressBarText.textContent = `التقدم: ${Math.floor(progressPercentage)}%`;
            
            statusBarDiv.classList.remove('hidden');
        }
    }

    window.updateStatusBar = updateStatusBarDisplay;

    document.addEventListener('DOMContentLoaded', () => {
        updateStatusBarDisplay();

        const mapButton = document.getElementById('back-to-map-btn');
        const logoutButton = document.getElementById('logout-btn');
        const profileButton = document.getElementById('profile-btn');

        if (mapButton) {
            mapButton.addEventListener('click', () => {
                if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
                    if (typeof renderScene === 'function') renderScene('map');
                } else {
                    localStorage.setItem('iugGameTargetScene', 'map');
                    window.location.href = 'index.html?nav=true';
                }
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                const logoutModal = document.getElementById('logout-confirm-modal');
                if (logoutModal) logoutModal.classList.remove('hidden');
            });
        }

        if (profileButton) {
            profileButton.addEventListener('click', () => {
                if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
                    if (typeof renderPlayerProfile === 'function') renderPlayerProfile();
                } else {
                    localStorage.setItem('iugGameTargetScene', 'player-profile');
                    window.location.href = 'index.html?nav=true';
                }
            });
        }
    });
}
