// Initialization and event listeners
import { AudioSystem } from './audio.js';
import { GAME_CONFIG } from './config.js';
import { DevTerminal } from './devterminal.js';
import { Events } from './events.js';
import { Game } from './game.js';
import { Harpoon, Player } from './player.js';
import { Renderer } from './renderer.js';
import { Storage } from './storage.js';
import { UI } from './ui.js';

window.__bubblebyteLoaded = true;

document.addEventListener('DOMContentLoaded', () => {
    const applyResponsiveScale = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 24;
        const baseWidth = GAME_CONFIG.CANVAS_WIDTH;
        const baseHeight = GAME_CONFIG.CANVAS_HEIGHT;
        const maxScale = document.fullscreenElement ? 1.5 : 1;
        const scale = Math.min(
            (viewportWidth - padding) / baseWidth,
            (viewportHeight - padding) / baseHeight,
            maxScale
        );
        const safeScale = Number.isFinite(scale) ? Math.max(scale, 0.3) : 1;
        document.documentElement.style.setProperty(
            '--game-scale',
            safeScale.toFixed(3)
        );
        const uiBar = document.getElementById('ui');
        if (uiBar) {
            const uiHeight = uiBar.getBoundingClientRect().height;
            if (uiHeight > 0) {
                GAME_CONFIG.UI_HEIGHT = Math.round(uiHeight / safeScale);
                GAME_CONFIG.CEILING_Y =
                    GAME_CONFIG.UI_HEIGHT + GAME_CONFIG.SPIKE_HEIGHT;
            }
        }
        if (Renderer && typeof Renderer.resizeCanvas === 'function') {
            Renderer.resizeCanvas();
        }
        if (Renderer && typeof Renderer.invalidateStaticLayer === 'function') {
            Renderer.invalidateStaticLayer();
        }
    };

    window.applyResponsiveScale = applyResponsiveScale;
    applyResponsiveScale();
    window.addEventListener('resize', applyResponsiveScale);
    window.addEventListener('orientationchange', applyResponsiveScale);

    // Initialize UI
    UI.loadThemeSetting();
    UI.updateMenuStats();
    UI.updateLanguageUI();
    UI.syncMenuCursor();
    UI.bindMenuPointerSync();
    UI.renderLevelButtons(1);
    UI.loadCRTSetting(); // Load CRT setting
    UI.loadFPSSetting();
    Events.addEventListener('start-level', (event) => {
        if (!event?.detail?.level) {
            return;
        }
        Game.start(event.detail.level);
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (DevTerminal && DevTerminal.isOpen) {
            return;
        }
        if (UI.handleMenuKeyDown(e)) {
            return;
        }
        if (UI.handlePauseMenuKeyDown(e)) {
            return;
        }
        if (Game.state.isPlaying) {
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                if (!Game.state.isPaused) {
                    Player.moveLeft = true;
                    e.preventDefault();
                }
            }
            if (e.key === 'ArrowRight' || e.key === 'd') {
                if (!Game.state.isPaused) {
                    Player.moveRight = true;
                    e.preventDefault();
                }
            }
            if (e.key === 'ArrowUp' || e.key === 'w') {
                if (!Game.state.isPaused) {
                    const isClimbing =
                        Player.onLadder && (Player.moveUp || Player.moveDown);
                    Player.moveUp = true;
                    if (!Game.isPowerupActive() && !isClimbing) {
                        Harpoon.shoot();
                    }
                    e.preventDefault();
                }
            }
            if (e.key === 'ArrowDown' || e.key === 's') {
                if (!Game.state.isPaused) {
                    Player.moveDown = true;
                    e.preventDefault();
                }
            }
            if (e.key === ' ') {
                if (!Game.state.isPaused) {
                    if (!Game.isPowerupActive()) {
                        Harpoon.shoot();
                    }
                }
                e.preventDefault();
            }
            if (e.key === 'Tab') {
                Game.togglePause();
                e.preventDefault();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (DevTerminal && DevTerminal.isOpen) {
            return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'a') Player.moveLeft = false;
        if (e.key === 'ArrowRight' || e.key === 'd') Player.moveRight = false;
        if (e.key === 'ArrowUp' || e.key === 'w') Player.moveUp = false;
        if (e.key === 'ArrowDown' || e.key === 's') Player.moveDown = false;
    });

    const playMenuSelect = () => {
        AudioSystem.init();
        AudioSystem.playSound('menu');
    };

    // Menu buttons
    document.getElementById('menuPlayBtn').addEventListener('click', () => {
        playMenuSelect();
        Events.dispatchEvent(
            new CustomEvent('start-level', { detail: { level: 1 } })
        );
    });

    document.getElementById('menuSelectLevelBtn').addEventListener('click', () => {
        playMenuSelect();
        UI.showLevelMenu();
        UI.hideSettingsMenu();
        UI.hideStatsMenu();
    });

    document.getElementById('menuStatsBtn').addEventListener('click', () => {
        playMenuSelect();
        UI.showStatsMenu();
        UI.hideLevelMenu();
        UI.hideSettingsMenu();
    });

    document.getElementById('menuSettingsBtn').addEventListener('click', () => {
        playMenuSelect();
        UI.showSettingsMenu();
        UI.hideLevelMenu();
        UI.hideStatsMenu();
    });

    document.getElementById('levelMenuBackBtn').addEventListener('click', () => {
        playMenuSelect();
        UI.hideLevelMenu();
    });

    document.getElementById('settingsMenuBackBtn').addEventListener('click', () => {
        playMenuSelect();
        UI.hideSettingsMenu();
    });

    document.getElementById('statsMenuBackBtn').addEventListener('click', () => {
        playMenuSelect();
        UI.hideStatsMenu();
    });

    document.getElementById('resetProgressBtn').addEventListener('click', () => {
        playMenuSelect();
        if (confirm(UI.t('resetConfirm'))) {
            Storage.reset();
            UI.updateMenuStats();
            UI.renderLevelButtons(1);
        }
    });

    document.getElementById('languageToggle').addEventListener('click', () => {
        playMenuSelect();
        UI.toggleLanguage();
    });

    document.getElementById('themeToggle').addEventListener('click', () => {
        playMenuSelect();
        UI.toggleTheme();
    });

    document.getElementById('musicToggle').addEventListener('click', () => {
        playMenuSelect();
        AudioSystem.init();
        const enabled = AudioSystem.toggleMusic();
        const text = enabled ? UI.t('musicOn') : UI.t('musicOff');
        document.getElementById('musicToggle').textContent = text;
        document.getElementById('pauseMusicToggle').textContent = text;

        if (enabled) {
            if (Game.state.isPlaying && !Game.state.isPaused) {
                AudioSystem.startGameplayMusic();
            } else if (!Game.state.isPlaying) {
                AudioSystem.startMusic();
            }
        } else {
            AudioSystem.stopMusic();
            AudioSystem.stopGameplayMusic();
        }
    });

    document.getElementById('sfxToggle').addEventListener('click', () => {
        playMenuSelect();
        const enabled = AudioSystem.toggleSfx();
        document.getElementById('sfxToggle').textContent = 
            enabled ? UI.t('sfxOn') : UI.t('sfxOff');
        document.getElementById('pauseSfxToggle').textContent = 
            enabled ? UI.t('sfxOn') : UI.t('sfxOff');
    });

    document.getElementById('fpsToggle').addEventListener('click', () => {
        playMenuSelect();
        UI.toggleFPS();
    });

    // CRT toggle in main menu
    document.getElementById('crtToggle').addEventListener('click', () => {
        playMenuSelect();
        UI.toggleCRT();
    });

    document.getElementById('fullscreenToggle').addEventListener('click', () => {
        playMenuSelect();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.warn('Failed to enter fullscreen:', err);
            });
        } else {
            document.exitFullscreen().catch((err) => {
                console.warn('Failed to exit fullscreen:', err);
            });
        }
    });

    document.addEventListener('fullscreenchange', () => {
        UI.updateFullscreenToggle();
        applyResponsiveScale();
    });

    // Game over buttons
    document.getElementById('mainMenuBtn').addEventListener('click', () => {
        playMenuSelect();
        Game.returnToMenu();
    });

    document.getElementById('playAgainBtn').addEventListener('click', () => {
        playMenuSelect();
        Game.restartGame();
    });

    // Pause menu buttons
    document.getElementById('resumeBtn').addEventListener('click', () => {
        playMenuSelect();
        Game.resume();
    });

    document.getElementById('pauseMusicToggle').addEventListener('click', () => {
        playMenuSelect();
        AudioSystem.init();
        const enabled = AudioSystem.toggleMusic();
        const text = enabled ? UI.t('musicOn') : UI.t('musicOff');
        document.getElementById('musicToggle').textContent = text;
        document.getElementById('pauseMusicToggle').textContent = text;

        if (enabled && Game.state.isPlaying && !Game.state.isPaused) {
            AudioSystem.startGameplayMusic();
        } else {
            AudioSystem.stopGameplayMusic();
        }
    });

    document.getElementById('pauseSfxToggle').addEventListener('click', () => {
        playMenuSelect();
        const enabled = AudioSystem.toggleSfx();
        document.getElementById('pauseSfxToggle').textContent = 
            enabled ? UI.t('sfxOn') : UI.t('sfxOff');
    });

    // CRT toggle in pause menu
    document.getElementById('pauseCRTToggle').addEventListener('click', () => {
        playMenuSelect();
        UI.toggleCRT();
    });

    document.getElementById('pauseFullscreenToggle').addEventListener('click', () => {
        playMenuSelect();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.warn('Failed to enter fullscreen:', err);
            });
        } else {
            document.exitFullscreen().catch((err) => {
                console.warn('Failed to exit fullscreen:', err);
            });
        }
    });

    document.getElementById('restartLevelBtn').addEventListener('click', () => {
        playMenuSelect();
        Game.restartCurrentLevel();
    });

    document.getElementById('pauseMainMenuBtn').addEventListener('click', () => {
        playMenuSelect();
        Game.returnToMenu();
    });

    // Initialize audio on first click
    document.addEventListener('click', function initMusicOnClick() {
        AudioSystem.init();
        if (AudioSystem.musicEnabled && !Game.state.isPlaying) {
            AudioSystem.startMusic();
        }
        document.removeEventListener('click', initMusicOnClick);
    }, { once: true });
});
