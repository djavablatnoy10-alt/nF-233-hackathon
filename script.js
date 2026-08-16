// --- БАЗА ДАННЫХ СЛОВ И ТРАНСЛЯЦИЙ ---
const dictionaryData = [
    { en: "Apple", ru: "Яблоко", uz: "Olma" },
    { en: "House", ru: "Дом", uz: "Uy" },
    { en: "Cat", ru: "Кошка", uz: "Mushuk" },
    { en: "Water", ru: "Вода", uz: "Suv" },
    { en: "Book", ru: "Книга", uz: "Kitob" },
    { en: "Car", ru: "Машина", uz: "Mashina" },
    { en: "Sun", ru: "Солнце", uz: "Quyosh" },
    { en: "Friend", ru: "Друг", uz: "Do'st" },
    { en: "City", ru: "Город", uz: "Shahar" },
    { en: "Tree", ru: "Дерево", uz: "Daraxt" }
];

const translations = {
    rus: {
        landing_subtitle: "Изучайте языки быстро и эффективно",
        tab_login: "Вход",
        tab_register: "Регистрация",
        label_email: "Email",
        label_password: "Пароль",
        label_name: "Имя",
        btn_login: "Войти",
        btn_register: "Зарегистрироваться",
        nav_learn: "Учеба",
        nav_dict: "Словарь",
        nav_trans: "Перевод",
        nav_profile: "Профиль",
        learn_title: "Курс обучения",
        learn_subtitle: "Выберите урок для прохождения",
        dict_subtitle: "Сохраненные слова и карточки",
        trans_subtitle: "Мгновенный перевод слов и предложений",
        btn_translate: "Перевести",
        btn_next: "Ответить",
        btn_logout: "Выйти из аккаунта",
        stat_words: "Слов",
        stat_streak: "Дней",
        stat_xp: "Очки",
        level: "Уровень",
        lesson: "Урок"
    },
    uzb: {
        landing_subtitle: "Tillarni tez va samarali o'rganing",
        tab_login: "Kirish",
        tab_register: "Ro'yxatdan o'tish",
        label_email: "Email",
        label_password: "Parol",
        label_name: "Ism",
        btn_login: "Kirish",
        btn_register: "Ro'yxatdan o'tish",
        nav_learn: "O'qish",
        nav_dict: "Lug'at",
        nav_trans: "Tarjima",
        nav_profile: "Profil",
        learn_title: "O'quv kursi",
        learn_subtitle: "O'tish uchun darsni tanlang",
        dict_subtitle: "Saqlangan so'zlar va kartochkalar",
        trans_subtitle: "So'z va iboralarni tezkor tarjima qilish",
        btn_translate: "Tarjima qilish",
        btn_next: "Javob berish",
        btn_logout: "Hisobdan chiqish",
        stat_words: "So'zlar",
        stat_streak: "Kunlar",
        stat_xp: "Ballar",
        level: "Daraja",
        lesson: "Dars"
    },
    eng: {
        landing_subtitle: "Learn languages fast and effectively",
        tab_login: "Log In",
        tab_register: "Sign Up",
        label_email: "Email",
        label_password: "Password",
        label_name: "Name",
        btn_login: "Log In",
        btn_register: "Sign Up",
        nav_learn: "Learn",
        nav_dict: "Dictionary",
        nav_trans: "Translate",
        nav_profile: "Profile",
        learn_title: "Learning Course",
        learn_subtitle: "Select a lesson to start",
        dict_subtitle: "Saved words and flashcards",
        trans_subtitle: "Instant translation for words and sentences",
        btn_translate: "Translate",
        btn_next: "Submit",
        btn_logout: "Log Out",
        stat_words: "Words",
        stat_streak: "Streak",
        stat_xp: "XP Points",
        level: "Level",
        lesson: "Lesson"
    }
};

// --- СОСТОЯНИЕ ПРИЛОЖЕНИЯ ---
let currentLang = 'rus';
let authMode = 'login';
let userStats = { xp: 0, words: 0, completedLessons: new Set() };
let currentLessonTasks = [];
let currentTaskIdx = 0;
let selectedOption = null;

// --- ТЕМА И ЗНАЧОК (ЛУНА / СОЛНЦЕ) ---
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
        themeBtn.innerText = isDark ? '☀️' : '🌙';
    }
}

// --- ЯЗЫКИ И ИНТЕРФЕЙС ---
function setLanguage(lang) {
    currentLang = lang;

    // Подсветка активных кнопок
    document.querySelectorAll('.lang-btn').forEach(btn => {
        const text = btn.innerText.toLowerCase();
        btn.classList.toggle('active', text === lang || text === lang.substr(0, 2));
    });

    // Перевод интерфейса
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });

    renderLevels();
    renderDictionary();
}

// --- АВТОРИЗАЦИЯ И ВХОД ---
function toggleAuthTab(mode) {
    authMode = mode;
    const isReg = mode === 'register';

    document.querySelectorAll('.auth-tab-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', (isReg && idx === 1) || (!isReg && idx === 0));
    });

    document.getElementById('register-fields').classList.toggle('hidden', !isReg);
    document.getElementById('auth-submit-btn').innerText = translations[currentLang][isReg ? 'btn_register' : 'btn_login'];
}

function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const nameInput = document.getElementById('reg-name').value;

    const userName = (authMode === 'register' && nameInput.trim()) ? nameInput : email.split('@')[0];
    document.getElementById('profile-user-name').innerText = userName;

    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
}

function logout() {
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
}

// --- ГЕНЕРАЦИЯ И ОТОБРАЖЕНИЕ УРОКОВ ---
const TOTAL_LEVELS = 3;
const LESSONS_PER_LEVEL = 10;

function generateTask(levelIdx, lessonIdx, taskIdx) {
    const word = dictionaryData[(levelIdx + lessonIdx + taskIdx) % dictionaryData.length];
    const type = taskIdx % 3;
    const targetTranslation = currentLang === 'uzb' ? word.uz : word.ru;

    if (type === 0) {
        // Выбор перевода с английского
        const options = [targetTranslation];
        while (options.length < 4) {
            const randomWord = dictionaryData[Math.floor(Math.random() * dictionaryData.length)];
            const randomTrans = currentLang === 'uzb' ? randomWord.uz : randomWord.ru;
            if (!options.includes(randomTrans)) options.push(randomTrans);
        }
        return {
            type: "choice",
            question: `Как переводится "${word.en}"?`,
            options: options.sort(() => Math.random() - 0.5),
            answer: targetTranslation
        };
    } else if (type === 1) {
        // Текстовый ввод на английском
        return {
            type: "input",
            question: `Напишите "${targetTranslation}" на английском:`,
            answer: word.en.toLowerCase()
        };
    } else {
        // Обратный выбор на английский
        const options = [word.en];
        while (options.length < 4) {
            const randomWord = dictionaryData[Math.floor(Math.random() * dictionaryData.length)];
            if (!options.includes(randomWord.en)) options.push(randomWord.en);
        }
        return {
            type: "choice",
            question: `Выберите английский эквивалент слова "${targetTranslation}":`,
            options: options.sort(() => Math.random() - 0.5),
            answer: word.en
        };
    }
}

function renderLevels() {
    const container = document.getElementById('levels-accordion');
    if (!container) return;
    container.innerHTML = '';

    for (let l = 1; l <= TOTAL_LEVELS; l++) {
        const item = document.createElement('div');
        item.className = 'accordion-item';

        let lessonsHTML = '';
        for (let u = 1; u <= LESSONS_PER_LEVEL; u++) {
            const lessonKey = `${l}-${u}`;
            const isDone = userStats.completedLessons.has(lessonKey);
            lessonsHTML += `
                <button class="lesson-btn ${isDone ? 'completed' : ''}" onclick="startLesson(${l}, ${u})">
                    ${translations[currentLang].lesson} ${u} ${isDone ? '✓' : ''}
                </button>`;
        }

        item.innerHTML = `
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
                <span>📍 ${translations[currentLang].level} ${l}</span>
                <span>▼</span>
            </div>
            <div class="accordion-content">
                <div class="lessons-grid">${lessonsHTML}</div>
            </div>
        `;
        container.appendChild(item);
    }
}

// --- ЛОГИКА ПРОХОЖДЕНИЯ И ПРОВЕРКИ ---
function startLesson(level, lesson) {
    const taskCount = 5 + ((level + lesson) % 11);
    currentLessonTasks = [];

    for (let i = 0; i < taskCount; i++) {
        currentLessonTasks.push(generateTask(level, lesson, i));
    }

    currentLessonTasks.level = level;
    currentLessonTasks.lesson = lesson;
    currentTaskIdx = 0;

    document.getElementById('learn-screen').classList.add('hidden');
    document.getElementById('lesson-screen').classList.remove('hidden');
    renderTask();
}

function renderTask() {
    const task = currentLessonTasks[currentTaskIdx];
    const container = document.getElementById('task-container');
    const progress = (currentTaskIdx / currentLessonTasks.length) * 100;

    document.getElementById('lesson-progress-fill').style.width = `${progress}%`;
    selectedOption = null;

    if (task.type === 'choice') {
        container.innerHTML = `
            <h3>${task.question}</h3>
            <div class="options-grid">
                ${task.options.map(opt => `<button class="opt-btn" onclick="selectOption(this, '${opt}')">${opt}</button>`).join('')}
            </div>
        `;
    } else if (task.type === 'input') {
        container.innerHTML = `
            <h3>${task.question}</h3>
            <input type="text" id="task-text-input" class="task-input margin-top" placeholder="Введите ответ..." autocomplete="off">
        `;
    }
}

function selectOption(btn, val) {
    document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedOption = val;
}

function submitTask() {
    const task = currentLessonTasks[currentTaskIdx];
    let isCorrect = false;

    if (task.type === 'choice') {
        if (selectedOption === task.answer) isCorrect = true;
    } else if (task.type === 'input') {
        const val = document.getElementById('task-text-input')?.value.trim().toLowerCase();
        if (val === task.answer) isCorrect = true;
    }

    if (isCorrect) {
        currentTaskIdx++;
        userStats.xp += 10;

        if (currentTaskIdx < currentLessonTasks.length) {
            renderTask();
        } else {
            const key = `${currentLessonTasks.level}-${currentLessonTasks.lesson}`;
            if (!userStats.completedLessons.has(key)) {
                userStats.completedLessons.add(key);
                userStats.words += currentLessonTasks.length;
            }
            updateProfileStats();
            alert('Урок успешно завершен! +10 XP за ответ');
            closeLesson();
        }
    } else {
        alert('Неверно, попробуйте еще раз!');
    }
}

function closeLesson() {
    document.getElementById('lesson-screen').classList.add('hidden');
    document.getElementById('learn-screen').classList.remove('hidden');
    renderLevels();
}

// --- СЛОВАРЬ И ПЕРЕВОДЧИК ---
function renderDictionary() {
    const list = document.getElementById('dict-list');
    if (!list) return;

    list.innerHTML = dictionaryData.map(item => {
        const trans = currentLang === 'uzb' ? item.uz : item.ru;
        return `
            <div class="dict-card">
                <div>
                    <strong>${item.en}</strong>
                    <p class="phrase-sub">${trans}</p>
                </div>
                <button class="audio-btn" onclick="speakText('${item.en}')">🔊</button>
            </div>
        `;
    }).join('');
}

function filterDictionary() {
    const query = document.getElementById('dict-search').value.toLowerCase();
    document.querySelectorAll('.dict-card').forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(query) ? 'flex' : 'none';
    });
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }
}

function handleTranslate() {
    const input = document.getElementById('trans-input').value.trim();
    const output = document.getElementById('trans-output');

    if (!input) {
        output.innerText = '...';
        return;
    }

    const match = dictionaryData.find(d => d.en.toLowerCase() === input.toLowerCase());
    if (match) {
        output.innerText = currentLang === 'uzb' ? match.uz : match.ru;
    } else {
        output.innerText = `[Перевод]: ${input}`;
    }
}

function updateProfileStats() {
    document.getElementById('stat-xp-val').innerText = `${userStats.xp} XP`;
    document.getElementById('stat-words-val').innerText = userStats.words;
}

// --- НАВИГАЦИЯ И ИНИЦИАЛИЗАЦИЯ ---
function switchTab(tabName, event) {
    const screens = {
        'learn': 'learn-screen',
        'dictionary': 'dictionary-screen',
        'translator': 'translator-screen',
        'profile': 'profile-screen'
    };

    Object.values(screens).forEach(id => document.getElementById(id)?.classList.add('hidden'));
    document.getElementById('lesson-screen').classList.add('hidden');
    document.getElementById(screens[tabName])?.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
}

// Стартовая инициализация
setLanguage('rus');