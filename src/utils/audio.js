// Web Audio API ambient sacred brass chime synthesizer
class SacredAudio {
  constructor() {
    this.ctx = null;
    this.isEnabled = false;
    this.intervalId = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTempleChime(fundamental = 216) {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const harmonics = [1, 2.01, 3.02, 4.05, 5.2];
    const gains = [0.15, 0.08, 0.04, 0.02, 0.01];

    harmonics.forEach((h, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(fundamental * h, now);

      gain.gain.setValueAtTime(gains[i], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 4.6);
    });
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
    if (this.isEnabled) {
      this.init();
      this.playTempleChime(216); // play welcoming chime
    }
    return this.isEnabled;
  }
}

export const sacredAudio = new SacredAudio();
