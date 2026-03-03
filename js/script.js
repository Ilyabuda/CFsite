document.getElementById('year').innerText = new Date().getFullYear();

// --- Translations ---
const i18n = {
    en: {
        appTitle: "Lumina Flashcards", editMode: "Edit Deck", studyMode: "Study Mode",
        addCard: "Add New Card", term: "Term", definition: "Definition", share: "Share",
        copied: "Copied!", settings: "Settings", theme: "Theme", animation: "Animation",
        language: "Language", studyType: "Study Type", typeFlip: "Classic Flip",
        typeMCQ: "Multiple Choice", typeTyping: "Typing Practice", animFlip: "3D Flip",
        animFade: "Fade", animSlide: "Slide", startStudy: "Start Studying",
        backToEdit: "Back to Editor", next: "Next", prev: "Previous", finish: "Finish",
        restart: "Restart", correct: "Correct!", incorrect: "Incorrect. The correct answer was:",
        typeAnswer: "Type the definition here...", submit: "Submit", results: "Study Session Complete!",
        score: "Your Score", aboutTitle: "About the Project",
        aboutText: "Developed collaboratively by a dedicated team of high school students. Our mission is to provide a lightweight, aesthetically pleasing, and highly effective learning platform. We built Lumina Flashcards to help students worldwide master their subjects, retain knowledge effortlessly, and easily share their custom study sets with peers."
    },
    es: {
        appTitle: "Tarjetas Lumina", editMode: "Editar Mazo", studyMode: "Modo Estudio",
        addCard: "Añadir Tarjeta", term: "Término", definition: "Definición", share: "Compartir",
        copied: "¡Copiado!", settings: "Ajustes", theme: "Tema", animation: "Animación",
        language: "Idioma", studyType: "Tipo de Estudio", typeFlip: "Giro Clásico",
        typeMCQ: "Opción Múltiple", typeTyping: "Práctica de Escritura", animFlip: "Giro 3D",
        animFade: "Desvanecer", animSlide: "Deslizar", startStudy: "Empezar a Estudiar",
        backToEdit: "Volver al Editor", next: "Siguiente", prev: "Anterior", finish: "Terminar",
        restart: "Reiniciar", correct: "¡Correcto!", incorrect: "Incorrecto. La respuesta era:",
        typeAnswer: "Escribe la definición aquí...", submit: "Enviar", results: "¡Sesión Completada!",
        score: "Tu Puntuación", aboutTitle: "Sobre el Proyecto",
        aboutText: "Desarrollado en colaboración por un equipo dedicado de estudiantes de secundaria. Nuestra misión es proporcionar una plataforma de aprendizaje ligera, estéticamente agradable y altamente efectiva. Creamos Tarjetas Lumina para ayudar a estudiantes de todo el mundo a dominar sus materias y compartir fácilmente sus conjuntos de estudio."
    }
};

const defaultCards = [
    { id: '1', term: 'Photosynthesis', def: 'The process by which plants use sunlight to synthesize foods from carbon dioxide and water.' },
    { id: '2', term: 'Mitochondria', def: 'An organelle found in large numbers in most cells, in which the biochemical processes of respiration and energy production occur.' },
    { id: '3', term: 'Pythagorean Theorem', def: 'In a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides.' }
];

// --- Global Application State ---
const state = {
    cards: [...defaultCards],
    mode: 'edit', // 'edit' or 'study'
    theme: 'light', // light, dark, ocean, midnight
    language: 'en',
    studyType: 'flip', // flip, mcq, typing
    animation: 'flip', // flip, fade, slide
    
    // Study session data
    currentIndex: 0,
    isFlipped: false,
    score: 0,
    sessionComplete: false,
    mcqOptions: [],
    answeredState: null, // null, 'correct', 'incorrect'
    typingInput: ""
};

// --- Application Logic ---
window.app = {
    init() {
        // Check URL for shared data
        const params = new URLSearchParams(window.location.search);
        const data = params.get('data');
        if (data) {
            try {
                const decoded = JSON.parse(decodeURIComponent(atob(data)));
                if (Array.isArray(decoded) && decoded.length > 0) {
                    state.cards = decoded;
                }
            } catch (e) { console.error("Failed to load shared deck", e); }
        }

        this.applyTheme();
        this.updateTranslations();
        this.render();
    },

    // State Modifiers
    updateCard(id, field, value) {
        const card = state.cards.find(c => c.id === id);
        if (card) card[field] = value;
        // No full re-render needed for typing in inputs, keeps focus
    },
    
    addCard() {
        state.cards.push({ id: Date.now().toString(), term: '', def: '' });
        this.render();
    },

    deleteCard(id) {
        state.cards = state.cards.filter(c => c.id !== id);
        this.render();
    },

    setMode(mode) {
        state.mode = mode;
        if (mode === 'study') {
            state.currentIndex = 0;
            state.score = 0;
            state.sessionComplete = false;
            this.resetStudyCard();
        }
        this.render();
    },

    resetStudyCard() {
        state.isFlipped = false;
        state.answeredState = null;
        state.typingInput = "";
        if (state.studyType === 'mcq') this.generateMCQ();
    },

    nextCard() {
        if (state.currentIndex < state.cards.length - 1) {
            state.currentIndex++;
            this.resetStudyCard();
        } else {
            state.sessionComplete = true;
        }
        this.render();
    },

    prevCard() {
        if (state.currentIndex > 0) {
            state.currentIndex--;
            this.resetStudyCard();
            this.render();
        }
    },

    toggleFlip() {
        if (state.studyType === 'flip') {
            state.isFlipped = !state.isFlipped;
            this.render();
        }
    },

    generateMCQ() {
        if (state.cards.length === 0) return;
        const currentDef = state.cards[state.currentIndex].def;
        let others = state.cards.filter((_, i) => i !== state.currentIndex).map(c => c.def);
        others.sort(() => 0.5 - Math.random());
        
        let options = [currentDef, ...others.slice(0, 3)];
        options.sort(() => 0.5 - Math.random());
        state.mcqOptions = options;
    },

    answerMCQ(option) {
        if (state.answeredState) return;
        const isCorrect = option === state.cards[state.currentIndex].def;
        state.answeredState = isCorrect ? 'correct' : 'incorrect';
        if (isCorrect) state.score++;
        this.render();
    },

    updateTyping(val) {
        state.typingInput = val;
    },

    submitTyping(e) {
        e.preventDefault();
        if (state.answeredState) {
            this.nextCard();
            return;
        }
        const correctDef = state.cards[state.currentIndex].def.trim().toLowerCase();
        const userDef = state.typingInput.trim().toLowerCase();
        const isCorrect = correctDef === userDef || (userDef.length > 3 && correctDef.includes(userDef));
        
        state.answeredState = isCorrect ? 'correct' : 'incorrect';
        if (isCorrect) state.score++;
        this.render();
    },

    shareDeck() {
        const encoded = btoa(encodeURIComponent(JSON.stringify(state.cards)));
        const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
        
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            const textEl = document.getElementById('share-text');
            const iconEl = document.getElementById('share-icon');
            textEl.innerText = i18n[state.language].copied;
            iconEl.setAttribute('data-lucide', 'check');
            document.getElementById('share-btn').classList.add('text-green-500');
            lucide.createIcons();
            
            setTimeout(() => {
                textEl.innerText = i18n[state.language].share;
                iconEl.setAttribute('data-lucide', 'share-2');
                document.getElementById('share-btn').classList.remove('text-green-500');
                lucide.createIcons();
            }, 2000);
        } catch (err) {}
        document.body.removeChild(textArea);
    },

    // UI & Settings Modifiers
    toggleSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            this.renderSettings();
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    setTheme(t) { state.theme = t; this.applyTheme(); this.renderSettings(); },
    setLang(l) { state.language = l; this.updateTranslations(); this.renderSettings(); this.render(); },
    setStudyType(t) { state.studyType = t; this.renderSettings(); if(state.mode === 'study') this.resetStudyCard(); this.render(); },
    setAnimation(a) { state.animation = a; this.renderSettings(); },

    applyTheme() {
        document.body.className = `min-h-screen flex flex-col font-sans theme-${state.theme}`;
    },

    updateTranslations() {
        const t = i18n[state.language];
        document.getElementById('app-title').innerText = t.appTitle;
        document.getElementById('share-text').innerText = t.share;
        document.getElementById('settings-title').innerHTML = `<i data-lucide="settings" class="w-6 h-6"></i> ${t.settings}`;
        document.getElementById('about-title').innerText = t.aboutTitle;
        document.getElementById('about-text').innerText = t.aboutText;
        
        // Update Settings Labels
        document.getElementById('label-theme').innerHTML = `<i data-lucide="palette" class="w-4 h-4"></i> ${t.theme}`;
        document.getElementById('label-study-type').innerHTML = `<i data-lucide="book-open" class="w-4 h-4"></i> ${t.studyType}`;
        document.getElementById('label-anim').innerHTML = `<i data-lucide="wand-2" class="w-4 h-4"></i> ${t.animation}`;
        document.getElementById('label-lang').innerHTML = `<i data-lucide="globe" class="w-4 h-4"></i> ${t.language}`;
        lucide.createIcons();
    },

    // --- Rendering ---
    render() {
        const main = document.getElementById('app-main');
        if (state.mode === 'edit') {
            main.innerHTML = this.getEditorHTML();
        } else {
            main.innerHTML = this.getStudyHTML();
        }
        lucide.createIcons();
        
        // Focus typing input if active
        const typingEl = document.getElementById('typing-input');
        if (typingEl && state.answeredState === null) typingEl.focus();
    },

    renderSettings() {
        const t = i18n[state.language];
        
        // Themes
        const themes = ['light', 'dark', 'ocean', 'midnight'];
        document.getElementById('theme-options').innerHTML = themes.map(th => 
            `<button onclick="app.setTheme('${th}')" class="p-3 rounded-xl border-2 font-medium capitalize transition-all ${state.theme === th ? 'themed-btn themed-border' : 'border-transparent bg-black/5 hover:bg-black/10'}">${th}</button>`
        ).join('');

        // Study Types
        const types = [
            { id: 'flip', icon: 'rotate-ccw', label: t.typeFlip },
            { id: 'mcq', icon: 'check-circle-2', label: t.typeMCQ },
            { id: 'typing', icon: 'type', label: t.typeTyping }
        ];
        document.getElementById('study-options').innerHTML = types.map(ty => 
            `<button onclick="app.setStudyType('${ty.id}')" class="p-3 rounded-xl border-2 text-left font-medium flex items-center gap-3 ${state.studyType === ty.id ? 'themed-btn themed-border' : 'border-transparent bg-black/5 hover:bg-black/10'}">
                <i data-lucide="${ty.icon}" class="w-5 h-5"></i> ${ty.label}
            </button>`
        ).join('');

        // Animation Controls (Toggle visibility based on study type)
        const animContainer = document.getElementById('animation-container');
        if (state.studyType === 'flip') {
            animContainer.classList.remove('hidden');
            const anims = ['flip', 'fade', 'slide'];
            document.getElementById('anim-options').innerHTML = anims.map(a => 
                `<button onclick="app.setAnimation('${a}')" class="flex-1 p-2 rounded-lg font-medium capitalize transition-all ${state.animation === a ? 'shadow-md themed-card' : 'opacity-70 hover:opacity-100'}">
                    ${t['anim' + a.charAt(0).toUpperCase() + a.slice(1)]}
                </button>`
            ).join('');
        } else {
            animContainer.classList.add('hidden');
        }

        // Languages
        document.getElementById('lang-options').innerHTML = Object.keys(i18n).map(l => 
            `<button onclick="app.setLang('${l}')" class="flex-1 p-2 rounded-lg font-medium uppercase transition-all ${state.language === l ? 'shadow-md themed-card' : 'opacity-70 hover:opacity-100'}">${l}</button>`
        ).join('');

        lucide.createIcons();
    },

    getEditorHTML() {
        const t = i18n[state.language];
        let cardsHtml = state.cards.map((card, index) => `
            <div class="p-5 rounded-2xl shadow-sm border themed-card themed-border flex flex-col md:flex-row gap-4 relative group">
                <span class="absolute -left-3 -top-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm bg-inherit border inherit themed-card">
                    ${index + 1}
                </span>
                <div class="flex-1 space-y-2">
                    <label class="text-sm opacity-70 font-semibold uppercase tracking-wider">${t.term}</label>
                    <input type="text" value="${card.term.replace(/"/g, '&quot;')}" oninput="app.updateCard('${card.id}', 'term', this.value)" class="w-full p-3 rounded-lg bg-transparent border-2 focus:outline-none transition-colors themed-border focus:border-current" placeholder="e.g. Mitochondria">
                </div>
                <div class="flex-1 space-y-2">
                    <label class="text-sm opacity-70 font-semibold uppercase tracking-wider">${t.definition}</label>
                    <textarea oninput="app.updateCard('${card.id}', 'def', this.value)" class="w-full p-3 rounded-lg bg-transparent border-2 focus:outline-none transition-colors resize-none h-[52px] themed-border focus:border-current" placeholder="e.g. Powerhouse of the cell">${card.def}</textarea>
                </div>
                <button onclick="app.deleteCard('${card.id}')" class="mt-6 md:mt-8 p-3 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors self-end md:self-center opacity-50 hover:opacity-100" title="Delete Card">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </div>
        `).join('');

        return `
            <div class="w-full max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-2xl font-bold flex items-center gap-2">
                        <i data-lucide="edit-3" class="w-6 h-6"></i> ${t.editMode}
                    </h2>
                    <button onclick="app.setMode('study')" ${state.cards.length === 0 ? 'disabled' : ''} class="flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 themed-btn">
                        <i data-lucide="play" class="w-5 h-5 fill-current"></i> ${t.startStudy}
                    </button>
                </div>
                <div class="space-y-4">${cardsHtml}</div>
                <button onclick="app.addCard()" class="w-full py-5 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 font-bold opacity-70 hover:opacity-100 transition-all themed-border hover:bg-black/5">
                    <i data-lucide="plus" class="w-6 h-6"></i> ${t.addCard}
                </button>
            </div>
        `;
    },

    getStudyHTML() {
        const t = i18n[state.language];

        if (state.sessionComplete) {
            return `
                <div class="w-full max-w-2xl mx-auto p-10 text-center rounded-3xl shadow-xl border themed-card themed-border animate-fade-in">
                    <i data-lucide="check-circle-2" class="w-24 h-24 mx-auto mb-6 opacity-80 themed-text-primary"></i>
                    <h2 class="text-4xl font-bold mb-4">${t.results}</h2>
                    ${(state.studyType === 'mcq' || state.studyType === 'typing') ? `
                        <div class="mb-8 text-2xl">
                            <span class="opacity-70">${t.score}:</span> 
                            <span class="font-bold ml-2 text-3xl">${state.score} / ${state.cards.length}</span>
                        </div>
                    ` : ''}
                    <div class="flex justify-center gap-4 mt-8">
                        <button onclick="app.setMode('study')" class="px-8 py-3 rounded-xl font-bold flex items-center gap-2 themed-btn">
                            <i data-lucide="rotate-ccw" class="w-5 h-5"></i> ${t.restart}
                        </button>
                        <button onclick="app.setMode('edit')" class="px-8 py-3 rounded-xl font-bold border-2 flex items-center gap-2 hover:bg-black/5">
                            <i data-lucide="x" class="w-5 h-5"></i> ${t.backToEdit}
                        </button>
                    </div>
                </div>
            `;
        }

        const card = state.cards[state.currentIndex];
        let cardContentHtml = '';

        // FLIP MODE
        if (state.studyType === 'flip') {
            const is3D = state.animation === 'flip';
            const frontClass = is3D ? `backface-hidden ${state.isFlipped ? 'opacity-0' : 'opacity-100 z-10'}` : (state.isFlipped ? 'hidden' : 'animate-fade-in');
            const backClass = is3D ? `backface-hidden rotate-x-180 ${state.isFlipped ? 'opacity-100 z-10' : 'opacity-0'}` : (state.isFlipped ? 'animate-fade-in' : 'hidden');
            
            let innerStyles = '';
            if (state.animation === 'fade' && state.isFlipped) innerStyles = 'opacity: 0; animation: fadeIn 0.4s forwards;';
            if (state.animation === 'slide' && state.isFlipped) innerStyles = 'transform: translateX(-20px); animation: slideIn 0.4s forwards;';

            cardContentHtml = `
                <div class="w-full h-[400px] cursor-pointer group ${is3D ? 'perspective-1000' : ''}" onclick="app.toggleFlip()">
                    <div class="w-full h-full relative ${is3D ? 'flip-card-inner' : ''} ${is3D && state.isFlipped ? 'is-flipped' : ''}">
                        <!-- Front -->
                        <div class="absolute inset-0 p-10 rounded-3xl shadow-xl border flex items-center justify-center text-center themed-card themed-border transition-opacity duration-300 ${frontClass}" style="${!is3D && !state.isFlipped ? innerStyles : ''}">
                            <h3 class="text-4xl md:text-5xl font-bold leading-tight">${card.term}</h3>
                            <span class="absolute bottom-6 opacity-40 flex items-center gap-2 text-sm uppercase tracking-widest font-semibold">
                                <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Click to flip
                            </span>
                        </div>
                        <!-- Back -->
                        <div class="absolute inset-0 p-10 rounded-3xl shadow-xl border flex items-center justify-center text-center themed-card themed-border transition-opacity duration-300 ${backClass}" style="${!is3D && state.isFlipped ? innerStyles : ''}">
                            <p class="text-2xl md:text-3xl font-medium leading-relaxed">${card.def}</p>
                            <span class="absolute bottom-6 opacity-40 flex items-center gap-2 text-sm uppercase tracking-widest font-semibold">
                                <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Click to flip
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }

        // MCQ MODE
        if (state.studyType === 'mcq') {
            let optionsHtml = state.mcqOptions.map((opt, i) => {
                const isSelectedAndCorrect = state.answeredState !== null && opt === card.def;
                const isIncorrect = state.answeredState === 'incorrect' && opt !== card.def;
                let btnClass = `p-6 rounded-xl border-2 text-left transition-all text-lg font-medium `;
                
                if (state.answeredState === null) btnClass += `hover:bg-black/5 themed-border`;
                if (isSelectedAndCorrect) btnClass += `bg-green-500/20 border-green-500 text-green-700`;
                if (isIncorrect) btnClass += `opacity-40 themed-border`;

                return `<button onclick="app.answerMCQ('${opt.replace(/'/g, "\\'")}')" class="${btnClass}" ${state.answeredState !== null ? 'disabled' : ''}>${opt}</button>`;
            }).join('');

            cardContentHtml = `
                <div class="w-full min-h-[400px] p-8 rounded-3xl shadow-xl border themed-card themed-border flex flex-col animate-slide-in">
                    <div class="flex-1 flex items-center justify-center min-h-[150px] mb-8">
                        <h3 class="text-4xl font-bold text-center">${card.term}</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${optionsHtml}</div>
                    ${state.answeredState ? `
                        <div class="mt-6 p-4 rounded-xl text-center font-bold text-lg animate-fade-in ${state.answeredState === 'correct' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}">
                            ${state.answeredState === 'correct' ? t.correct : t.incorrect}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // TYPING MODE
        if (state.studyType === 'typing') {
            let inputClass = `w-full p-6 rounded-xl border-2 bg-transparent text-xl transition-all resize-none h-32 focus:outline-none focus:border-current `;
            if (state.answeredState === 'correct') inputClass += 'border-green-500 text-green-600';
            else if (state.answeredState === 'incorrect') inputClass += 'border-red-500 text-red-600';
            else inputClass += 'themed-border';

            cardContentHtml = `
                <div class="w-full min-h-[400px] p-8 rounded-3xl shadow-xl border themed-card themed-border flex flex-col animate-fade-in">
                    <div class="flex-1 flex items-center justify-center min-h-[150px] mb-8">
                        <h3 class="text-4xl font-bold text-center">${card.term}</h3>
                    </div>
                    <form onsubmit="app.submitTyping(event)" class="space-y-6 w-full max-w-xl mx-auto flex flex-col">
                        <textarea id="typing-input" oninput="app.updateTyping(this.value)" ${state.answeredState !== null ? 'disabled' : ''} placeholder="${t.typeAnswer}" class="${inputClass}">${state.typingInput}</textarea>
                        
                        ${state.answeredState === null ? `
                            <button type="submit" class="w-full py-4 rounded-xl font-bold text-lg themed-btn">${t.submit}</button>
                        ` : `
                            <div class="animate-fade-in space-y-4 text-center">
                                <div class="p-4 rounded-xl font-bold text-lg ${state.answeredState === 'correct' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}">
                                    ${state.answeredState === 'correct' ? t.correct : t.incorrect}
                                </div>
                                ${state.answeredState === 'incorrect' ? `
                                    <div class="p-4 bg-black/5 rounded-xl text-lg text-left border themed-border">
                                        <span class="font-bold block mb-2 opacity-70">Correct Answer:</span>
                                        ${card.def}
                                    </div>
                                ` : ''}
                                <button type="submit" class="w-full py-4 rounded-xl font-bold text-lg mt-4 themed-btn">${t.next}</button>
                            </div>
                        `}
                    </form>
                </div>
            `;
        }

        const progressPercent = ((state.currentIndex + 1) / state.cards.length) * 100;

        return `
            <div class="w-full max-w-3xl mx-auto flex flex-col items-center">
                <!-- Progress -->
                <div class="w-full flex items-center gap-4 mb-8">
                    <span class="font-bold w-12 text-right">${state.currentIndex + 1}</span>
                    <div class="flex-1 h-3 rounded-full overflow-hidden border themed-border bg-black/10">
                        <div class="h-full transition-all duration-500 themed-btn" style="width: ${progressPercent}%"></div>
                    </div>
                    <span class="font-bold w-12">${state.cards.length}</span>
                </div>

                ${cardContentHtml}

                <!-- Navigation -->
                <div class="flex items-center justify-between w-full max-w-3xl mt-8">
                    <button onclick="app.prevCard()" ${state.currentIndex === 0 ? 'disabled' : ''} class="p-4 rounded-full border-2 border-transparent hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all">
                        <i data-lucide="chevron-left" class="w-8 h-8"></i>
                    </button>
                    <button onclick="app.setMode('edit')" class="px-6 py-2 rounded-lg font-bold opacity-50 hover:opacity-100 hover:bg-black/5 transition-all">
                        ${t.backToEdit}
                    </button>
                    <button onclick="app.nextCard()" ${state.answeredState === null && (state.studyType === 'mcq' || state.studyType === 'typing') ? 'disabled' : ''} class="p-4 rounded-full border-2 border-transparent transition-all ${(state.answeredState !== null || state.studyType === 'flip') ? 'hover:bg-black/5 text-current' : 'opacity-30 cursor-not-allowed'}">
                        <i data-lucide="chevron-right" class="w-8 h-8"></i>
                    </button>
                </div>
            </div>
        `;
    }
};

// Initialize App on load
window.onload = () => app.init();
