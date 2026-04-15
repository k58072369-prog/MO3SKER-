/* =========================================
   MO3SKER — Core Engine 2026
   تطوير بواسطة المبرمج ادهم ايمن
   ========================================= */

// ===== SPA Redirect Handler (GitHub Pages / Static Host Fix) =====
(function() {
    var redirect = sessionStorage.getItem('spa_redirect');
    if (redirect && redirect !== '/') {
        sessionStorage.removeItem('spa_redirect');
        // Replace current history state with the intended URL
        window.history.replaceState(null, '', redirect);
    }
})();



// ===== State Management =====
const state = {
    timer: {
        mode: 'countdown',        // 'countdown' | 'stopwatch'
        isRunning: false,
        isPaused: false,
        seconds: 0,
        targetSeconds: 1500,      // 25 دقيقة افتراضياً
        interval: null
    },
    user: {
        xp: 0,
        level: 'Rookie',
        totalStudySeconds: 0,
        tasksCompleted: 0
    },
    subjects: [],
    history: []                   // بيانات الرسم البياني
};

// ===== Constants =====
const LEVELS = [
    { name: 'Rookie',   minXp: 0     },
    { name: 'Focused',  minXp: 100   },
    { name: 'Warrior',  minXp: 500   },
    { name: 'Elite',    minXp: 1500  },
    { name: 'Master',   minXp: 4000  },
    { name: 'Legend',   minXp: 10000 }
];

const MOTIVATIONS = [
    "كل دقيقة تركيز تصنع نسخة أقوى منك 💪",
    "أنت داخل معسكر… لا يوجد مكان للتشتت 🎯",
    "استمر… أنت تبني نفسك من الصفر 🔥",
    "الالتزام هو الفرق بين الحلم والواقع ⚡",
    "المعسكر لا يرحم الضعفاء، كن بطلاً 🏆",
    "رحلتك نحو القمة تبدأ بخطوة واحدة الآن 🚀",
    "التركيز اليوم، النجاح غداً ✨",
    "كل ثانية تعدّ… لا تضيع وقتك ⏰"
];

const DESTINATIONS = [
    { distance: 0,     name: 'القاهرة'   },
    { distance: 500,   name: 'البحر الأحمر' },
    { distance: 1500,  name: 'دبي'       },
    { distance: 3500,  name: 'إسطنبول'   },
    { distance: 6000,  name: 'لندن'      },
    { distance: 10000, name: 'نيويورك'   },
    { distance: 20000, name: 'طوكيو'     }
];

// ===== DOM Elements Cache =====
const elements = {
    timerDisplay:    document.getElementById('timer-display'),
    timerStatus:     document.getElementById('timer-status'),
    ringProgress:    document.getElementById('ring-progress'),
    timerInput:      document.getElementById('timer-input'),
    btnStart:        document.getElementById('timer-start'),
    btnPause:        document.getElementById('timer-pause'),
    btnReset:        document.getElementById('timer-reset'),
    plane:           document.getElementById('plane'),
    planeTrail:      document.getElementById('plane-trail'),
    flightDistance:  document.getElementById('flight-distance'),
    nextDest:        document.getElementById('next-destination'),
    totalXp:         document.getElementById('total-xp'),
    userLevel:       document.getElementById('user-level'),
    statTime:        document.getElementById('stat-total-time'),
    statTasks:       document.getElementById('stat-tasks-done'),
    subjectsContainer: document.getElementById('subjects-container'),
    campEmpty:       document.getElementById('camp-empty'),
    motivationText:  document.getElementById('motivation-text'),
    modalOverlay:    document.getElementById('modal-overlay'),
    levelUpNotif:    document.getElementById('level-up-notif'),
    chartEmpty:      document.getElementById('chart-empty'),
    pwaBanner:       document.getElementById('pwa-banner')
};

// ===== Initialization =====
function init() {
    loadData();
    setupEventListeners();
    setupPWA();
    updateUI();
    startMotivationRotation();
    renderChart();
}

// ===== Data Persistence =====
function saveData() {
    try {
        localStorage.setItem('mo3sker_data', JSON.stringify({
            user:     state.user,
            subjects: state.subjects,
            history:  state.history
        }));
    } catch (e) {
        console.warn('[MO3SKER] تعذّر حفظ البيانات:', e);
    }
}

function loadData() {
    try {
        const saved = localStorage.getItem('mo3sker_data');
        if (saved) {
            const data = JSON.parse(saved);
            state.user     = { ...state.user,  ...(data.user     || {}) };
            state.subjects = data.subjects || [];
            state.history  = data.history  || [];
        }
    } catch (e) {
        console.warn('[MO3SKER] تعذّر تحميل البيانات:', e);
    }
}

// ===== Timer Logic =====
function startTimer() {
    if (state.timer.isRunning && !state.timer.isPaused) return;

    // إعداد الوقت عند بدء جديد
    if (!state.timer.isPaused) {
        if (state.timer.mode === 'countdown') {
            const mins = parseInt(elements.timerInput.value) || 25;
            state.timer.targetSeconds = mins * 60;
            state.timer.seconds = 0;
        } else {
            state.timer.seconds = 0;
        }
    }

    state.timer.isRunning = true;
    state.timer.isPaused  = false;

    elements.btnStart.style.display     = 'none';
    elements.btnPause.style.display     = 'inline-flex';
    elements.btnPause.innerHTML         = '⏸ إيقاف مؤقت';
    elements.plane.classList.add('flying');
    if (elements.timerStatus) elements.timerStatus.textContent = '🔥 يعمل الآن';

    state.timer.interval = setInterval(tick, 1000);
}

function pauseTimer() {
    if (!state.timer.isRunning) return;

    if (state.timer.isPaused) {
        // استئناف
        startTimer();
    } else {
        // إيقاف مؤقت
        clearInterval(state.timer.interval);
        state.timer.isPaused = true;
        elements.btnPause.innerHTML = '▶ استئناف';
        elements.plane.classList.remove('flying');
        if (elements.timerStatus) elements.timerStatus.textContent = '⏸ متوقف مؤقتاً';
    }
}

function resetTimer() {
    clearInterval(state.timer.interval);
    state.timer.isRunning = false;
    state.timer.isPaused  = false;
    state.timer.seconds   = 0;

    elements.btnStart.style.display = 'inline-flex';
    elements.btnPause.style.display = 'none';
    elements.plane.classList.remove('flying');
    if (elements.timerStatus) elements.timerStatus.textContent = 'جاهز للبدء';

    updateTimerUI();
}

// دورة كل ثانية
function tick() {
    state.timer.seconds++;
    state.user.totalStudySeconds++;

    // XP كل دقيقة
    if (state.timer.seconds % 60 === 0) {
        addXp(10);
    }

    updateTimerUI();
    updateFlightUI();
    updateStatsUI();

    // انتهاء العداد التنازلي
    if (state.timer.mode === 'countdown' && state.timer.seconds >= state.timer.targetSeconds) {
        finishSession();
    }

    // حفظ كل 10 ثوانٍ
    if (state.timer.seconds % 10 === 0) saveData();
}

function finishSession() {
    clearInterval(state.timer.interval);
    state.timer.isRunning = false;

    elements.btnStart.style.display = 'inline-flex';
    elements.btnPause.style.display = 'none';
    elements.plane.classList.remove('flying');
    if (elements.timerStatus) elements.timerStatus.textContent = '✅ انتهت الجلسة!';

    addXp(50); // مكافأة إتمام الجلسة
    triggerConfetti();
    showMotivation("رحلتك انتهت بنجاح! أنت بطل 🔥");

    // تحديث بيانات الرسم البياني
    const today = new Date().toLocaleDateString('ar-EG');
    const existing = state.history.find(h => h.date === today);
    if (existing) {
        existing.minutes += Math.floor(state.timer.seconds / 60);
    } else {
        state.history.push({ date: today, minutes: Math.floor(state.timer.seconds / 60) });
    }
    if (state.history.length > 7) state.history.shift();

    renderChart();
    saveData();
}

// ===== UI Updates =====
function updateTimerUI() {
    let displaySecs = state.timer.seconds;
    if (state.timer.mode === 'countdown') {
        displaySecs = Math.max(0, state.timer.targetSeconds - state.timer.seconds);
    }

    const h = Math.floor(displaySecs / 3600);
    const m = Math.floor((displaySecs % 3600) / 60);
    const s = displaySecs % 60;
    elements.timerDisplay.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

    // تحديث حلقة التقدم
    if (state.timer.mode === 'countdown') {
        const progress = state.timer.seconds / Math.max(1, state.timer.targetSeconds);
        elements.ringProgress.style.strokeDashoffset = 283 - (progress * 283);
    } else {
        elements.ringProgress.style.strokeDashoffset = 0;
    }
}

function updateFlightUI() {
    let progress = 0;
    if (state.timer.mode === 'countdown') {
        progress = (state.timer.seconds / Math.max(1, state.timer.targetSeconds)) * 100;
    } else {
        progress = Math.min(100, (state.timer.seconds / 7200) * 100);
    }

    // تحريك الطائرة مع تعويض الحجم
    const offset = Math.min(progress * 0.55, 40);
    elements.plane.style.left      = `calc(${progress}% - ${offset}px + 28px)`;
    elements.planeTrail.style.width = `${progress}%`;

    // المسافة الكلية
    const km = Math.floor((state.user.totalStudySeconds / 3600) * 800);
    elements.flightDistance.textContent = `${km.toLocaleString('ar')} كم`;

    // الوجهة القادمة
    const next = DESTINATIONS.find(d => d.distance > km) || DESTINATIONS[DESTINATIONS.length - 1];
    elements.nextDest.textContent = next.name;
}

function updateStatsUI() {
    elements.totalXp.textContent  = state.user.xp.toLocaleString('ar');
    elements.userLevel.textContent = state.user.level;

    const h = Math.floor(state.user.totalStudySeconds / 3600);
    const m = Math.floor((state.user.totalStudySeconds % 3600) / 60);
    elements.statTime.textContent  = `${pad(h)}:${pad(m)}`;
    elements.statTasks.textContent = state.user.tasksCompleted;
}

function updateUI() {
    updateTimerUI();
    updateFlightUI();
    updateStatsUI();
    renderSubjects();
}

// مساعد: تنسيق الأرقام
function pad(n) {
    return String(n).padStart(2, '0');
}

// ===== Gamification =====
function addXp(amount) {
    state.user.xp += amount;
    checkLevelUp();
    updateStatsUI();
}

function checkLevelUp() {
    const currentIndex = LEVELS.findIndex(l => l.name === state.user.level);
    const nextLevel    = LEVELS[currentIndex + 1];
    if (nextLevel && state.user.xp >= nextLevel.minXp) {
        state.user.level = nextLevel.name;
        showLevelUp(nextLevel.name);
    }
}

function showLevelUp(name) {
    document.getElementById('new-level-name').textContent = name;
    elements.levelUpNotif.style.display = 'flex';
    triggerConfetti();
    setTimeout(() => {
        elements.levelUpNotif.style.display = 'none';
    }, 3500);
}

// ===== Camp System =====
function renderSubjects() {
    const container = elements.subjectsContainer;
    container.innerHTML = '';

    if (state.subjects.length === 0) {
        if (elements.campEmpty) elements.campEmpty.style.display = 'block';
        return;
    }
    if (elements.campEmpty) elements.campEmpty.style.display = 'none';

    state.subjects.forEach(sub => {
        const doneCount = sub.tasks.filter(Boolean).length;
        const isDone    = doneCount === sub.tasks.length;
        const imgSrc    = sub.image || `https://picsum.photos/seed/${encodeURIComponent(sub.name)}/100`;

        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `
            <div class="subject-main">
                <img src="${imgSrc}" class="subject-img" referrerpolicy="no-referrer"
                     onerror="this.src='https://picsum.photos/seed/${Date.now()}/100'" alt="${sub.name}">
                <div class="subject-info">
                    <h4>${sub.name}</h4>
                    <p>${doneCount} / ${sub.tasks.length} مهام منجزة</p>
                </div>
                ${isDone ? '<span class="badge-done">✅</span>' : ''}
            </div>
            <div class="tasks-grid">
                ${sub.tasks.map((done, idx) => `
                    <div class="task-dot ${done ? 'completed' : ''}"
                         onclick="toggleTask(${sub.id}, ${idx})"
                         title="مهمة ${idx + 1}">
                        ${done ? '✓' : idx + 1}
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(card);
    });
}

// تبديل حالة المهمة
window.toggleTask = (subId, taskIdx) => {
    const sub = state.subjects.find(s => s.id === subId);
    if (!sub) return;

    const wasDone   = sub.tasks[taskIdx];
    sub.tasks[taskIdx] = !wasDone;

    if (!wasDone) {
        // إكمال المهمة
        state.user.tasksCompleted++;
        addXp(20);
        // إكمال المادة بالكامل
        if (sub.tasks.every(Boolean)) {
            addXp(100);
            triggerConfetti();
            showMotivation(`تم إنهاء مادة ${sub.name} بنجاح! 🔥`);
        }
    } else {
        // إلغاء إكمال المهمة
        if (state.user.tasksCompleted > 0) state.user.tasksCompleted--;
    }

    renderSubjects();
    updateStatsUI();
    saveData();
};

// ===== Modals =====
document.getElementById('add-subject-btn').onclick = () => {
    elements.modalOverlay.style.display = 'flex';
    document.getElementById('subject-name-input').focus();
};

document.getElementById('modal-cancel').onclick  = closeModal;
document.getElementById('modal-close').onclick   = closeModal;
elements.modalOverlay.onclick = e => { if (e.target === elements.modalOverlay) closeModal(); };

function closeModal() {
    elements.modalOverlay.style.display = 'none';
    // إعادة ضبط الحقول
    document.getElementById('subject-name-input').value  = '';
    document.getElementById('subject-tasks-input').value = '3';
    document.getElementById('subject-image-input').value = '';
}

document.getElementById('modal-confirm').onclick = () => {
    const name  = document.getElementById('subject-name-input').value.trim();
    const count = parseInt(document.getElementById('subject-tasks-input').value) || 3;
    const image = document.getElementById('subject-image-input').value.trim();

    if (!name) {
        document.getElementById('subject-name-input').focus();
        return;
    }

    state.subjects.push({
        id:    Date.now(),
        name,
        tasks: Array(Math.min(count, 20)).fill(false),
        image
    });

    renderSubjects();
    closeModal();
    saveData();
};

// إغلاق الـ modal بـ ESC
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && elements.modalOverlay.style.display !== 'none') closeModal();
});

// ===== Motivation =====
function showMotivation(text) {
    elements.motivationText.textContent = text;
}

function startMotivationRotation() {
    // تغيير الرسالة التحفيزية كل 15 ثانية عند التوقف
    setInterval(() => {
        if (!state.timer.isRunning) {
            const random = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
            showMotivation(random);
        }
    }, 15000);
}

// ===== Chart (Canvas) =====
function renderChart() {
    const canvas = document.getElementById('activity-chart');
    if (!canvas) return;

    const ctx    = canvas.getContext('2d');
    const width  = canvas.width  = canvas.offsetWidth  || 300;
    const height = canvas.height = canvas.offsetHeight || 180;

    ctx.clearRect(0, 0, width, height);

    // إظهار/إخفاء رسالة البيانات الفارغة
    if (elements.chartEmpty) {
        elements.chartEmpty.style.display = state.history.length === 0 ? 'block' : 'none';
    }

    if (state.history.length < 2) return;

    const maxMins    = Math.max(...state.history.map(h => h.minutes), 30);
    const padding    = 24;
    const chartW     = width  - padding * 2;
    const chartH     = height - padding * 2;
    const stepX      = chartW / (state.history.length - 1);

    const points = state.history.map((h, i) => ({
        x: padding + i * stepX,
        y: height - padding - (h.minutes / maxMins) * chartH
    }));

    // رسم المنطقة الملوّنة
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height - padding);
    ctx.lineTo(points[0].x, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // رسم الخط
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth   = 2.5;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // رسم النقاط
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle   = '#38bdf8';
        ctx.shadowColor = 'rgba(56,189,248,0.6)';
        ctx.shadowBlur  = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

// ===== Confetti =====
function triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    const colors = ['#38bdf8','#facc15','#22c55e','#f472b6','#a78bfa','#fb923c'];
    let particles = Array.from({ length: 120 }, () => ({
        x:      Math.random() * canvas.width,
        y:      Math.random() * canvas.height - canvas.height,
        size:   Math.random() * 9 + 4,
        color:  colors[Math.floor(Math.random() * colors.length)],
        speed:  Math.random() * 5 + 2,
        angle:  Math.random() * Math.PI * 2,
        spin:   (Math.random() - 0.5) * 0.2
    }));

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.y     += p.speed;
            p.x     += Math.sin(p.angle) * 2;
            p.angle += p.spin;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
            ctx.restore();
        });
        particles = particles.filter(p => p.y < canvas.height);
        if (particles.length > 0) {
            requestAnimationFrame(animate);
        } else {
            canvas.style.display = 'none';
        }
    }
    animate();
}

// ===== PWA Setup =====
let deferredPrompt = null;

function setupPWA() {
    // تسجيل Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js', { scope: './' })
            .then(reg => console.log('[SW] مُسجَّل:', reg.scope))
            .catch(err => console.warn('[SW] فشل التسجيل:', err));
    }

    // الاستماع لحدث التثبيت
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;

        // عرض بانر التثبيت بعد 3 ثوانٍ
        setTimeout(() => {
            if (elements.pwaBanner && !localStorage.getItem('pwa_dismissed')) {
                elements.pwaBanner.style.display = 'block';
            }
        }, 3000);
    });

    // زر التثبيت
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
        installBtn.onclick = async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('[PWA] نتيجة التثبيت:', outcome);
            deferredPrompt = null;
            if (elements.pwaBanner) elements.pwaBanner.style.display = 'none';
        };
    }

    // زر الإغلاق
    const dismissBtn = document.getElementById('pwa-dismiss-btn');
    if (dismissBtn) {
        dismissBtn.onclick = () => {
            if (elements.pwaBanner) elements.pwaBanner.style.display = 'none';
            localStorage.setItem('pwa_dismissed', '1');
        };
    }

    // حدث ما بعد التثبيت
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] تم تثبيت التطبيق!');
        if (elements.pwaBanner) elements.pwaBanner.style.display = 'none';
        showMotivation('تم تثبيت MO3SKER بنجاح على جهازك! 🎉');
    });
}

// ===== Event Listeners =====
function setupEventListeners() {
    elements.btnStart.onclick = startTimer;
    elements.btnPause.onclick = pauseTimer;
    elements.btnReset.onclick = resetTimer;

    // وضع العداد التنازلي
    document.getElementById('mode-countdown').onclick = function () {
        state.timer.mode = 'countdown';
        this.classList.add('active');
        document.getElementById('mode-stopwatch').classList.remove('active');
        document.getElementById('countdown-setup').style.display = 'block';
        resetTimer();
    };

    // وضع ساعة الإيقاف
    document.getElementById('mode-stopwatch').onclick = function () {
        state.timer.mode = 'stopwatch';
        this.classList.add('active');
        document.getElementById('mode-countdown').classList.remove('active');
        document.getElementById('countdown-setup').style.display = 'none';
        resetTimer();
    };

    // تحديث الرسم البياني عند تغيير حجم النافذة
    window.addEventListener('resize', renderChart);
}

// ===== Launch =====
init();
