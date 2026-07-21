// Player and Harpoon management
import { AudioSystem } from './audio.js';
import { GAME_CONFIG } from './config.js';

const setPowerWireIndicator = (visible) => {
    const indicator = document.getElementById('powerWireIndicator');
    if (indicator) {
        indicator.style.display = visible ? 'block' : 'none';
    }
};

export const Player = {
    x: GAME_CONFIG.CANVAS_WIDTH / 2,
    y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PLAYER_HEIGHT,
    width: GAME_CONFIG.PLAYER_WIDTH,
    height: GAME_CONFIG.PLAYER_HEIGHT,
    speed: GAME_CONFIG.PLAYER_SPEED,
    velocityX: 0,
    velocityY: 0,
    accel: 0.45,
    friction: 0.82,
    gravity: 0.55,
    maxFallSpeed: 10,
    climbSpeed: 3,
    bobPhase: 0,
    bobOffset: 0,
    lean: 0,
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    onLadder: false,
    onGround: false,
    invulnerableTimer: 0,
    animState: 'idle',
    animFrame: 0,
    animTimer: 0,
    facing: 1,
    shootTimer: 0,
    stepFxTimer: 0,
    stepPulse: 0,

    reset() {
        this.x = GAME_CONFIG.CANVAS_WIDTH / 2;
        this.y = GAME_CONFIG.CANVAS_HEIGHT - this.height;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;
        this.velocityX = 0;
        this.velocityY = 0;
        this.bobPhase = 0;
        this.bobOffset = 0;
        this.lean = 0;
        this.onLadder = false;
        this.onGround = false;
        this.invulnerableTimer = 0;
        this.animState = 'idle';
        this.animFrame = 0;
        this.animTimer = 0;
        this.facing = 1;
        this.shootTimer = 0;
        this.stepFxTimer = 0;
        this.stepPulse = 0;
    },

    update(ceilingSpikesEnabled = true) {
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= 1;
        }
        if (this.shootTimer > 0) {
            this.shootTimer -= 1;
        }
        if (this.stepFxTimer > 0) {
            this.stepFxTimer -= 1;
        }
        this.prevY = this.y;
        let targetSpeed = 0;
        if (this.moveLeft) targetSpeed -= this.speed;
        if (this.moveRight) targetSpeed += this.speed;

        if (targetSpeed !== 0) {
            this.velocityX += (targetSpeed - this.velocityX) * this.accel;
        } else {
            this.velocityX *= this.friction;
        }

        this.x += this.velocityX;

        if (this.onLadder) {
            this.velocityY = 0;
            if (this.moveUp) this.y -= this.climbSpeed;
            if (this.moveDown) this.y += this.climbSpeed;
        } else {
            this.velocityY = Math.min(
                this.velocityY + this.gravity,
                this.maxFallSpeed
            );
            this.y += this.velocityY;
        }

        const minY = ceilingSpikesEnabled
            ? GAME_CONFIG.CEILING_Y + 4
            : GAME_CONFIG.UI_HEIGHT + 4;
        if (this.y < minY) {
            this.y = minY;
            this.velocityY = 0;
        }

        const minX = this.width / 2;
        const maxX = GAME_CONFIG.CANVAS_WIDTH - this.width / 2;
        if (this.x < minX) {
            this.x = minX;
            this.velocityX = 0;
        }
        if (this.x > maxX) {
            this.x = maxX;
            this.velocityX = 0;
        }

        const speedAbs = Math.min(Math.abs(this.velocityX), this.speed);
        if (speedAbs > 0.2) {
            this.bobPhase += 0.12 + speedAbs * 0.05;
        } else {
            this.bobPhase *= 0.95;
        }
        this.bobOffset = Math.sin(this.bobPhase) * (1.5 + speedAbs * 0.25);
        this.lean = this.velocityX / this.speed;

        if (Math.abs(this.velocityX) > 0.25) {
            this.facing = this.velocityX > 0 ? 1 : -1;
        }

        const moveX = Math.abs(this.velocityX) > 0.35;
        const moveY = this.onLadder && (this.moveUp || this.moveDown);
        const nextState = this.shootTimer > 0
            ? 'shoot'
            : moveY
                ? 'climb'
                : moveX
                    ? 'run'
                    : 'idle';

        if (nextState !== this.animState) {
            this.animState = nextState;
            this.animFrame = 0;
            this.animTimer = 0;
        } else {
            this.animTimer += 1;
            const frameRate = this.animState === 'run'
                ? 6
                : this.animState === 'climb'
                    ? 8
                    : 12;
            const frameCount = this.animState === 'run'
                ? 6
                : this.animState === 'shoot'
                    ? 2
                    : this.animState === 'climb'
                        ? 4
                        : 2;
            if (this.animTimer >= frameRate) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % frameCount;
            }
        }

        if (this.animState === 'run' && this.animFrame % 3 === 0 && this.animTimer === 0) {
            this.stepFxTimer = 6;
            this.stepPulse = (this.stepPulse + 1) % 2;
        }
    },

    draw(ctx, theme) {
        const primaryColor = theme.vars['--primary'];
        const bgColor = theme.vars['--bg-dark'];
        const accent = theme.vars['--accent'];
        const bodyWidth = this.width;
        const bodyHeight = this.height;
        const bobY = Math.round(this.bobOffset);
        const centerX = Math.round(this.x);
        const centerY = Math.round(this.y + bodyHeight / 2 + bobY);

        const frameSwing = this.animState === 'run'
            ? (this.animFrame % 2 === 0 ? -1 : 1)
            : 0;
        const climbOffset = this.animState === 'climb'
            ? (this.animFrame % 2 === 0 ? -1 : 1)
            : 0;
        const shootKick = this.animState === 'shoot' ? 1 : 0;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(this.facing, 1);

        if (this.invulnerableTimer > 0) {
            const blink = Math.floor(this.invulnerableTimer / 5) % 2 === 0;
            ctx.globalAlpha = blink ? 0.55 : 0.95;
        }

        const shadowWidth = Math.round(bodyWidth * 0.42);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fillRect(-shadowWidth, Math.floor(bodyHeight / 2) + 6, shadowWidth * 2, 3);

        const spriteX = -Math.floor(bodyWidth / 2);
        const spriteY = -Math.floor(bodyHeight / 2) - shootKick;
        const torsoTop = spriteY + 7;
        const torsoHeight = bodyHeight - 13;

        // Helmet/cap block keeps the same hue as the suit body.
        ctx.fillStyle = primaryColor;
        ctx.fillRect(spriteX + 4, spriteY + 1, bodyWidth - 8, 5);

        // Main suit
        ctx.fillStyle = primaryColor;
        ctx.fillRect(spriteX + 3, torsoTop, bodyWidth - 6, torsoHeight);

        // Soft inner shading keeps shape definition without bright outlines.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.fillRect(spriteX + 3, torsoTop + 2, 3, torsoHeight - 4);
        ctx.fillRect(spriteX + bodyWidth - 6, torsoTop + 2, 3, torsoHeight - 4);

        const armLift = this.animState === 'shoot' ? -2 : frameSwing;
        // Keep limbs in body color but place them behind the visor/core details.
        ctx.fillStyle = primaryColor;
        ctx.fillRect(spriteX + 1, spriteY + 13 + armLift, 3, 9);
        ctx.fillRect(spriteX + bodyWidth - 4, spriteY + 13 - armLift, 3, 9);

        // Visor/core
        ctx.fillStyle = bgColor;
        ctx.fillRect(spriteX + 7, spriteY + 11, bodyWidth - 14, 7);
        ctx.fillStyle = accent;
        ctx.fillRect(spriteX + 9, spriteY + 12, bodyWidth - 20, 2);

        const legStride = this.animState === 'run' ? frameSwing * 2 : climbOffset;
        ctx.fillStyle = primaryColor;
        ctx.fillRect(spriteX + 8, spriteY + bodyHeight - 8 + legStride, 5, 8);
        ctx.fillRect(spriteX + bodyWidth - 13, spriteY + bodyHeight - 8 - legStride, 5, 8);

        // antenna pixel
        ctx.fillStyle = accent;
        ctx.fillRect(-1, spriteY - 4, 2, 4);

        if (this.shootTimer > 0) {
            const flashAlpha = 0.35 + (this.shootTimer / 8) * 0.45;
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha.toFixed(2)})`;
            ctx.fillRect(spriteX + bodyWidth + 2, spriteY + 14, 6, 3);
        }

        if (this.stepFxTimer > 0) {
            const alpha = this.stepFxTimer / 6;
            ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.45).toFixed(2)})`;
            const dustY = Math.floor(bodyHeight / 2) + 8;
            const offset = this.stepPulse === 0 ? -10 : 8;
            ctx.fillRect(offset, dustY, 2, 2);
            ctx.fillRect(offset + 3, dustY + 2, 2, 2);
            ctx.fillRect(offset - 3, dustY + 3, 2, 2);
        }

        ctx.restore();
    },

    triggerShootAnimation() {
        this.shootTimer = 8;
        this.animState = 'shoot';
    },

    activateInvulnerability(duration = GAME_CONFIG.PLAYER_INVULNERABLE_FRAMES) {
        this.invulnerableTimer = duration;
    },

    checkBubbleCollision(bubbles) {
        if (this.invulnerableTimer > 0) {
            return false;
        }
        for (const bubble of bubbles) {
            const dx = this.x - bubble.x;
            const dy = this.y + this.height / 2 - bubble.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bubble.radius + 12) {
                return true;
            }
        }
        return false;
    }
};

export const Harpoon = {
    x: 0,
    y: 0,
    active: false,
    speed: GAME_CONFIG.HARPOON_SPEED,
    wobblePhase: 0,
    tipPulse: 0,
    powerWireCollected: false,
    powerWireActive: false,
    powerWireTimer: 0,

    reset() {
        this.active = false;
        this.powerWireActive = false;
        this.powerWireCollected = false;
        this.powerWireTimer = 0;
        this.wobblePhase = 0;
        this.tipPulse = 0;
    },

    shoot() {
        const isClimbing = Player.onLadder && (Player.moveUp || Player.moveDown);
        if (isClimbing) {
            return false;
        }
        if (this.powerWireActive) {
            return false;
        }

        if (!this.active) {
            this.active = true;
            this.x = Player.x;
            this.y = Player.y;
            this.wobblePhase = Math.random() * Math.PI * 2;
            this.tipPulse = 0;
            AudioSystem.playSound('shoot');
            Player.triggerShootAnimation();
            return true;
        }
        return false;
    },

    update() {
        if (this.active) {
            this.y -= this.speed;
            this.wobblePhase += 0.2;
            this.tipPulse = (this.tipPulse + 0.12) % (Math.PI * 2);
            if (this.y < GAME_CONFIG.CEILING_Y) {
                this.active = false;
            }
        }

        if (this.powerWireActive) {
            this.powerWireTimer--;
            if (this.powerWireTimer <= 0) {
                this.powerWireActive = false;
                setPowerWireIndicator(false);
            }
        }
    },

    draw(ctx, theme, ceilingSpikesEnabled = true) {
        if (this.active) {
            const primary = theme.vars['--primary'];
            const secondary = theme.vars['--secondary'];
            const cableTop = this.y;
            const cableBottom = Player.y;
            const cableLength = cableBottom - cableTop;
            const segments = Math.max(6, Math.floor(cableLength / 30));
            const sway = Math.sin(this.wobblePhase) * 4;

            ctx.save();
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.strokeStyle = primary;
            ctx.shadowColor = primary;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.moveTo(this.x, cableBottom);
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const y = cableBottom - t * cableLength;
                const offset = Math.sin(this.wobblePhase + t * 3) * sway;
                ctx.lineTo(this.x + offset, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = secondary;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.x, cableBottom);
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const y = cableBottom - t * cableLength;
                const offset = Math.sin(this.wobblePhase + t * 3) * sway * 0.5;
                ctx.lineTo(this.x + offset, y);
            }
            ctx.stroke();

            const tipGlow = 0.4 + Math.sin(this.tipPulse) * 0.3;
            ctx.fillStyle = secondary;
            ctx.beginPath();
            ctx.arc(this.x, cableTop, 6.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(255, 255, 255, ${tipGlow})`;
            ctx.beginPath();
            ctx.arc(this.x + 1.5, cableTop - 1.5, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = primary;
            ctx.beginPath();
            ctx.moveTo(this.x, cableTop - 12);
            ctx.lineTo(this.x - 7, cableTop + 6);
            ctx.lineTo(this.x + 7, cableTop + 6);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        if (this.powerWireActive) {
            const wireTopY = ceilingSpikesEnabled
                ? GAME_CONFIG.CEILING_Y
                : GAME_CONFIG.UI_HEIGHT;
            const alpha = Math.max(
                0.25,
                this.powerWireTimer / GAME_CONFIG.POWER_WIRE_DURATION
            );
            ctx.save();
            ctx.globalAlpha = alpha;

            const wireBottomY = GAME_CONFIG.CANVAS_HEIGHT;

            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(this.x, wireTopY, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3 + Math.sin(Date.now() / 100) * 1;

            ctx.beginPath();
            ctx.moveTo(this.x, wireTopY);
            ctx.lineTo(this.x, wireBottomY);
            ctx.stroke();

            const wireLength = wireBottomY - wireTopY;
            const numSpikes = 12;
            const spikeSpacing = wireLength / numSpikes;

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffff00';
            for (let i = 1; i <= numSpikes; i++) {
                const spikeY = wireTopY + i * spikeSpacing;
                const spikeSize = 8;

                ctx.beginPath();
                ctx.moveTo(this.x, spikeY - spikeSize / 2);
                ctx.lineTo(this.x - spikeSize, spikeY);
                ctx.lineTo(this.x, spikeY + spikeSize / 2);
                ctx.closePath();
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(this.x, spikeY - spikeSize / 2);
                ctx.lineTo(this.x + spikeSize, spikeY);
                ctx.lineTo(this.x, spikeY + spikeSize / 2);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }
    },

    deactivatePowerWire() {
        this.powerWireActive = false;
        this.powerWireTimer = 0;
        setPowerWireIndicator(false);
    }
};
