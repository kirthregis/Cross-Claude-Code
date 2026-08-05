"use client";

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export class StudioAudioEngine {
  private ctx: AudioContext | null = null;
  private decks = new Map<string, AudioBufferSourceNode>();
  private buffers = new Map<string, AudioBuffer>();

  async init() {
    if (!this.ctx) {
      const w = window as WebkitWindow;
      const Ctx = window.AudioContext ?? w.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  async loadTrack(id: string, arrayBuffer: ArrayBuffer) {
    const context = await this.init();
    if (!context) return;
    const buffer = await context.decodeAudioData(arrayBuffer);
    this.buffers.set(id, buffer);
  }

  play(id: string, volume = 1) {
    if (!this.ctx) return;
    const buffer = this.buffers.get(id);
    if (!buffer) return;

    this.stop(id);

    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();

    source.buffer = buffer;
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(this.ctx.destination);

    source.start();
    this.decks.set(id, source);
  }

  stop(id: string) {
    const src = this.decks.get(id);
    if (src) {
      try { src.stop(); } catch {}
      this.decks.delete(id);
    }
  }

  hasTrack(id: string) {
    return this.buffers.has(id);
  }
}

export const engine =
  typeof window !== "undefined" ? new StudioAudioEngine() : null;