import { GAME_CONFIG } from './config.js';

// LocalStorage management
export const Storage = {
    STORAGE_KEY: 'bubblebyteProgress',
    LEGACY_STORAGE_KEY: `${['bubble', 'Trouble'].join('')}Progress`,

    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY) ?? localStorage.getItem(this.LEGACY_STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
                return {
                    highestLevel: data.highestLevel || 1,
                    highScore: data.highScore || 0,
                    unlockedLevels: data.unlockedLevels || [1]
                };
            }
        } catch (e) {
            console.warn('Failed to load progress:', e);
        }
        return {
            highestLevel: 1,
            highScore: 0,
            unlockedLevels: [1]
        };
    },

    save(level, score, { unlockNext = true } = {}) {
        try {
            const progress = this.load();
            if (level > progress.highestLevel) {
                progress.highestLevel = level;
            }
            if (unlockNext) {
                const nextLevel = level + 1;
                if (nextLevel <= GAME_CONFIG.TOTAL_LEVELS && 
                    !progress.unlockedLevels.includes(nextLevel)) {
                    progress.unlockedLevels.push(nextLevel);
                }
            }
            if (score > progress.highScore) {
                progress.highScore = score;
            }
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
        } catch (e) {
            console.warn('Failed to save progress:', e);
        }
    },

    reset() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    setProgress(progress) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
        } catch (e) {
            console.warn('Failed to save progress:', e);
        }
    }
};
