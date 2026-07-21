// UI management and language system
import { AudioSystem } from './audio.js';
import { GAME_CONFIG } from './config.js';
import { translations, themes } from './data.js';
import { Storage } from './storage.js';
import { Events } from './events.js';

export const UI = {
    currentLanguage: 'de',
    currentThemeIndex: 0,
    currentPage: 1,
    crtEnabled: true,
    fpsEnabled: true,
    statusKey: 'statusReady',
    bonusTimer: null,
    menuCursorIndex: 0,
    hasBoundMenuPointerSync: false,
    storageKeys: {
        themeIndex: 'bubblebyteTheme',
        themeVars: 'bubblebyteThemeVars',
        crt: 'bubblebyteCRT',
        fps: 'bubblebyteFPS'
    },
    legacyStorageKeys: (() => {
        const legacyPrefix = ['bubble', 'Trouble'].join('');
        return {
            themeIndex: `${legacyPrefix}Theme`,
            themeVars: `${legacyPrefix}ThemeVars`,
            crt: `${legacyPrefix}CRT`,
            fps: `${legacyPrefix}FPS`
        };
    })(),

    t(key) {
        return translations[this.currentLanguage][key] || key;
    },

    getCurrentTheme() {
        return themes[this.currentThemeIndex];
    },

    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'de' ? 'en' : 'de';
        this.updateLanguageUI();
    },

    toggleTheme() {
        this.currentThemeIndex = (this.currentThemeIndex + 1) % themes.length;
        this.applyTheme();
        this.updateLanguageUI();
    },

    toggleCRT() {
        this.crtEnabled = !this.crtEnabled;
        this.updateCRTEffect();
        this.updateLanguageUI();
    },

    toggleFPS() {
        this.fpsEnabled = !this.fpsEnabled;
        this.updateFPSDisplay();
        this.updateLanguageUI();
    },

    applyTheme() {
        const theme = themes[this.currentThemeIndex];
        const root = document.documentElement;
        for (const [prop, value] of Object.entries(theme.vars)) {
            root.style.setProperty(prop, value);
        }
        try {
            localStorage.setItem(
                this.storageKeys.themeIndex,
                String(this.currentThemeIndex)
            );
            localStorage.setItem(
                this.storageKeys.themeVars,
                JSON.stringify(theme.vars)
            );
        } catch (e) {
            console.warn('Failed to save theme setting:', e);
        }
    },

    loadThemeSetting() {
        try {
            const savedTheme = localStorage.getItem(this.storageKeys.themeIndex) ?? localStorage.getItem(this.legacyStorageKeys.themeIndex);
            if (savedTheme !== null) {
                const parsed = Number.parseInt(savedTheme, 10);
                if (!Number.isNaN(parsed)) {
                    this.currentThemeIndex = Math.min(
                        Math.max(parsed, 0),
                        themes.length - 1
                    );
                    localStorage.setItem(
                        this.storageKeys.themeIndex,
                        String(this.currentThemeIndex)
                    );
                    const legacyThemeVars = localStorage.getItem(this.legacyStorageKeys.themeVars);
                    if (legacyThemeVars && !localStorage.getItem(this.storageKeys.themeVars)) {
                        localStorage.setItem(this.storageKeys.themeVars, legacyThemeVars);
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to load theme setting:', e);
        }
        this.applyTheme();
    },

    updateCRTEffect() {
        const crtOverlays = document.querySelectorAll('.crt-overlay');
        crtOverlays.forEach((overlay) => {
            if (this.crtEnabled) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        });
        if (document.body) {
            document.body.classList.toggle('crt-enabled', this.crtEnabled);
        }
        // Save to localStorage
        try {
            localStorage.setItem(
                this.storageKeys.crt,
                this.crtEnabled ? 'true' : 'false'
            );
        } catch (e) {
            console.warn('Failed to save CRT setting:', e);
        }
    },

    loadCRTSetting() {
        try {
            const saved = localStorage.getItem(this.storageKeys.crt) ?? localStorage.getItem(this.legacyStorageKeys.crt);
            if (saved !== null) {
                this.crtEnabled = saved === 'true';
                localStorage.setItem(
                    this.storageKeys.crt,
                    this.crtEnabled ? 'true' : 'false'
                );
            }
        } catch (e) {
            console.warn('Failed to load CRT setting:', e);
        }
        this.updateCRTEffect();
    },

    updateFPSDisplay() {
        const panel = document.getElementById('uiFpsPanel');
        if (!panel) return;
        panel.classList.toggle('hidden', !this.fpsEnabled);
        try {
            localStorage.setItem(
                this.storageKeys.fps,
                this.fpsEnabled ? 'true' : 'false'
            );
        } catch (e) {
            console.warn('Failed to save FPS setting:', e);
        }
    },

    loadFPSSetting() {
        try {
            const saved = localStorage.getItem(this.storageKeys.fps) ?? localStorage.getItem(this.legacyStorageKeys.fps);
            if (saved !== null) {
                this.fpsEnabled = saved === 'true';
                localStorage.setItem(
                    this.storageKeys.fps,
                    this.fpsEnabled ? 'true' : 'false'
                );
            }
        } catch (e) {
            console.warn('Failed to load FPS setting:', e);
        }
        this.updateFPSDisplay();
    },

    updateFullscreenToggle() {
        const button = document.getElementById('fullscreenToggle');
        if (!button) {
            return;
        }
        const isFullscreen = Boolean(document.fullscreenElement);
        button.textContent = this.t(isFullscreen ? 'fullscreenOn' : 'fullscreenOff');
        const pauseButton = document.getElementById('pauseFullscreenToggle');
        if (pauseButton) {
            pauseButton.textContent = this.t(
                isFullscreen ? 'fullscreenOn' : 'fullscreenOff'
            );
        }
    },

    updateLanguageUI() {
        const t = (key) => this.t(key);

        document.getElementById('mainTitle').textContent = t('mainTitle');
        document.getElementById('menuPlayBtn').textContent = t('menuPlay');
        document.getElementById('menuSelectLevelBtn').textContent = 
            t('menuSelectLevel');
        document.getElementById('menuSettingsBtn').textContent = 
            t('menuSettings');
        document.getElementById('menuStatsBtn').textContent = t('menuStats');
        document.getElementById('selectLevelTitle').textContent = 
            t('selectLevelTitle');
        document.getElementById('settingsTitle').textContent = 
            t('settingsTitle');
        document.getElementById('statsTitle').textContent = t('statsTitle');
        document.getElementById('levelMenuBackBtn').textContent = 
            t('menuBack');
        document.getElementById('settingsMenuBackBtn').textContent = 
            t('menuBack');
        document.getElementById('statsMenuBackBtn').textContent = t('menuBack');

        const menuHint = document.getElementById('menuHint');
        menuHint.innerHTML = `
            <p>bubblebyte v0.1b</p>
        `;

        document.getElementById('highestLevelLabel').textContent = 
            t('highestLevelLabel');
        document.getElementById('highScoreLabel').textContent = 
            t('highScoreLabel');
        document.getElementById('resetProgressBtn').textContent = 
            t('resetProgress');
        document.getElementById('languageToggle').textContent = 
            t('languageToggle');
        document.getElementById('themeToggle').textContent = 
            `${t('themeLabel')} ${t(themes[this.currentThemeIndex].name)}`;
        document.getElementById('musicToggle').textContent = 
            AudioSystem.musicEnabled ? t('musicOn') : t('musicOff');
        document.getElementById('sfxToggle').textContent = 
            AudioSystem.sfxEnabled ? t('sfxOn') : t('sfxOff');
        document.getElementById('fpsToggle').textContent =
            this.fpsEnabled ? t('fpsOn') : t('fpsOff');
        document.getElementById('crtToggle').textContent = 
            this.crtEnabled ? t('crtOn') : t('crtOff');
        this.updateFullscreenToggle();

        document.getElementById('uiLevelLabel').textContent = t('level');
        document.getElementById('uiScoreLabel').textContent = t('score');
        document.getElementById('uiLivesLabel').textContent = t('lives');
        document.getElementById('uiTimeLabel').textContent = t('time');
        document.getElementById('uiStatusLabel').textContent = t('status');
        document.getElementById('uiStatusValue').textContent = 
            t(this.statusKey);
        const powerWireIndicator = document.getElementById('powerWireIndicator');
        if (powerWireIndicator) {
            powerWireIndicator.textContent = t('powerWireActive');
        }

        document.getElementById('gameOverText').textContent = t('gameOver');
        document.getElementById('mainMenuBtn').textContent = t('mainMenu');
        document.getElementById('playAgainBtn').textContent = t('playAgain');

        document.getElementById('pauseTitle').textContent = t('paused');
        document.getElementById('resumeBtn').textContent = t('resume');
        document.getElementById('pauseMusicToggle').textContent = 
            AudioSystem.musicEnabled ? t('musicOn') : t('musicOff');
        document.getElementById('pauseSfxToggle').textContent = 
            AudioSystem.sfxEnabled ? t('sfxOn') : t('sfxOff');
        document.getElementById('pauseCRTToggle').textContent = 
            this.crtEnabled ? t('crtOn') : t('crtOff');
        document.getElementById('pauseFullscreenToggle').textContent =
            t(document.fullscreenElement ? 'fullscreenOn' : 'fullscreenOff');
        document.getElementById('restartLevelBtn').textContent = 
            t('restartLevel');
        document.getElementById('pauseMainMenuBtn').textContent = t('mainMenu');

        this.renderLevelButtons(this.currentPage);
        this.syncMenuCursor();
    },

    setStatus(key) {
        this.statusKey = key;
        const el = document.getElementById('uiStatusValue');
        if (el) {
            el.textContent = this.t(key);
        }
    },

    showBonus(message, duration = 1200) {
        const el = document.getElementById('uiBonus');
        if (!el) return;
        el.textContent = message;
        el.classList.remove('show');
        void el.offsetWidth;
        el.classList.add('show');
        if (this.bonusTimer) {
            clearTimeout(this.bonusTimer);
        }
        this.bonusTimer = setTimeout(() => {
            el.classList.remove('show');
        }, duration);
    },

    updateFps(value) {
        const panel = document.getElementById('uiFpsPanel');
        const el = document.getElementById('uiFpsValue');
        if (!panel || !el) return;
        if (!this.fpsEnabled) {
            return;
        }
        const displayValue = Math.round(value);
        el.textContent = Number.isFinite(displayValue) ? displayValue : '--';
        panel.classList.toggle('alert', displayValue < 60);
    },

    updateGameUI(gameState) {
        document.getElementById('level').textContent = gameState.level;
        document.getElementById('score').textContent = gameState.score;
        const livesEl = document.getElementById('lives');
        const timeEl = document.getElementById('timer');
        livesEl.textContent = gameState.lives;
        timeEl.textContent = gameState.time;

        livesEl.classList.toggle(
            'alert',
            gameState.lives <= GAME_CONFIG.LOW_LIVES_THRESHOLD
        );
        timeEl.classList.toggle(
            'alert',
            gameState.time <= GAME_CONFIG.LOW_TIME_THRESHOLD
        );
    },

    updateMenuStats() {
        const progress = Storage.load();
        document.getElementById('highestLevel').textContent = 
            progress.highestLevel;
        document.getElementById('highScore').textContent = progress.highScore;
    },

    showLevelScreen(title, subtitle, options = {}) {
        const {
            variant = 'neutral',
            icon = '◆',
            metaLine1 = '',
            metaLine2 = '',
            durationMs = 0
        } = options;

        const screen = document.getElementById('levelScreen');
        const progressBar = document.getElementById('levelProgressBar');

        document.getElementById('levelText').textContent = title;
        document.getElementById('levelSubtext').textContent = subtitle;
        document.getElementById('levelIcon').textContent = icon;
        document.getElementById('levelMetaLine1').textContent = metaLine1;
        document.getElementById('levelMetaLine2').textContent = metaLine2;

        screen.dataset.variant = variant;
        screen.style.display = 'block';
        screen.classList.remove('show');
        void screen.offsetWidth;
        screen.classList.add('show');

        if (durationMs > 0) {
            progressBar.style.transition = 'none';
            progressBar.style.transform = 'scaleX(1)';
            void progressBar.offsetWidth;
            progressBar.style.transition = `transform ${durationMs}ms linear`;
            progressBar.style.transform = 'scaleX(0)';
        } else {
            progressBar.style.transition = 'none';
            progressBar.style.transform = 'scaleX(1)';
        }
    },

    hideLevelScreen() {
        const screen = document.getElementById('levelScreen');
        screen.style.display = 'none';
        screen.classList.remove('show');
    },

    showGameOver(score, level) {
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('finalScore').textContent = 
            `${this.t('finalScore')} ${score}`;
        document.getElementById('levelReached').textContent = 
            `${this.t('levelReached')} ${level}`;
    },

    hideGameOver() {
        document.getElementById('gameOver').style.display = 'none';
    },

    showPauseMenu() {
        document.getElementById('pauseMenu').style.display = 'block';
        this.menuCursorIndex = 0;
        this.syncPauseMenuCursor();
    },

    hidePauseMenu() {
        document.getElementById('pauseMenu').style.display = 'none';
        this.clearPauseMenuCursor();
    },

    showMainMenu() {
        document.getElementById('mainMenu').style.display = 'block';
        this.hideLevelMenu();
        this.hideSettingsMenu();
        this.hideStatsMenu();
        if (typeof window.applyResponsiveScale === 'function') {
            window.applyResponsiveScale();
        }
    },

    hideMainMenu() {
        document.getElementById('mainMenu').style.display = 'none';
    },

    updateMenuWindowState() {
        const mainMenu = document.getElementById('mainMenu');
        const levelMenuActive = document
            .getElementById('levelMenu')
            .classList.contains('active');
        const settingsMenuActive = document
            .getElementById('settingsMenu')
            .classList.contains('active');
        const statsMenuActive = document
            .getElementById('statsMenu')
            .classList.contains('active');
        if (levelMenuActive || settingsMenuActive || statsMenuActive) {
            mainMenu.classList.add('menu-window-open');
        } else {
            mainMenu.classList.remove('menu-window-open');
        }
    },

    showLevelMenu() {
        document.getElementById('levelMenu').classList.add('active');
        document.getElementById('levelMenu').setAttribute('aria-hidden', 'false');
        this.updateMenuWindowState();
        this.menuCursorIndex = 0;
        this.syncMenuCursor();
    },

    hideLevelMenu() {
        document.getElementById('levelMenu').classList.remove('active');
        document.getElementById('levelMenu').setAttribute('aria-hidden', 'true');
        this.updateMenuWindowState();
        this.menuCursorIndex = 0;
        this.syncMenuCursor();
    },

    showSettingsMenu() {
        document.getElementById('settingsMenu').classList.add('active');
        document.getElementById('settingsMenu').setAttribute('aria-hidden', 'false');
        this.updateMenuWindowState();
        this.menuCursorIndex = 0;
        this.syncMenuCursor();
    },

    hideSettingsMenu() {
        document.getElementById('settingsMenu').classList.remove('active');
        document.getElementById('settingsMenu').setAttribute('aria-hidden', 'true');
        this.updateMenuWindowState();
        this.menuCursorIndex = 0;
        this.syncMenuCursor();
    },

    showStatsMenu() {
        document.getElementById('statsMenu').classList.add('active');
        document.getElementById('statsMenu').setAttribute('aria-hidden', 'false');
        this.updateMenuWindowState();
        this.menuCursorIndex = 0;
        this.syncMenuCursor();
    },

    hideStatsMenu() {
        document.getElementById('statsMenu').classList.remove('active');
        document.getElementById('statsMenu').setAttribute('aria-hidden', 'true');
        this.updateMenuWindowState();
        this.menuCursorIndex = 0;
        this.syncMenuCursor();
    },

    showGameContainer() {
        document.getElementById('gameContainer').style.display = 'block';
        if (typeof window.applyResponsiveScale === 'function') {
            window.applyResponsiveScale();
        }
    },

    hideGameContainer() {
        document.getElementById('gameContainer').style.display = 'none';
    },

    renderLevelButtons(page = 1) {
        const progress = Storage.load();
        const container = document.getElementById('levelButtons');
        container.innerHTML = '';

        const totalPages = Math.ceil(
            GAME_CONFIG.TOTAL_LEVELS / GAME_CONFIG.LEVELS_PER_PAGE
        );
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        this.currentPage = page;

        const startLevel = (page - 1) * GAME_CONFIG.LEVELS_PER_PAGE + 1;
        const endLevel = Math.min(
            page * GAME_CONFIG.LEVELS_PER_PAGE, 
            GAME_CONFIG.TOTAL_LEVELS
        );

        for (let i = startLevel; i <= endLevel; i++) {
            const button = document.createElement('button');
            button.className = 'menu-button';
            const isUnlocked = progress.unlockedLevels.includes(i);
            button.disabled = !isUnlocked;
            button.textContent = `${this.t('level')} ${i}`;

            if (isUnlocked) {
                const levelNum = i;
                button.addEventListener('click', () => {
                    AudioSystem.init();
                    AudioSystem.playSound('menu');
                    Events.dispatchEvent(
                        new CustomEvent('start-level', {
                            detail: { level: levelNum }
                        })
                    );
                });
            }
            container.appendChild(button);
        }

        if (GAME_CONFIG.TOTAL_LEVELS > GAME_CONFIG.LEVELS_PER_PAGE) {
            this.renderPagination(page);
        } else {
            document.getElementById('pagination').innerHTML = '';
        }
        this.syncMenuCursor();
    },

    renderPagination(currentPageNum) {
        const paginationContainer = document.getElementById('pagination');
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(
            GAME_CONFIG.TOTAL_LEVELS / GAME_CONFIG.LEVELS_PER_PAGE
        );

        if (totalPages <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.className = 'page-button';
        prevButton.textContent = '◀';
        prevButton.setAttribute('aria-label', 'Previous page');
        prevButton.disabled = currentPageNum === 1;
        prevButton.addEventListener('click', () => {
            if (currentPageNum > 1) {
                AudioSystem.init();
                AudioSystem.playSound('menu');
                this.renderLevelButtons(currentPageNum - 1);
            }
        });
        paginationContainer.appendChild(prevButton);

        const pageCounter = document.createElement('span');
        pageCounter.className = 'page-counter';
        pageCounter.textContent = `${currentPageNum} / ${totalPages}`;
        paginationContainer.appendChild(pageCounter);

        const nextButton = document.createElement('button');
        nextButton.className = 'page-button';
        nextButton.textContent = '▶';
        nextButton.setAttribute('aria-label', 'Next page');
        nextButton.disabled = currentPageNum === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPageNum < totalPages) {
                AudioSystem.init();
                AudioSystem.playSound('menu');
                this.renderLevelButtons(currentPageNum + 1);
            }
        });
        paginationContainer.appendChild(nextButton);
    },

    changeLevelPage(delta) {
        if (this.getActiveMenuKey() !== 'level') {
            return false;
        }
        const totalPages = Math.ceil(
            GAME_CONFIG.TOTAL_LEVELS / GAME_CONFIG.LEVELS_PER_PAGE
        );
        if (totalPages <= 1) {
            return false;
        }
        const nextPage = Math.min(
            totalPages,
            Math.max(1, this.currentPage + delta)
        );
        if (nextPage === this.currentPage) {
            return false;
        }

        AudioSystem.init();
        AudioSystem.playSound('menu');
        this.renderLevelButtons(nextPage);
        this.menuCursorIndex = 1;
        this.syncMenuCursor();
        return true;
    },


    isPauseMenuOpen() {
        const pauseMenu = document.getElementById('pauseMenu');
        if (!pauseMenu) {
            return false;
        }
        return window.getComputedStyle(pauseMenu).display !== 'none';
    },

    getPauseMenuButtons() {
        return Array.from(
            document.querySelectorAll('#pauseMenu .menu-button:not(:disabled)')
        );
    },

    clearPauseMenuCursor() {
        const markedButtons = document.querySelectorAll(
            '#pauseMenu .menu-button-nav-selected'
        );
        markedButtons.forEach((button) => {
            button.classList.remove('menu-button-nav-selected');
        });
    },

    syncPauseMenuCursor() {
        const buttons = this.getPauseMenuButtons();
        this.clearPauseMenuCursor();
        if (!buttons.length) {
            this.menuCursorIndex = 0;
            return;
        }
        if (this.menuCursorIndex >= buttons.length) {
            this.menuCursorIndex = 0;
        }
        if (this.menuCursorIndex < 0) {
            this.menuCursorIndex = buttons.length - 1;
        }
        buttons[this.menuCursorIndex].classList.add('menu-button-nav-selected');
    },

    movePauseMenuCursor(delta) {
        const buttons = this.getPauseMenuButtons();
        if (!buttons.length) {
            return;
        }
        this.menuCursorIndex =
            (this.menuCursorIndex + delta + buttons.length) % buttons.length;
        this.syncPauseMenuCursor();
    },

    activatePauseMenuCursor() {
        const buttons = this.getPauseMenuButtons();
        if (!buttons.length) {
            return;
        }
        const target = buttons[this.menuCursorIndex];
        if (target && !target.disabled) {
            target.click();
        }
    },

    handlePauseMenuKeyDown(event) {
        if (!this.isPauseMenuOpen()) {
            return false;
        }
        if (event.key === 'ArrowUp' || event.key === 'w') {
            this.movePauseMenuCursor(-1);
            event.preventDefault();
            return true;
        }
        if (event.key === 'ArrowDown' || event.key === 's') {
            this.movePauseMenuCursor(1);
            event.preventDefault();
            return true;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            this.activatePauseMenuCursor();
            event.preventDefault();
            return true;
        }
        if (event.key === 'Escape') {
            const resumeButton = document.getElementById('resumeBtn');
            if (resumeButton) {
                resumeButton.click();
                event.preventDefault();
                return true;
            }
        }
        return false;
    },

    getActiveMenuKey() {
        if (document.getElementById('levelMenu').classList.contains('active')) {
            return 'level';
        }
        if (document.getElementById('settingsMenu').classList.contains('active')) {
            return 'settings';
        }
        if (document.getElementById('statsMenu').classList.contains('active')) {
            return 'stats';
        }
        return 'main';
    },

    getMenuButtons() {
        const menuKey = this.getActiveMenuKey();
        const selectors = {
            main: ['#menuPlayBtn', '#menuSelectLevelBtn', '#menuStatsBtn', '#menuSettingsBtn'],
            level: ['#levelMenuBackBtn', '#levelButtons .menu-button:not(:disabled)', '#pagination .page-button:not(:disabled)'],
            stats: ['#statsMenuBackBtn'],
            settings: ['#settingsMenuBackBtn', '#settingsMenu .menu-window-body .menu-button:not(:disabled)']
        };
        const list = selectors[menuKey] || [];
        return list.flatMap((selector) =>
            Array.from(document.querySelectorAll(selector))
        );
    },

    syncMenuCursor() {
        const buttons = this.getMenuButtons();
        const markedButtons = document.querySelectorAll(
            '#mainMenu .menu-button-selected, #mainMenu .menu-button-nav-selected, #mainMenu .page-button.menu-button-nav-selected'
        );
        markedButtons.forEach((button) => {
            button.classList.remove('menu-button-nav-selected');
            button.classList.remove('menu-button-selected');
        });
        if (!buttons.length) {
            this.menuCursorIndex = 0;
            return;
        }
        if (this.menuCursorIndex >= buttons.length) {
            this.menuCursorIndex = 0;
        }
        if (this.menuCursorIndex < 0) {
            this.menuCursorIndex = buttons.length - 1;
        }
        const selected = buttons[this.menuCursorIndex];
        if (selected.classList.contains('menu-button') || selected.classList.contains('page-button')) {
            selected.classList.add('menu-button-nav-selected');
            if (this.getActiveMenuKey() === 'main') {
                selected.classList.add('menu-button-selected');
            }
        }
    },

    moveMenuCursor(delta) {
        const buttons = this.getMenuButtons();
        if (!buttons.length) {
            return;
        }
        this.menuCursorIndex = (this.menuCursorIndex + delta + buttons.length) % buttons.length;
        this.syncMenuCursor();
    },

    activateMenuCursor() {
        const buttons = this.getMenuButtons();
        if (!buttons.length) {
            return;
        }
        const target = buttons[this.menuCursorIndex];
        if (target && !target.disabled) {
            target.click();
        }
    },

    adjustCurrentSetting(delta) {
        if (this.getActiveMenuKey() !== 'settings') {
            return false;
        }
        const buttons = this.getMenuButtons();
        if (!buttons.length) {
            return false;
        }
        const target = buttons[this.menuCursorIndex];
        if (!target || target.disabled) {
            return false;
        }
        if (target.id === 'settingsMenuBackBtn' || target.id === 'resetProgressBtn') {
            return false;
        }
        if (target.id === 'themeToggle' && delta < 0) {
            const next = (this.currentThemeIndex - 1 + themes.length) % themes.length;
            this.currentThemeIndex = next;
            this.applyTheme();
            this.updateLanguageUI();
            return true;
        }
        target.click();
        return true;
    },

    bindMenuPointerSync() {
        if (this.hasBoundMenuPointerSync) {
            return;
        }
        const mainMenu = document.getElementById('mainMenu');
        if (!mainMenu) {
            return;
        }
        const syncFromPointer = (event) => {
            const button = event.target.closest('#mainMenu .menu-button, #mainMenu .page-button');
            if (!button || button.disabled) {
                return;
            }
            const buttons = this.getMenuButtons();
            const idx = buttons.indexOf(button);
            if (idx === -1) {
                return;
            }
            this.menuCursorIndex = idx;
            this.syncMenuCursor();
        };
        mainMenu.addEventListener('mouseover', syncFromPointer);
        this.hasBoundMenuPointerSync = true;
    },

    handleMenuKeyDown(event) {
        const mainMenu = document.getElementById('mainMenu');
        if (!mainMenu || mainMenu.style.display === 'none') {
            return false;
        }
        if (event.key === 'ArrowUp' || event.key === 'w') {
            this.moveMenuCursor(-1);
            event.preventDefault();
            return true;
        }
        if (event.key === 'ArrowDown' || event.key === 's') {
            this.moveMenuCursor(1);
            event.preventDefault();
            return true;
        }
        if (event.key === 'ArrowLeft' || event.key === 'a') {
            if (this.adjustCurrentSetting(-1) || this.changeLevelPage(-1)) {
                event.preventDefault();
                return true;
            }
        }
        if (event.key === 'ArrowRight' || event.key === 'd') {
            if (this.adjustCurrentSetting(1) || this.changeLevelPage(1)) {
                event.preventDefault();
                return true;
            }
        }
        if (event.key === 'Enter' || event.key === ' ') {
            this.activateMenuCursor();
            event.preventDefault();
            return true;
        }
        if (event.key === 'Escape') {
            if (this.getActiveMenuKey() === 'level') {
                this.hideLevelMenu();
                event.preventDefault();
                return true;
            }
            if (this.getActiveMenuKey() === 'settings') {
                this.hideSettingsMenu();
                event.preventDefault();
                return true;
            }
            if (this.getActiveMenuKey() === 'stats') {
                this.hideStatsMenu();
                event.preventDefault();
                return true;
            }
        }
        return false;
    }

};
