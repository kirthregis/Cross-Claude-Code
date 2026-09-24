"use client";

import Image from "next/image";
import { whatsappDeepLink, instagramDeepLink } from "@/lib/channels";

/** A phone field can hold more than one number for display (see primaryPhone() in channels.ts) — a vCard can hold every number it finds, each as its own TEL line, rather than picking just one. */
function allPhoneNumbers(raw: string): string[] {
  return raw.match(/\+\d[\d\s-]{6,}\d/g)?.map((s) => s.trim()) ?? [raw];
}

export interface CardData {
  name: string;
  subtitle?: string;
  /** One or more title lines — e.g. ["Professional DJ", "Creative Director, Emy Vision Group"]. */
  roles: string[];
  company: string;
  photoUrl: string;
  credentials?: string[];
  phone: string;
  whatsappGreeting: string;
  email?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
  epkUrl?: string;
}

function vcardText(c: CardData): string {
  const [first, ...rest] = c.name.split(" ");
  const last = rest.join(" ");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${last};${first};;;`,
    `FN:${c.name}`,
    `ORG:${c.company}`,
    `TITLE:${c.roles[0] ?? ""}`,
    ...allPhoneNumbers(c.phone).map((num) => `TEL;TYPE=CELL:${num}`),
    c.email ? `EMAIL:${c.email}` : "",
    c.website ? `URL:${c.website}` : "",
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\n");
}

function downloadVCard(c: CardData) {
  const blob = new Blob([vcardText(c)], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${c.name.replace(/\s+/g, "-")}.vcf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

// EVG's real brand palette — confirmed against emyvisiongroup.com's own
// stylesheet, not the generic purple/orange theme this app's other pages use.
const evg = {
  ground: "#080c17",
  panel: "#101830",
  line: "#1e2942",
  ink: "#eaf0fb",
  muted: "#8590a6",
  accent: "#34c08a",
  accentDim: "#1f8f66",
};

export function DigitalCard(c: CardData) {
  return (
    <div className="min-h-screen px-5 py-10 flex flex-col items-center" style={{ backgroundColor: evg.ground, color: evg.ink }}>
      <div className="w-full max-w-sm">
        <div className="rounded-3xl p-[1.5px]" style={{ backgroundColor: evg.accent }}>
          <div className="rounded-3xl p-6" style={{ backgroundColor: evg.panel }}>
            <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "4 / 5", backgroundColor: evg.ground, border: `1px solid ${evg.line}` }}>
              <Image src={c.photoUrl} alt={c.name} fill sizes="400px" className="object-cover" style={{ objectPosition: "50% 15%" }} priority />
            </div>

            <div className="mt-5 text-center">
              <h1 className="text-2xl font-black">{c.name}</h1>
              {c.subtitle && <p className="text-sm" style={{ color: evg.muted }}>{c.subtitle}</p>}
              <div className="mt-1.5 space-y-0.5">
                {c.roles.map((role) => (
                  <p key={role} className="text-sm font-bold" style={{ color: evg.accent }}>{role}</p>
                ))}
              </div>
              <p className="mt-1 text-xs" style={{ color: evg.muted }}>{c.company}</p>
            </div>

            {c.credentials && c.credentials.length > 0 && (
              <div className="mt-5 space-y-1.5 rounded-2xl p-4" style={{ backgroundColor: evg.ground, border: `1px solid ${evg.line}` }}>
                {c.credentials.map((line) => (
                  <p key={line} className="text-xs leading-relaxed" style={{ color: evg.ink }}>
                    <span style={{ color: evg.accent }}>★</span> {line}
                  </p>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-2.5">
              <a
                href={whatsappDeepLink(c.phone, c.whatsappGreeting)}
                target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
                style={{ backgroundColor: "#25D366" }}
              >
                💬 Chat on WhatsApp
              </a>
              <button
                onClick={() => downloadVCard(c)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold shadow-lg transition hover:brightness-110"
                style={{ backgroundColor: evg.accent, color: evg.ground }}
              >
                📇 Save Contact
              </button>
              {c.epkUrl && (
                <a
                  href={c.epkUrl} target="_blank" rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition"
                  style={{ border: `1px solid ${evg.line}`, color: evg.ink }}
                >
                  🎧 View EPK
                </a>
              )}
            </div>

            <div className="mt-6 flex justify-center gap-4 text-xs" style={{ color: evg.muted }}>
              {c.instagram && (
                <a href={instagramDeepLink(c.instagram)} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                  Instagram
                </a>
              )}
              {c.youtube && (
                <a href={c.youtube} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                  YouTube
                </a>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className="hover:opacity-80">
                  Email
                </a>
              )}
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-[11px]" style={{ color: evg.muted }}>Emy Vision Group · emyvisiongroup.com</p>
      </div>
    </div>
  );
}
