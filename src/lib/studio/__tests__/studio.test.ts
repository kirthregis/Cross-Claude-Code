import { describe, expect, it } from "vitest";
import { applyBiquad, biquadHighPass, biquadHighShelf, biquadLowShelf, biquadPeaking, computeMakeupGain, formatBytes, formatDuration, loudnessFromWindows, loudnessWindows, measureLoudness, resampleLinear, softClipCurve } from "../dsp";
import { buildDescription, buildFileName, buildRelease, buildTags, buildTitle, checksSummary, runComplianceChecks, youtubeHandoff } from "../release";
import { replyForIntent, routeCommand, summarizeProject } from "../assistant";
import { createProject } from "../store";
import { DEFAULT_SETTINGS } from "../types";
import { encodeWav } from "../wav";

describe("dsp", () => {
  it("applies a biquad without NaNs", () => {
    const x = new Float32Array(1000);
    for (let i = 0; i < 1000; i++) x[i] = Math.sin((i / 100) * Math.PI * 2) * 0.5;
    applyBiquad(biquadLowShelf(3, 90, 0.707, 48000), x);
    for (const v of x) expect(Number.isFinite(v)).toBe(true);
  });

  it("high shelf boosts a full-scale signal above cutoff", () => {
    const x = new Float32Array(4800).fill(0.5);
    applyBiquad(biquadHighShelf(6, 1000, 0.707, 48000), x);
    const rms = Math.sqrt(x.reduce((a, b) => a + b * b, 0) / x.length);
    expect(rms).toBeGreaterThan(0.49);
  });

  it("peaking filter and high-pass produce finite output", () => {
    const x = new Float32Array(4800).fill(0.25);
    applyBiquad(biquadPeaking(2, 1000, 0.8, 48000), x);
    applyBiquad(biquadHighPass(30, 0.707, 48000), x);
    expect(x.every((v) => Number.isFinite(v))).toBe(true);
  });

  it("measures loudness of a full-scale sine around -3 LUFS", () => {
    const sr = 48000;
    const n = sr * 2;
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) x[i] = Math.sin((i * 440 * Math.PI * 2) / sr) * 0.89;
    const m = measureLoudness(x, sr);
    expect(Number.isFinite(m.integratedLufs)).toBe(true);
    expect(m.integratedLufs).toBeGreaterThan(-6);
    expect(m.integratedLufs).toBeLessThan(0);
    expect(m.gainTo(-14)).toBeCloseTo(-14 - m.integratedLufs, 2);
  });

  it("loudnessWindows + loudnessFromWindows merge matches direct measurement", () => {
    const sr = 48000;
    const n = sr * 3;
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) x[i] = Math.sin((i * 220 * Math.PI * 2) / sr) * 0.7;
    const direct = measureLoudness(x, sr).integratedLufs;
    const merged = loudnessFromWindows(loudnessWindows(x, sr)).integratedLufs;
    expect(Math.abs(direct - merged)).toBeLessThan(0.05);
  });

  it("silence reports non-finite loudness and -Infinity peak", () => {
    const m = measureLoudness(new Float32Array(48000), 48000);
    expect(Number.isFinite(m.integratedLufs)).toBe(false);
    expect(m.truePeakDb).toBe(-Infinity);
  });

  it("soft clip curve stays in [-1, 1]", () => {
    const c = softClipCurve(0.8);
    expect(c[0]).toBeCloseTo(-1, 4);
    expect(c[c.length - 1]).toBeCloseTo(1, 4);
    for (let i = 0; i < c.length; i++) expect(Math.abs(c[i])).toBeLessThanOrEqual(1.0001);
  });

  it("resample keeps length proportional", () => {
    const x = new Float32Array(48000);
    const down = resampleLinear(x, 48000, 44100);
    expect(down.length).toBeGreaterThan(40000);
    expect(down.length).toBeLessThan(45000);
  });

  it("formats durations and bytes", () => {
    expect(formatDuration(3661)).toBe("61:01");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

function findChunk(dv: DataView, id: string): { offset: number; size: number } | null {
  let off = 12; // after RIFF + size + WAVE
  while (off + 8 <= dv.byteLength) {
    const type = String.fromCharCode(dv.getUint8(off), dv.getUint8(off + 1), dv.getUint8(off + 2), dv.getUint8(off + 3));
    const size = dv.getUint32(off + 4, true);
    if (type === id) return { offset: off, size };
    off += 8 + size + (size % 2);
  }
  return null;
}

describe("wav", () => {
  it("encodes a 16-bit stereo WAV with RIFF header and tags", () => {
    const left = new Float32Array(100);
    const right = new Float32Array(100);
    for (let i = 0; i < 100; i++) {
      left[i] = Math.sin(i / 10) * 0.5;
      right[i] = Math.cos(i / 10) * 0.5;
    }
    const buf = encodeWav([left, right], 48000, 16, { title: "Test", artist: "DJ EMY" });
    const dv = new DataView(buf);
    expect(String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3))).toBe("RIFF");
    expect(String.fromCharCode(dv.getUint8(8), dv.getUint8(9), dv.getUint8(10), dv.getUint8(11))).toBe("WAVE");
    expect(dv.getUint16(22, true)).toBe(2); // channels
    expect(dv.getUint32(24, true)).toBe(48000); // sample rate
    expect(dv.getUint16(34, true)).toBe(16); // bits
    const data = findChunk(dv, "data");
    expect(data).not.toBeNull();
    expect(data!.size).toBe(100 * 2 * 2); // frames * channels * bytes
    // INFO tags present (LIST chunk with INAM/IART)
    const list = findChunk(dv, "LIST");
    expect(list).not.toBeNull();
    const listStart = list!.offset + 8;
    const infoText = String.fromCharCode(dv.getUint8(listStart + 4), dv.getUint8(listStart + 5), dv.getUint8(listStart + 6), dv.getUint8(listStart + 7));
    expect(infoText).toBe("INAM");
  });

  it("encodes 24-bit without overflow", () => {
    const x = new Float32Array(10).fill(1);
    const buf = encodeWav([x], 48000, 24);
    const dv = new DataView(buf);
    expect(dv.getUint16(34, true)).toBe(24);
    const data = findChunk(dv, "data");
    expect(data!.size).toBe(10 * 3);
  });
});

function makeProject(over: Partial<ReturnType<typeof createProject>> = {}) {
  const p = createProject({ name: "Afro House Mix 2026", kind: "mix", genre: "Afro House", mood: "deep" });
  return { ...p, ...over, meta: { ...p.meta, ...(over.meta ?? {}) } };
}

describe("release", () => {
  it("builds a YouTube-clean title", () => {
    expect(buildTitle(makeProject(), "DJ EMY")).toBe("Afro House Mix 2026 | DJ EMY");
    expect(buildTitle(makeProject({ meta: { name: "Sahara" } }), "DJ EMY")).toContain("Sahara");
  });

  it("title respects the 100-char limit for long names", () => {
    const p = makeProject({ meta: { name: "A".repeat(120) } });
    expect(buildTitle(p, "DJ EMY").length).toBeLessThanOrEqual(100);
  });

  it("description includes social handles and genre", () => {
    const p = makeProject();
    const d = buildDescription(p, DEFAULT_SETTINGS);
    expect(d).toContain("Instagram");
    expect(d).toContain("@dj_emy_");
    expect(d).toContain("Afro House");
    expect(d.length).toBeLessThanOrEqual(5000);
  });

  it("tags are unique and start with #", () => {
    const tags = buildTags(makeProject());
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.every((t) => t.startsWith("#"))).toBe(true);
    expect(new Set(tags).size).toBe(tags.length);
    expect(tags.join(" ").length).toBeLessThanOrEqual(500);
  });

  it("file name is label-safe", () => {
    const fn = buildFileName(makeProject({ meta: { name: 'Weird: Name*?' } }), DEFAULT_SETTINGS, 24);
    expect(fn).toContain("DJ_EMY");
    expect(fn).toContain("48kHz_24bit.wav");
    expect(fn).not.toMatch(/[\\/:*?"<>|]/);
  });

  it("buildRelease includes all handoff fields", () => {
    const r = buildRelease(makeProject(), DEFAULT_SETTINGS);
    expect(r.category).toBe("Music");
    expect(r.madeForKids).toBe("no");
    expect(r.tags.length).toBeGreaterThan(0);
    expect(youtubeHandoff(r)).toContain("Title:");
    expect(youtubeHandoff(r)).toContain("Visibility:");
  });

  it("compliance: missing everything fails with fixes", () => {
    const checks = runComplianceChecks({}, "youtube");
    expect(checks.length).toBeGreaterThan(3);
    expect(checks.filter((c) => c.status === "fail").length).toBeGreaterThanOrEqual(3);
    expect(checks.every((c) => c.fix)).toBe(true);
  });

  it("compliance: full package passes", () => {
    const p = makeProject({
      audio: { fileName: "mix.mp3", sizeBytes: 1000, durationSec: 3600, sampleRate: 44100, channels: 2 },
      master: {
        params: { targetLufs: -14, lowGainDb: 0, midGainDb: 0, highGainDb: 0, rumbleFilter: true, compThreshold: -16, compRatio: 2, limiterDrive: 0.5, ceilingDb: -1 },
        inputLufs: -20,
        outputLufs: -14.2,
        inputTruePeakDb: -6,
        outputTruePeakDb: -1.2,
        gainAppliedDb: 5.8,
        renderedAt: Date.now(),
        exportName: "x.wav",
      },
      artwork: { source: "template", templateId: "midnight-gold", width: 3000, height: 3000, sizeBytes: 5 * 1024 * 1024, generatedAt: Date.now() },
      release: buildRelease(makeProject(), DEFAULT_SETTINGS),
    });
    const checks = runComplianceChecks(
      {
        audio: p.audio,
        master: p.master,
        artworkSize: { width: 3000, height: 3000, bytes: 5 * 1024 * 1024 },
        release: p.release,
      },
      "youtube",
    );
    expect(checks.filter((c) => c.status === "fail")).toHaveLength(0);
    const s = checksSummary(checks);
    expect(s.pass).toBeGreaterThanOrEqual(6);
  });

  it("compliance flags 44100 Hz sample rate as a warning", () => {
    const p = makeProject({ audio: { fileName: "m.mp3", sizeBytes: 1, durationSec: 300, sampleRate: 44100, channels: 2 } });
    const checks = runComplianceChecks({ audio: p.audio }, "youtube");
    const sr = checks.find((c) => c.id === "samplerate");
    expect(sr?.status).toBe("warn");
  });

  it("compliance flags small artwork as fail", () => {
    const checks = runComplianceChecks({ artworkSize: { width: 640, height: 640, bytes: 1000 } }, "youtube");
    expect(checks.find((c) => c.id === "artwork")?.status).toBe("fail");
  });
});

describe("assistant", () => {
  it("routes voice commands without a key", () => {
    expect(routeCommand("master my mix")).toBe("master");
    expect(routeCommand("make the cover art")).toBe("artwork");
    expect(routeCommand("build the release pack")).toBe("release");
    expect(routeCommand("is it ready?")).toBe("check");
    expect(routeCommand("what's left to do?")).toBe("status");
    expect(routeCommand("create a new mix project")).toBe("create_project");
    expect(routeCommand("hello")).toBe("greet");
    expect(routeCommand("open my last project")).toBe("open_project");
  });

  it("master command navigates to the master tab", () => {
    const p = makeProject({ audio: { fileName: "m.mp3", sizeBytes: 1, durationSec: 300, sampleRate: 48000, channels: 2 } });
    const d = replyForIntent("master", { project: p, projectCount: 1, hasGemini: false });
    expect(d.action).toEqual({ type: "navigate", to: `/studio/p/${p.meta.id}?tab=master` });
  });

  it("status summarizes where the project stands", () => {
    const p = makeProject();
    const d = replyForIntent("status", { project: p, projectCount: 1, hasGemini: false });
    expect(d.reply).toContain("No audio loaded");
    expect(d.reply).toContain("Mastering");
    const s = summarizeProject(p);
    expect(s).toContain("Afro House Mix 2026");
  });

  it("fallback without key points to commands", () => {
    const d = replyForIntent("fallback", { project: undefined, projectCount: 0, hasGemini: false });
    expect(d.reply).toContain("master my mix");
  });

  it("fallback with key routes to Gemini", () => {
    const d = replyForIntent("fallback", { project: undefined, projectCount: 0, hasGemini: true });
    expect(d.reply).toContain("Gemini");
  });
});

// ── Deep-review regression tests ────────────────────────────────────────────

function riffSize(dv: DataView): number {
  return dv.getUint32(4, true);
}

describe("wav integrity (deep review)", () => {
  it("RIFF size field equals file size minus 8, with and without tags", () => {
    const x = new Float32Array(500);
    for (let i = 0; i < 500; i++) x[i] = Math.sin(i / 20) * 0.4;
    for (const tags of [undefined, { title: "T", artist: "A", genre: "G", album: "Al", comment: "C" }]) {
      const buf = encodeWav([x, x], 48000, 16, tags as never);
      const dv = new DataView(buf);
      expect(riffSize(dv)).toBe(buf.byteLength - 8);
      // data chunk present with exact size (walk chunks — LIST may precede it)
      const data = findChunk(dv, "data");
      expect(data).not.toBeNull();
      expect(data!.size).toBe(500 * 2 * 2);
    }
  });

  it("24-bit export writes byte-wise without RangeError for many samples", () => {
    const x = new Float32Array(2049); // odd length exercises the tail
    for (let i = 0; i < x.length; i++) x[i] = Math.sin(i / 30) * 0.9;
    const buf = encodeWav([x], 48000, 24, { title: "T" });
    const dv = new DataView(buf);
    expect(dv.getUint16(34, true)).toBe(24);
    const data = findChunk(dv, "data");
    expect(data!.size).toBe(x.length * 3);
    expect(riffSize(dv)).toBe(buf.byteLength - 8);
  });

  it("16-bit TPDF dither turns a near-silent signal into varying samples", () => {
    const x = new Float32Array(2000).fill(0.00001); // ~ -100 dBFS
    const buf = encodeWav([x], 48000, 16);
    const dv = new DataView(buf);
    const vals = new Set<number>();
    for (let i = 0; i < 100; i++) vals.add(dv.getInt16(44 + i * 2, true));
    expect(vals.size).toBeGreaterThan(1); // dithered, not digital zeros
  });

  it("24-bit export is NOT dithered (values deterministic)", () => {
    const x = new Float32Array(200).fill(0.5);
    const buf = encodeWav([x], 48000, 24);
    const dv = new DataView(buf);
    const first = dv.getUint8(44);
    const same = (() => { for (let i = 0; i < 50; i++) if (dv.getUint8(44 + i * 3) !== first) return false; return true; })();
    expect(same).toBe(true);
  });
});

describe("computeMakeupGain (deep review)", () => {
  it("hits the target when headroom allows", () => {
    // plenty of peak headroom (-20 dBTP) so the loudness target wins
    expect(computeMakeupGain({ integratedLufs: -20, truePeakDb: -20 }, -14, -1)).toBeCloseTo(6, 6);
  });
  it("never pushes true peak past the ceiling", () => {
    const g = computeMakeupGain({ integratedLufs: -20, truePeakDb: -2 }, -14, -1);
    expect(-2 + g).toBeLessThanOrEqual(-1);
    expect(g).toBeCloseTo(1, 6);
  });
  it("returns 0 for silence and clamps extreme gain", () => {
    expect(computeMakeupGain({ integratedLufs: NaN, truePeakDb: -Infinity }, -14, -1)).toBe(0);
    expect(computeMakeupGain({ integratedLufs: -60, truePeakDb: -30 }, -14, -1)).toBeLessThanOrEqual(12);
  });
});

describe("loudness measurement accuracy (deep review)", () => {
  it("is linear: halving amplitude drops exactly ~6.02 LUFS", () => {
    const sr = 48000;
    const n = sr * 5;
    const sine = (amp: number) => {
      const x = new Float32Array(n);
      for (let i = 0; i < n; i++) x[i] = Math.sin((i * 440 * Math.PI * 2) / sr) * amp;
      return x;
    };
    const a = measureLoudness(sine(1), sr).integratedLufs;
    const b = measureLoudness(sine(0.5), sr).integratedLufs;
    const c = measureLoudness(sine(0.1), sr).integratedLufs;
    expect(Math.abs((a - b) - 6.02)).toBeLessThan(0.1);
    expect(Math.abs((b - c) - 14.0)).toBeLessThan(0.1);
    // Absolute sanity: full-scale 440Hz sine ≈ -3.8 LUFS ± 0.5
    expect(a).toBeGreaterThan(-4.5);
    expect(a).toBeLessThan(-3.0);
  });
});
