import { GAME_CONFIG } from './config.js';
import { Game } from './game.js';
import { Storage } from './storage.js';
import { UI } from './ui.js';

export const DevTerminal = {
    isOpen: false,
    history: [],
    historyIndex: -1,
    outputEl: null,
    inputEl: null,
    windowEl: null,
    promptText: 'player@bubblebyte:~$',

    init() {
        this.outputEl = document.getElementById('devTerminalOutput');
        this.inputEl = document.getElementById('devTerminalInput');
        this.windowEl = document.getElementById('devTerminal');

        if (!this.outputEl || !this.inputEl || !this.windowEl) return;

        this.inputEl.addEventListener('keydown', (event) => {
            event.stopPropagation();
            if (event.shiftKey && event.key.toLowerCase() === 't') {
                event.preventDefault();
                this.toggle();
                return;
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                const command = this.inputEl.value.trim();
                this.inputEl.value = '';
                this.runCommand(command);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                this.navigateHistory(-1);
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                this.navigateHistory(1);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.shiftKey && event.key.toLowerCase() === 't') {
                event.preventDefault();
                this.toggle();
            }
        });
    },

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    open() {
        this.isOpen = true;
        this.windowEl.classList.add('active');
        this.windowEl.setAttribute('aria-hidden', 'false');
        this.printLine('bubblebyte dev terminal');
        this.printLine('type "help" for commands.');
        this.focusInput();
    },

    close() {
        this.isOpen = false;
        this.windowEl.classList.remove('active');
        this.windowEl.setAttribute('aria-hidden', 'true');
        this.inputEl.value = '';
        this.historyIndex = -1;
        this.outputEl.scrollTop = this.outputEl.scrollHeight;
    },

    focusInput() {
        if (this.inputEl) {
            this.inputEl.focus({ preventScroll: true });
        }
    },

    navigateHistory(direction) {
        if (!this.history.length) return;
        if (this.historyIndex === -1) {
            this.historyIndex = this.history.length;
        }
        this.historyIndex = Math.max(
            0,
            Math.min(this.history.length, this.historyIndex + direction)
        );
        if (this.historyIndex === this.history.length) {
            this.inputEl.value = '';
        } else {
            this.inputEl.value = this.history[this.historyIndex];
        }
    },

    runCommand(command) {
        if (!this.outputEl) return;
        const trimmed = command.trim();
        this.printLine(`${this.promptText} ${command}`);
        if (!trimmed) return;

        this.history.push(trimmed);
        this.historyIndex = -1;

        const [rawCommand, ...args] = trimmed.split(/\s+/);
        const normalized = rawCommand.toLowerCase();

        switch (normalized) {
            case 'help':
                this.printLine(
                    'commands: help, clear, unlockall, lockall, stats, status'
                );
                this.printLine(
                    'game: pause, resume, restart, menu, start <level>'
                );
                break;
            case 'clear':
                this.outputEl.innerHTML = '';
                break;
            case 'unlockall':
                this.unlockAllLevels();
                this.printLine(`unlocked ${GAME_CONFIG.TOTAL_LEVELS} levels.`);
                break;
            case 'lockall':
                this.lockAllLevels();
                this.printLine('reset unlocked levels to 1.');
                break;
            case 'stats':
                this.printLine(this.formatStats());
                break;
            case 'status':
                this.printLine(this.formatGameStatus());
                break;
            case 'pause':
                if (!Game.state.isPlaying) {
                    this.printLine('game not running.');
                    break;
                }
                if (Game.state.isPaused) {
                    this.printLine('game already paused.');
                    break;
                }
                Game.pause();
                this.printLine('paused.');
                break;
            case 'resume':
                if (!Game.state.isPlaying) {
                    this.printLine('game not running.');
                    break;
                }
                if (!Game.state.isPaused) {
                    this.printLine('game already running.');
                    break;
                }
                Game.resume();
                this.printLine('resumed.');
                break;
            case 'restart':
                if (!Game.state.isPlaying) {
                    this.printLine('game not running.');
                    break;
                }
                Game.restartCurrentLevel();
                this.printLine(`restarted level ${Game.state.level}.`);
                break;
            case 'menu':
                Game.returnToMenu();
                this.printLine('returned to main menu.');
                break;
            case 'start': {
                const level = Number.parseInt(args[0], 10);
                if (!args.length || Number.isNaN(level)) {
                    this.printLine('usage: start <level>');
                    break;
                }
                if (level < 1 || level > GAME_CONFIG.TOTAL_LEVELS) {
                    this.printLine(
                        `level must be between 1 and ${GAME_CONFIG.TOTAL_LEVELS}.`
                    );
                    break;
                }
                Game.start(level);
                this.printLine(`starting level ${level}.`);
                break;
            }
            default:
                this.printLine(`command not found: ${command}`);
                break;
        }

        this.outputEl.scrollTop = this.outputEl.scrollHeight;
    },

    printLine(text) {
        const line = document.createElement('div');
        line.textContent = text;
        this.outputEl.appendChild(line);
    },

    unlockAllLevels() {
        const progress = Storage.load();
        progress.unlockedLevels = Array.from(
            { length: GAME_CONFIG.TOTAL_LEVELS },
            (_, idx) => idx + 1
        );
        progress.highestLevel = GAME_CONFIG.TOTAL_LEVELS;
        Storage.setProgress(progress);
        UI.updateMenuStats();
        UI.renderLevelButtons(UI.currentPage);
    },

    lockAllLevels() {
        const progress = Storage.load();
        progress.unlockedLevels = [1];
        progress.highestLevel = 1;
        Storage.setProgress(progress);
        UI.updateMenuStats();
        UI.renderLevelButtons(UI.currentPage);
    },

    formatStats() {
        const progress = Storage.load();
        return `highest level: ${progress.highestLevel} | ` +
            `highest score: ${progress.highScore} | ` +
            `unlocked: ${progress.unlockedLevels.length}`;
    },

    formatGameStatus() {
        if (!Game.state.isPlaying) {
            return 'game: idle | level: - | score: - | lives: - | time: -';
        }
        const status = Game.state.isPaused ? 'paused' : 'running';
        return `game: ${status} | level: ${Game.state.level} | ` +
            `score: ${Game.state.score} | lives: ${Game.state.lives} | ` +
            `time: ${Game.state.time}s`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    DevTerminal.init();
});
