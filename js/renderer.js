// Rendering functions
import { GAME_CONFIG } from './config.js';
import { Player, Harpoon } from './player.js';
import { UI } from './ui.js';

const themeColorToRgba = (color, alpha, fallback = `rgba(255, 255, 255, ${alpha})`) => {
    if (!color || typeof color !== 'string') {
        return fallback;
    }
    const value = color.trim();
    const hex = value.startsWith('#') ? value.slice(1) : value;
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return fallback;
};

export const Renderer = {
    canvas: null,
    ctx: null,
    staticCanvas: null,
    staticCtx: null,
    stars: [],
    bgOffset: 0,
    lastThemeName: null,
    lastUiHeight: null,
    staticNeedsRedraw: true,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        this.initStars();
    },

    resizeCanvas() {
        if (!this.canvas || !this.ctx) {
            return;
        }
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = GAME_CONFIG.CANVAS_WIDTH * dpr;
        this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT * dpr;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!this.staticCanvas) {
            this.staticCanvas = document.createElement('canvas');
            this.staticCtx = this.staticCanvas.getContext('2d');
        }
        this.staticCanvas.width = this.canvas.width;
        this.staticCanvas.height = this.canvas.height;
        this.staticCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.staticNeedsRedraw = true;
    },

    invalidateStaticLayer() {
        this.staticNeedsRedraw = true;
    },

    renderStaticLayer(theme) {
        if (!this.staticCtx) {
            return;
        }
        const ctx = this.staticCtx;
        ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        ctx.fillStyle = theme.vars['--bg-dark'];
        ctx.fillRect(
            0,
            0,
            GAME_CONFIG.CANVAS_WIDTH,
            GAME_CONFIG.CANVAS_HEIGHT
        );

        const gridColor = theme.vars['--primary'];
        ctx.strokeStyle = gridColor;
        ctx.globalAlpha = 0.15;
        ctx.lineWidth = 1;

        const gridSize = 40;
        for (let x = 0; x <= GAME_CONFIG.CANVAS_WIDTH; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, GAME_CONFIG.CANVAS_HEIGHT);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

    },

    initStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
                y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.2
            });
        }
    },


    drawBackground(ceilingSpikesEnabled = true) {
        const theme = UI.getCurrentTheme();
        const ctx = this.ctx;
        const themeName = theme.name;
        if (this.staticNeedsRedraw ||
            this.lastThemeName !== themeName ||
            this.lastUiHeight !== GAME_CONFIG.UI_HEIGHT) {
            this.renderStaticLayer(theme);
            this.staticNeedsRedraw = false;
            this.lastThemeName = themeName;
            this.lastUiHeight = GAME_CONFIG.UI_HEIGHT;
        }

        if (this.staticCanvas) {
            ctx.drawImage(this.staticCanvas, 0, 0);
        }

        const gridColor = theme.vars['--primary'];
        ctx.strokeStyle = gridColor;
        ctx.globalAlpha = 0.15;
        ctx.lineWidth = 1;

        const gridSize = 40;
        this.bgOffset = (this.bgOffset + 0.5) % gridSize;

        for (let y = this.bgOffset; y <= GAME_CONFIG.CANVAS_HEIGHT; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        // Stars
        ctx.fillStyle = gridColor;
        ctx.globalAlpha = 0.5;
        for (const star of this.stars) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();

            star.y += star.speed;
            if (star.y > GAME_CONFIG.CANVAS_HEIGHT) {
                star.y = 0;
                star.x = Math.random() * GAME_CONFIG.CANVAS_WIDTH;
            }
        }
        ctx.globalAlpha = 1.0;

        // Ceiling Spikes
        if (ceilingSpikesEnabled) {
            const spikeWidth = 20;
            ctx.fillStyle = theme.vars['--border-dim'];
            ctx.beginPath();
            for (let x = 0; x < GAME_CONFIG.CANVAS_WIDTH; x += spikeWidth) {
                ctx.moveTo(x, GAME_CONFIG.UI_HEIGHT);
                ctx.lineTo(
                    x + spikeWidth / 2,
                    GAME_CONFIG.UI_HEIGHT + GAME_CONFIG.SPIKE_HEIGHT
                );
                ctx.lineTo(x + spikeWidth, GAME_CONFIG.UI_HEIGHT);
            }
            ctx.fill();
        }

    },

    drawEntities(bubbles, particles, dropItems, bullets) {
        const ctx = this.ctx;

        for (const bubble of bubbles) {
            bubble.draw(ctx);
        }
        for (const bullet of bullets) {
            bullet.draw(ctx);
        }
        for (const particle of particles) {
            particle.draw(ctx);
        }
        for (const item of dropItems) {
            item.draw(ctx);
        }
    },


    drawClosingWall(closingWall) {
        if (!closingWall || !closingWall.enabled) return;
        const ctx = this.ctx;
        const theme = UI.getCurrentTheme();
        const x = Math.max(-closingWall.width, Math.min(closingWall.x, GAME_CONFIG.CANVAS_WIDTH));
        const primary = theme.vars['--primary'];
        const secondary = theme.vars['--secondary'];
        const border = theme.vars['--border-dim'];

        ctx.save();
        const gradientEnd = Math.max(1, x + closingWall.width);
        const bodyGradient = ctx.createLinearGradient(0, 0, gradientEnd, 0);
        bodyGradient.addColorStop(0, themeColorToRgba(primary, 0.24));
        bodyGradient.addColorStop(1, themeColorToRgba(primary, 0.08));
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(0, GAME_CONFIG.UI_HEIGHT, Math.max(0, x), GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.UI_HEIGHT);

        const wallGradient = ctx.createLinearGradient(x, 0, x + closingWall.width, 0);
        wallGradient.addColorStop(0, border || primary);
        wallGradient.addColorStop(0.55, secondary || primary);
        wallGradient.addColorStop(1, primary || secondary);
        ctx.fillStyle = wallGradient;
        ctx.fillRect(x, GAME_CONFIG.UI_HEIGHT, closingWall.width, GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.UI_HEIGHT);

        ctx.strokeStyle = secondary || primary;
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, GAME_CONFIG.UI_HEIGHT + 1, Math.max(0, closingWall.width - 2), GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.UI_HEIGHT - 2);
        ctx.restore();
    },

    drawPlatforms(platforms) {
        if (!platforms || platforms.length === 0) return;
        const ctx = this.ctx;
        const theme = UI.getCurrentTheme();
        const highlight = theme.vars['--secondary'];
        const base = theme.vars['--border-dim'];
        ctx.save();
        for (const platform of platforms) {
            const gradient = ctx.createLinearGradient(
                platform.x,
                platform.y,
                platform.x,
                platform.y + platform.height
            );
            gradient.addColorStop(0, highlight);
            gradient.addColorStop(0.15, base);
            gradient.addColorStop(1, '#0b0e12');
            ctx.fillStyle = gradient;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(platform.x, platform.y + 3, platform.width, 2);
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(
                platform.x,
                platform.y + platform.height - 3,
                platform.width,
                2
            );
        }
        ctx.restore();
    },

    drawLadders(ladders) {
        if (!ladders || ladders.length === 0) return;
        const ctx = this.ctx;
        const theme = UI.getCurrentTheme();
        ctx.save();
        ctx.strokeStyle = theme.vars['--secondary'];
        ctx.lineWidth = 3;
        for (const ladder of ladders) {
            const left = ladder.x;
            const right = ladder.x + ladder.width;
            const top = ladder.y;
            const bottom = ladder.y + ladder.height;
            ctx.beginPath();
            ctx.moveTo(left, top);
            ctx.lineTo(left, bottom);
            ctx.moveTo(right, top);
            ctx.lineTo(right, bottom);
            ctx.stroke();

            const rungSpacing = 18;
            for (let y = top + 8; y < bottom - 4; y += rungSpacing) {
                ctx.beginPath();
                ctx.moveTo(left, y);
                ctx.lineTo(right, y);
                ctx.stroke();
            }
        }
        ctx.restore();
    },

    drawWalls(walls) {
        const ctx = this.ctx;
        const theme = UI.getCurrentTheme();
        for (const wall of walls) {
            wall.draw(ctx, theme);
        }
    },

    drawPlayer() {
        Player.draw(this.ctx, UI.getCurrentTheme());
    },

    drawHarpoon(ceilingSpikesEnabled = true) {
        Harpoon.draw(this.ctx, UI.getCurrentTheme(), ceilingSpikesEnabled);
    }
};
