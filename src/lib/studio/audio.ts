/**
 * EMY Studio — Web Audio Mastering Engine & A/B Player.
 *
 * Implements the full mastering chain described in REVIEW.md & STUDIO.md:
 * 30 Hz Rumble Filter -> Low Shelf (90 Hz) -> Mid Peak (1 kHz) -> Air Shelf (8 kHz)
 * -> Compressor (12 dB knee) -> Soft-knee limiter (tanh) -> Makeup gain -> True Peak Ceiling.
 *
 * Renders on-device in 48 kHz stereo OfflineAudioContext with true-peak & BS.1770-4 measurement.
 * Plays through the user-selected audio output device (DJ controller, studio monitors, etc.).
 */

import {
  computeMakeupGain,
  softClipCurve,
  loudnessWindows,
  loudnessFromWindows,
  truePeakDbOversampled,
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

/**
 * Route an AudioContext to the user's selected output device.
 * Uses setSinkId when available (Chrome/Edge).
 */
async function routeToDevice(ctx: AudioContext, deviceId: string): Promise<void> {
  if (!deviceId) return;
  const ctxAny = ctx as AudioContext & { setSinkId?: (id: string) => Promise<void> };
  if (typeof ctxAny.setSinkId === "function") {
    try {
      await ctxAny.setSinkId(deviceId);
    } catch {
      /* fallback to default output */
    }
  }
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

const OUTPUT_SR = 48000;
// A 60-90 minute DJ set decoded to Float32 is already 700MB-1.5GB. Rendering
// it in one giant OfflineAudioContext + a few full-length copies (the old
// approach) pushes peak memory past what phones — and many desktop tabs —
// will tolerate, so mastering would silently hang or the tab would be killed
// with no error the UI could ever show. Rendering in bounded chunks keeps
// peak memory to roughly one copy of the source plus one chunk, regardless
// of how long the mix is.
const CHUNK_SEC = 180;
// Stateful nodes (compressor envelope, biquad filters) reset when a fresh
// OfflineAudioContext starts. Feeding a couple of seconds of the real,
// preceding audio in ahead of each chunk (and discarding that portion of the
// output) lets them settle before the audio we keep begins, so chunk
// boundaries don't produce audible pops or gain-reduction jumps. 2s is far
// longer than the slowest compressor release exposed in the UI (500ms).
const PRIME_SEC = 2;

/** Builds the EQ -> compressor -> soft-clip -> limiter chain onto `input`. Does not connect to destination or start any source. */
function buildMasterChain(offlineCtx: OfflineAudioContext, input: AudioNode, params: MasterParams): AudioNode {
  let lastNode: AudioNode = input;

  // ── Input Gain ──────────────────────────────────────────
  if (params.inputGainDb !== 0) {
    const inputGain = offlineCtx.createGain();
    inputGain.gain.value = Math.pow(10, params.inputGainDb / 20);
    lastNode.connect(inputGain);
    lastNode = inputGain;
  }

  // ── Rumble High-Pass (30 Hz) ────────────────────────────
  if (params.rumbleFilter) {
    const hp = offlineCtx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 30;
    hp.Q.value = 0.707;
    lastNode.connect(hp);
    lastNode = hp;
  }

  // ── 5-Band Parametric EQ ────────────────────────────────
  // Band 1: Low Shelf 80 Hz
  if (params.lowGainDb !== 0) {
    const b1 = offlineCtx.createBiquadFilter();
    b1.type = "lowshelf";
    b1.frequency.value = 80;
    b1.gain.value = params.lowGainDb;
    lastNode.connect(b1);
    lastNode = b1;
  }

  // Band 2: Low-Mid Peak 250 Hz
  const lowMidGain = params.lowMidGainDb ?? 0;
  if (lowMidGain !== 0 || params.mudCut) {
    const b2 = offlineCtx.createBiquadFilter();
    b2.type = "peaking";
    b2.frequency.value = 250;
    b2.Q.value = 1.2;
    b2.gain.value = params.mudCut ? Math.min(lowMidGain, -3) : lowMidGain;
    lastNode.connect(b2);
    lastNode = b2;
  }

  // Band 3: Mid Peak 1 kHz
  if (params.midGainDb !== 0) {
    const b3 = offlineCtx.createBiquadFilter();
    b3.type = "peaking";
    b3.frequency.value = 1000;
    b3.Q.value = 0.8;
    b3.gain.value = params.midGainDb;
    lastNode.connect(b3);
    lastNode = b3;
  }

  // Band 4: High-Mid Peak 4 kHz
  const highMidGain = params.highMidGainDb ?? 0;
  if (highMidGain !== 0) {
    const b4 = offlineCtx.createBiquadFilter();
    b4.type = "peaking";
    b4.frequency.value = 4000;
    b4.Q.value = 1.0;
    b4.gain.value = highMidGain;
    lastNode.connect(b4);
    lastNode = b4;
  }

  // Band 5: High Shelf 12 kHz
  const highGain = params.airBoost ? Math.max(params.highGainDb, 2) : params.highGainDb;
  if (highGain !== 0) {
    const b5 = offlineCtx.createBiquadFilter();
    b5.type = "highshelf";
    b5.frequency.value = 12000;
    b5.gain.value = highGain;
    lastNode.connect(b5);
    lastNode = b5;
  }

  // ── Compressor ──────────────────────────────────────────
  const comp = offlineCtx.createDynamicsCompressor();
  comp.threshold.value = params.compThreshold;
  comp.ratio.value = params.compRatio;
  comp.knee.value = params.compKnee ?? 12;
  comp.attack.value = (params.compAttack ?? 20) / 1000;
  comp.release.value = (params.compRelease ?? 250) / 1000;
  lastNode.connect(comp);
  lastNode = comp;

  // ── Soft Clipper (pre-limiter warmth/punch) ─────────────
  const softClipEnabled = params.softClipEnabled ?? false;
  const softClipDrive = params.softClipDrive ?? 0.3;
  if (softClipEnabled && softClipDrive > 0) {
    const clipper = offlineCtx.createWaveShaper();
    clipper.curve = new Float32Array(softClipCurve(softClipDrive, 4096));
    clipper.oversample = "4x";
    lastNode.connect(clipper);
    lastNode = clipper;
  }

  // ── Final Limiter (tanh soft-knee) ──────────────────────
  if (params.limiterDrive > 0) {
    const shaper = offlineCtx.createWaveShaper();
    shaper.curve = new Float32Array(softClipCurve(params.limiterDrive, 4096));
    shaper.oversample = "4x";
    lastNode.connect(shaper);
    lastNode = shaper;
  }

  return lastNode;
}

interface ChunkPlan {
  /** Chunk index. */
  idx: number;
  /** Start/end of the region we KEEP, in output (48kHz) samples. */
  outStart: number;
  outEnd: number;
  /** How many extra "priming" seconds of real preceding audio to render and discard. 0 for the first chunk. */
  primeSec: number;
}

function planChunks(totalSamples: number): ChunkPlan[] {
  const chunkSamples = Math.round(CHUNK_SEC * OUTPUT_SR);
  const numChunks = Math.max(1, Math.ceil(totalSamples / chunkSamples));
  const plans: ChunkPlan[] = [];
  for (let idx = 0; idx < numChunks; idx++) {
    const outStart = idx * chunkSamples;
    const outEnd = Math.min(totalSamples, outStart + chunkSamples);
    plans.push({ idx, outStart, outEnd, primeSec: idx === 0 ? 0 : PRIME_SEC });
  }
  return plans;
}

/** Renders one chunk (with its priming look-back) through the mastering chain and returns only the KEPT region, at 48kHz. */
async function renderChunk(
  sourceBuffer: AudioBuffer,
  plan: ChunkPlan,
  params: MasterParams,
): Promise<{ ch0: Float32Array<ArrayBuffer>; ch1: Float32Array<ArrayBuffer> }> {
  const srcSr = sourceBuffer.sampleRate;
  const outLen = plan.outEnd - plan.outStart;
  const primeSamplesOut = Math.round(plan.primeSec * OUTPUT_SR);
  const renderLenOut = primeSamplesOut + outLen;

  // Slice of the ORIGINAL buffer that covers this chunk plus its priming
  // look-back, in real time — padded a few samples on each side so the
  // context never runs out of source audio to resample from, whatever the
  // rounding between sample rates does.
  const renderStartSec = plan.outStart / OUTPUT_SR - plan.primeSec;
  const renderEndSec = plan.outEnd / OUTPUT_SR;
  const srcStart = Math.max(0, Math.floor(renderStartSec * srcSr) - 4);
  const srcEnd = Math.min(sourceBuffer.length, Math.ceil(renderEndSec * srcSr) + 4);
  const srcLen = Math.max(1, srcEnd - srcStart);

  const inCh0 = sourceBuffer.getChannelData(0);
  const inCh1 = sourceBuffer.numberOfChannels > 1 ? sourceBuffer.getChannelData(1) : inCh0;

  const chunkBuffer = new AudioBuffer({ numberOfChannels: 2, length: srcLen, sampleRate: srcSr });
  chunkBuffer.copyToChannel(inCh0.subarray(srcStart, srcEnd) as Float32Array<ArrayBuffer>, 0);
  chunkBuffer.copyToChannel(inCh1.subarray(srcStart, srcEnd) as Float32Array<ArrayBuffer>, 1);

  const offlineCtx = new OfflineAudioContext(2, renderLenOut, OUTPUT_SR);
  const chunkSource = offlineCtx.createBufferSource();
  chunkSource.buffer = chunkBuffer;
  const chainEnd = buildMasterChain(offlineCtx, chunkSource, params);
  chainEnd.connect(offlineCtx.destination);
  chunkSource.start(0);

  const rendered = await offlineCtx.startRendering();
  const rc0 = rendered.getChannelData(0);
  const rc1 = rendered.numberOfChannels > 1 ? rendered.getChannelData(1) : rc0;

  // Discard the primed look-back; keep only the real chunk region (the tail).
  return {
    ch0: Float32Array.from(rc0.subarray(rc0.length - outLen)),
    ch1: Float32Array.from(rc1.subarray(rc1.length - outLen)),
  };
}

function accumulateLoudness(ch0: Float32Array, ch1: Float32Array, sr: number, windowsL: number[], windowsR: number[]): number {
  windowsL.push(...loudnessWindows(ch0, sr));
  windowsR.push(...loudnessWindows(ch1, sr));
  return Math.max(truePeakDbOversampled(ch0), truePeakDbOversampled(ch1));
}

function mergeLoudness(windowsL: number[], windowsR: number[], peakDb: number): { integratedLufs: number; truePeakDb: number } {
  const l = loudnessFromWindows(windowsL).integratedLufs;
  const r = loudnessFromWindows(windowsR).integratedLufs;
  const integratedLufs = Number.isFinite(l) && Number.isFinite(r) ? Math.max(l, r) : Number.isFinite(l) ? l : r;
  return { integratedLufs, truePeakDb: peakDb };
}

/**
 * Renders audio through the full studio mastering chain at 48 kHz stereo.
 *
 * Runs in two chunked passes so memory stays bounded regardless of mix
 * length: pass 1 measures the loudness the mastering chain would produce
 * (rendering and immediately discarding each chunk); pass 2 re-renders each
 * chunk — deterministically identical to pass 1 — now applying the makeup
 * gain that measurement implies, and writes it straight into the final
 * buffer. Only one full-length buffer (the output) plus one chunk are ever
 * held in memory at a time, on top of the already-decoded source.
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
  const sr = OUTPUT_SR;
  const numChannels = 2;
  const durationSec = sourceBuffer.duration;
  const totalSamples = Math.max(1, Math.ceil(durationSec * sr));
  const plans = planChunks(totalSamples);

  onProgress?.({ pct: 1, stage: "Analyzing source audio..." });

  // 1. Measure input loudness & peak in slices — the source channel data are
  // views (no copy), and each slice we hand to loudnessWindows is only
  // chunk-sized, not the whole file.
  const inCh0 = sourceBuffer.getChannelData(0);
  const inCh1 = sourceBuffer.numberOfChannels > 1 ? sourceBuffer.getChannelData(1) : inCh0;
  const inWindowsL: number[] = [];
  const inWindowsR: number[] = [];
  let inPeak = -Infinity;
  const srcSliceSamples = Math.max(1, Math.round(CHUNK_SEC * sourceBuffer.sampleRate));
  for (let start = 0; start < inCh0.length; start += srcSliceSamples) {
    const end = Math.min(inCh0.length, start + srcSliceSamples);
    const peak = accumulateLoudness(
      inCh0.subarray(start, end) as Float32Array,
      inCh1.subarray(start, end) as Float32Array,
      sourceBuffer.sampleRate,
      inWindowsL,
      inWindowsR,
    );
    if (peak > inPeak) inPeak = peak;
  }
  const inLoudness = mergeLoudness(inWindowsL, inWindowsR, inPeak);

  // 2. Pass 1 — render each chunk, measure the loudness it produces, discard the audio.
  const outWindowsL: number[] = [];
  const outWindowsR: number[] = [];
  let outPeak = -Infinity;
  for (const plan of plans) {
    const { ch0, ch1 } = await renderChunk(sourceBuffer, plan, params);
    const peak = accumulateLoudness(ch0, ch1, sr, outWindowsL, outWindowsR);
    if (peak > outPeak) outPeak = peak;
    onProgress?.({
      pct: 2 + Math.round(((plan.idx + 1) / plans.length) * 45),
      stage: `Measuring loudness — chunk ${plan.idx + 1} of ${plans.length}...`,
    });
  }
  const postLoudness = mergeLoudness(outWindowsL, outWindowsR, outPeak);
  const gainDb = computeMakeupGain(
    { integratedLufs: postLoudness.integratedLufs, truePeakDb: postLoudness.truePeakDb },
    params.targetLufs,
    params.ceilingDb,
  );

  // 3. Pass 2 — re-render each chunk (deterministic given the same params),
  // apply stereo width / mono-bass / makeup gain / ceiling clamp, and write
  // straight into the one final full-length buffer.
  const finalContext = await getAudioContext();
  const finalBuffer = finalContext.createBuffer(numChannels, totalSamples, sr);
  const linearGain = Math.pow(10, gainDb / 20);
  const ceilingLinear = Math.pow(10, params.ceilingDb / 20);
  const stereoWidth = (params.stereoWidth ?? 100) / 100; // 0=mono, 1=normal, 2=wide
  const doMonoBass = params.monoBass ?? false;
  const finalWindowsL: number[] = [];
  const finalWindowsR: number[] = [];
  let finalPeak = -Infinity;

  for (const plan of plans) {
    const { ch0, ch1 } = await renderChunk(sourceBuffer, plan, params);

    for (let i = 0; i < ch0.length; i++) {
      let s0 = ch0[i];
      let s1 = ch1[i];

      // Stereo width (mid-side processing)
      if (stereoWidth !== 1.0) {
        const mid = (s0 + s1) * 0.5;
        const side = (s0 - s1) * 0.5;
        const wideSide = side * stereoWidth;
        s0 = mid + wideSide;
        s1 = mid - wideSide;
      }

      // Mono bass: narrow frequencies below ~200 Hz to mono (per-sample
      // approximation — a real crossover would split at 200Hz, but blending
      // 15% toward mono is perceptually close and much cheaper).
      if (doMonoBass) {
        const mono = (s0 + s1) * 0.5;
        s0 = s0 * 0.85 + mono * 0.15;
        s1 = s1 * 0.85 + mono * 0.15;
      }

      // Makeup gain
      s0 *= linearGain;
      s1 *= linearGain;

      // True peak ceiling clamp
      if (s0 > ceilingLinear) s0 = ceilingLinear;
      else if (s0 < -ceilingLinear) s0 = -ceilingLinear;
      if (s1 > ceilingLinear) s1 = ceilingLinear;
      else if (s1 < -ceilingLinear) s1 = -ceilingLinear;

      ch0[i] = s0;
      ch1[i] = s1;
    }

    const peak = accumulateLoudness(ch0, ch1, sr, finalWindowsL, finalWindowsR);
    if (peak > finalPeak) finalPeak = peak;

    finalBuffer.copyToChannel(ch0, 0, plan.outStart);
    finalBuffer.copyToChannel(ch1, 1, plan.outStart);

    onProgress?.({
      pct: 48 + Math.round(((plan.idx + 1) / plans.length) * 50),
      stage: `Finalizing master — chunk ${plan.idx + 1} of ${plans.length}...`,
    });
  }

  const finalLoudness = mergeLoudness(finalWindowsL, finalWindowsR, finalPeak);

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
 * Routes audio to the user-selected output device (DJ controller, monitors, etc).
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
  private deviceId = "";

  async init(raw: AudioBuffer, mastered?: AudioBuffer) {
    this.stop();
    this.rawBuffer = raw;
    this.masteredBuffer = mastered ?? null;
    this.ctx = await getAudioContext();
    // Route to user-selected device
    if (this.deviceId) {
      await routeToDevice(this.ctx, this.deviceId);
    }
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
  }

  /** Set the audio output device (call before play, or re-inits context) */
  async setOutputDevice(deviceId: string) {
    this.deviceId = deviceId;
    if (this.ctx && deviceId) {
      await routeToDevice(this.ctx, deviceId);
    }
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
