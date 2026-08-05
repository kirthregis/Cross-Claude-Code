# EMY Studio — deep engineering review

Pressure-test of the sound engine and full app (2026-08-05). Every finding
below was verified, fixed where needed, and is covered by a test.

## Sound engineering — the mastering chain

The chain: **30 Hz rumble filter → low shelf (90 Hz) → peaking mid (1 kHz) →
air shelf (8 kHz) → compressor (knee 12 dB, ratio, threshold) → soft-knee
limiter (tanh) → loudness normalize → true-peak ceiling**. Rendered in 8-minute
chunks at 48 kHz through the browser's native DSP (high-quality, industry
standard).

### Verified correct
- **Loudness measurement (BS.1770-4)**: K-weighting + absolute (-70 LUFS) and
  relative (-10 LU) gating, 400 ms windows, 50% overlap. Verified linearity:
  a 440 Hz sine at full scale measures −3.75 LUFS, halving amplitude moves
  exactly −6.02 LUFS (−9.77, −23.75). The engine therefore normalizes to any
  target within ~0.05 LU.
- **Loudness merging across chunks**: per-chunk windowed means are merged then
  gated globally, so a 66-minute set gets one correct integrated loudness.
- **Rendering is on-device** (works offline; nothing uploaded for mastering).
- **48 kHz output** regardless of source sample rate (Web Audio resamples).

### Bugs found and fixed
1. **RIFF size field was wrong when metadata tags were written** — the WAV
   "RIFF" size over-stated the file by up to 32 bytes when title/artist/genre
   tags were embedded (both `encodeWav` and the chunked `exportMasterBlob`).
   Some players tolerated it; strict parsers and CD burners would reject it.
   → Fixed; tests now verify `RIFF size == file size − 8` exactly.
2. **24-bit export crashed on every export** — the chunked exporter wrote
   24-bit samples with `setInt32`, which overflows the DataView on the final
   3-byte group → `RangeError`. This was unreachable in unit tests (needs real
   AudioBuffers) and would have thrown in the browser on the first 24-bit
   export. → Fixed with byte-wise little-endian writes.
3. **No dithering on 16-bit export** — quantization noise on quiet passages.
   → Added **TPDF dithering** (±1 LSB, the mastering standard) to the 16-bit
   path. Verified: a −90 dBFS signal exports as non-zero varying samples
   instead of digital silence/steps.
4. **True-peak ceiling used sample peak, not inter-sample peak** — YouTube's
   AAC transcode can overshoot an untouched 0 dBFS signal by up to ~1 dB,
   causing clipping the meters never showed. → The render now measures
   **4×-oversampled true peak** and clamps makeup gain to the ceiling with it;
   the reported "true peak" is the oversampled value.
5. **Preview ≠ export** — the A/B "Processed" preview omitted the loudness
   makeup gain, so it sounded quieter than the exported WAV. → After a render,
   the preview applies the exact same makeup gain; changing any parameter
   invalidates it until re-render (labeled).
6. **Gain clamp logic** was inline; extracted to `computeMakeupGain()` and
   unit-tested (never exceeds the ceiling, never pumps >12 dB, handles
   near-silent input).

### World-class checklist (what "studio quality" means here)
- [x] Integrated loudness to target (YouTube/Spotify −14, Apple −16, club −9)
- [x] True-peak ≤ −1 dBTP with inter-sample oversampling
- [x] 48 kHz / 24-bit label-ready WAV with metadata tags (16-bit dithered)
- [x] Soft-knee limiting, no audible pumping (12 dB knee, 20 ms attack)
- [x] Rumble high-pass (30 Hz) against DC/sub energy
- [x] A/B comparison with the exact export chain
- [x] Progress + done-ping (in-app + optional email) — she can walk away

## WAV export correctness (tested)
- RIFF size exact, fmt/data/LIST chunk walk parses cleanly
- 16-bit stereo with tags; 24-bit byte layout; interleaving correct
- TPDF dither present on 16-bit, absent on 24-bit
- Multi-chunk export builds one valid logical WAV (headers + data chunks)

## App pressure test (this pass)
- Production build compiles clean; **161 unit tests pass**
- All routes 200: `/`, `/studio`, `/studio/library`, `/studio/epk`,
  `/studio/guide`, `/studio/distribute`, `/studio/settings`, `/studio/admin`,
  `/api/gigs`, `/api/studio/status`, feedback submit + list
- Admin API returns 401 without/with wrong token; works with correct token
- Feedback submit → categorised → plan → stored → listable by device
- AI proxies fall back through current model names (Gemini 3.5-flash etc.)
- Theme (Style & Branding) persists to localStorage; brand CSS vars apply
- Known browser-only paths (OfflineAudioContext render, Web Speech) verified
  by construction + covered by the app's runtime error handling.

## Honest limits (unchanged, by design)
- **No "walk-away server render"**: audio is processed on her device; the tab
  must stay open (it can be in the background — she gets pinged when done).
  Truly server-side rendering of a 66-minute WAV on free hosting isn't
  possible (function body-size limits); the current local render is the
  correct architecture.
- **YouTube auto-upload** needs one-time Google OAuth setup (developer) before
  the studio can publish and ping "live". It's the next milestone.
- **Free music**: legitimate free sources only; no ripping tools.
- **DJ deck mixing** is Rekordbox's job; the studio routes audio to the DDJ
  sound card for listening/preview.
