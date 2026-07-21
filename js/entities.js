// Game entities: Particle, Bubble, DropItem
import { AudioSystem } from './audio.js';
import { BUBBLE_SIZES, GAME_CONFIG } from './config.js';


const clampColorChannel = (value) => Math.max(0, Math.min(255, Math.round(value)));

const adjustHexColor = (hex, delta) => {
    const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
        return hex;
    }

    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);

    const rr = clampColorChannel(r + delta).toString(16).padStart(2, '0');
    const gg = clampColorChannel(g + delta).toString(16).padStart(2, '0');
    const bb = clampColorChannel(b + delta).toString(16).padStart(2, '0');
    return `#${rr}${gg}${bb}`;
};

const readThemeBubblePalette = () => {
    if (typeof window === 'undefined' || !window.getComputedStyle) {
        return null;
    }
    const root = document.documentElement;
    const styles = window.getComputedStyle(root);
    const primary = styles.getPropertyValue('--primary').trim();
    const secondary = styles.getPropertyValue('--secondary').trim();
    const accent = styles.getPropertyValue('--accent').trim();
    const border = styles.getPropertyValue('--border-dim').trim();

    if (!primary || !secondary || !accent) {
        return null;
    }

    const smallSplitColor = adjustHexColor(secondary, -38);

    return {
        fill: {
            4: primary,
            3: accent,
            2: smallSplitColor,
            1: border || secondary
        },
    };
};

const BUBBLE_SPRITE_CACHE = new Map();
const BUBBLE_PIXEL_SCALE = 3;

const buildPixelBubbleSprite = (radius, color) => {
    const key = `${radius}:${color}:${BUBBLE_PIXEL_SCALE}`;
    const cached = BUBBLE_SPRITE_CACHE.get(key);
    if (cached) {
        return cached;
    }

    const logicalRadius = Math.max(2, Math.round(radius / BUBBLE_PIXEL_SCALE));
    const diameter = logicalRadius * 2 + 1;
    const canvas = document.createElement('canvas');
    canvas.width = diameter;
    canvas.height = diameter;
    const spriteCtx = canvas.getContext('2d');

    if (!spriteCtx) {
        return null;
    }

    const edgeColor = adjustHexColor(color, -28);
    const innerDark = adjustHexColor(color, -14);
    const innerLight = adjustHexColor(color, 10);
    const center = logicalRadius + 0.5;
    const radiusLimit = logicalRadius - 0.22;
    const r2 = radiusLimit * radiusLimit;
    const edgeStart = Math.max(0, radiusLimit - 1);
    const edgeStart2 = edgeStart * edgeStart;
    const midBand = Math.max(0, radiusLimit - 2);
    const midBand2 = midBand * midBand;

    for (let py = 0; py < diameter; py += 1) {
        for (let px = 0; px < diameter; px += 1) {
            const dx = px + 0.5 - center;
            const dy = py + 0.5 - center;
            const d2 = dx * dx + dy * dy;
            if (d2 > r2) continue;

            const checker = (px + py) % 2 === 0;
            let shade = color;
            if (d2 >= edgeStart2) {
                shade = edgeColor;
            } else if (d2 >= midBand2) {
                shade = checker ? innerDark : color;
            } else {
                shade = checker ? innerLight : color;
            }

            spriteCtx.fillStyle = shade;
            spriteCtx.fillRect(px, py, 1, 1);
        }
    }

    const shineSize = Math.max(1, Math.round(logicalRadius * 0.34));
    const shineX = Math.max(0, logicalRadius - Math.round(logicalRadius * 0.45));
    const shineY = Math.max(0, logicalRadius - Math.round(logicalRadius * 0.45));
    spriteCtx.fillStyle = '#FFFFFF';
    spriteCtx.fillRect(shineX, shineY, shineSize, shineSize);
    if (logicalRadius > 3) {
        spriteCtx.fillRect(shineX + 1, shineY + 1, Math.max(1, shineSize - 1), 1);
    }

    const sprite = {
        canvas,
        drawSize: diameter * BUBBLE_PIXEL_SCALE
    };
    BUBBLE_SPRITE_CACHE.set(key, sprite);
    return sprite;
};

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
    }

    update(speedScale = 1) {
        this.x += this.speedX * speedScale;
        this.y += this.speedY * speedScale;
        this.life -= this.decay;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class Wall {
    constructor(config) {
        this.x = config.x;
        this.width = config.width || 18;
        this.doorHeight = config.doorHeight || (GAME_CONFIG.PLAYER_HEIGHT + 28);
        this.doorY = config.doorY ?? (
            GAME_CONFIG.CANVAS_HEIGHT - this.doorHeight
        );
        this.doorClearance = config.doorClearance ?? 6;
        this.unlockRegion = config.unlockRegion || {
            xMin: 0,
            xMax: GAME_CONFIG.CANVAS_WIDTH
        };
        this.unlocked = false;
        this.doorPulse = Math.random() * Math.PI * 2;
        this.openProgress = 0;
        this.openSpeed = 0.05;
        this.unlockSfxPlayed = false;
    }

    update(bubbles) {
        if (!this.unlocked) {
            if (bubbles.length === 0) {
                this.unlocked = true;
                this.openProgress = 1;
            } else {
                const hasBubble = bubbles.some((bubble) => {
                    const left = bubble.x - bubble.radius;
                    const right = bubble.x + bubble.radius;
                    return right > this.unlockRegion.xMin &&
                        left < this.unlockRegion.xMax;
                });
                if (!hasBubble) {
                    this.unlocked = true;
                }
            }
        }

        if (this.unlocked && this.openProgress < 1) {
            if (!this.unlockSfxPlayed) {
                AudioSystem.playSound('doorOpen');
                this.unlockSfxPlayed = true;
            }
            this.openProgress = Math.min(1, this.openProgress + this.openSpeed);
        }
    }

    isUnlocked() {
        return this.unlocked;
    }

    getBlockingRects() {
        const rects = [];
        const ceilingY = GAME_CONFIG.CEILING_Y;
        const topHeight = Math.max(
            0,
            this.doorY - ceilingY - this.doorClearance
        );
        if (topHeight > 0) {
            rects.push({
                x: this.x,
                y: ceilingY,
                width: this.width,
                height: topHeight
            });
        }

        const bottomStart = this.doorY + this.doorHeight + this.doorClearance;
        const bottomHeight = Math.max(0, GAME_CONFIG.CANVAS_HEIGHT - bottomStart);
        if (bottomHeight > 0) {
            rects.push({
                x: this.x,
                y: bottomStart,
                width: this.width,
                height: bottomHeight
            });
        }

        if (!this.unlocked || this.openProgress < 1) {
            const openOffset = (this.doorHeight * this.openProgress) / 2;
            const blockHeight = this.doorHeight * (1 - this.openProgress);
            rects.push({
                x: this.x,
                y: this.doorY + openOffset,
                width: this.width,
                height: blockHeight
            });
        }
        return rects;
    }

    draw(ctx, theme) {
        const frameColor = theme.vars['--border-dim'];
        const accent = theme.vars['--secondary'];
        const lockedColor = '#ff4d4d';
        const unlockedColor = '#3dff9c';
        const doorGlow = '#9bf5ff';
        const doorRect = {
            x: this.x,
            y: this.doorY,
            width: this.width,
            height: this.doorHeight
        };
        const openOffset = (this.doorHeight * this.openProgress) / 2;
        const animatedDoorRect = {
            x: doorRect.x,
            y: doorRect.y + openOffset,
            width: doorRect.width,
            height: doorRect.height * (1 - this.openProgress)
        };

        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = frameColor;

        const segments = this.getBlockingRects().filter((rect) => {
            return rect.y !== animatedDoorRect.y ||
                rect.height !== animatedDoorRect.height;
        });
        for (const rect of segments) {
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        }

        ctx.globalAlpha = 1;
        if (this.openProgress >= 1) {
            ctx.strokeStyle = unlockedColor;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = doorGlow;
            ctx.shadowBlur = 12;
            ctx.strokeRect(
                doorRect.x + 2,
                doorRect.y + 2,
                doorRect.width - 4,
                doorRect.height - 4
            );
            ctx.shadowBlur = 0;
        } else {
            const gradient = ctx.createLinearGradient(
                animatedDoorRect.x,
                animatedDoorRect.y,
                animatedDoorRect.x + animatedDoorRect.width,
                animatedDoorRect.y
            );
            gradient.addColorStop(0, lockedColor);
            gradient.addColorStop(0.5, '#ff8e5a');
            gradient.addColorStop(1, lockedColor);

            ctx.fillStyle = gradient;
            ctx.fillRect(
                animatedDoorRect.x,
                animatedDoorRect.y,
                animatedDoorRect.width,
                animatedDoorRect.height
            );

            ctx.strokeStyle = accent;
            ctx.lineWidth = 2;
            ctx.strokeRect(
                animatedDoorRect.x + 2,
                animatedDoorRect.y + 2,
                animatedDoorRect.width - 4,
                animatedDoorRect.height - 4
            );

            this.doorPulse = (this.doorPulse + 0.08) % (Math.PI * 2);
            const pulseAlpha = 0.4 + Math.sin(this.doorPulse) * 0.25;
            ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
            ctx.fillRect(
                animatedDoorRect.x + 3,
                animatedDoorRect.y + animatedDoorRect.height * 0.3,
                animatedDoorRect.width - 6,
                2
            );
            ctx.fillRect(
                animatedDoorRect.x + 3,
                animatedDoorRect.y + animatedDoorRect.height * 0.65,
                animatedDoorRect.width - 6,
                2
            );
        }
        ctx.restore();
    }
}

export class Bubble {
    constructor(x, y, size, type = 'standard', hitCount = 0) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.size = size;
        this.type = type;
        this.hitCount = hitCount;
        this.markedForRemoval = false;
        this.hitCeiling = false;
        this.zigzagTimer = 0;
        this.phaseShiftActive = false;
        this.phaseShiftTimer = 0;
        this.rhythmPhase = 0;
        this.armorHitsRequired = 0;
        this.armorHitFlashTimer = 0;

        const sizeConfig = BUBBLE_SIZES[size];
        this.radius = sizeConfig.radius;
        const baseBounceScale = 0.85;
        this.minBounceSpeed = sizeConfig.bounceSpeed * baseBounceScale;
        this.speedX = (Math.random() - 0.5) * 1.5;
        this.speedY = 0;
        this.gravity = 0.3;

        // Clamp spawning position
        if (this.x - this.radius < 0) {
            this.x = this.radius + 1;
        }
        if (this.x + this.radius > GAME_CONFIG.CANVAS_WIDTH) {
            this.x = GAME_CONFIG.CANVAS_WIDTH - this.radius - 1;
        }

        if (this.type === 'fast') {
            this.speedX *= 2.5;
            this.minBounceSpeed *= 1.1;
        } else if (this.type === 'heavy') {
            this.gravity = 0.5;
            this.minBounceSpeed *= 0.85;
        } else if (this.type === 'rubber') {
            this.gravity = 0.22;
            this.speedX *= 1.3;
            this.minBounceSpeed *= 1.25;
        } else if (this.type === 'ghost') {
            this.speedX *= 1.2;
        } else if (this.type === 'zigzag') {
            this.speedX *= 1.7;
            this.zigzagTimer = Math.floor(Math.random() * 40) + 30;
        } else if (this.type === 'drifter') {
            this.gravity = 0.18;
            this.speedX *= 0.7;
        } else if (this.type === 'phaseShift') {
            this.speedX *= 1.2;
            this.phaseShiftTimer = Math.floor(Math.random() * 80) + 80;
        } else if (this.type === 'armored') {
            this.gravity = 0.35;
            this.speedX *= 1.1;
            this.armorHitsRequired = 2;
        } else if (this.type === 'rhythm') {
            this.speedX *= 1.3;
            this.rhythmPhase = Math.random() * Math.PI * 2;
        }

        const bounceMargin = 10;
        const maxRise =
            GAME_CONFIG.CANVAS_HEIGHT -
            this.radius -
            (GAME_CONFIG.CEILING_Y + this.radius + bounceMargin);
        const clampedRise = Math.max(maxRise, this.radius * 2);
        this.maxBounceSpeed = Math.sqrt(clampedRise * 2 * this.gravity);
        const minHorizontalSpeed = 0.6;
        if (Math.abs(this.speedX) < minHorizontalSpeed) {
            this.speedX = minHorizontalSpeed * (Math.random() < 0.5 ? -1 : 1);
        }

        this.colors = ['#FF1493', '#FF8C00', '#00CED1', '#90EE90'];
        this.color = this.colors[size - 1];

        if (this.type === 'fast') this.color = '#FFFF00';
        if (this.type === 'heavy') this.color = '#A9A9A9';
        if (this.type === 'ghost') this.color = '#E0B0FF';
        if (this.type === 'rubber') this.color = '#00FFCC';
        if (this.type === 'zigzag') this.color = '#FF5F1F';
        if (this.type === 'drifter') this.color = '#7FFFD4';
        if (this.type === 'phaseShift') this.color = '#8B7CFF';
        if (this.type === 'armored') this.color = '#FF8C00';
        if (this.type === 'rhythm') this.color = '#00FFA8';
    }

    update(speedScale = 1, ceilingSpikesEnabled = true) {
        let effectiveScale = speedScale;
        if (this.type === 'rhythm') {
            this.rhythmPhase += 0.08 * speedScale;
            const pulse = 0.7 + 0.6 * (0.5 + 0.5 * Math.sin(this.rhythmPhase));
            effectiveScale *= pulse;
        }
        this.prevX = this.x;
        this.prevY = this.y;
        this.y += this.speedY * effectiveScale;
        this.x += this.speedX * effectiveScale;

        if (this.type === 'ghost' && Math.random() < 0.02) {
            this.speedX += (Math.random() - 0.5) * 0.5;
        }

        const minHorizontalSpeed = 0.4;
        if (Math.abs(this.speedX) < minHorizontalSpeed) {
            this.speedX = minHorizontalSpeed * (this.speedX < 0 ? -1 : 1);
        }

        if (this.type === 'zigzag') {
            this.zigzagTimer -= speedScale;
            if (this.zigzagTimer <= 0) {
                this.speedX = -this.speedX;
                this.zigzagTimer = Math.floor(Math.random() * 30) + 25;
            }
        }

        if (this.type === 'phaseShift') {
            this.phaseShiftTimer -= speedScale;
            if (this.phaseShiftTimer <= 0) {
                this.phaseShiftActive = !this.phaseShiftActive;
                this.phaseShiftTimer = this.phaseShiftActive ? 60 : 120;
            }
        }
        if (this.armorHitFlashTimer > 0) {
            this.armorHitFlashTimer -= speedScale;
        }
        if (this.y + this.radius >= GAME_CONFIG.CANVAS_HEIGHT) {
            this.y = GAME_CONFIG.CANVAS_HEIGHT - this.radius;
            const bounceSpeed = Math.min(
                this.minBounceSpeed + this.hitCount * 1.2,
                this.maxBounceSpeed
            );
            this.speedY = -bounceSpeed;
        } else {
            this.speedY += this.gravity * effectiveScale;
        }

        // Ceiling spike collision
        const ceilingLimit = ceilingSpikesEnabled
            ? GAME_CONFIG.CEILING_Y
            : GAME_CONFIG.UI_HEIGHT;
        if (this.y - this.radius <= ceilingLimit) {
            if (!ceilingSpikesEnabled) {
                this.y = ceilingLimit + this.radius;
                this.speedY = Math.abs(this.speedY);
            } else {
                this.markedForRemoval = true;
                this.hitCeiling = true;
            }
        }

        if (this.x - this.radius <= 0) {
            this.x = this.radius;
            this.speedX = Math.abs(this.speedX);
        }
        if (this.x + this.radius >= GAME_CONFIG.CANVAS_WIDTH) {
            this.x = GAME_CONFIG.CANVAS_WIDTH - this.radius;
            this.speedX = -Math.abs(this.speedX);
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.type === 'ghost') ctx.globalAlpha = 0.6;
        if (this.type === 'phaseShift' && this.phaseShiftActive) {
            ctx.globalAlpha = 0.3;
        }

        const centerX = Math.round(this.x);
        const centerY = Math.round(this.y);
        const r = Math.max(2, Math.round(this.radius));
        const fillColor = this.getRenderColor();
        const sprite = buildPixelBubbleSprite(r, fillColor);
        if (sprite) {
            const topLeftX = Math.round(centerX - sprite.drawSize / 2);
            const topLeftY = Math.round(centerY - sprite.drawSize / 2);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(sprite.canvas, topLeftX, topLeftY, sprite.drawSize, sprite.drawSize);
        }

        ctx.restore();
    }

    getRenderColor() {
        if (this.type !== 'standard') {
            return this.color;
        }
        const themePalette = readThemeBubblePalette();
        return themePalette?.fill[this.size] || this.color;
    }

    split() {
        if (this.size > 1) {
            const childHitCount = this.type === 'armored' ? 0 : this.hitCount;
            const b1 = new Bubble(
                this.x - 24, 
                this.y - 16, 
                this.size - 1, 
                this.type,
                childHitCount
            );
            const b2 = new Bubble(
                this.x + 24, 
                this.y - 16, 
                this.size - 1, 
                this.type,
                childHitCount
            );
            b1.speedY = -Math.min(
                b1.minBounceSpeed + b1.hitCount * 1.2,
                b1.maxBounceSpeed
            );
            b2.speedY = -Math.min(
                b2.minBounceSpeed + b2.hitCount * 1.2,
                b2.maxBounceSpeed
            );
            b1.speedX = -1.8 * (this.type === 'fast' ? 1.5 : 1);
            b2.speedX = 1.8 * (this.type === 'fast' ? 1.5 : 1);
            return [b1, b2];
        }
        return [];
    }

    isHittable() {
        return !(this.type === 'phaseShift' && this.phaseShiftActive);
    }

    registerHit() {
        this.hitCount += 1;
        if (this.type === 'armored') {
            this.armorHitFlashTimer = 16;
            return this.hitCount >= this.armorHitsRequired;
        }
        return true;
    }
}

export class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.speedY = GAME_CONFIG.BULLET_SPEED;
        this.active = true;
    }

    update(speedScale = 1) {
        this.y -= this.speedY * speedScale;
        if (this.y + this.radius < GAME_CONFIG.CEILING_Y) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#ff4d00';
        ctx.shadowColor = '#ff4d00';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class DropItem {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 20;
        this.speedY = 3;
        this.rotation = 0;
        this.lifeTime = GAME_CONFIG.DROP_LIFETIME;
        this.maxLifeTime = GAME_CONFIG.DROP_LIFETIME;
    }

    update() {
        if (this.y < GAME_CONFIG.CANVAS_HEIGHT - 25) {
            this.y += this.speedY;
        } else {
            this.y = GAME_CONFIG.CANVAS_HEIGHT - 25;
            this.lifeTime--;
        }

        this.rotation += 0.1;
        return this.lifeTime > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Blink when about to disappear
        if (this.lifeTime < 120 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        if (this.type === 'powerWire') {
            ctx.fillStyle = '#ffff00';
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, -10);
            ctx.lineTo(2, -2);
            ctx.lineTo(-2, 0);
            ctx.lineTo(8, 10);
            ctx.lineTo(-2, 2);
            ctx.lineTo(2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10;
            ctx.fill();
        }

        if (this.type === 'timeFreeze') {
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
            ctx.beginPath();
            ctx.rect(-10, -10, 20, 20);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-6, 0);
            ctx.lineTo(6, 0);
            ctx.moveTo(0, -6);
            ctx.lineTo(0, 6);
            ctx.moveTo(-4, -4);
            ctx.lineTo(4, 4);
            ctx.moveTo(-4, 4);
            ctx.lineTo(4, -4);
            ctx.stroke();
        }

        if (this.type === 'slowMo') {
            ctx.strokeStyle = '#ffb000';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(255, 176, 0, 0.2)';
            ctx.beginPath();
            ctx.rect(-10, -10, 20, 20);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-6, -6);
            ctx.lineTo(6, -6);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-6, 6);
            ctx.lineTo(6, 6);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.stroke();
        }

        if (this.type === 'autoGun') {
            ctx.strokeStyle = '#ff4d00';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(255, 77, 0, 0.2)';
            ctx.beginPath();
            ctx.rect(-10, -10, 20, 20);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-6, 4);
            ctx.lineTo(6, 4);
            ctx.lineTo(8, 0);
            ctx.lineTo(6, -4);
            ctx.lineTo(-6, -4);
            ctx.closePath();
            ctx.stroke();
        }

        ctx.restore();
    }

    checkCollision(playerObj) {
        const dx = this.x - playerObj.x;
        const dy = this.y - (playerObj.y + playerObj.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.size + 16;
    }
}
