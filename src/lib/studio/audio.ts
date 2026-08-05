"use client";
export class StudioAudioEngine {
  private ctx: AudioContext | null = null;
  private decks: Map<string, AudioBufferSourceNode> = new Map();
  private buffers: Map<string, AudioBuffer> = new Map();
  
  async init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    return this.ctx;
  }

  async loadTrack(id: string, arrayBuffer: ArrayBuffer) {
    const context = await this.init();
    const buffer = await context.decodeAudioData(arrayBuffer);
    this.buffers.set(id, buffer);
  }

  play(id: string, volume: number = 1) {
    const buffer = this.buffers.get(id);
    if (!buffer || !this.ctx) return;
    this.stop(id);
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain).connect(this.ctx.destination);
    source.start(0);
    this.decks.set(id, source);
  }

  stop(id: string) {
    this.decks.get(id)?.stop();
    this.decks.delete(id);
  }
}
export const engine = typeof window !== "undefined" ? new StudioAudioEngine() : null;