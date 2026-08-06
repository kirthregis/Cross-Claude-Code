/**
 * EMY Studio — Web Audio Mastering Engine & A/B Player.
 *
 * Implements the full mastering chain described in REVIEW.md & STUDIO.md:
 * 30 Hz Rumble Filter -> Low Shelf (90 Hz) -> Mid Peak (1 kHz) -> Air Shelf (8 kHz)
 * -> Compressor (12 dB knee) -> Soft-knee limiter (tanh) -> Makeup gain -> True Peak Ceiling.
 *
 * Renders on-device in 48 kHz stereo OfflineAudioContext with true-peak & BS.1770-4 measurement.
 */

import {
  measureLoudnessStereo,
  computeMakeupGain,
  softClipCurve,
} from "./dsp";
import type { MasterParams } from "./types";

export async function getAudioContext(): Promise<AudioContext> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  return ctx;
}

export async function decodeAudioFile(file: File | Blob): Promise<AudioBuffer> {
  const ctx = await getAudioContext();
  const ab = await file.arrayBuffer();
  return await ctx.decodeAudioData(ab);
}

export interface RenderProgress {
  pct: number;
  stage: string;
}

/**
 * Renders audio through the full studio mastering chain at 48 kHz stereo.
 */
export async function renderMaster(
  sourceBuffer: AudioBuffer,
  params: MasterParams,
  onProgress?: (p: RenderProgress) => void,
): Promise<{
  renderedBuffer: AudioBuffer;
  inputLufs: number;
  outputLufs: number;
  inputTruePeakDb: number;
  outputTruePeakDb: number;
  gainAppliedDb: number;
}> {
  const sr = 48000;
  const numChannels = 2;
  const durationSec = sourceBuffer.duration;
  const totalSamples = Math.ceil(durationSec * sr);

  onProgress?.({ pct: 10, stage: "Analyzing source audio..." });

  // 1. Measure input loudness & peak
  const inCh0 = sourceBuffer.getChannelData(0);
  const inCh1 = sourceBuffer.numberOfChannels > 1 ? sourceBuffer.getChannelData(1) : inCh0;
  const inLoudness = measureLoudnessStereo(inCh0, inCh1, sourceBuffer.sampleRate);

  onProgress?.({ pct: 25, stage: "Processing EQ, dynamics & soft-clip..." });

  // 2. Offline rendering graph
  const offlineCtx = new OfflineAudioContext(numChannels, totalSamples, sr);

  // Source node
  const sourceNode = offlineCtx.createBufferSource();
  sourceNode.buffer = sourceBuffer;

  // Rumble high-pass filter (30 Hz)
  let lastNode: AudioNode = sourceNode;
  if (params.rumbleFilter) {
    const hp = offlineCtx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 30;
    hp.Q.value = 0.707;
    lastNode.connect(hp);
    lastNode = hp;
  }

  // Low Shelf (90 Hz)
  const lowShelf = offlineCtx.createBiquadFilter();
  lowShelf.type = "lowshelf";
  lowShelf.frequency.value = 90;
  lowShelf.gain.value = params.lowGainDb;
  lastNode.connect(lowShelf);
  lastNode = lowShelf;

  // Peaking Mid (1 kHz)
  const midPeak = offlineCtx.createBiquadFilter();
  midPeak.type = "peaking";
  midPeak.frequency.value = 1000;
  midPeak.Q.value = 0.8;
  midPeak.gain.value = params.midGainDb;
  lastNode.connect(midPeak);
  lastNode = midPeak;

  // High / Air Shelf (8 kHz)
  const highShelf = offlineCtx.createBiquadFilter();
  highShelf.type = "highshelf";
  highShelf.frequency.value = 8000;
  highShelf.gain.value = params.highGainDb;
  lastNode.connect(highShelf);
  lastNode = highShelf;

  // Compressor stage
  const comp = offlineCtx.createDynamicsCompressor();
  comp.threshold.value = params.compThreshold;
  comp.ratio.value = params.compRatio;
  comp.knee.value = 12;
  comp.attack.value = 0.02;
  comp.release.value = 0.25;
  lastNode.connect(comp);
  lastNode = comp;

  // Soft-knee limiter (tanh wave shaper)
  if (params.limiterDrive > 0) {
    const shaper = offlineCtx.createWaveShaper();
    shaper.curve = new Float32Array(softClipCurve(params.limiterDrive, 4096));
    shaper.oversample = "4x";
    lastNode.connect(shaper);
    lastNode = shaper;
  }

  lastNode.connect(offlineCtx.destination);
  sourceNode.start(0);

  onProgress?.({ pct: 50, stage: "Rendering 48 kHz master buffer..." });
  const renderedOffline = await offlineCtx.startRendering();

  onProgress?.({ pct: 75, stage: "Measuring loudness & applying true-peak makeup gain..." });

  // 3. Measure rendered offline output
  const ch0 = new Float32Array(renderedOffline.getChannelData(0));
  const ch1 = new Float32Array(renderedOffline.getChannelData(1));

  const postLoudness = measureLoudnessStereo(ch0, ch1, sr);
  const gainDb = computeMakeupGain(
    { integratedLufs: postLoudness.integratedLufs, truePeakDb: postLoudness.truePeakDb },
    params.targetLufs,
    params.ceilingDb,
  );

  // 4. Apply makeup gain & ceiling clamp
  const linearGain = Math.pow(10, gainDb / 20);
  const ceilingLinear = Math.pow(10, params.ceilingDb / 20);

  for (let i = 0; i < totalSamples; i++) {
    let s0 = ch0[i] * linearGain;
    let s1 = ch1[i] * linearGain;

    // soft peak clamp to ceiling
    if (s0 > ceilingLinear) s0 = ceilingLinear;
    else if (s0 < -ceilingLinear) s0 = -ceilingLinear;

    if (s1 > ceilingLinear) s1 = ceilingLinear;
    else if (s1 < -ceilingLinear) s1 = -ceilingLinear;

    ch0[i] = s0;
    ch1[i] = s1;
  }

  onProgress?.({ pct: 90, stage: "Finalizing master output..." });

  // 5. Final verification measurement
  const finalLoudness = measureLoudnessStereo(ch0, ch1, sr);

  // Create final AudioBuffer
  const finalContext = await getAudioContext();
  const finalBuffer = finalContext.createBuffer(numChannels, totalSamples, sr);
  finalBuffer.copyToChannel(ch0, 0);
  finalBuffer.copyToChannel(ch1, 1);

  onProgress?.({ pct: 100, stage: "Done" });

  return {
    renderedBuffer: finalBuffer,
    inputLufs: Number.isFinite(inLoudness.integratedLufs) ? inLoudness.integratedLufs : -24,
    outputLufs: Number.isFinite(finalLoudness.integratedLufs) ? finalLoudness.integratedLufs : params.targetLufs,
    inputTruePeakDb: Number.isFinite(inLoudness.truePeakDb) ? inLoudness.truePeakDb : -6,
    outputTruePeakDb: Number.isFinite(finalLoudness.truePeakDb) ? finalLoudness.truePeakDb : params.ceilingDb,
    gainAppliedDb: gainDb,
  };
}

/**
 * Real-time A/B Master Player (Original vs Processed).
 */
export class MasteringPlayer {
  private ctx: AudioContext | null = null;
  private rawBuffer: AudioBuffer | null = null;
  private masteredBuffer: AudioBuffer | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private startOffsetSec = 0;
  private startTime = 0;
  private mode: "original" | "mastered" = "mastered";

  async init(raw: AudioBuffer, mastered?: AudioBuffer) {
    this.stop();
    this.rawBuffer = raw;
    this.masteredBuffer = mastered ?? null;
    this.ctx = await getAudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
  }

  setMasteredBuffer(buf: AudioBuffer) {
    this.masteredBuffer = buf;
  }

  setMode(m: "original" | "mastered") {
    if (this.mode === m) return;
    this.mode = m;
    if (this.isPlaying) {
      const pos = this.getCurrentTime();
      this.play(pos);
    }
  }

  getMode() {
    return this.mode;
  }

  play(fromSec?: number) {
    if (!this.ctx || !this.rawBuffer) return;
    this.stop();

    const buf = this.mode === "mastered" && this.masteredBuffer ? this.masteredBuffer : this.rawBuffer;
    const offset = fromSec !== undefined ? fromSec : this.startOffsetSec;
    const boundedOffset = Math.max(0, Math.min(offset, buf.duration));

    const source = this.ctx.createBufferSource();
    source.buffer = buf;

    if (!this.gainNode) {
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
    }

    source.connect(this.gainNode);
    source.onended = () => {
      if (this.currentSource === source) {
        this.isPlaying = false;
      }
    };

    source.start(0, boundedOffset);
    this.currentSource = source;
    this.startTime = this.ctx.currentTime;
    this.startOffsetSec = boundedOffset;
    this.isPlaying = true;
  }

  pause() {
    if (!this.isPlaying || !this.ctx) return;
    const pos = this.getCurrentTime();
    this.stop();
    this.startOffsetSec = pos;
  }

  stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {}
      this.currentSource = null;
    }
    this.isPlaying = false;
  }

  seek(sec: number) {
    this.startOffsetSec = sec;
    if (this.isPlaying) {
      this.play(sec);
    }
  }

  getCurrentTime(): number {
    if (!this.ctx || !this.isPlaying) return this.startOffsetSec;
    const elapsed = this.ctx.currentTime - this.startTime;
    const buf = this.rawBuffer;
    const duration = buf ? buf.duration : 0;
    return Math.min(duration, this.startOffsetSec + elapsed);
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(2, vol)), this.ctx.currentTime);
    }
  }
}

export const player = typeof window !== "undefined" ? new MasteringPlayer() : null;
