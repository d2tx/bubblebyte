// NES-inspired procedural audio system

const MENU_THEME = {
    stepDuration: 0.18,
    pulse1: [
        659, 784, 880, 0, 784, 880, 784, 659,
        523, 587, 659, 0, 523, 659, 587, 523
    ],
    pulse2: [
        [392, 440], 440, 392, 0, [440, 392], [392, 330], 392, 330,
        [392, 523], 440, 392, 0, [392, 440], 392, 330, 392
    ],
    triangle: [
        110, 110, 123, 0, 110, 98, 110, 123,
        131, 110, 98, 0, 110, 123, 131, 110
    ],
    noise: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
};

const GAMEPLAY_THEME = {
    stepDuration: 0.3,
    pulse1: [
        659, 784, 880, 0,
        [784, 659], 880, 784, 659,
        [523, 659], 587, 659, 0,
        [523, 587], 659, 587, 523
    ],
    pulse2: [
        [392, 440], 440, 392, 0,
        [440, 392], [392, 330], 392, 330,
        [392, 523], 440, 392, 0,
        [392, 440], 392, 330, 392
    ],
    triangle: [
        110, 110, 123, 0,
        110, 98, 110, 123,
        131, 110, 98, 0,
        110, 123, 131, 110
    ],
    noise: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
};

const VICTORY_THEME = {
    stepDuration: 0.12,
    pulse1: [523, 659, 784, 1046, 784, 1046, 1318, 0],
    pulse2: [392, 523, 659, 784, 659, 784, 988, 0],
    triangle: [131, 165, 196, 262, 196, 262, 330, 0],
    noise: [0, 0, 1, 0, 0, 1, 0, 0]
};

export const AudioSystem = {
    ctx: null,
    initialized: false,
    musicEnabled: true,
    sfxEnabled: true,
    currentSong: null,
    schedulerInterval: null,
    nextStepTime: 0,
    currentStepIndex: 0,
    lookAheadSeconds: 0.24,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    noiseBuffer: null,

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        const musicFilter = this.ctx.createBiquadFilter();
        musicFilter.type = 'lowpass';
        musicFilter.frequency.value = 3800;
        musicFilter.Q.value = 0.7;

        this.masterGain.gain.value = 0.9;
        this.musicGain.gain.value = 0.5;
        this.sfxGain.gain.value = 0.75;

        this.musicGain.connect(musicFilter);
        musicFilter.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.noiseBuffer = this.createNoiseBuffer();
        this.initialized = true;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    createNoiseBuffer() {
        const sampleRate = this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    },

    startMusic() {
        this.startSong(MENU_THEME, true);
    },

    stopMusic() {
        if (this.currentSong === MENU_THEME) {
            this.stopSong();
        }
    },

    startGameplayMusic() {
        this.startSong(GAMEPLAY_THEME, true);
    },

    stopGameplayMusic() {
        if (this.currentSong === GAMEPLAY_THEME) {
            this.stopSong();
        }
    },

    startSong(song, shouldLoop) {
        if (!this.musicEnabled) return;
        this.init();

        if (this.currentSong !== song) {
            this.stopSong();
            this.currentSong = song;
            this.currentStepIndex = 0;
            this.nextStepTime = this.ctx.currentTime + 0.02;
        }

        if (this.schedulerInterval) return;

        this.schedulerInterval = setInterval(() => {
            this.scheduleSongSteps(shouldLoop);
        }, 60);
    },

    stopSong() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
        this.currentSong = null;
        this.currentStepIndex = 0;
        this.nextStepTime = 0;
    },

    scheduleSongSteps(shouldLoop = true) {
        if (!this.currentSong || !this.ctx) return;

        const songLength = this.currentSong.pulse1.length;
        while (this.nextStepTime < this.ctx.currentTime + this.lookAheadSeconds) {
            this.scheduleStep(this.currentSong, this.currentStepIndex, this.nextStepTime);

            this.currentStepIndex++;
            if (this.currentStepIndex >= songLength) {
                if (shouldLoop) {
                    this.currentStepIndex = 0;
                } else {
                    this.stopSong();
                    return;
                }
            }

            this.nextStepTime += this.currentSong.stepDuration;
        }
    },

    scheduleStep(song, stepIndex, startTime) {
        const stepDuration = song.stepDuration;
        const p1 = song.pulse1[stepIndex];
        const p2 = song.pulse2[stepIndex];
        const bass = song.triangle[stepIndex];
        const noise = song.noise[stepIndex];

        this.playPulseVoice(p1, startTime, stepDuration, 0.115, 0.22);
        this.playPulseVoice(p2, startTime, stepDuration, 0.08, 0.18);
        this.playTriangleVoice(bass, startTime, stepDuration, 0.12);

        if (noise) {
            this.playNoiseBurst(startTime, stepDuration * 0.35, 0.045, 1900);
        }
    },

    playPulseVoice(note, startTime, duration, volume, releaseTail = 0.2) {
        if (!note) return;

        const notes = Array.isArray(note) ? note : [note];
        const noteDuration = duration / notes.length;

        for (let i = 0; i < notes.length; i++) {
            const freq = notes[i];
            if (!freq) continue;

            const oscillator = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(freq, startTime + i * noteDuration);

            const noteStart = startTime + i * noteDuration;
            const noteEnd = noteStart + noteDuration;
            gainNode.gain.setValueAtTime(0.0001, noteStart);
            gainNode.gain.linearRampToValueAtTime(volume, noteStart + 0.008);
            gainNode.gain.exponentialRampToValueAtTime(
                0.0001,
                noteEnd + noteDuration * releaseTail
            );

            oscillator.connect(gainNode);
            gainNode.connect(this.musicGain);
            oscillator.start(noteStart);
            oscillator.stop(noteEnd + noteDuration * releaseTail);
        }
    },

    playTriangleVoice(freq, startTime, duration, volume) {
        if (!freq) return;

        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(freq, startTime);

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.95);

        oscillator.connect(gainNode);
        gainNode.connect(this.musicGain);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    },

    playNoiseBurst(startTime, duration, gainAmount, centerFreq = 1400) {
        const noiseSource = this.ctx.createBufferSource();
        const filter = this.ctx.createBiquadFilter();
        const gainNode = this.ctx.createGain();

        noiseSource.buffer = this.noiseBuffer;
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(centerFreq, startTime);
        filter.Q.value = 1.2;

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(gainAmount, startTime + 0.004);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        noiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.sfxGain);

        noiseSource.start(startTime);
        noiseSource.stop(startTime + duration);
    },

    playVictoryMusic() {
        if (!this.musicEnabled) return;
        this.init();

        this.stopSong();
        this.currentSong = VICTORY_THEME;
        this.currentStepIndex = 0;
        this.nextStepTime = this.ctx.currentTime + 0.02;

        this.schedulerInterval = setInterval(() => {
            this.scheduleSongSteps(false);
        }, 60);
    },

    playSound(type) {
        if (!this.sfxEnabled || !this.ctx) return;

        const now = this.ctx.currentTime;

        switch (type) {
            case 'menu':
                this.playPulseSweep(now, 880, 640, 0.08, 0.18, 'square');
                break;
            case 'shoot':
                this.playPulseSweep(now, 520, 190, 0.12, 0.24, 'square');
                this.playNoiseBurst(now + 0.005, 0.05, 0.02, 2600);
                break;
            case 'pop':
                this.playPulseSweep(now, 1320, 620, 0.09, 0.2, 'square');
                this.playNoiseBurst(now, 0.045, 0.03, 3000);
                break;
            case 'die':
                this.playPulseSweep(now, 300, 55, 0.52, 0.35, 'square');
                this.playTriangleSweep(now, 160, 48, 0.5, 0.22);
                break;
            case 'levelup':
                this.playPulseStepSequence(now, [392, 523, 659, 784], 0.09, 0.16);
                break;
            case 'powerup':
                this.playPulseStepSequence(now, [523, 659, 784, 988], 0.075, 0.18);
                break;
            case 'doorOpen':
                this.playTriangleSweep(now, 580, 220, 0.24, 0.28);
                this.playNoiseBurst(now + 0.02, 0.16, 0.018, 1200);
                break;
            default:
                this.playPulseSweep(now, 740, 420, 0.08, 0.18, 'square');
                break;
        }
    },

    playPulseSweep(startTime, startFreq, endFreq, duration, gainAmount, wave = 'square') {
        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        oscillator.type = wave;
        oscillator.frequency.setValueAtTime(startFreq, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(gainAmount, startTime + 0.003);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    },

    playTriangleSweep(startTime, startFreq, endFreq, duration, gainAmount) {
        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(startFreq, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(gainAmount, startTime + 0.008);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    },

    playPulseStepSequence(startTime, notes, stepDuration, gainAmount) {
        notes.forEach((freq, idx) => {
            const noteStart = startTime + idx * stepDuration;
            this.playPulseSweep(noteStart, freq, freq * 0.97, stepDuration * 0.95, gainAmount, 'square');
        });
    },

    toggleMusic() {
        this.init();
        this.musicEnabled = !this.musicEnabled;

        if (!this.musicEnabled) {
            this.stopSong();
        }

        return this.musicEnabled;
    },

    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }
};
