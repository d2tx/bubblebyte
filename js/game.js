// Main game logic and state management
import { AudioSystem } from './audio.js';
import { GAME_CONFIG } from './config.js';
import { Bubble, Bullet, DropItem, Particle, Wall } from './entities.js';
import { levelConfigs } from './levels.js';
import { Player, Harpoon } from './player.js';
import { Renderer } from './renderer.js';
import { Storage } from './storage.js';
import { UI } from './ui.js';

const setPowerWireIndicator = (visible) => {
    const indicator = document.getElementById('powerWireIndicator');
    if (indicator) {
        indicator.style.display = visible ? 'block' : 'none';
    }
};

export const Game = {
    state: {
        level: 1,
        score: 0,
        lives: 3,
        time: 60,
        isPlaying: false,
        isPaused: false
    },

    bubbles: [],
    walls: [],
    platforms: [],
    ladders: [],
    ceilingSpikesEnabled: true,
    activeLadder: null,
    particles: [],
    dropItems: [],
    bullets: [],
    animationId: null,
    timerInterval: null,
    lastFrameTime: 0,
    targetFPS: 60,
    frameInterval: 1000 / 60,
    powerWireDropsThisLevel: 0,
    powerWireDropCooldown: 0,
    timeFreezeTimer: 0,
    slowMoTimer: 0,
    autoGunTimer: 0,
    autoGunCooldown: 0,
    comboHits: 0,
    harpoonHitThisShot: false,
    frameSamples: [],
    fpsLastTimestamp: 0,
    closingWallEnabled: false,
    closingWallX: -24,
    closingWallWidth: 24,
    levelTimeLimit: GAME_CONFIG.BASE_TIME,
    transitionTimeouts: new Set(),

    scheduleTransition(callback, delayMs) {
        const id = setTimeout(() => {
            this.transitionTimeouts.delete(id);
            callback();
        }, delayMs);
        this.transitionTimeouts.add(id);
        return id;
    },

    clearTransitionTimeouts() {
        for (const id of this.transitionTimeouts) {
            clearTimeout(id);
        }
        this.transitionTimeouts.clear();
    },

    start(startLevel = 1) {
        this.clearTransitionTimeouts();
        AudioSystem.init();
        UI.hideMainMenu();
        UI.showGameContainer();
        this.focusGameCanvas();
        AudioSystem.stopMusic();

        this.state = {
            level: startLevel,
            score: 0,
            lives: 3,
            time: GAME_CONFIG.BASE_TIME,
            isPlaying: true,
            isPaused: false
        };

        this.resetGameState();
        Renderer.init();

        if (!this.initLevel(startLevel)) {
            console.error('Failed to initialize level', startLevel);
            this.returnToMenu();
            return;
        }

        UI.updateGameUI(this.state);
        AudioSystem.playSound('menu');
        UI.showLevelScreen(
            `${UI.t('level')} ${startLevel}`,
            UI.t('ready'),
            {
                variant: 'neutral',
                icon: '▶',
                metaLine1: UI.t('levelStartMeta'),
                metaLine2: UI.t('prepareSystemsMeta'),
                durationMs: 2000
            }
        );

        this.scheduleTransition(() => {
            Player.activateInvulnerability();
            UI.hideLevelScreen();
            this.focusGameCanvas();
            this.startTimer();
            if (AudioSystem.musicEnabled) AudioSystem.startGameplayMusic();
            this.startGameLoop();
        }, 2000);
    },

    initLevel(level) {
        this.bubbles = [];
        this.walls = [];
        this.platforms = [];
        this.ladders = [];
        this.activeLadder = null;
        this.dropItems = [];
        this.bullets = [];
        this.powerWireDropsThisLevel = 0;
        this.powerWireDropCooldown = 0;
        this.timeFreezeTimer = 0;
        this.slowMoTimer = 0;
        this.autoGunTimer = 0;
        this.autoGunCooldown = 0;
        this.comboHits = 0;
        this.harpoonHitThisShot = false;
        this.closingWallEnabled = false;
        this.closingWallX = -this.closingWallWidth;
        this.levelTimeLimit = GAME_CONFIG.BASE_TIME;
        UI.setStatus('statusReady');

        const config = levelConfigs[level - 1];
        if (!config) {
            console.error('Invalid level:', level);
            return false;
        }

        const bubbleConfigs = Array.isArray(config) ? config : config.bubbles;
        const wallConfigs = Array.isArray(config) ? [] : (config.walls || []);
        const platformConfigs = Array.isArray(config)
            ? []
            : (config.platforms || []);
        const ladderConfigs = Array.isArray(config)
            ? []
            : (config.ladders || []);
        const ceilingSpikesEnabled = Array.isArray(config)
            ? true
            : (config.ceilingSpikes !== false);
        const closingWallEnabled = Array.isArray(config)
            ? false
            : Boolean(config.closingWall);

        for (const c of bubbleConfigs) {
            this.bubbles.push(
                new Bubble(c.x, c.y, c.size, c.type || 'standard')
            );
        }

        this.walls = wallConfigs.map((c) => new Wall(c));
        this.platforms = platformConfigs.map((c) => ({ ...c }));
        this.ladders = ladderConfigs.map((c) => ({ ...c }));
        this.ceilingSpikesEnabled = ceilingSpikesEnabled;
        this.closingWallEnabled = closingWallEnabled;

        const baseLevelTime = GAME_CONFIG.BASE_TIME +
            Math.floor((level - 1) / 5) * GAME_CONFIG.TIME_BONUS_PER_5_LEVELS;
        this.levelTimeLimit = Math.max(1, Math.ceil(baseLevelTime * 0.8));
        this.state.time = this.levelTimeLimit;
        this.closingWallX = -this.closingWallWidth;
        return true;
    },

    resetGameState() {
        this.particles = [];
        this.dropItems = [];
        this.bullets = [];
        this.walls = [];
        this.platforms = [];
        this.ladders = [];
        this.activeLadder = null;
        this.powerWireDropsThisLevel = 0;
        this.powerWireDropCooldown = 0;
        this.timeFreezeTimer = 0;
        this.slowMoTimer = 0;
        this.autoGunTimer = 0;
        this.autoGunCooldown = 0;
        this.comboHits = 0;
        this.harpoonHitThisShot = false;
        this.frameSamples = [];
        this.fpsLastTimestamp = 0;
        this.closingWallEnabled = false;
        this.closingWallX = -this.closingWallWidth;
        this.levelTimeLimit = GAME_CONFIG.BASE_TIME;
        UI.setStatus('statusReady');
        Player.reset();
        Harpoon.reset();
        setPowerWireIndicator(false);
    },

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            if (this.state.isPlaying && !this.state.isPaused) {
                if (this.timeFreezeTimer > 0) {
                    return;
                }
                this.state.time--;
                UI.updateGameUI(this.state);
                if (this.state.time <= 0) {
                    if (this.closingWallEnabled && this.bubbles.length > 0) {
                        this.loseLife('statusCrushed');
                    } else {
                        this.loseLife();
                    }
                }
            }
        }, 1000);
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    startGameLoop() {
        this.stopGameLoop();
        this.lastFrameTime = 0;
        this.frameSamples = [];
        this.fpsLastTimestamp = 0;
        this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
    },

    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    gameLoop(timestamp) {
        if (!this.state.isPlaying) return;

        if (!timestamp) timestamp = performance.now();
        if (!this.lastFrameTime) this.lastFrameTime = timestamp;

        const elapsed = timestamp - this.lastFrameTime;

        if (elapsed > this.frameInterval) {
            this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
            this.trackFps(timestamp);

            Renderer.drawBackground(this.ceilingSpikesEnabled);

            if (!this.state.isPaused) {
                this.updateLadderState();
                Player.update(this.ceilingSpikesEnabled);
                this.applyWallConstraintsToPlayer();
                this.resolveClosingWallPlayerCollision();
                this.applyPlatformConstraintsToPlayer();
                const harpoonWasActive = Harpoon.active;
                Harpoon.update();
                if (harpoonWasActive && !Harpoon.active) {
                    if (!this.harpoonHitThisShot) {
                        this.resetCombo();
                    }
                    this.harpoonHitThisShot = false;
                }
                this.updatePowerups();
                this.updateDropItems();
                this.updateAutoGun();
                this.updateClosingWallProgress();

                const bubbleSpeedScale = this.slowMoTimer > 0
                    ? GAME_CONFIG.SLOW_MO_FACTOR
                    : 1;
                if (this.timeFreezeTimer <= 0) {
                    for (const bubble of this.bubbles) {
                        bubble.update(
                            bubbleSpeedScale,
                            this.ceilingSpikesEnabled
                        );
                    }
                }

                const particleSpeedScale = bubbleSpeedScale;
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    if (this.timeFreezeTimer <= 0) {
                        if (!this.particles[i].update(particleSpeedScale)) {
                            this.particles.splice(i, 1);
                        }
                    }
                }

                const bulletSpeedScale = bubbleSpeedScale;
                for (let i = this.bullets.length - 1; i >= 0; i--) {
                    if (this.timeFreezeTimer <= 0) {
                        this.bullets[i].update(bulletSpeedScale);
                    }
                    if (!this.bullets[i].active) {
                        this.bullets.splice(i, 1);
                    }
                }

                this.updateWalls();
                this.resolvePlatformCollisions();
                this.resolveWallCollisions();
                this.resolveClosingWallBubbleCollisions();
                this.resolveBulletWallCollisions();
                this.resolveBulletPlatformCollisions();
                this.resolveHarpoonWallCollisions();
                this.resolveHarpoonPlatformCollisions();
                this.resolvePowerWirePlatformCollisions();

                this.processBulletCollisions();
                this.processBubbleCollisions();

                if (Player.checkBubbleCollision(this.bubbles)) {
                    this.loseLife();
                    this.lastFrameTime = 0;
                    return;
                }
            }

            Renderer.drawClosingWall({
                enabled: this.closingWallEnabled,
                x: this.closingWallX,
                width: this.closingWallWidth
            });
            Renderer.drawPlatforms(this.platforms);
            Renderer.drawLadders(this.ladders);
            Renderer.drawWalls(this.walls);
            Renderer.drawEntities(
                this.bubbles, 
                this.particles, 
                this.dropItems,
                this.bullets
            );
            Renderer.drawPlayer();
            Renderer.drawHarpoon(this.ceilingSpikesEnabled);

            if (this.bubbles.length === 0 && 
                this.state.isPlaying && 
                !this.state.isPaused) {
                const timeBonus = this.state.time *
                    GAME_CONFIG.TIME_BONUS_PER_SEC;
                if (timeBonus > 0) {
                    this.state.score += timeBonus;
                    UI.showBonus(`${UI.t('bonusTime')} +${timeBonus}`);
                }
                UI.updateGameUI(this.state);
                this.nextLevel();
                this.lastFrameTime = 0;
                return;
            }
        }

        this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
    },

    updateClosingWallProgress() {
        if (!this.closingWallEnabled) {
            this.closingWallX = -this.closingWallWidth;
            return;
        }

        const clampedTime = Math.max(0, Math.min(this.state.time, this.levelTimeLimit));
        const progress = 1 - clampedTime / Math.max(1, this.levelTimeLimit);
        const maxTravel = GAME_CONFIG.CANVAS_WIDTH + this.closingWallWidth;
        const targetX = -this.closingWallWidth + maxTravel * progress;
        const lerpSpeed = 0.16;
        this.closingWallX += (targetX - this.closingWallX) * lerpSpeed;
    },

    trackFps(timestamp) {
        if (!this.fpsLastTimestamp) {
            this.fpsLastTimestamp = timestamp;
            return;
        }
        const delta = timestamp - this.fpsLastTimestamp;
        this.fpsLastTimestamp = timestamp;
        if (delta <= 0) {
            return;
        }
        const fps = 1000 / delta;
        this.frameSamples.push(fps);
        if (this.frameSamples.length > 30) {
            this.frameSamples.shift();
        }
        const avg =
            this.frameSamples.reduce((sum, value) => sum + value, 0) /
            this.frameSamples.length;
        UI.updateFps(avg);
    },

    updateDropItems() {
        if (this.powerWireDropCooldown > 0) {
            this.powerWireDropCooldown--;
        }
        for (let i = this.dropItems.length - 1; i >= 0; i--) {
            const item = this.dropItems[i];
            let isAlive = item.update();
            const platformHit = this.resolveDropItemPlatformCollision(item);
            if (platformHit) {
                item.lifeTime = Math.max(0, item.lifeTime - 1);
                isAlive = item.lifeTime > 0;
            }

            const isClimbing = Player.onLadder && (Player.moveUp || Player.moveDown);
            if (!isClimbing && item.checkCollision(Player)) {
                if (item.type === 'powerWire') {
                    Harpoon.x = item.x;
                    Harpoon.powerWireActive = true;
                    Harpoon.powerWireTimer = GAME_CONFIG.POWER_WIRE_DURATION;
                    Harpoon.powerWireCollected = false;
                    setPowerWireIndicator(true);
                    AudioSystem.playSound('powerup');
                } else if (item.type === 'timeFreeze') {
                    this.activateTimeFreeze();
                    AudioSystem.playSound('powerup');
                } else if (item.type === 'slowMo') {
                    this.activateSlowMo();
                    AudioSystem.playSound('powerup');
                } else if (item.type === 'autoGun') {
                    this.activateAutoGun();
                    AudioSystem.playSound('powerup');
                }
                this.dropItems.splice(i, 1);
                continue;
            }

            if (!isAlive) {
                this.dropItems.splice(i, 1);
            }
        }
    },

    createExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    },

    spawnDropItem(x, y) {
        if (this.dropItems.length > 0) {
            return;
        }
        if (Math.random() < GAME_CONFIG.AUTO_GUN_DROP_CHANCE) {
            const hasPowerupDrop = this.dropItems.some(
                (item) => item.type !== 'powerWire'
            );
            if (!hasPowerupDrop) {
                this.dropItems.push(new DropItem(x, y, 'autoGun'));
                return;
            }
        }

        if (Math.random() < GAME_CONFIG.POWERUP_DROP_CHANCE) {
            const hasPowerupDrop = this.dropItems.some(
                (item) => item.type !== 'powerWire'
            );
            if (!hasPowerupDrop) {
                const types = ['timeFreeze', 'slowMo'];
                const type = types[Math.floor(Math.random() * types.length)];
                this.dropItems.push(new DropItem(x, y, type));
                return;
            }
        }

        const hasPowerWireDrop = this.dropItems.some(
            (item) => item.type === 'powerWire'
        );
        if (Harpoon.powerWireActive ||
            Harpoon.powerWireCollected ||
            hasPowerWireDrop) {
            return;
        }

        if (this.powerWireDropsThisLevel >=
            GAME_CONFIG.POWER_WIRE_MAX_DROPS_PER_LEVEL) {
            return;
        }

        if (this.powerWireDropCooldown > 0) {
            return;
        }

        if (Math.random() < GAME_CONFIG.POWER_WIRE_DROP_CHANCE) {
            this.dropItems.push(new DropItem(x, y, 'powerWire'));
            this.powerWireDropsThisLevel++;
            this.powerWireDropCooldown = GAME_CONFIG.POWER_WIRE_DROP_COOLDOWN;
        }
    },

    updatePowerups() {
        if (this.timeFreezeTimer > 0) {
            this.timeFreezeTimer--;
        }
        if (this.slowMoTimer > 0) {
            this.slowMoTimer--;
        }
        if (this.autoGunTimer > 0) {
            this.autoGunTimer--;
        }
        if (this.autoGunCooldown > 0) {
            this.autoGunCooldown--;
        }

        if (this.timeFreezeTimer > 0) {
            UI.setStatus('statusFreeze');
        } else if (this.slowMoTimer > 0) {
            UI.setStatus('statusSlowMo');
        } else if (this.autoGunTimer > 0) {
            UI.setStatus('statusAutoGun');
        } else {
            UI.setStatus('statusReady');
        }
    },

    registerComboHit() {
        this.comboHits += 1;
        if (this.comboHits % GAME_CONFIG.COMBO_HIT_THRESHOLD === 0) {
            this.state.score += GAME_CONFIG.COMBO_BONUS;
            UI.showBonus(
                `${UI.t('bonusCombo')} +${GAME_CONFIG.COMBO_BONUS}`
            );
        }
    },

    resetCombo() {
        this.comboHits = 0;
    },

    addBubbleScore(bubble, { comboEligible = true } = {}) {
        this.state.score += bubble.size * GAME_CONFIG.SCORE_PER_BUBBLE_SIZE;
        if (comboEligible) {
            this.registerComboHit();
        }
    },

    isPowerupActive() {
        return this.autoGunTimer > 0 ||
            Harpoon.powerWireActive;
    },

    activateTimeFreeze() {
        this.timeFreezeTimer = GAME_CONFIG.TIME_FREEZE_DURATION;
        UI.setStatus('statusFreeze');
    },

    activateSlowMo() {
        this.slowMoTimer = GAME_CONFIG.SLOW_MO_DURATION;
        UI.setStatus('statusSlowMo');
    },

    activateAutoGun() {
        this.autoGunTimer = GAME_CONFIG.AUTO_GUN_DURATION;
        this.autoGunCooldown = 0;
        UI.setStatus('statusAutoGun');
    },

    updateAutoGun() {
        if (this.autoGunTimer <= 0) {
            return;
        }
        if (Player.onLadder && (Player.moveUp || Player.moveDown)) {
            return;
        }
        if (this.autoGunCooldown > 0) {
            this.autoGunCooldown--;
            return;
        }
        this.bullets.push(new Bullet(Player.x, Player.y - 6));
        Player.triggerShootAnimation();
        this.autoGunCooldown = GAME_CONFIG.AUTO_GUN_FIRE_RATE;
    },

    processBulletCollisions() {
        if (this.bullets.length === 0) return;
        const newBubbles = [];
        const bubblesMarkedForRemoval = new Set();

        for (let b = this.bullets.length - 1; b >= 0; b--) {
            const bullet = this.bullets[b];
            for (let i = 0; i < this.bubbles.length; i++) {
                if (bubblesMarkedForRemoval.has(i)) continue;
                const bubble = this.bubbles[i];
                const dx = bullet.x - bubble.x;
                const dy = bullet.y - bubble.y;
                const distanceSquared = (dx * dx) + (dy * dy);
                const combinedRadius = bullet.radius + bubble.radius;
                if (distanceSquared < combinedRadius * combinedRadius) {
                    if (!bubble.isHittable()) {
                        continue;
                    }
                    const shouldSplit = bubble.registerHit();
                    this.bullets.splice(b, 1);
                    if (!shouldSplit) {
                        break;
                    }
                    this.addBubbleScore(bubble, { comboEligible: true });
                    this.createExplosion(bubble.x, bubble.y, bubble.getRenderColor());
                    this.spawnDropItem(bubble.x, bubble.y);
                    newBubbles.push(...bubble.split());
                    bubblesMarkedForRemoval.add(i);
                    AudioSystem.playSound('pop');
                    UI.updateGameUI(this.state);
                    break;
                }
            }
        }

        const indices = Array.from(bubblesMarkedForRemoval).sort((a, b) => b - a);
        for (const idx of indices) {
            this.bubbles.splice(idx, 1);
        }
        this.bubbles.push(...newBubbles);
    },

    updateWalls() {
        for (const wall of this.walls) {
            wall.update(this.bubbles);
        }
    },

    updateLadderState() {
        if (!this.ladders.length) {
            Player.onLadder = false;
            this.activeLadder = null;
            return;
        }
        const padding = 4;
        const topSnap = 6;
        const ladderSeekRange = 24;
        const playerRect = {
            x: Player.x - Player.width / 2,
            y: Player.y,
            width: Player.width,
            height: Player.height
        };
        Player.onLadder = false;
        this.activeLadder = null;
        for (const ladder of this.ladders) {
            const ladderRect = {
                x: ladder.x - padding,
                y: ladder.y - topSnap,
                width: ladder.width + padding * 2,
                height: ladder.height + topSnap
            };
            if (this.checkRectIntersection(playerRect, ladderRect)) {
                Player.onLadder = true;
                this.activeLadder = ladder;
                if (Player.moveUp || Player.moveDown) {
                    Player.x = ladder.x + ladder.width / 2;
                }
                const ladderBottom = ladder.y + ladder.height;
                Player.y = Math.min(Player.y, ladderBottom - Player.height);
                if (Player.moveUp && Player.y < ladder.y - Player.height) {
                    Player.y = ladder.y - Player.height;
                }
                break;
            }
        }

        if (!Player.onLadder && Player.moveDown) {
            const playerBottom = Player.y + Player.height;
            let bestLadder = null;
            let bestDistance = Infinity;
            for (const ladder of this.ladders) {
                if (playerBottom < ladder.y - topSnap ||
                    playerBottom > ladder.y + ladder.height) {
                    continue;
                }
                const withinX =
                    Player.x + Player.width / 2 > ladder.x - padding &&
                    Player.x - Player.width / 2 < ladder.x + ladder.width + padding;
                if (!withinX) continue;
                const distance = Math.abs(playerBottom - ladder.y);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestLadder = ladder;
                }
            }
            if (bestLadder && bestDistance <= ladderSeekRange) {
                Player.onLadder = true;
                this.activeLadder = bestLadder;
                Player.x = bestLadder.x + bestLadder.width / 2;
                const ladderBottom = bestLadder.y + bestLadder.height;
                Player.y = Math.min(Player.y, ladderBottom - Player.height);
            }
        }
    },

    resolveClosingWallPlayerCollision() {
        if (!this.closingWallEnabled) return;
        const wallFrontX = this.closingWallX + this.closingWallWidth;
        const minCenterX = wallFrontX + Player.width / 2;
        if (Player.x < minCenterX) {
            Player.x = minCenterX;
            Player.velocityX = Math.max(0, Player.velocityX);
        }
    },

    resolveClosingWallBubbleCollisions() {
        if (!this.closingWallEnabled || this.bubbles.length === 0) return;
        const wallFrontX = this.closingWallX + this.closingWallWidth;
        for (const bubble of this.bubbles) {
            if (bubble.x - bubble.radius < wallFrontX) {
                bubble.x = wallFrontX + bubble.radius;
                bubble.speedX = Math.abs(bubble.speedX);
            }
        }
    },

    resolveWallCollisions() {
        if (this.walls.length === 0 || this.bubbles.length === 0) return;
        for (const bubble of this.bubbles) {
            for (const wall of this.walls) {
                for (const rect of wall.getBlockingRects()) {
                    if (!this.checkCircleRectCollision(bubble, rect)) {
                        continue;
                    }

                    const rectCenter = rect.x + rect.width / 2;
                    if (bubble.x < rectCenter) {
                        bubble.x = rect.x - bubble.radius;
                        bubble.speedX = -Math.abs(bubble.speedX);
                    } else {
                        bubble.x = rect.x + rect.width + bubble.radius;
                        bubble.speedX = Math.abs(bubble.speedX);
                    }
                }
            }
        }
    },

    resolvePlatformCollisions() {
        if (this.platforms.length === 0 || this.bubbles.length === 0) return;
        for (const bubble of this.bubbles) {
            for (const platform of this.platforms) {
                const minX = Math.min(bubble.prevX, bubble.x) - bubble.radius;
                const maxX = Math.max(bubble.prevX, bubble.x) + bubble.radius;
                const withinX = maxX > platform.x &&
                    minX < platform.x + platform.width;
                const prevBottom = bubble.prevY + bubble.radius;
                const prevTop = bubble.prevY - bubble.radius;
                const currentBottom = bubble.y + bubble.radius;
                const currentTop = bubble.y - bubble.radius;
                const hitFromAbove = bubble.speedY >= 0 &&
                    prevBottom <= platform.y &&
                    currentBottom >= platform.y;
                const hitFromBelow = bubble.speedY < 0 &&
                    prevTop >= platform.y + platform.height &&
                    currentTop <= platform.y + platform.height;

                if (!(withinX && (hitFromAbove || hitFromBelow)) &&
                    !this.checkCircleRectCollision(bubble, platform)) {
                    continue;
                }

                if (hitFromAbove) {
                    bubble.y = platform.y - bubble.radius;
                    const bounceSpeed = Math.min(
                        bubble.minBounceSpeed + bubble.hitCount * 1.2,
                        bubble.maxBounceSpeed
                    );
                    bubble.speedY = -bounceSpeed;
                } else if (hitFromBelow) {
                    bubble.y = platform.y + platform.height + bubble.radius;
                    bubble.speedY = Math.abs(bubble.speedY);
                }
            }
        }
    },

    resolveBulletWallCollisions() {
        if (this.walls.length === 0 || this.bullets.length === 0) return;
        for (const bullet of this.bullets) {
            if (!bullet.active) continue;
            for (const wall of this.walls) {
                for (const rect of wall.getBlockingRects()) {
                    if (this.checkCircleRectCollision(bullet, rect)) {
                        bullet.active = false;
                        break;
                    }
                }
                if (!bullet.active) break;
            }
        }
    },

    resolveBulletPlatformCollisions() {
        if (this.platforms.length === 0 || this.bullets.length === 0) return;
        for (const bullet of this.bullets) {
            if (!bullet.active) continue;
            for (const platform of this.platforms) {
                if (this.checkCircleRectCollision(bullet, platform)) {
                    bullet.active = false;
                    break;
                }
            }
        }
    },

    resolveHarpoonWallCollisions() {
        if (!Harpoon.active || this.walls.length === 0) return;
        const harpoonRect = {
            x: Harpoon.x - 3,
            y: Harpoon.y,
            width: 6,
            height: Player.y - Harpoon.y
        };

        for (const wall of this.walls) {
            for (const rect of wall.getBlockingRects()) {
                if (this.checkRectIntersection(harpoonRect, rect)) {
                    Harpoon.active = false;
                    return;
                }
            }
        }
    },

    resolveHarpoonPlatformCollisions() {
        if (!Harpoon.active || this.platforms.length === 0) return;
        for (const platform of this.platforms) {
            const withinX = Harpoon.x >= platform.x &&
                Harpoon.x <= platform.x + platform.width;
            if (!withinX) continue;
            const platformBottom = platform.y + platform.height;
            if (Harpoon.y <= platformBottom && Player.y >= platformBottom) {
                Harpoon.active = false;
                Harpoon.y = platformBottom;
                return;
            }
        }
    },

    resolvePowerWirePlatformCollisions() {
        if (!Harpoon.powerWireActive || this.platforms.length === 0) return;
    },

    resolveDropItemPlatformCollision(item) {
        if (this.platforms.length === 0) return false;
        const itemRadius = item.size / 2;
        for (const platform of this.platforms) {
            const withinX = item.x + itemRadius > platform.x &&
                item.x - itemRadius < platform.x + platform.width;
            const bottom = item.y + itemRadius;
            if (withinX && bottom >= platform.y && item.y < platform.y) {
                item.y = platform.y - itemRadius;
                return true;
            }
        }
        return false;
    },

    applyWallConstraintsToPlayer() {
        if (this.walls.length === 0) return;
        const playerRect = {
            x: Player.x - Player.width / 2,
            y: Player.y,
            width: Player.width,
            height: Player.height
        };

        for (const wall of this.walls) {
            for (const rect of wall.getBlockingRects()) {
                if (!this.checkRectIntersection(playerRect, rect)) {
                    continue;
                }
                const rectCenter = rect.x + rect.width / 2;
                if (playerRect.x + playerRect.width / 2 < rectCenter) {
                    Player.x = rect.x - Player.width / 2;
                } else {
                    Player.x = rect.x + rect.width + Player.width / 2;
                }
                Player.velocityX = 0;
                playerRect.x = Player.x - Player.width / 2;
            }
        }
    },

    applyPlatformConstraintsToPlayer() {
        Player.onGround = false;
        const groundY = GAME_CONFIG.CANVAS_HEIGHT - Player.height;
        if (!Player.onLadder) {
            if (Player.y >= groundY) {
                Player.y = groundY;
                Player.velocityY = 0;
                Player.onGround = true;
            }
        }
        if (Player.onLadder) {
            return;
        }
        if (this.platforms.length === 0) return;
        const playerBottom = Player.y + Player.height;
        const prevBottom = (Player.prevY ?? Player.y) + Player.height;
        if (Player.velocityY >= 0) {
            for (const platform of this.platforms) {
                const withinX =
                    Player.x + Player.width / 2 > platform.x &&
                    Player.x - Player.width / 2 < platform.x + platform.width;
                if (!withinX) continue;
                const platformTop = platform.y;
                if (prevBottom <= platformTop &&
                    playerBottom >= platformTop) {
                    Player.y = platformTop - Player.height;
                    Player.velocityY = 0;
                    Player.onGround = true;
                }
            }
        }
    },

    checkCircleRectCollision(circle, rect) {
        const closestX = Math.max(
            rect.x, 
            Math.min(circle.x, rect.x + rect.width)
        );
        const closestY = Math.max(
            rect.y, 
            Math.min(circle.y, rect.y + rect.height)
        );

        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        const distanceSquared = 
            (distanceX * distanceX) + (distanceY * distanceY);

        return distanceSquared < (circle.radius * circle.radius);
    },

    checkRectIntersection(rectA, rectB) {
        return rectA.x < rectB.x + rectB.width &&
            rectA.x + rectA.width > rectB.x &&
            rectA.y < rectB.y + rectB.height &&
            rectA.y + rectA.height > rectB.y;
    },

    processBubbleCollisions() {
        const newBubbles = [];
        const bubblesMarkedForRemoval = [];

        // Check harpoon collisions
        if (Harpoon.active) {
            const harpoonRect = {
                x: Harpoon.x - 3,
                y: Harpoon.y,
                width: 6,
                height: Player.y - Harpoon.y
            };

            for (let i = 0; i < this.bubbles.length; i++) {
                const bubble = this.bubbles[i];
                if (bubble.markedForRemoval) continue;

                if (this.checkCircleRectCollision(bubble, harpoonRect)) {
                    if (!bubble.isHittable()) {
                        continue;
                    }
                    const shouldSplit = bubble.registerHit();
                    Harpoon.active = false;
                    this.harpoonHitThisShot = shouldSplit;
                    if (!shouldSplit) {
                        break;
                    }
                    this.addBubbleScore(bubble, { comboEligible: true });
                    this.createExplosion(bubble.x, bubble.y, bubble.getRenderColor());
                    this.spawnDropItem(bubble.x, bubble.y);
                    newBubbles.push(...bubble.split());
                    bubblesMarkedForRemoval.push(i);
                    AudioSystem.playSound('pop');
                    UI.updateGameUI(this.state);
                    break;
                }
            }
        }

        // Check power wire collisions
        if (Harpoon.powerWireActive) {
            const powerWireTop = this.ceilingSpikesEnabled
                ? GAME_CONFIG.CEILING_Y
                : GAME_CONFIG.UI_HEIGHT;
            const powerWireRect = {
                x: Harpoon.x - 5,
                y: powerWireTop,
                width: 10,
                height: GAME_CONFIG.CANVAS_HEIGHT - powerWireTop
            };

            for (let i = 0; i < this.bubbles.length; i++) {
                const bubble = this.bubbles[i];
                if (bubble.markedForRemoval || 
                    bubblesMarkedForRemoval.includes(i)) continue;

                if (this.checkCircleRectCollision(bubble, powerWireRect)) {
                    if (!bubble.isHittable()) {
                        continue;
                    }
                    const shouldSplit = bubble.registerHit();
                    if (!shouldSplit) {
                        break;
                    }
                    this.addBubbleScore(bubble, { comboEligible: true });
                    this.createExplosion(bubble.x, bubble.y, bubble.getRenderColor());
                    this.spawnDropItem(bubble.x, bubble.y);
                    newBubbles.push(...bubble.split());
                    bubblesMarkedForRemoval.push(i);
                    AudioSystem.playSound('pop');
                    UI.updateGameUI(this.state);

                    Harpoon.deactivatePowerWire();
                    break;
                }
            }
        }

        // Process ceiling collisions
        for (let i = 0; i < this.bubbles.length; i++) {
            const bubble = this.bubbles[i];
            if (bubble.hitCeiling && !bubblesMarkedForRemoval.includes(i)) {
                this.addBubbleScore(bubble, { comboEligible: false });
                this.state.score += GAME_CONFIG.CEILING_SPIKE_BONUS;
                UI.showBonus(
                    `${UI.t('bonusCeiling')} +${GAME_CONFIG.CEILING_SPIKE_BONUS}`
                );
                this.createExplosion(bubble.x, bubble.y, bubble.getRenderColor());
                newBubbles.push(...bubble.split());
                bubblesMarkedForRemoval.push(i);
                AudioSystem.playSound('pop');
                UI.updateGameUI(this.state);
            }
        }

        // Remove bubbles
        bubblesMarkedForRemoval.sort((a, b) => b - a);
        for (const idx of bubblesMarkedForRemoval) {
            this.bubbles.splice(idx, 1);
        }

        // Add new bubbles
        this.bubbles.push(...newBubbles);
    },

    loseLife(statusKey = 'statusHit') {
        this.state.lives--;
        this.state.isPaused = true;
        UI.setStatus(statusKey);
        this.resetCombo();
        AudioSystem.stopGameplayMusic();
        this.stopGameLoop();
        AudioSystem.playSound('die');
        UI.updateGameUI(this.state);

        if (this.state.lives <= 0) {
            this.endGame();
        } else {
            UI.showLevelScreen(UI.t('lifeLost'), UI.t('restarting'), {
                variant: 'danger',
                icon: '⚠',
                metaLine1: `${UI.t('livesLeftMeta')} ${this.state.lives}`,
                metaLine2: UI.t('respawnMeta'),
                durationMs: 1500
            });
            this.scheduleTransition(() => {
                Player.reset();
                Player.activateInvulnerability();
                Harpoon.reset();
                setPowerWireIndicator(false);
                this.initLevel(this.state.level);
                UI.hideLevelScreen();
                this.state.isPaused = false;
                this.focusGameCanvas();
                if (AudioSystem.musicEnabled) AudioSystem.startGameplayMusic();
                this.startGameLoop();
            }, 1500);
        }
    },

    nextLevel() {
        if (this.state.level >= GAME_CONFIG.TOTAL_LEVELS) {
            this.cleanup();
            Storage.save(this.state.level, this.state.score, { unlockNext: false });
            UI.showLevelScreen(
                UI.t('congratulations'),
                UI.t('allLevelsComplete'),
                {
                    variant: 'success',
                    icon: '★',
                    metaLine1: UI.t('campaignCompleteMeta'),
                    metaLine2: `${UI.t('finalScore')} ${this.state.score}`,
                    durationMs: 3000
                }
            );
            this.scheduleTransition(() => {
                this.returnToMenu();
                UI.hideLevelScreen();
            }, 3000);
            return;
        }

        Storage.save(this.state.level, this.state.score, { unlockNext: true });

        this.state.level++;
        this.state.lives = Math.min(this.state.lives + 1, 5);
        this.state.isPaused = true;
        AudioSystem.stopGameplayMusic();
        this.stopGameLoop();
        AudioSystem.playVictoryMusic();
        AudioSystem.playSound('levelup');
        Player.reset();
        Harpoon.reset();
        setPowerWireIndicator(false);

        UI.showLevelScreen(
            `${UI.t('level')} ${this.state.level}`,
            UI.t('ready'),
            {
                variant: 'success',
                icon: '▲',
                metaLine1: `${UI.t('levelClearedMeta')} ${this.state.level - 1}`,
                metaLine2: `${UI.t('bonusLifeMeta')} +1`,
                durationMs: 2000
            }
        );

        this.scheduleTransition(() => {
            if (!this.initLevel(this.state.level)) {
                this.endGame();
                return;
            }
            Player.activateInvulnerability();
            UI.updateGameUI(this.state);
            UI.hideLevelScreen();
            this.state.isPaused = false;
            this.focusGameCanvas();
            if (AudioSystem.musicEnabled) AudioSystem.startGameplayMusic();
            this.startGameLoop();
        }, 2000);
    },

    togglePause() {
        if (!this.state.isPlaying) return;
        if (this.state.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    },

    pause() {
        this.state.isPaused = true;
        AudioSystem.stopGameplayMusic();
        this.stopGameLoop();
        UI.showPauseMenu();
    },

    resume() {
        this.state.isPaused = false;
        UI.hidePauseMenu();
        this.focusGameCanvas();
        if (AudioSystem.musicEnabled) AudioSystem.startGameplayMusic();
        this.startGameLoop();
    },

    restartCurrentLevel() {
        Player.reset();
        Harpoon.reset();
        setPowerWireIndicator(false);
        this.initLevel(this.state.level);
        UI.updateGameUI(this.state);
        this.resume();
    },

    focusGameCanvas() {
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.focus({ preventScroll: true });
        }
        if (typeof window !== 'undefined') {
            window.focus();
        }
    },

    cleanup() {
        this.clearTransitionTimeouts();
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.stopGameLoop();
        this.stopTimer();
        AudioSystem.stopGameplayMusic();
        setPowerWireIndicator(false);
    },

    endGame() {
        this.cleanup();
        Storage.save(this.state.level, this.state.score, { unlockNext: false });
        UI.showGameOver(this.state.score, this.state.level);
    },

    restartGame() {
        UI.hideGameOver();
        this.start(1);
    },

    returnToMenu() {
        this.cleanup();
        UI.hideGameOver();
        UI.hidePauseMenu();
        UI.hideGameContainer();
        UI.showMainMenu();
        UI.updateMenuStats();
        UI.renderLevelButtons(UI.currentPage);
        if (AudioSystem.musicEnabled) AudioSystem.startMusic();
    }
};
