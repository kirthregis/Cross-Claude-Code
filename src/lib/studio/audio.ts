/**
 * EMY Studio — browser audio engine.
 *
 * - decodes her file (mp3/aac/wav/m4a…)
 * - realtime A/B preview of the master chain (original vs processed)
 * - chunked offline render so even a 66-minute set masters in bounded memory
 * - exports 48 kHz 16/24-bit WAV, loudness-normalized to the target LUFS
 *   with a true-peak ceiling — i.e. "upload to YouTube without thinking"
 *
 * All rendering runs on-device: works with no internet connection at all.
 */

import { computeMakeupGain, dbToGain, loudnessFromWindows, loudnessWindows, measureLoudnessStereo, quantize, softClipCurve, truePeakDbOversampled, type LoudnessResult } from "./dsp";
import { encodeWav } from "./wav";
import type { AudioInfo, MasterParams } from "./types";

const TARGET_RATE = 48000;
const CHUNK_SEC = 8 * 60; // 8-minute chunks → ~140 MB peak per chunk @24-bit

export interface DecodedAudio {
  buffer: AudioBuffer;
  info: AudioInfo;
}

export async function decodeAudioFile(file: File): Promise<DecodedAudio> {
  const arrayBuf = await file.arrayBuffer();
  const ctx = new AudioContext();
  try {
    const buffer = await ctx.decodeAudioData(arrayBuf);
    return {
      buffer,
      info: {
        fileName: file.name,
        sizeBytes: file.size,
        durationSec: buffer.duration,
        sampleRate: buffer.sampleRate,
        channels: buffer.numberOfChannels,
      },
    };
  } finally {
    void ctx.close().catch(() => {});
  }
}

export function estimateMemoryMb(info: AudioInfo): number {
  const pcmBytes = info.durationSec * info.sampleRate * info.channels * 4;
  return Math.round((pcmBytes + pcmBytes * 1.08) / (1024 * 1024)); // decode + one render chunk
}

/** min/max peaks per column for waveform drawing. */
export function computeWaveform(buffer: AudioBuffer, columns: number): Float32Array {
  const data = buffer.getChannelData(0);
  const n = data.length;
  const peaks = new Float32Array(columns);
  const step = Math.max(1, Math.floor(n / columns));
  for (let c = 0; c < columns; c++) {
    const start = c * step;
    const end = Math.min(n, start + step);
    let max = 0;
    for (let i = start; i < end; i++) {
      const a = Math.abs(data[i]);
      if (a > max) max = a;
    }
    peaks[c] = max;
  }
  return peaks;
}

// ---- master chain ----

interface Chain {
  input: GainNode;
  output: GainNode;
  /** full chain nodes, for bypass */
  nodes: AudioNode[];
  makeup: GainNode;
}

export function buildChain(ctx: BaseAudioContext, params: MasterParams): Chain {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const nodes: AudioNode[] = [];

  let prev: AudioNode = input;

  if (params.rumbleFilter) {
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 30;
    hp.Q.value = 0.707;
    prev.connect(hp);
    prev = hp;
    nodes.push(hp);
  }
  const low = ctx.createBiquadFilter();
  low.type = "lowshelf";
  low.frequency.value = 90;
  low.gain.value = params.lowGainDb;
  prev.connect(low);
  prev = low;
  nodes.push(low);

  const mid = ctx.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = 1000;
  mid.Q.value = 0.8;
  mid.gain.value = params.midGainDb;
  prev.connect(mid);
  prev = mid;
  nodes.push(mid);

  const high = ctx.createBiquadFilter();
  high.type = "highshelf";
  high.frequency.value = 8000;
  high.gain.value = params.highGainDb;
  prev.connect(high);
  prev = high;
  nodes.push(high);

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = params.compThreshold;
  comp.ratio.value = params.compRatio;
  comp.attack.value = 0.02;
  comp.release.value = 0.25;
  comp.knee.value = 12;
  prev.connect(comp);
  prev = comp;
  nodes.push(comp);

  if (params.limiterDrive > 0.01) {
    const shaper = ctx.createWaveShaper();
    shaper.curve = softClipCurve(params.limiterDrive);
    prev.connect(shaper);
    prev = shaper;
    nodes.push(shaper);
  }

  const makeup = ctx.createGain();
  makeup.gain.value = 0; // dB → applied after measurement
  prev.connect(makeup);
  prev = makeup;
  nodes.push(makeup);

  prev.connect(output);
  return { input, output, nodes, makeup };
}

// ---- realtime A/B preview ----

export class PreviewPlayer {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private chain: Chain | null = null;
  private buffer: AudioBuffer | null = null;
  private params: MasterParams = { targetLufs: -14, lowGainDb: 0, midGainDb: 0, highGainDb: 0, rumbleFilter: true, compThreshold: -16, compRatio: 2.2, limiterDrive: 0.65, ceilingDb: -1 };
  private processed = false;
  private startCtxTime = 0;
  private startBufferTime = 0;
  private makeupGainDb = 0;
  onProgress: ((t: number) => void) | null = null;
  onEnd: (() => void) | null = null;
  private raf = 0;

  load(buffer: AudioBuffer, params: MasterParams): void {
    this.buffer = buffer;
    this.params = { ...params };
  }

  /** After a render, the processed preview applies the same makeup gain as
   * the export, so "Processed" sounds exactly like the final WAV. */
  setMakeupGain(gainDb: number): void {
    this.makeupGainDb = Number.isFinite(gainDb) ? gainDb : 0;
  }

  isPlaying(): boolean {
    return this.source != null && this.ctx != null;
  }

  async play(fromSec = 0, processed: boolean, deviceId = ""): Promise<void> {
    this.stop();
    if (!this.buffer) return;
    const W: any = window; // eslint-disable-line @typescript-eslint/no-explicit-any
    const Ctor: typeof AudioContext = W.AudioContext || W.webkitAudioContext;
    this.ctx = new Ctor();
    // Route audio to a chosen output (e.g. DJ controller sound card) if set.
    if (deviceId && "setSinkId" in this.ctx) {
      try {
        await (this.ctx as AudioContext & { setSinkId: (id: string) => Promise<void> }).setSinkId(deviceId);
      } catch {
        /* fall back to default output */
      }
    }
    await this.ctx.resume();
    this.processed = processed;
    this.chain = buildChain(this.ctx, this.params);
    // Make the processed preview match the export (same loudness makeup).
    if (processed && this.makeupGainDb !== 0) {
      this.chain.makeup.gain.value = dbToGain(this.makeupGainDb);
    }

    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;

    if (processed) {
      this.source.connect(this.chain.input);
      this.chain.output.connect(this.ctx.destination);
    } else {
      this.source.connect(this.ctx.destination);
    }

    this.startBufferTime = fromSec;
    this.startCtxTime = this.ctx.currentTime;
    this.source.start(0, fromSec);
    this.source.onended = () => {
      this.stop();
      this.onEnd?.();
    };

    const tick = () => {
      if (!this.ctx || !this.source || !this.buffer) return;
      const t = this.startBufferTime + (this.ctx.currentTime - this.startCtxTime);
      this.onProgress?.(Math.min(t, this.buffer.duration));
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  /** switch between processed and original without restarting position */
  async toggle(processed: boolean): Promise<void> {
    const pos = this.currentTime();
    const wasPlaying = this.isPlaying();
    if (wasPlaying) await this.play(pos, processed);
    else this.processed = processed;
  }

  currentTime(): number {
    if (!this.ctx || !this.source || !this.buffer) return 0;
    return Math.min(this.startBufferTime + (this.ctx.currentTime - this.startCtxTime), this.buffer.duration);
  }

  isProcessed(): boolean {
    return this.processed;
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    if (this.source) {
      try {
        this.source.onended = null;
        this.source.stop();
      } catch {
        /* already stopped */
      }
      this.source.disconnect();
      this.source = null;
    }
    if (this.chain) {
      try {
        this.chain.input.disconnect();
        this.chain.output.disconnect();
      } catch {
        /* noop */
      }
      this.chain = null;
    }
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

// ---- offline render (chunked, progress-reported) ----

export interface RenderOutcome {
  chunks: AudioBuffer[];
  outputLufs: number;
  outputTruePeakDb: number;
  gainAppliedDb: number;
  renderedSec: number;
}

export async function renderMaster(
  buffer: AudioBuffer,
  params: MasterParams,
  onProgress?: (doneSec: number, totalSec: number) => void,
): Promise<RenderOutcome> {
  const totalSec = buffer.duration;
  const chunkCount = Math.max(1, Math.ceil(totalSec / CHUNK_SEC));
  const chunks: AudioBuffer[] = [];

  for (let i = 0; i < chunkCount; i++) {
    const start = i * CHUNK_SEC;
    const dur = Math.min(CHUNK_SEC, totalSec - start);
    const frames = Math.max(1, Math.ceil(dur * TARGET_RATE));
    const ctx = new OfflineAudioContext(2, frames, TARGET_RATE);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.start(0, start, dur);
    const chain = buildChain(ctx, params);
    source.connect(chain.input);
    chain.output.connect(ctx.destination);
    const rendered = await ctx.startRendering();
    chunks.push(rendered);
    onProgress?.(Math.min(start + dur, totalSec), totalSec);
  }

  // Loudness of the rendered result, merged from per-chunk window means.
  const lufs = measureRenderedLoudness(chunks);

  // True peak: 4x oversampled across both channels (inter-sample peaks that
  // sample-peak misses would clip after YouTube's AAC transcode).
  let truePeak = -Infinity;
  for (const c of chunks) {
    for (let ch = 0; ch < c.numberOfChannels; ch++) {
      const tp = truePeakDbOversampled(c.getChannelData(ch));
      if (tp > truePeak) truePeak = tp;
    }
  }

  const gain = computeMakeupGain({ integratedLufs: lufs, truePeakDb: truePeak }, params.targetLufs, params.ceilingDb);

  const outLufs = Number.isFinite(lufs) ? lufs + gain : params.targetLufs;
  const outPeak = Number.isFinite(truePeak) ? truePeak + gain : -Infinity;

  return { chunks, outputLufs: outLufs, outputTruePeakDb: Math.min(outPeak, params.ceilingDb), gainAppliedDb: gain, renderedSec: totalSec };
}

/** Per-chunk K-weighted window means, merged, then gated globally. */
function measureRenderedLoudness(chunks: AudioBuffer[]): number {
  const winMono: number[][] = [];
  for (let ch = 0; ch < Math.min(2, chunks[0].numberOfChannels); ch++) {
    const mono: number[] = [];
    for (const c of chunks) {
      const w = loudnessWindows(c.getChannelData(ch), c.sampleRate);
      for (const m of w) mono.push(m);
    }
    winMono.push(mono);
  }
  // merge = union of windows across the loudest channel behaviour
  const merged: number[] = [];
  const maxLen = Math.max(winMono[0].length, winMono[1]?.length ?? 0);
  for (let i = 0; i < maxLen; i++) {
    const a = winMono[0][i] ?? 0;
    const b = winMono[1]?.[i] ?? a;
    merged.push(Math.max(a, b));
  }
  return loudnessFromWindows(merged).integratedLufs;
}

// ---- input measurement ----

export function measureInput(buffer: AudioBuffer): LoudnessResult {
  const l = buffer.getChannelData(0);
  const r = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;
  return measureLoudnessStereo(l, r, buffer.sampleRate);
}

// ---- export ----

export function exportMasterBlob(
  chunks: AudioBuffer[],
  bits: 16 | 24,
  gainDb: number,
  tags?: { title?: string; artist?: string; album?: string; genre?: string; comment?: string },
): Blob {
  // Build one logical WAV from chunked audio without concatenating samples.
  const numChannels = Math.min(2, chunks[0].numberOfChannels);
  const totalFrames = chunks.reduce((a, c) => a + c.length, 0);
  const bytesPerSample = bits / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataBytes = totalFrames * blockAlign;
  const gain = dbToGain(gainDb);

  // INFO tags chunk if any
  const info = buildInfoChunk(tags);

  // header (44 bytes incl. the "data" chunk header). RIFF size = file − 8;
  // must include the INFO chunk length too (old code omitted it when tags
  // were written, producing an incorrect size).
  const header = new ArrayBuffer(44);
  const dv = new DataView(header);
  writeAscii(dv, 0, "RIFF");
  dv.setUint32(4, 36 + info.byteLength + dataBytes, true);
  writeAscii(dv, 8, "WAVE");
  writeAscii(dv, 12, "fmt ");
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, numChannels, true);
  dv.setUint32(24, TARGET_RATE, true);
  dv.setUint32(28, TARGET_RATE * blockAlign, true);
  dv.setUint16(32, blockAlign, true);
  dv.setUint16(34, bits, true);
  writeAscii(dv, 36, "data");
  dv.setUint32(40, dataBytes, true);

  const parts: BlobPart[] = [header, info];
  const scale = bits === 24 ? 8388607 : 32767;
  for (const chunk of chunks) {
    const bytes = new Uint8Array(chunk.length * blockAlign);
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < chunk.length; i++) {
      for (let c = 0; c < numChannels; c++) {
        const off = (i * numChannels + c) * bytesPerSample;
        if (bits === 16) {
          view.setInt16(off, quantize(chunk.getChannelData(c)[i] * gain, scale, 16), true);
        } else {
          // 24-bit: write 3 bytes little-endian (setInt32 overflowed the
          // final 3-byte group → RangeError on every export).
          const v = quantize(chunk.getChannelData(c)[i] * gain, scale, 24);
          bytes[off] = v & 0xff;
          bytes[off + 1] = (v >> 8) & 0xff;
          bytes[off + 2] = (v >> 16) & 0xff;
        }
      }
    }
    parts.push(bytes);
  }
  return new Blob(parts, { type: "audio/wav" });
}

function writeAscii(dv: DataView, offset: number, s: string): void {
  for (let i = 0; i < s.length; i++) dv.setUint8(offset + i, s.charCodeAt(i));
}

function buildInfoChunk(tags?: { title?: string; artist?: string; album?: string; genre?: string; comment?: string }): Uint8Array<ArrayBuffer> {
  if (!tags) return new Uint8Array(new ArrayBuffer(0));
  const enc = new TextEncoder();
  const entries: { id: string; value?: string }[] = [
    { id: "INAM", value: tags.title },
    { id: "IART", value: tags.artist },
    { id: "IPRD", value: tags.album },
    { id: "IGNR", value: tags.genre },
    { id: "ICMT", value: tags.comment },
  ];
  const bodyParts: Uint8Array[] = [];
  for (const e of entries) {
    if (!e.value) continue;
    const raw = enc.encode(e.value);
    const padded = new Uint8Array(Math.ceil((4 + raw.length) / 2) * 2);
    writeAscii(new DataView(padded.buffer), 0, e.id);
    padded.set(raw, 4);
    bodyParts.push(padded);
  }
  if (bodyParts.length === 0) return new Uint8Array(new ArrayBuffer(0));
  const bodyLen = bodyParts.reduce((a, b) => a + b.length, 0);
  const list = new Uint8Array(4 + bodyLen);
  writeAscii(new DataView(list.buffer), 0, "INFO");
  let off = 4;
  for (const p of bodyParts) {
    list.set(p, off);
    off += p.length;
  }
  const out = new Uint8Array(8 + list.length);
  writeAscii(new DataView(out.buffer), 0, "LIST");
  new DataView(out.buffer).setUint32(4, list.length, true);
  out.set(list, 8);
  return out;
}

/** Fallback path: encode a single AudioBuffer to a WAV ArrayBuffer (small files). */
export function bufferToWavBuffer(buffer: AudioBuffer, bits: 16 | 24, gainDb: number): ArrayBuffer {
  const channels: Float32Array[] = [];
  for (let c = 0; c < Math.min(2, buffer.numberOfChannels); c++) {
    const src = buffer.getChannelData(c);
    const out = new Float32Array(src.length);
    const g = dbToGain(gainDb);
    for (let i = 0; i < src.length; i++) out[i] = Math.max(-1, Math.min(1, src[i] * g));
    channels.push(out);
  }
  return encodeWav(channels, TARGET_RATE, bits);
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

