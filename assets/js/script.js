/* --- script.js (Final Updated Version with Badges Fix) --- */

// غيّر للرابط الخاص بك
// ضع رابط نشر Google Apps Script هنا 👇
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzvaONeSCCW-0z7Nxf0eHlaUs4tp_KdO0l8ERXoS64dYUs3DwM3ofkVxFMNHMPQMopUdA/exec';

// --- بداية منطق الشارات ---
const allBadges = {
    explorer: { id: 'explorer', name: 'المستكشف', icon: '🗺️', description: 'أكملت 3 تحديات مختلفة', earned: false },
    genius: { id: 'genius', name: 'العبقري', icon: '🧠', description: 'حققت 80% في أحد التحديات', earned: false },
    librarian: { id: 'librarian', name: 'المثقف', icon: '📚', description: 'أكملت تحدي المكتبة', earned: false },
    financier: { id: 'financier', name: 'الخبير المالي', icon: '💰', description: 'أكملت تحدي المنح', earned: false },
    medic: { id: 'medic', name: 'الطبيب الناشئ', icon: '⚕️', description: 'أكملت تحدي الكليات بنجاح', earned: false },
    engineer: { id: 'engineer', name: 'المهندس الواعد', icon: '🏗️', description: 'أكملت تحدي الكليات بنجاح', earned: false }
};

function checkAndAwardBadges() {
    const state = JSON.parse(localStorage.getItem('iugGameProgress'));
    if (!state) return;
    if (!state.badges) {
        state.badges = {};
    }

    const completedChallenges = new Set();
    if(state.answeredQuestions) {
        Array.from(state.answeredQuestions).forEach(qId => completedChallenges.add(qId.split('_')[0]));
    }

    let newBadgeEarned = false;

    // شارة المستكشف: أكمل 3 تحديات
    if (completedChallenges.size >= 3 && !state.badges.explorer) {
        state.badges.explorer = true;
        newBadgeEarned = true;
        showToastNotification('🏆 لقد حصلت على شارة المستكشف!');
    }
    
    // شارة المثقف: أكمل تحدي المكتبة
    if (completedChallenges.has('lib') && !state.badges.librarian) {
        state.badges.librarian = true;
        newBadgeEarned = true;
        showToastNotification('📚 لقد حصلت على شارة المثقف!');
    }

    // شارة الخبير المالي: أكمل تحدي المنح
    if (completedChallenges.has('grants') && !state.badges.financier) {
        state.badges.financier = true;
        newBadgeEarned = true;
        showToastNotification('💰 لقد حصلت على شارة الخبير المالي!');
    }
    
    // --- بداية الكود المصحح ---
    // التحقق من إكمال تحدي الكليات لمنح شارات الطب والهندسة
    if (completedChallenges.has('fac')) {
        // شارة الطبيب الناشئ
        if (!state.badges.medic) {
            state.badges.medic = true;
            newBadgeEarned = true;
            showToastNotification('⚕️ لقد حصلت على شارة الطبيب الناشئ!');
        }
        // شارة المهندس الواعد
        if (!state.badges.engineer) {
            state.badges.engineer = true;
            newBadgeEarned = true;
            showToastNotification('🏗️ لقد حصلت على شارة المهندس الواعد!');
        }
    }
    // --- نهاية الكود المصحح ---

    if (newBadgeEarned) {
        const gameStateToSave = {...state, badges: state.badges};
        localStorage.setItem('iugGameProgress', JSON.stringify(gameStateToSave));
        // تحديث الحالة الحالية في الذاكرة
        if(window.gameState) {
            window.gameState.badges = state.badges;
        }
    }
}

function renderBadges() {
    const container = document.getElementById('badges-container');
    const savedState = localStorage.getItem('iugGameProgress');
    if (!container || !savedState) return;

    const state = JSON.parse(savedState);
    container.innerHTML = '';
    
    const userBadges = state.badges || {};

    for (const badgeKey in allBadges) {
        const badge = allBadges[badgeKey];
        const isEarned = userBadges[badgeKey];
        
        const card = document.createElement('div');
        card.className = 'badge-card';
        if (isEarned) {
            card.classList.add('earned');
        }
        
        card.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-name">${badge.name}</div>
        `;
        card.title = badge.description;

        container.appendChild(card);
    }
}

function showToastNotification(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="toast-icon">⭐</span> ${message}`;
    
    const badgeSound = document.getElementById('badge-sound');
    if (badgeSound) {
        badgeSound.currentTime = 0;
        badgeSound.play().catch(e => console.error("Audio play failed", e));
    }

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}
// --- نهاية منطق الشارات ---


const form = document.getElementById('player-form');
if (form) {
    const startBtn = form.querySelector('button');
    form.addEventListener('input', () => {
        startBtn.disabled = !form.checkValidity();
    });
}

function registerPlayer(name, phone, year) {
    const formData = new FormData();
    formData.append('action', 'register');
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('year', year);
    try {
        const token = (typeof ensureVisitorToken === 'function') ? ensureVisitorToken() : localStorage.getItem('siteVisitorToken');
        if (token) formData.append('token', token);
    } catch (e) {}
    return fetch(SCRIPT_URL, { method: 'POST', body: formData }).then(response => response.json());
}

function updatePlayerScore(uniqueId, score) {
    if (!uniqueId) {
        console.error("Attempted to update score without a uniqueId.");
        return;
    }
    const formData = new FormData();
    formData.append('action', 'updateScore');
    formData.append('uniqueId', uniqueId);
    formData.append('score', score);
    fetch(SCRIPT_URL, { method: 'POST', body: formData })
        .then(response => response.json())
        .then(data => {
            if (data.result === 'success') {
                console.log(`Score updated to: ${score}`);
            } else {
                console.error('Error updating score:', data.message);
            }
        })
        .catch(error => console.error('Error in update fetch:', error));
}

function shuffleArray(array) {
    let currentIndex = array.length,
        randomIndex;
    const newArray = [...array];

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [newArray[currentIndex], newArray[randomIndex]] = [
            newArray[randomIndex], newArray[currentIndex]
        ];
    }
    return newArray;
}
window.correctAnswerAction = (points) => {
    if (window.gameState) {
        window.gameState.score += points;
        updatePlayerScoreDisplayAndSave();
        if (typeof window.updatePlayerScore === 'function') {
            window.updatePlayerScore(window.gameState.uniqueId, window.gameState.score);
        }
    }
};
document.addEventListener('DOMContentLoaded', () => {
        function groupMapOptions() {
            try {
                const containers = document.querySelectorAll('#map-scene .options-container');
                containers.forEach(container => {
                    const children = Array.from(container.children);
                    const wrapperNodes = [];
                    for (let i = 0; i < children.length; i++) {
                        const el = children[i];
                        if (el.classList && el.classList.contains('option-btn')) {
                            const wrap = document.createElement('div');
                            wrap.className = 'option-wrap';
                            wrap.appendChild(el);
                            const next = children[i+1];
                            if (next && next.classList && next.classList.contains('stage-points-pill')) {
                                wrap.appendChild(next);
                                i++; // skip the pill we just consumed
                            }
                            wrapperNodes.push(wrap);
                        } else if (el.classList && el.classList.contains('stage-points-pill')) {
                            // stray pill without button: wrap it alone
                            const wrap = document.createElement('div');
                            wrap.className = 'option-wrap';
                            wrap.appendChild(el);
                            wrapperNodes.push(wrap);
                        }
                    }
                    // replace container content with wrappers
                    container.innerHTML = '';
                    wrapperNodes.forEach(w => container.appendChild(w));
                });
            } catch(e) { /* ignore */ }
        }

        function injectStagePointsOnMap() {
            try {
                const mapBtns = document.querySelectorAll('#map-scene .option-btn');
                mapBtns.forEach(btn => {
                    const dest = btn.getAttribute('onclick')?.replace("window.location.href='", '').replace("'", '');
                    if (!dest || !dest.endsWith('.html')) return;
                    const quizId = dest.replace(/\.html?$/,'').toLowerCase();
                    let pill = btn.nextElementSibling;
                    if (!pill || !pill.classList || !pill.classList.contains('stage-points-pill')) {
                        pill = document.createElement('span');
                        pill.className = 'stage-points-pill';
                        pill.setAttribute('data-stage-points', quizId);
                        btn.insertAdjacentElement('afterend', pill);
                    }
                    const rec = (window.gameState && window.gameState.attempts) ? window.gameState.attempts[quizId] : null;
                    if (rec && typeof rec.bestScore === 'number' && rec.total) {
                        if (window.updateStagePoints) window.updateStagePoints(quizId, rec.bestScore, rec.total);
                    }
                });
            } catch(e) { console.warn('injectStagePointsOnMap failed', e); }
        }
    // Group option buttons with their stage-points-pill so grid places items correctly
    groupMapOptions();
    injectStagePointsOnMap();
        try {
            if (window.gameState && window.gameState.attempts) {
                Object.entries(window.gameState.attempts).forEach(([quizId, rec]) => {
                    if (rec && typeof rec.bestScore === 'number' && rec.total && window.updateStagePoints) {
                        window.updateStagePoints(quizId, rec.bestScore, rec.total);
                    }
                });
            }
        } catch(e) {}

        // Intercept inline onclicks like: onclick="window.location.href='library.html'"
        try {
            const inlineNavEls = document.querySelectorAll('[onclick]');
            inlineNavEls.forEach(el => {
                const onclick = el.getAttribute('onclick') || '';
                // simple regex to capture the destination when assigning window.location.href
                const m = onclick.match(/window\.location\.href\s*=\s*['"]([^'"]+\.html)['"]/i);
                if (m && m[1]) {
                    const href = m[1];
                    // remove inline onclick to avoid double navigation
                    el.removeAttribute('onclick');
                    el.addEventListener('click', function(evt){
                        try { evt.preventDefault(); } catch(e){}
                        try { unlockAudio(); } catch(e){}
                        try {
                            if (transitionSound) {
                                transitionSound.currentTime = 0;
                                transitionSound.play().catch(()=>{});
                            }
                        } catch(e){}
                        setTimeout(() => { window.location.href = href; }, 220);
                    });
                }
            });
        } catch(e) { /* ignore */ }
    
    const allGuides = [
        { id: 'medicine', name: 'د. خالد', gender: 'male', college: 'كلية الطب', emoji: '⚕️', description: 'الدقة والتشخيص السليم هما مفتاح النجاح. سأرشدك في رحلة معرفية صحية.' },
        { id: 'engineering', name: 'م. سارة', gender: 'female', college: 'كلية الهندسة', emoji: '🏗️', description: 'كل مشروع عظيم يبدأ بتصميم دقيق. لنبني مستقبلك خطوة بخطوة.' },
        { id: 'it', name: 'مبرمج بدر', gender: 'male', college: 'كلية تكنولوجيا المعلومات', emoji: '💻', description: 'في عالم الأكواد, كل مشكلة لها حل. سأساعدك على التفكير بمنطقية وإيجاد الحلول.' },
        { id: 'nursing', name: 'ممرضة أمل', gender: 'female', college: 'كلية التمريض', emoji: '🩺', description: 'الرحمة والعناية هما أساس مهنتنا. سأكون بجانبك لألهمك العطاء.' },
        { id: 'health_sciences', name: 'أخصائي رامي', gender: 'male', college: 'كلية العلوم الصحية', emoji: '🧬', description: 'صحة المجتمع تبدأ من المختبر. معًا سنكتشف أسرار الوقاية والعلاج.' },
        { id: 'sciences', name: 'عالمة نور', gender: 'female', college: 'كلية العلوم', emoji: '🔬', description: 'الكون مليء بالأسئلة, والعلوم هي وسيلتنا للإجابة. دعنا نستكشف بشغف.' },
        { id: 'arts', name: 'أديبة ليلى', gender: 'female', college: 'كلية الآداب', emoji: '📚', description: 'الكلمات تبني الحضارات. سأجعل رحلتك مليئة بالإبداع والمعاني الجميلة.' },
        { id: 'law', name: 'فقيه يوسف', gender: 'male', college: 'كلية الشريعة والقانون', emoji: '⚖️', description: 'العدل هو أساس الملك. سأعلمك كيف توازن بين الحقوق والواجبات.' },
        { id: 'religion', name: 'داعية إيمان', gender: 'female', college: 'كلية أصول الدين', emoji: '🕌', description: 'العلم بالدين ينير الدرب. سأرافقك في رحلة لفهم مقاصد شريعتنا السمحة.' },
        { id: 'education', name: 'أستاذة هدى', gender: 'female', college: 'كلية التربية', emoji: '👩‍🏫', description: 'بناء الأجيال هو أسمى الرسالات. معًا سنتعلم كيف نلهم العقول ونبني المستقبل.' },
        { id: 'economics', name: 'خبير مالي', gender: 'male', college: 'كلية الاقتصاد', emoji: '💼', description: 'فهم المال والاقتصاد هو مفتاح بناء مستقبل مزدهر. دعنا نخطط لنجاحك.' }
    ];

    const guideMessages = {
        'gate': {
            medicine: "مرحباً بك! الدخول للجامعة يشبه التشخيص الأول, يجب أن يكون دقيقاً. ركز جيداً.",
            engineering: "أهلاً بك. هذه البوابة هي أساس مشروعك التعليمي. لنبدأ ببناء متين!",
            it: "مصادقة ناجحة! لقد تجاوزت جدار الحماية الأول. أهلاً بك في نظام الجامعة.",
            nursing: "تماماً مثل استقبال المريض, نرحب بك بحرارة. رحلتك نحو العطاء تبدأ الآن.",
            health_sciences: "العينة الأولى هي سؤال الدخول! حلله بعناية لتكشف الإجابة الصحيحة.",
            sciences: "مرحباً أيها الباحث! كل اكتشاف عظيم يبدأ بفرضية. ما هي فرضيتك للإجابة الصحيحة؟",
            arts: "لكل قصة بداية, وهذه بداية قصتك الجامعية. اجعلها بداية مُلهمة.",
            law: "قبل الدخول, يجب التأكد من استيفاء الشروط. هل أنت مستعد لإثبات جدارتك؟",
            religion: "بسم الله نبدأ. هذه البوابة هي مدخلك إلى صرح من صروح العلم والإيمان.",
            education: "أهلاً بك في الفصل الأول من رحلتك. كل إجابة صحيحة هي خطوة نحو إلهام الآخرين.",
            economics: "هذه أول صفقة لك! استثمر تركيزك جيداً لتحقيق أول ربح في رصيدك."
        },
        'faculties-list': {
            medicine: "ستجد كلية الطب هنا, حيث نتعلم كيف ننقذ الأرواح. اختر بحكمة وشغف.",
            engineering: "هذه منطقة الكليات, وكليتي (الهندسة) هنا! كل مبنى يحمل معرفة مختلفة. استكشف بشغف.",
            it: "هذه هي الشبكة الرئيسية للكليات. كل كلية تمثل خادماً (Server) للمعرفة. إلى أي واحد ستتصل؟",
            nursing: "هنا تتوزع أقسام المستشفى التعليمي... عفواً, أقصد كليات الجامعة. كل كلية تقدم نوعاً فريداً من الرعاية.",
            health_sciences: "كل كلية هنا تختص بمجال حيوي. استكشفها لتجد المجال الذي يثير شغفك.",
            sciences: "هذه الكليات تمثل فروع شجرة المعرفة. أي فرع ستختار لتتسلقه؟",
            arts: "كل كلية هنا تمثل فصلاً في كتاب الجامعة الكبير. أي فصل ستختار أن تقرأ؟",
            law: "أمامك هيئات تشريعية مختلفة للمعرفة. اختر الهيئة التي ستنتمي إليها.",
            religion: "كل كلية هنا هي منبر علم. اختر المنبر الذي ستنهل منه العلم الشرعي.",
            education: "هذه هي الفصول الدراسية للجامعة. اختر الفصل الذي ستتعلم فيه لكي تُعلِّم.",
            economics: "هذه هي أسواق المعرفة المختلفة. كل كلية لها أصولها وقيمتها. استثمر في مستقبلك."
        }
    };

    const gameData = {};

    const gameState = {
        playerName: '',
        playerPhone: '',
        tawjihiYear: '',
        uniquePlayerId: null,
        score: 0,
        currentScene: 'map', // Start at map
        answeredQuestions: new Set(),
        selectedGuide: null,
        currentQuestionAttempts: 0,
        badges: {}
    };
    window.gameState = gameState;
    // ===== Helpers for stage points & scoring policy =====
 function updateStagePoints(quizId, score, total){
  const el = document.querySelector(`[data-stage-points="${quizId}"]`);
  if (!el) return;
  const progress = JSON.parse(localStorage.getItem('iugGameProgress')||'{}');
  const best = progress.bestScores?.[quizId] || 0;
  el.textContent = `✔ ${best}/${total}`;
}

    window.updateStagePoints = updateStagePoints;

    function finalizeQuizScore(quizId, attemptScore, totalQuestions) {
        if (!quizId) return;
        if (!gameState.attempts) gameState.attempts = {};
        const rec = gameState.attempts[quizId] || { count: 1, bestScore: 0, total: totalQuestions || 0 };
        rec.total = totalQuestions || rec.total || 0;

        let delta = 0;
        if (rec.count === 1) {
            delta = attemptScore;
            rec.bestScore = attemptScore;
            rec.count = 1; // first completion
        } else if (rec.count >= 2) {
            if (attemptScore > rec.bestScore) {
                delta = attemptScore - rec.bestScore;
                rec.bestScore = attemptScore;
            } else {
                delta = 0;
            }
        }

        gameState.attempts[quizId] = rec;
        if (delta > 0) {
            if (typeof incrementMainScore === 'function') {
                incrementMainScore(delta);
            } else {
                gameState.score += delta;
                try {
                    const stateToSave = { ...gameState, answeredQuestions: Array.from(gameState.answeredQuestions || []) };
                    localStorage.setItem('iugGameProgress', JSON.stringify(stateToSave));
                } catch(e){}
            }
        } else {
            try {
                const stateToSave = { ...gameState, answeredQuestions: Array.from(gameState.answeredQuestions || []) };
                localStorage.setItem('iugGameProgress', JSON.stringify(stateToSave));
            } catch(e){}
        }
        if (window.updateStagePoints) window.updateStagePoints(quizId, rec.bestScore, rec.total);
        if (window.updateStatusBar) window.updateStatusBar();
    }
    window.finalizeQuizScore = finalizeQuizScore;
    // ===== End helpers =====


    const landingScreen = document.getElementById('landing-screen');
    const startScreen = document.getElementById('start-screen');
    const gameSceneContainer = document.getElementById('game-scene');
    const playerForm = document.getElementById('player-form');
    const statusBar = document.getElementById('status-bar');
    const modal = document.getElementById('feedback-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const correctSound = document.getElementById('correct-sound');
    const incorrectSound = document.getElementById('incorrect-sound');
    // Accept either id="transition-sound" or id="transitionSound" (some HTML files use camelCase)
    const transitionSound = document.getElementById('transition-sound') || document.getElementById('transitionSound');
    const guideAppearsSound = document.getElementById('guide-appears-sound');
    const videoOverlay = document.getElementById('video-overlay');
    const welcomeVideo = document.getElementById('welcome-video');
    const skipVideoBtn = document.getElementById('skip-video-btn');
    let isAudioUnlocked = false;

    async function unlockAudio() {
        if (isAudioUnlocked) return;
        const sounds = [correctSound, incorrectSound, transitionSound, guideAppearsSound, document.getElementById('badge-sound')];
        for (const sound of sounds) {
            try {
                if (sound) {
                   await sound.play();
                   sound.pause();
                   sound.currentTime = 0;
                }
            } catch (error) {}
        }
        isAudioUnlocked = true;
    }

    // Ensure audio is unlocked after the first user interaction (many browsers block autoplay)
    try {
        document.body.addEventListener('click', unlockAudio, { once: true });
    } catch (e) {}

    // Delegated handler: play transition sound before navigating to internal HTML pages
    document.addEventListener('click', function (evt) {
        try {
            let el = evt.target;
            // walk up to find actionable element
            while (el && el !== document) {
                // anchor links to internal pages
                if (el.tagName === 'A' && el.getAttribute('href')) {
                    const href = el.getAttribute('href');
                    if (href && href.endsWith('.html')) {
                        evt.preventDefault();
                        unlockAudio();
                        if (transitionSound) playSound(transitionSound);
                        setTimeout(() => { window.location.href = href; }, 220);
                        return;
                    }
                }

                // elements with data-href attribute
                if (el.dataset && el.dataset.href) {
                    const href = el.dataset.href;
                    if (href && href.endsWith('.html')) {
                        evt.preventDefault();
                        unlockAudio();
                        if (transitionSound) playSound(transitionSound);
                        setTimeout(() => { window.location.href = href; }, 220);
                        return;
                    }
                }

                // inline onclick patterns like window.location.href='page.html'
                const onclick = el.getAttribute && el.getAttribute('onclick');
                if (onclick && /window\.location\.href\s*=/.test(onclick)) {
                    const m = onclick.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/);
                    if (m && m[1] && m[1].endsWith('.html')) {
                        evt.preventDefault();
                        unlockAudio();
                        if (transitionSound) playSound(transitionSound);
                        setTimeout(() => { window.location.href = m[1]; }, 220);
                        return;
                    }
                }

                el = el.parentNode;
            }
        } catch (err) {
            console.warn('Navigation sound handler failed', err);
        }
    }, true);

    function playSound(soundElement) {
        if (isAudioUnlocked && soundElement) {
            soundElement.currentTime = 0;
            soundElement.play().catch(error => {
                console.error(`Could not play sound: ${soundElement.src}`, error);
            });
        }
    }

    function incrementMainScore(pointsToAdd) {
        if (typeof pointsToAdd === 'number' && pointsToAdd > 0) {
            gameState.score += pointsToAdd;
            saveGameState();
            updatePlayerScore(gameState.uniquePlayerId, gameState.score);

            if (window.updateStatusBar) {
                window.updateStatusBar();
            }
        }
    }
    window.incrementMainScore = incrementMainScore;

    function showGuideModal(title, message, playSoundEffect = true, callback = null) {
        const guideInfo = allGuides.find(g => g.id === gameState.selectedGuide);
        if (!guideInfo) return;

        if (playSoundEffect) {
            playSound(guideAppearsSound);
        }

        const verb = guideInfo.gender === 'female' ? 'تقول' : 'يقول';

        const modalContent = `
            <div style="text-align: center;">
                <div class="guide-icon" style="margin: 0 auto 10px; font-size: 48px; width: 80px; height: 80px;">${guideInfo.emoji}</div>
                <h3 style="color: var(--primary-dark); margin: 0;">${guideInfo.name} ${verb}:</h3>
                <p style="font-size: 16px; color: var(--text-light); margin-top: 10px;">"${message}"</p>
            </div>
        `;
        showModal(title, modalContent, callback);
    }

    function onGateQuizSuccess() {
        if (!gameState.answeredQuestions.has('gate_q1')) {
            gameState.answeredQuestions.add('gate_q1');
            saveGameState();
        }
        sessionStorage.setItem('isNavigatingBack', 'true');
        if (welcomeVideo) playWelcomeVideo();
        else renderScene('map');
    }
    window.onGateQuizSuccess = onGateQuizSuccess;

    function saveGameState() {
        try {
            const stateToSave = { ...gameState, answeredQuestions: Array.from(gameState.answeredQuestions) };
            localStorage.setItem('iugGameProgress', JSON.stringify(stateToSave));
        } catch (e) {
            console.error("Failed to save game state:", e);
        }
    }

    function loadGameState() {
        try {
            const savedStateJSON = localStorage.getItem('iugGameProgress');
            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                Object.assign(gameState, savedState);
                gameState.answeredQuestions = new Set(savedState.answeredQuestions);
                gameState.badges = savedState.badges || {};
                return true;
            }
            return false;
        } catch (e) {
            console.error("Failed to load game state:", e);
            return false;
        }
    }

    function performLogout() {
        localStorage.removeItem('iugGameProgress');
        localStorage.removeItem('iugGameTargetScene');
        sessionStorage.clear();
        location.reload();
    }

    function showLogoutConfirmation() {
        const logoutModal = document.getElementById('logout-confirm-modal');
        if (logoutModal) logoutModal.classList.remove('hidden');
    }

    function restoreGameSession() {
        if (loadGameState() && gameState.uniquePlayerId) {
            if(landingScreen) landingScreen.classList.add('hidden');
            if(startScreen) startScreen.classList.add('hidden');
            if(gameSceneContainer) gameSceneContainer.classList.remove('hidden');

            if (window.updateStatusBar) window.updateStatusBar();
            
            const targetScene = localStorage.getItem('iugGameTargetScene');
            localStorage.removeItem('iugGameTargetScene');

            const isNavigatingBack = sessionStorage.getItem('isNavigatingBack');
            if (!isNavigatingBack) {
                showModal('أهلاً بعودتك!', `مرحباً ${gameState.playerName}, يسعدنا رؤيتك مجدداً! سنكمل من حيث توقفنا.`, () => {
                    renderScene(targetScene || gameState.currentScene || 'map');
                });
            } else {
                renderScene(targetScene || gameState.currentScene || 'map');
            }
            sessionStorage.removeItem('isNavigatingBack');
            return true;
        }
        return false;
    }

    function startGame(event) {
        event.preventDefault();
        const nameInput = document.getElementById('name').value.trim();
        const phoneInput = document.getElementById('phone').value.trim();
        const tawjihiYearInput = document.getElementById('tawjihi-year').value.trim();
        
        const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]{5,}$/;
        if (!nameRegex.test(nameInput)) {
            showModal('تنبيه بخصوص الاسم', 'هذا الاسم سيتم استخدامه في الشهادة, الرجاء كتابته بشكل صحيح (5 حروف على الأقل, وبدون أرقام أو رموز).', null);
            return;
        }
        const phoneRegex = /^05[9|6]\d{7}$/;
        if (!phoneRegex.test(phoneInput)) {
            showModal('خطأ في رقم الجوال', 'الرجاء إدخال رقم جوال صحيح يبدأ بـ 059 أو 056.', null);
            return;
        }
        const currentYear = new Date().getFullYear();
        const tawjihiYear = parseInt(tawjihiYearInput);
        if (isNaN(tawjihiYear) || tawjihiYear < 2000 || tawjihiYear > currentYear + 1) {
            showModal('خطأ في سنة التوجيهي', 'الرجاء إدخال سنة توجيهي منطقية (مثال: 2024).', null);
            return;
        }

        const startButton = event.target.querySelector('.action-button');
        startButton.disabled = true;
        startButton.innerHTML = 'جاري التسجيل... <span class="spinner"></span>';

        registerPlayer(nameInput, phoneInput, tawjihiYearInput)
            .then(data => {
                if (data.result === 'success' && data.uniqueId) {
                    gameState.playerName = nameInput;
                    gameState.playerPhone = phoneInput;
                    gameState.tawjihiYear = tawjihiYearInput;
                    gameState.uniquePlayerId = data.uniqueId;
                    saveGameState();
                    if (window.updateStatusBar) window.updateStatusBar();
                    if(startScreen) startScreen.classList.add('hidden');
                    const guideScreen = document.getElementById('guide-selection-screen');
                    if (guideScreen) guideScreen.classList.remove('hidden');
                } else {
                    showModal('خطأ في التسجيل', 'حدث خطأ أثناء التسجيل. الرجاء المحاولة مرة أخرى.', null);
                    startButton.disabled = false;
                    startButton.innerHTML = 'ابدأ الرحلة!';
                }
            })
            .catch(error => {
                showModal('خطأ في الاتصال', 'فشل الاتصال بالخادم. الرجاء التحقق من اتصالك بالإنترنت.', null);
                startButton.disabled = false;
                startButton.innerHTML = 'ابدأ الرحلة!';
            });
    }

  function showEndScene() {
    document.querySelectorAll('.game-stage').forEach(stage => stage.classList.add('hidden'));
    const endScene = document.getElementById('end-scene');
    if (!endScene) return;

    const certPlayerName = document.getElementById('cert-player-name');
    const certFinalScore = document.getElementById('cert-final-score');
    if (certPlayerName) certPlayerName.textContent = gameState.playerName;
    if (certFinalScore) certFinalScore.textContent = `${gameState.score} نقطة`;
    
    endScene.classList.remove('hidden');

    const shareUrl = window.location.href;
    const shareText = `🎉 لقد أتممت رحلتي في الجامعة الإسلامية وحصلت على ${gameState.score} نقطة! هل يمكنك تحقيق نتيجة أفضل؟`;
    
    const facebookBtn = document.getElementById('share-facebook');
    const whatsappBtn = document.getElementById('share-whatsapp');
    const twitterBtn = document.getElementById('share-twitter');

    if(facebookBtn) facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    if(whatsappBtn) whatsappBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    if(twitterBtn) twitterBtn.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

    if (gameState.uniquePlayerId) {
        updatePlayerScore(gameState.uniquePlayerId, gameState.score);
    }
}
    
    function renderScene(sceneId) {
        const validScenes = ['map', 'player-profile'];
        if (!sceneId || !validScenes.includes(sceneId)) {
            sceneId = 'map';
        }
        
        gameState.currentScene = sceneId;
        saveGameState();
        
        if (sceneId !== 'map' && guideMessages[sceneId]) {
             if(guideMessages[sceneId][gameState.selectedGuide]) {
                setTimeout(() => showGuideModal('رسالة من مرشدك', guideMessages[sceneId][gameState.selectedGuide]), 500);
            }
        }
        playSound(transitionSound);

        document.querySelectorAll('.game-stage').forEach(stage => stage.classList.add('hidden'));
        
        const sceneMappings = {
            'map': () => {
                const map = document.getElementById('map-scene');
                if (map) map.classList.remove('hidden');
                updateMapMarkers();
            },
            'player-profile': renderPlayerProfile,
        };

        if (sceneMappings[sceneId]) {
            sceneMappings[sceneId]();
        }
    }
    
    function updateMapMarkers() {
        const mapButtons = document.querySelectorAll('#map-scene .option-btn');
        const destinationToQuestionId = {
            'library.html': 'lib_mc_q1',
            'cafeteria.html': 'caf_tf_q1',
            'faculties.html': 'fac_tf_q1',
            'grants.html': 'grants_mc_q1',
            'admission.html': 'adm_tf_q1',
            'studentaffairs.html': 'sa_tf_q1',
            'exchange.html': 'exc_tf_q1'
        };

        mapButtons.forEach(button => {
            const destination = button.getAttribute('onclick')?.replace("window.location.href='", "").replace("'", "");
            if (destination && destinationToQuestionId[destination]) {
                const questionId = destinationToQuestionId[destination];
                const challengePrefix = questionId.substring(0, 3);
                const isCompleted = Array.from(gameState.answeredQuestions).some(id => id.startsWith(challengePrefix));
                if (isCompleted) {
                    button.classList.add('completed');
                } else {
                    button.classList.remove('completed');
                }
            }
        });
    }
    
    function showModal(title, text, callback) {
        if (!modal || !modalTitle || !modalText || !modalCloseBtn) return;
        modalTitle.textContent = title;
        modalText.innerHTML = text;
        modal.classList.remove('hidden');
        modalCloseBtn.onclick = () => {
            modal.classList.add('hidden');
            if (callback) callback();
        };
    }

    function endVideoAndProceed() {
        if (!welcomeVideo || !videoOverlay) return;
        welcomeVideo.pause();
        welcomeVideo.currentTime = 0;
        videoOverlay.classList.add('hidden');
        renderScene('map');
    }

    function playWelcomeVideo() {
        if (!videoOverlay || !welcomeVideo || !skipVideoBtn) return;
        videoOverlay.classList.remove('hidden');
        welcomeVideo.play();
        welcomeVideo.onended = endVideoAndProceed;
        skipVideoBtn.onclick = endVideoAndProceed;
    }
    
    if (playerForm) {
        playerForm.addEventListener('submit', startGame);
    }
    
    const mapScene = document.getElementById('map-scene');
    if (mapScene) {
        mapScene.addEventListener('click', (e) => {
            const button = e.target.closest('.option-btn');
            if (!button) return;
            const destination = button.dataset.destination;
            
            if (destination) {
                 if (destination === 'certificate') {
                    const scoreSufficient = gameState.score >= 0;
                    if(scoreSufficient) {
                         showEndScene();
      const audio = document.getElementById("success-audio");
if (destination === 'certificate') {
const scoreSufficient = gameState.score >= 50; // غيّر لـ >= 0 لو للتجربة
if (scoreSufficient) {
// فتح صفحة الشهادة مع تمرير بيانات اللاعب
const url = `certificate.html?name=${encodeURIComponent(gameState.playerName)}&score=${gameState.score}`;
window.location.href = url;
} else {
showModal(
"شروط الحصول على الشهادة",
`للحصول على الشهادة, يجب أن تجمع 50 نقطة على الأقل. رصيدك الحالي هو: ${gameState.score}`,
null
);
}
}
                    } else {
                         showModal("شروط الحصول على الشهادة", `للحصول على الشهادة, يجب أن تجمع 50 نقطة على الأقل. رصيدك الحالي هو: ${gameState.score}`, null);
                    }
                }
            }
        });
    }
 function logout() {
  localStorage.clear();
  alert("تم تسجيل الخروج بنجاح ✅");
  window.location.href = "index.html";
}

    
    document.body.addEventListener('click', function(event) {
        const target = event.target.closest('button, a');
        if (!target) return;

        const id = target.id;
        if (id === 'show-register-btn') {
            if (landingScreen) landingScreen.classList.add('hidden');
            if (startScreen) startScreen.classList.remove('hidden');
        } else if (id === 'reset-progress-btn') {
            event.preventDefault();
            showLogoutConfirmation();
        } else if (id === 'back-to-map-btn' || id === 'profile-back-btn') {
            event.preventDefault();
            renderScene('map');
        } else if (id === 'profile-btn') {
            event.preventDefault();
            renderPlayerProfile();
        } else if (id === 'confirm-guide-btn') {
             if (gameState.selectedGuide) {
                saveGameState();
                const guideScreen = document.getElementById('guide-selection-screen');
                if (guideScreen) guideScreen.classList.add('hidden');
                if (gameSceneContainer) gameSceneContainer.classList.remove('hidden');

                const startQuizCallback = () => {
                    const gateQuizBtn = document.getElementById('start-gate-quiz-btn');
                    if (gateQuizBtn) gateQuizBtn.click();
                };
                const guideMessage = guideMessages['gate'][gameState.selectedGuide] || "لنبدأ التحدي الأول لدخول الجامعة!";
                showGuideModal("رسالة من مرشدك", guideMessage, true, startQuizCallback);
            }
        }
    });

    const newPlayerBtn = document.getElementById('new-player-btn');
    if (newPlayerBtn) newPlayerBtn.addEventListener('click', performLogout);
    
    const logoutModal = document.getElementById('logout-confirm-modal');
    if (logoutModal) {
        const confirmBtn = document.getElementById('confirm-logout-btn');
        const cancelBtn = document.getElementById('cancel-logout-btn');
        if (confirmBtn) confirmBtn.addEventListener('click', performLogout);
        if (cancelBtn) cancelBtn.addEventListener('click', () => logoutModal.classList.add('hidden'));
    }

    function populateGuideSelection() {
        const container = document.querySelector('#guide-selection-screen .guides-container');
        if (!container) return;
        container.innerHTML = '';
        allGuides.forEach(guide => {
            const cardHTML = `
                <div class="guide-card" data-guide="${guide.id}">
                    <div class="guide-icon">${guide.emoji}</div>
                    <h3>${guide.name}</h3>
                    <span>${guide.college}</span>
                    <p>${guide.description}</p>
                </div>
            `;
            container.innerHTML += cardHTML;
        });
    }

    const guideSelectionScreen = document.getElementById('guide-selection-screen');
    if (guideSelectionScreen) {
        const guidesContainer = guideSelectionScreen.querySelector('.guides-container');
        const confirmGuideBtn = document.getElementById('confirm-guide-btn');

        if (guidesContainer) {
            guidesContainer.addEventListener('click', (e) => {
                const selectedCard = e.target.closest('.guide-card');
                if (!selectedCard) return;
                
                guidesContainer.querySelectorAll('.guide-card').forEach(card => card.classList.remove('selected'));
                selectedCard.classList.add('selected');
                
                gameState.selectedGuide = selectedCard.dataset.guide;
                if(confirmGuideBtn) confirmGuideBtn.disabled = false;
            });
        }
    }

    function renderPlayerProfile() {
        document.querySelectorAll('.game-stage').forEach(stage => stage.classList.add('hidden'));
        const profileScene = document.getElementById('player-profile-scene');
        if (!profileScene) return;
        const selectedGuideInfo = allGuides.find(g => g.id === gameState.selectedGuide);
        const profileName = document.getElementById('profile-name');
        const profileEmoji = document.getElementById('profile-emoji');
        const profileScore = document.getElementById('profile-score');
        const profileYear = document.getElementById('profile-tawjihi-year');

        if (profileName) profileName.textContent = gameState.playerName;
        if (profileEmoji) profileEmoji.textContent = selectedGuideInfo ? selectedGuideInfo.emoji : '👤';
        if (profileScore) profileScore.textContent = `${gameState.score} نقطة`;
        if (profileYear) profileYear.textContent = gameState.tawjihiYear;
        
        profileScene.classList.remove('hidden');
        gameState.currentScene = 'player-profile';
        saveGameState();
        
        renderBadges();
    }
    
    function updatePlayerScoreDisplayAndSave() {
       const profileScore = document.getElementById('profile-score-display');
      if (window.gameState && profileScore) {
        profileScore.textContent = `${window.gameState.score} نقطة`;
      }
      if (typeof window.updateStatusBarScore === 'function') {
        window.updateStatusBarScore(window.gameState.score);
    }
    saveGameState();
}
    document.body.addEventListener('click', unlockAudio, { once: true });
    
    populateGuideSelection();
    const urlParams = new URLSearchParams(window.location.search);
    const isNavigatingBack = urlParams.has('nav');

    if (isNavigatingBack) {
        restoreGameSession();
    } else {
        if (!restoreGameSession()) {
            if (landingScreen) landingScreen.classList.remove('hidden');
        }
    }
});
// assets/js/script.js (إضافة منطق تأكيد الخروج)

    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
    const cancelLogoutBtn = document.getElementById('cancel-logout-btn');

    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', performLogout);
    }

    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
            const logoutModal = document.getElementById('logout-confirm-modal');
            if (logoutModal) {
                logoutModal.classList.add('hidden');
            }
        });
    }

// --- Visitor counter: generate a persistent token, report visit to Apps Script, and show counter ---
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function ensureVisitorToken() {
    try {
        let token = localStorage.getItem('siteVisitorToken');
        if (!token) {
            token = generateUUID();
            localStorage.setItem('siteVisitorToken', token);
        }
        return token;
    } catch (e) {
        return null;
    }
}

function updateVisitorUI(countOrText) {
    try {
        let el = document.getElementById('site-visitor-counter');
        if (!el) {
            el = document.createElement('div');
            el.id = 'site-visitor-counter';
            el.setAttribute('aria-hidden', 'true');
            el.style.position = 'fixed';
            el.style.left = '12px';
            el.style.bottom = '12px';
            el.style.padding = '8px 12px';
            el.style.background = 'rgba(0,0,0,0.6)';
            el.style.color = '#fff';
            el.style.fontSize = '14px';
            el.style.borderRadius = '8px';
            el.style.zIndex = 9999;
            document.body.appendChild(el);
        }
        el.textContent = typeof countOrText === 'number' ? `الزوار: ${countOrText}` : String(countOrText || '—');
    } catch (e) {
        // ignore UI errors
    }
}

function reportVisitToServer() {
    const token = ensureVisitorToken();
    if (!SCRIPT_URL) return Promise.reject(new Error('SCRIPT_URL not set'));

    const url = SCRIPT_URL + '?action=visitorIncrement' + (token ? '&token=' + encodeURIComponent(token) : '');
    return fetch(url, { method: 'GET', mode: 'cors' })
        .then(resp => resp.json ? resp.json() : resp.text())
        .then(data => {
            console.debug('visitorIncrement response', data);
            // expected server JSON: { result: 'success', count: N } or similar
            if (!data) {
                // try to fetch the canonical count
                return fetch(SCRIPT_URL + '?action=visitorGet', { method: 'GET', mode: 'cors' })
                    .then(r => r.json ? r.json() : r.text())
                    .then(d => {
                        console.debug('visitorGet fallback response', d);
                        const c = d && (d.count || d.total || d.visitorCount) || null;
                        if (c !== null) updateVisitorUI(c);
                        return d;
                    })
                    .catch(() => { updateVisitorUI(localStorage.getItem('siteVisitsLocal') || '—'); return null; });
            }
            if (typeof data === 'object') {
                const count = data.count || data.total || data.visitorCount || null;
                if (count !== null) {
                    localStorage.setItem('siteVisitsLocal', String(count));
                    updateVisitorUI(count);
                    return data;
                }
                // try canonical getter when increment didn't return total
                return fetch(SCRIPT_URL + '?action=visitorGet', { method: 'GET', mode: 'cors' })
                    .then(r => r.json ? r.json() : r.text())
                    .then(d => {
                        console.debug('visitorGet response', d);
                        const c = d && (d.count || d.total || d.visitorCount) || null;
                        if (c !== null) {
                            localStorage.setItem('siteVisitsLocal', String(c));
                            updateVisitorUI(c);
                        } else {
                            updateVisitorUI(data.result === 'success' ? (data.message || 'تم التسجيل') : (data.message || '—'));
                        }
                        return d || data;
                    })
                    .catch(() => { updateVisitorUI(data.result === 'success' ? (data.message || 'تم التسجيل') : (data.message || '—')); return data; });
            }
            // if server returned plain text, show it
            updateVisitorUI(data);
            return data;
        })
        .catch(err => {
            // fallback: keep a local counter so user sees something
            console.warn('visitorIncrement failed', err);
            try {
                let local = parseInt(localStorage.getItem('siteVisitsLocal') || '0', 10) || 0;
                local += 1;
                localStorage.setItem('siteVisitsLocal', String(local));
                updateVisitorUI(local);
            } catch (e) {}
            // don't rethrow so page scripts aren't blocked by visitor reporting
            return null;
        });
}

// Trigger a visit report shortly after load (non-blocking)
try {
    document.addEventListener('DOMContentLoaded', function() {
        // small delay so page metrics & other scripts run first
        setTimeout(() => {
            reportVisitToServer().catch(() => {});
        }, 600);
    });
} catch (e) {}
    