/**
 * PROCEDURAL WEB AUDIO SYNTHESIZER
 * Zero external mp3 dependencies: crisp camera shutter, notebook page, stamp, and dialogue sounds.
 */
export class SoundEffects {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Camera mechanical shutter click + mirror slap
  public playCameraShutter() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Fast high click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);

    // Mechanical spring slap
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.25));
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.25, t + 0.03);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    noise.connect(nGain);
    nGain.connect(this.ctx.destination);
    noise.start(t + 0.03);
  }

  // Notebook page flip / rustle
  public playPageFlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Dialogue text blip
  public playDialogueBlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 + Math.random() * 40, t);
    gain.gain.setValueAtTime(0.035, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  // Contradiction Breakthrough chord (Phoenix Wright style dramatic sting!)
  public playContradictionSting() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const freqs = [440, 554.37, 659.25, 880]; // A major
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t + i * 0.03);
      gain.gain.setValueAtTime(0.18, t + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + i * 0.03);
      osc.stop(t + 0.5);
    });
  }

  // Rubber stamp thud
  public playStampThud() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.16);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Clue discovery forensic chime (D-major sparkle)
  public playClueDiscovered() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const freqs = [587.33, 880, 1174.66]; // D5, A5, D6
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.06);
      gain.gain.setValueAtTime(0.12, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.4);
    });
  }
}

