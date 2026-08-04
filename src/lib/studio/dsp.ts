/**
 * EMY Studio — pure DSP for loudness measurement (ITU-R BS.1770-4 style),
 * true-peak estimation, biquad filtering and gain math.
 *
 * Deliberately dependency-free and DOM-free so it runs identically in the
 * browser and in unit tests. The heavy lifting during *rendering* is done by
 * the browser's Web Audio graph (src/lib/studio/audio.ts); this module is the
 * measurement brain that decides how much gain a master needs.
 */

export interface Biquad {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

/** RBJ Audio-EQ-Cookbook coefficients. */
export function biquadLowShelf(gainDb: number, f0: number, q: number, sr: number): Biquad {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * f0) / sr;
  const alpha = Math.sin(w0) / (2 * q);
  const c = Math.cos(w0);
  const twoSqrtA = 2 * Math.sqrt(A) * alpha;
  const b0 = A * (A + 1 - (A - 1) * c + twoSqrtA);
  const b1 = 2 * A * (A - 1 - (A + 1) * c);
  const b2 = A * (A + 1 - (A - 1) * c - twoSqrtA);
  const a0 = A + 1 + (A - 1) * c + twoSqrtA;
  const a1 = -2 * (A - 1 + (A + 1) * c);
  const a2 = A + 1 + (A - 1) * c - twoSqrtA;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

export function biquadHighShelf(gainDb: number, f0: number, q: number, sr: number): Biquad {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * f0) / sr;
  const alpha = Math.sin(w0) / (2 * q);
  const c = Math.cos(w0);
  const twoSqrtA = 2 * Math.sqrt(A) * alpha;
  const b0 = A * (A + 1 + (A - 1) * c + twoSqrtA);
  const b1 = -2 * A * (A - 1 + (A + 1) * c);
  const b2 = A * (A + 1 + (A - 1) * c - twoSqrtA);
  const a0 = A + 1 - (A - 1) * c + twoSqrtA;
  const a1 = 2 * (A - 1 - (A + 1) * c);
  const a2 = A + 1 - (A - 1) * c - twoSqrtA;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

export function biquadPeaking(gainDb: number, f0: number, q: number, sr: number): Biquad {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * f0) / sr;
  const alpha = Math.sin(w0) / (2 * q);
  const c = Math.cos(w0);
  const b0 = 1 + alpha * A;
  const b1 = -2 * c;
  const b2 = 1 - alpha * A;
  const a0 = 1 + alpha / A;
  const a1 = -2 * c;
  const a2 = 1 - alpha / A;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

export function biquadHighPass(f0: number, q: number, sr: number): Biquad {
  const w0 = (2 * Math.PI * f0) / sr;
  const alpha = Math.sin(w0) / (2 * q);
  const c = Math.cos(w0);
  const b0 = (1 + c) / 2;
  const b1 = -(1 + c);
  const b2 = (1 + c) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * c;
  const a2 = 1 - alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

/** Run a biquad over a Float32Array in place (transposed-direct form II). */
export function applyBiquad(b: Biquad, x: Float32Array): void {
  const { b0, b1, b2, a1, a2 } = b;
  let z1 = 0;
  let z2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = x[i];
    const y = b0 * v + z1;
    z1 = b1 * v - a1 * y + z2;
    z2 = b2 * v - a2 * y;
    x[i] = y;
  }
}

/** Simple linear-interpolation resampler (good enough for measurement). */
export function resampleLinear(src: Float32Array, srcRate: number, dstRate: number): Float32Array {
  if (srcRate === dstRate) return src;
  const ratio = srcRate / dstRate;
  const outLen = Math.max(1, Math.floor(src.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, src.length - 1);
    const frac = pos - i0;
    out[i] = src[i0] * (1 - frac) + src[i1] * frac;
  }
  return out;
}

const K_WEIGHT_HP_FREQ = 38.13547087;
const K_WEIGHT_HP_Q = 0.500327037;
const K_WEIGHT_SHELF_FREQ = 1681.97445096;
const K_WEIGHT_SHELF_Q = 0.7071752367;
const K_WEIGHT_SHELF_GAIN = 4.0;
const WINDOW_SEC = 0.4;
const HOP_SEC = 0.2;

/**
 * K-weight a mono signal at a target rate of 48 kHz and return the mean
 * square of each 400 ms window (50% overlap). Pure data → can be produced
 * per chunk and merged later with loudnessFromWindows().
 */
export function loudnessWindows(mono: Float32Array, sampleRate: number): number[] {
  // Always work on a copy — filtering in place would destroy the caller's audio.
  const signal = sampleRate === 48000 ? new Float32Array(mono) : resampleLinear(mono, sampleRate, 48000);
  const N = signal.length;
  if (N < 4800) return [];
  applyBiquad(biquadHighPass(K_WEIGHT_HP_FREQ, K_WEIGHT_HP_Q, 48000), signal);
  applyBiquad(biquadHighShelf(K_WEIGHT_SHELF_GAIN, K_WEIGHT_SHELF_FREQ, K_WEIGHT_SHELF_Q, 48000), signal);
  const WINDOW = Math.floor(48000 * WINDOW_SEC);
  const HOP = Math.floor(48000 * HOP_SEC);
  const means: number[] = [];
  for (let start = 0; start + WINDOW <= N; start += HOP) {
    let sum = 0;
    const end = start + WINDOW;
    for (let i = start; i < end; i++) {
      const s = signal[i];
      sum += s * s;
    }
    means.push(sum / WINDOW);
  }
  return means;
}

const ABS_GATE = -70; // LUFS absolute gate
const REL_GATE = -10; // LUFS below ungated loudness

/** Gated loudness from window mean squares (BS.1770-4 absolute + relative gating). */
export function loudnessFromWindows(means: number[]): { integratedLufs: number; ungatedLufs: number } {
  if (means.length === 0) return { integratedLufs: NaN, ungatedLufs: NaN };
  const loudnessOf = (ms: number[]) => {
    if (ms.length === 0) return NaN;
    const sum = ms.reduce((a, b) => a + b, 0);
    return -0.691 + 10 * Math.log10(sum / ms.length);
  };
  const ungated = loudnessOf(means);
  let integrated = loudnessOf(means.filter((m) => m >= Math.pow(10, ABS_GATE / 10)));
  if (Number.isFinite(ungated)) {
    const rel = loudnessOf(means.filter((m) => m >= Math.pow(10, (ungated + REL_GATE) / 10)));
    if (Number.isFinite(rel)) integrated = rel;
  }
  return { integratedLufs: integrated, ungatedLufs: ungated };
}

export interface LoudnessResult {
  /** Integrated (gated) loudness in LUFS. */
  integratedLufs: number;
  /** Ungated loudness in LUFS. */
  ungatedLufs: number;
  /** True-peak in dBTP (4x oversample estimate). */
  truePeakDb: number;
  /** Gain in dB needed to land exactly on `targetLufs`. */
  gainTo(targetLufs: number): number;
}

/**
 * Measure integrated loudness of a mono Float32Array at `sampleRate` using the
 * BS.1770-4 K-weighting + absolute/relative gating with 400 ms windows.
 * Returns NaN for near-silent input.
 */
export function measureLoudness(mono: Float32Array, sampleRate: number): LoudnessResult {
  const windows = loudnessWindows(mono, sampleRate);
  if (windows.length === 0) return { integratedLufs: NaN, ungatedLufs: NaN, truePeakDb: -Infinity, gainTo: () => 0 };
  const { integratedLufs: gated, ungatedLufs: ungated } = loudnessFromWindows(windows);

  // True peak: 4x linear oversample
  let peak = 0;
  const o4 = (x: Float32Array) => {
    for (let i = 1; i < x.length; i++) {
      const a = x[i - 1];
      const b = x[i];
      const m = Math.max(Math.abs(a), Math.abs(b));
      if (m > peak) peak = m;
      for (let j = 1; j < 4; j++) {
        const v = a + ((b - a) * j) / 4;
        const av = Math.abs(v);
        if (av > peak) peak = av;
      }
    }
  };
  o4(mono);

  const gainTo = (target: number) => (Number.isFinite(gated) ? target - gated : 0);
  return {
    integratedLufs: gated,
    ungatedLufs: ungated,
    truePeakDb: peak > 0 ? 20 * Math.log10(peak) : -Infinity,
    gainTo,
  };
}

/**
 * Measure a stereo pair (or mono) and return the loudest channel reading.
 */
export function measureLoudnessStereo(
  left: Float32Array,
  right: Float32Array | null,
  sampleRate: number,
): LoudnessResult {
  const l = measureLoudness(left, sampleRate);
  if (!right) return l;
  const r = measureLoudness(right, sampleRate);
  const pick = (get: (x: LoudnessResult) => number) => {
    const a = get(l);
    const b = get(r);
    if (!Number.isFinite(a)) return b;
    if (!Number.isFinite(b)) return a;
    return Math.max(a, b); // loudest channel governs perceived loudness
  };
  const integratedLufs = pick((x) => x.integratedLufs);
  const ungatedLufs = pick((x) => x.ungatedLufs);
  const truePeakDb = pick((x) => x.truePeakDb);
  return { integratedLufs, ungatedLufs, truePeakDb, gainTo: (t) => t - integratedLufs };
}

export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

export function gainToDb(gain: number): number {
  return 20 * Math.log10(Math.max(gain, 1e-9));
}

/** Soft-clip (tanh) curve used for the master limiter stage. */
export function softClipCurve(drive: number, tableSize = 2048): Float32Array<ArrayBuffer> {
  const k = 1 + drive * 3.2; // 1 (off) .. ~4.2 (hard)
  const curve = new Float32Array(new ArrayBuffer(tableSize * 4));
  const half = (tableSize - 1) / 2;
  const tanhK = Math.tanh(k);
  for (let i = 0; i < tableSize; i++) {
    const x = (i - half) / half; // -1..1
    curve[i] = Math.tanh(k * x) / tanhK;
  }
  return curve;
}

export function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
