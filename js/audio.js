import { SynthAudio, mtof } from 'cyber-kit';

export class SwarmAudio extends SynthAudio {
  constructor(store) {
    super({ store, music: 'drive', musicTrimDb: 2, sfxTrimDb: 2 });
  }
  fire() { this.osc({ type: 'square', f: 880, f2: 420, dur: 0.05, vol: 0.035, lp: 3200 }); }
  hit() { this.noiseHit({ dur: 0.04, vol: 0.03, type: 'highpass', f: 2000 }); }
  kill() {
    this.osc({ type: 'triangle', f: 420, f2: 120, dur: 0.12, vol: 0.05, lp: 2400 });
    this.noiseHit({ dur: 0.08, vol: 0.04, type: 'bandpass', f: 1800 });
  }
  xp() { this.osc({ type: 'sine', f: mtof(84), dur: 0.05, vol: 0.03, send: 0.2 }); }
  level() {
    [0, 4, 7, 12].forEach((x, i) => this.osc({ type: 'square', f: mtof(72 + x), t: i * 0.05, dur: 0.14, vol: 0.045, lp: 4000, send: 0.35 }));
  }
  hurt() { this.osc({ type: 'sawtooth', f: 200, f2: 60, dur: 0.22, vol: 0.07, lp: 1200 }); }
  dead() { this.osc({ type: 'sawtooth', f: 180, f2: 40, dur: 0.7, vol: 0.1, lp: 900 }); this.noiseHit({ dur: 0.5, vol: 0.1, type: 'lowpass', f: 800 }); }
  pick() { this.click(); this.whoosh(0.04); }
}
