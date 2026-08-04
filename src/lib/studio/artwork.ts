/**
 * EMY Studio — artwork engine.
 *
 * Two paths, both ending in a platform-perfect 3000×3000 JPEG/PNG:
 *  1. Templates — pure canvas, fully offline (gradients, patterns, type).
 *  2. AI — Gemini image generation from a prompt built from the track's vibe.
 */

export interface ArtworkTemplate {
  id: string;
  name: string;
  blurb: string;
}

export const ARTWORK_TEMPLATES: ArtworkTemplate[] = [
  { id: "desert-gold", name: "Desert Gold", blurb: "Her story: Tunisian-born, Qatar-raised — gold crescents over desert dunes." },
  { id: "afro-heat", name: "Afro Heat", blurb: "Sunset embers over the floor — warm amber to deep red." },
  { id: "midnight-gold", name: "Midnight Gold", blurb: "Gold dust on black. Label-clean, club-sharp." },
  { id: "neon-bloom", name: "Neon Bloom", blurb: "Fuchsia + violet glow. Built for feeds." },
  { id: "deep-teal", name: "Deep Teal", blurb: "Cool ocean mood — Afro Tech late-night." },
  { id: "vinyl-classic", name: "Vinyl Classic", blurb: "Black wax, one label. Timeless, label-ready." },
];

function drawText(c: CanvasRenderingContext2D, text: string, opts: { x: number; y: number; size: number; weight: number; color: string; align?: CanvasTextAlign; font?: string; tracking?: number }): void {
  c.save();
  c.fillStyle = opts.color;
  c.font = `${opts.weight} ${opts.size}px ${opts.font ?? "Inter, system-ui, sans-serif"}`;
  c.textAlign = opts.align ?? "center";
  c.textBaseline = "middle";
  const t = opts.tracking ?? 0;
  if (t) {
    c.translate(opts.x, opts.y);
    let offset = 0;
    const letterSpacing = t * opts.size;
    for (const ch of text) {
      c.fillText(ch, offset, 0);
      offset += c.measureText(ch).width + letterSpacing;
    }
    c.restore();
    return;
  }
  c.fillText(text, opts.x, opts.y);
  c.restore();
}

export interface CoverOptions {
  templateId: string;
  title: string;
  subtitle: string;
  accent?: string;
}

export async function renderTemplateCover(opts: CoverOptions, size = 3000): Promise<{ dataUrl: string; sizeBytes: number; width: number; height: number }> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext("2d")!;

  const S = size / 1000; // scale factor so all coords are in "1000px" design space
  const t = opts.templateId;
  const title = opts.title || "UNTITLED";
  const subtitle = opts.subtitle || "DJ EMY";

  const accent = opts.accent ?? "#f59e0b";

  // ---- backgrounds ----
  if (t === "desert-gold") {
    // DJ EMY identity: Tunisian-born, Qatar-raised. Desert dunes at dusk,
    // a gold crescent, and warm Mediterranean light.
    const g = c.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, "#1c1917");
    g.addColorStop(0.5, "#78350f");
    g.addColorStop(1, "#f59e0b");
    c.fillStyle = g;
    c.fillRect(0, 0, size, size);
    // dune layers
    for (let i = 0; i < 6; i++) {
      const baseY = size * (0.42 + i * 0.1);
      const h = size * (0.09 + i * 0.035);
      c.fillStyle = `rgba(28,25,23,${0.25 + i * 0.08})`;
      c.beginPath();
      c.moveTo(0, baseY + h);
      for (let x = 0; x <= 40; x++) {
        c.lineTo((x / 40) * size, baseY + Math.sin((x / 40) * Math.PI * 2 + i * 0.8) * size * 0.05);
      }
      c.lineTo(size, size);
      c.lineTo(0, size);
      c.closePath();
      c.fill();
    }
    // gold crescent
    c.fillStyle = "rgba(253,224,71,0.95)";
    c.beginPath();
    c.arc(size * 0.74, size * 0.22, size * 0.11, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(28,25,23,1)";
    c.beginPath();
    c.arc(size * 0.77, size * 0.2, size * 0.093, 0, Math.PI * 2);
    c.fill();
    // star dust
    for (let i = 0; i < 160; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size * 0.5;
      c.fillStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.3})`;
      c.beginPath();
      c.arc(x, y, Math.random() * 2 + 0.5, 0, Math.PI * 2);
      c.fill();
    }
    // geometric strip (mashrabiya hint)
    c.strokeStyle = "rgba(253,224,71,0.35)";
    c.lineWidth = 2 * S;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(0, size * (0.34 + i * 0.035));
      c.lineTo(size, size * (0.34 + i * 0.035));
      c.stroke();
    }
  } else if (t === "afro-heat") {
    const g = c.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, "#7f1d1d");
    g.addColorStop(0.45, "#ea580c");
    g.addColorStop(1, "#fbbf24");
    c.fillStyle = g;
    c.fillRect(0, 0, size, size);
    // sun
    const sun = c.createRadialGradient(size * 0.72, size * 0.28, size * 0.02, size * 0.72, size * 0.28, size * 0.42);
    sun.addColorStop(0, "rgba(255,237,213,0.95)");
    sun.addColorStop(0.4, "rgba(251,146,60,0.6)");
    sun.addColorStop(1, "rgba(251,146,60,0)");
    c.fillStyle = sun;
    c.fillRect(0, 0, size, size);
    // floor strips
    c.fillStyle = "rgba(0,0,0,0.25)";
    for (let i = 0; i < 12; i++) {
      c.beginPath();
      c.moveTo(0, size * (0.55 + i * 0.045));
      c.lineTo(size, size * (0.55 + i * 0.045 - 0.012));
      c.lineTo(size, size * (0.55 + i * 0.045 + 0.028));
      c.lineTo(0, size * (0.55 + i * 0.045 + 0.04));
      c.closePath();
      c.fill();
    }
  } else if (t === "midnight-gold") {
    const g = c.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, "#0c0a09");
    g.addColorStop(1, "#1c1917");
    c.fillStyle = g;
    c.fillRect(0, 0, size, size);
    // gold dust
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 3 * S + 0.5 * S;
      c.fillStyle = `rgba(251,191,36,${0.12 + Math.random() * 0.5})`;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
    // large ring
    c.strokeStyle = "rgba(251,191,36,0.5)";
    c.lineWidth = 2 * S;
    c.beginPath();
    c.arc(size / 2, size / 2, size * 0.36, 0, Math.PI * 2);
    c.stroke();
  } else if (t === "neon-bloom") {
    const g = c.createLinearGradient(size * 0.1, 0, size * 0.9, size);
    g.addColorStop(0, "#4c1d95");
    g.addColorStop(0.5, "#be185d");
    g.addColorStop(1, "#d946ef");
    c.fillStyle = g;
    c.fillRect(0, 0, size, size);
    for (let i = 0; i < 7; i++) {
      const glow = c.createRadialGradient(size * (0.2 + i * 0.1), size * 0.75, 10 * S, size * (0.2 + i * 0.1), size * 0.75, size * 0.16);
      glow.addColorStop(0, "rgba(240,171,252,0.7)");
      glow.addColorStop(1, "rgba(240,171,252,0)");
      c.fillStyle = glow;
      c.fillRect(0, 0, size, size);
    }
    // neon grid
    c.strokeStyle = "rgba(255,255,255,0.08)";
    c.lineWidth = 1.2 * S;
    for (let i = 0; i <= 20; i++) {
      c.beginPath();
      c.moveTo((i / 20) * size, 0);
      c.lineTo((i / 20) * size, size);
      c.stroke();
      c.beginPath();
      c.moveTo(0, (i / 20) * size);
      c.lineTo(size, (i / 20) * size);
      c.stroke();
    }
  } else if (t === "deep-teal") {
    const g = c.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, "#042f2e");
    g.addColorStop(0.55, "#0f766e");
    g.addColorStop(1, "#22d3ee");
    c.fillStyle = g;
    c.fillRect(0, 0, size, size);
    // waves
    c.fillStyle = "rgba(255,255,255,0.07)";
    for (let i = 0; i < 9; i++) {
      c.beginPath();
      c.moveTo(0, size * (0.5 + i * 0.07));
      for (let x = 0; x <= 40; x++) {
        c.lineTo((x / 40) * size, size * (0.5 + i * 0.07) + Math.sin((x / 40) * Math.PI * 2 + i * 0.7) * 14 * S);
      }
      c.lineTo(size, size);
      c.lineTo(0, size);
      c.closePath();
      c.fill();
    }
  } else {
    // vinyl-classic
    c.fillStyle = "#09090b";
    c.fillRect(0, 0, size, size);
    const grooves = c.createRadialGradient(size / 2, size / 2, 10 * S, size / 2, size / 2, size * 0.44);
    grooves.addColorStop(0, "#18181b");
    grooves.addColorStop(0.7, "#0c0c0e");
    grooves.addColorStop(1, "#09090b");
    c.fillStyle = grooves;
    c.beginPath();
    c.arc(size / 2, size / 2, size * 0.44, 0, Math.PI * 2);
    c.fill();
    for (let i = 1; i <= 40; i++) {
      c.strokeStyle = `rgba(255,255,255,${0.02 + (i % 5) * 0.004})`;
      c.lineWidth = 1 * S;
      c.beginPath();
      c.arc(size / 2, size / 2, size * (0.08 + i * 0.009), 0, Math.PI * 2);
      c.stroke();
    }
    c.fillStyle = accent;
    c.beginPath();
    c.arc(size / 2, size / 2, size * 0.09, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#09090b";
    c.beginPath();
    c.arc(size / 2, size / 2, size * 0.018, 0, Math.PI * 2);
    c.fill();
  }

  // ---- type ----
  const titleColor = t === "midnight-gold" || t === "desert-gold" ? "#fde68a" : "#ffffff";
  const subColor = t === "afro-heat" ? "#431407" : t === "deep-teal" ? "#052e2b" : t === "desert-gold" ? "rgba(253,230,138,0.85)" : "rgba(255,255,255,0.72)";

  // dark scrim for legibility
  const scrim = c.createLinearGradient(0, size * 0.55, 0, size);
  scrim.addColorStop(0, "rgba(0,0,0,0)");
  scrim.addColorStop(1, "rgba(0,0,0,0.55)");
  c.fillStyle = scrim;
  c.fillRect(0, size * 0.5, size, size * 0.5);

  const fitSize = (text: string, maxW: number, base: number): number => {
    let fs = base;
    c.font = `800 ${fs}px Inter, system-ui, sans-serif`;
    while (c.measureText(text).width > maxW && fs > 40) {
      fs -= 6;
      c.font = `800 ${fs}px Inter, system-ui, sans-serif`;
    }
    return fs;
  };

  const fs = fitSize(title, size * 0.86, 150 * S);
  drawText(c, title.toUpperCase(), {
    x: size / 2,
    y: size * 0.78,
    size: fs,
    weight: 800,
    color: titleColor,
    tracking: 0.015,
  });
  drawText(c, subtitle.toUpperCase(), {
    x: size / 2,
    y: size * 0.88,
    size: 54 * S,
    weight: 600,
    color: subColor,
    tracking: 0.3,
  });

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const bytes = Math.round((dataUrl.length * 3) / 4);
  return { dataUrl, sizeBytes: bytes, width: size, height: size };
}

/** Draw an AI-generated image (or any image) into a square canvas at size×size and export JPEG. */
export async function squareCropToJpeg(src: HTMLImageElement | HTMLCanvasElement, size = 3000, quality = 0.92): Promise<{ dataUrl: string; sizeBytes: number; width: number; height: number }> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext("2d")!;
  const w = src instanceof HTMLImageElement ? src.naturalWidth : src.width;
  const h = src instanceof HTMLImageElement ? src.naturalHeight : src.height;
  const side = Math.min(w, h);
  c.drawImage(
    src,
    (w - side) / 2,
    (h - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  );
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const bytes = Math.round((dataUrl.length * 3) / 4);
  return { dataUrl, sizeBytes: bytes, width: size, height: size };
}

export function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image."));
    img.src = dataUrl;
  });
}

export function buildArtPrompt(project: { name: string; genre: string; mood: string }, settings: { artistName: string; instagram: string }): string {
  const mood = project.mood || "energetic, deep, hypnotic";
  return [
    `Design a square music cover artwork (3000x3000) for an Afro House DJ mix.`,
    `Title text: "${project.name || "Afro House Mix"}" — subtitle text: "${settings.artistName || "DJ EMY"}".`,
    `Genre: ${project.genre || "Afro House"}. Mood: ${mood}.`,
    `Artist identity: the DJ is Tunisian-born and raised in Qatar — weave in subtle references to her heritage where it fits the vibe: desert dunes at dusk, gold and amber, a crescent moon, North African geometric patterns, Arabian Gulf nightlife energy.`,
    `Style: premium club/vinyl artwork, bold typography, high contrast, no photorealistic faces, no watermarks, no borders, edge-to-edge composition, print-quality.`,
    `Do not write any other text besides the title and subtitle.`,
  ].join(" ");
}

export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
