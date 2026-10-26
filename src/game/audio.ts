// AFRICAN CROWNS: EMPIRES OF THE SUN
// Procedural Web Audio Engine (Authentic African Djembe, Kora Plucks, Horns, SFX)

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxMuted: boolean = false;
  private musicMuted: boolean = false;
  private masterVolume: number = 0.5;
  private isPlayingBgm: boolean = false;
  private bgmIntervalId: number | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSfxMuted(muted: boolean) {
    this.sfxMuted = muted;
  }

  public setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    if (muted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
  }

  public isMuted(): boolean {
    return this.sfxMuted && this.musicMuted;
  }

  public toggleMuteAll(): boolean {
    const next = !(this.sfxMuted && this.musicMuted);
    this.sfxMuted = next;
    this.setMusicMuted(next);
    return next;
  }

  // --- Procedural Percussion & African Traditional Instruments ---

  // Deep Djembe Bass Thud
  public playDjembeBass() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

    gain.gain.setValueAtTime(0.8 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Djembe Slap / Rimshot
  public playDjembeSlap() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Filtered noise burst
    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 850;
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // Kora / Balafon Pluck (Harmonic pentatonic tone)
  public playKoraNote(freq: number, duration: number = 0.4) {
    if (this.musicMuted && this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.35 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Sound Effect: Building Placed / Scaffolding Thud
  public playBuildPlace() {
    if (this.sfxMuted) return;
    this.playDjembeBass();
    setTimeout(() => this.playDjembeSlap(), 80);
  }

  // Sound Effect: Resource Harvest (Wood chop or Stone chip)
  public playHarvest(type: 'timber' | 'stone' | 'gold' | 'food') {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    if (type === 'gold') {
      this.playKoraNote(880, 0.25);
      setTimeout(() => this.playKoraNote(1174.66, 0.35), 70); // D6
    } else if (type === 'food') {
      this.playKoraNote(523.25, 0.2); // C5
    } else {
      this.playDjembeSlap();
    }
  }

  // Sound Effect: Unit Move Command (Soft talking drum double tap)
  public playUnitOrder() {
    if (this.sfxMuted) return;
    this.playDjembeSlap();
    setTimeout(() => this.playDjembeBass(), 60);
  }

  // Sound Effect: Arrow Fire
  public playArrowShoot() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.12);

    gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Sound Effect: Sword / Spear Strike
  public playAttackStrike() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);

    gain.gain.setValueAtTime(0.4 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Sound Effect: Kudu War Horn Warning (Raid Alert!)
  public playWarHorn() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(146.83, now); // D3
    osc1.frequency.linearRampToValueAtTime(164.81, now + 0.3); // E3
    osc1.frequency.setValueAtTime(164.81, now + 0.8);

    osc2.frequency.setValueAtTime(220, now); // A3
    osc2.frequency.linearRampToValueAtTime(246.94, now + 0.3);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.5 * this.masterVolume, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.2);
    osc2.stop(now + 1.2);
  }

  // Sound Effect: Victory Fanfare
  public playVictoryFanfare() {
    if (this.sfxMuted) return;
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // C major pentatonic
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playKoraNote(freq, 0.6);
        this.playDjembeBass();
      }, index * 160);
    });
  }

  // Sound Effect: Defeat Gong
  public playDefeatSting() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 1.8);

    gain.gain.setValueAtTime(0.6 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.8);
  }

  // --- Ambient Background Music (Gentle African Polyphonic Pattern) ---
  public startBGM() {
    if (this.musicMuted || this.isPlayingBgm) return;
    this.isPlayingBgm = true;

    // Pentatonic scale notes (Djembe & Balafon rhythm)
    const koraScale = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33]; // D major pentatonic
    let step = 0;

    this.bgmIntervalId = window.setInterval(() => {
      if (this.musicMuted) return;

      // Percussion groove: African 12/8 bell & djembe feel
      const beat = step % 8;
      if (beat === 0) {
        this.playDjembeBass();
      } else if (beat === 3 || beat === 6) {
        this.playDjembeSlap();
      }

      // Kora melody on select beats
      if (beat === 0 || beat === 2 || beat === 4 || beat === 5 || beat === 7) {
        const noteIdx = (step * 3) % koraScale.length;
        this.playKoraNote(koraScale[noteIdx], 0.35);
      }

      step = (step + 1) % 64;
    }, 280);
  }

  public stopBGM() {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.isPlayingBgm = false;
  }
}

export const sound = new SoundEngine();
