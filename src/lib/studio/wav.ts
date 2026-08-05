/**
 * EMY Studio — WAV file writer (PCM 16/24-bit) with optional RIFF INFO
 * metadata tags (title / artist / album / genre / comment), so exported
 * masters arrive at a label or distributor already tagged.
 *
 * Pure + dependency-free; returns an ArrayBuffer that can become a Blob.
 */

export interface WavTags {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  comment?: string;
}

const enc = new TextEncoder();

function fourCC(s: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(4));
  for (let i = 0; i < 4; i++) out[i] = s.charCodeAt(i);
  return out;
}

function chunk(type: string, data: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(8 + data.length));
  out.set(fourCC(type), 0);
  const dv = new DataView(out.buffer);
  dv.setUint32(4, data.length, true);
  out.set(data, 8);
  return out;
}

function concat(a: Uint8Array<ArrayBuffer>, b: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(a.length + b.length));
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

import { quantize } from "./dsp";

/** Build a "LIST/INFO" chunk from tags. Returns an empty buffer if no tags. */
function infoChunk(tags: WavTags): Uint8Array<ArrayBuffer> {
  const ids = [
    ["INAM", tags.title],
    ["IART", tags.artist],
    ["IPRD", tags.album],
    ["IGNR", tags.genre],
    ["ICMT", tags.comment],
  ] as const;
  let body: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(0));
  for (const [id, value] of ids) {
    if (!value) continue;
    const raw = enc.encode(value);
    const padded = new Uint8Array(new ArrayBuffer(Math.ceil((4 + raw.length) / 2) * 2));
    padded.set(fourCC(id), 0);
    padded.set(raw, 4);
    body = concat(body, padded);
  }
  if (body.length === 0) return new Uint8Array(new ArrayBuffer(0));
  const list = new Uint8Array(new ArrayBuffer(4 + body.length));
  list.set(fourCC("INFO"), 0);
  list.set(body, 4);
  return chunk("LIST", list);
}

/**
 * Serialize PCM samples to a WAV file.
 * @param channels Array of channel data (interleaved by the caller as needed).
 * @param sampleRate e.g. 48000
 * @param bitsPerSample 16 or 24
 * @param tags optional RIFF INFO metadata
 */
export function encodeWav(
  channels: Float32Array[],
  sampleRate: number,
  bitsPerSample: 16 | 24,
  tags?: WavTags,
): ArrayBuffer {
  const numChannels = channels.length;
  const numSamples = channels[0].length;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataBytes = numSamples * blockAlign;

  const fmt = new Uint8Array(new ArrayBuffer(16));
  const fdv = new DataView(fmt.buffer);
  fdv.setUint16(0, 1, true); // PCM
  fdv.setUint16(2, numChannels, true);
  fdv.setUint32(4, sampleRate, true);
  fdv.setUint32(8, sampleRate * blockAlign, true);
  fdv.setUint16(12, blockAlign, true);
  fdv.setUint16(14, bitsPerSample, true);

  const info = infoChunk(tags ?? {});
  const data = new Uint8Array(new ArrayBuffer(dataBytes));
  const ddv = new DataView(data.buffer);
  const scale = bitsPerSample === 24 ? 8388607 : 32767;

  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const offset = (i * numChannels + c) * bytesPerSample;
      if (bitsPerSample === 16) {
        // TPDF dither before 16-bit quantization (hides quantization noise).
        const v = quantize(channels[c][i], scale, 16);
        ddv.setInt16(offset, v, true);
      } else {
        // 24-bit: write 3 bytes little-endian (setInt32 would overflow at the tail)
        const v = quantize(channels[c][i], scale, 24);
        data[offset] = v & 0xff;
        data[offset + 1] = (v >> 8) & 0xff;
        data[offset + 2] = (v >> 16) & 0xff;
      }
    }
  }

  const body = concat(chunk("fmt ", fmt), info.length > 0 ? info : new Uint8Array(new ArrayBuffer(0)));
  const bodyWithData = concat(body, chunk("data", data));

  const header = new Uint8Array(new ArrayBuffer(12));
  const hdv = new DataView(header.buffer);
  header.set(fourCC("RIFF"), 0);
  // RIFF size = total file length − 8. (Old code added bodyWithData.length
  // twice — overstated the size by 24–32 bytes when INFO tags were present.)
  hdv.setUint32(4, 4 + bodyWithData.length, true);
  header.set(fourCC("WAVE"), 8);

  return concat(header, bodyWithData).buffer;
}

export function wavBlob(
  channels: Float32Array[],
  sampleRate: number,
  bitsPerSample: 16 | 24,
  tags?: WavTags,
): Blob {
  const buf = encodeWav(channels, sampleRate, bitsPerSample, tags);
  return new Blob([buf], { type: "audio/wav" });
}
