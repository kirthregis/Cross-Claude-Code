"use client";

import { whatsappDeepLink, instagramDeepLink } from "@/lib/channels";

/** A phone field can hold more than one number for display (see primaryPhone() in channels.ts) — a vCard can hold every number it finds, each as its own TEL line, rather than picking just one. */
function allPhoneNumbers(raw: string): string[] {
  return raw.match(/\+\d[\d\s-]{6,}\d/g)?.map((s) => s.trim()) ?? [raw];
}

export interface CardData {
  name: string;
  subtitle?: string;
  role: string;
  company: string;
  credentials?: string[];
  phone: string;
  whatsappGreeting: string;
  email?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
  epkUrl?: string;
  avatarLetter: string;
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
    `TITLE:${c.role}`,
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

export function DigitalCard(c: CardData) {
  return (
    <div className="min-h-screen bg-black px-5 py-10 text-white flex flex-col items-center">
      <div className="w-full max-w-sm">
        <div className="brand-grad brand-shadow rounded-3xl p-[1.5px]">
          <div className="rounded-3xl bg-zinc-950 p-7">
            <div className="flex flex-col items-center text-center">
              <div className="brand-grad flex h-20 w-20 items-center justify-center rounded-full text-3xl font-black text-white shadow-lg">
                {c.avatarLetter}
              </div>
              <h1 className="mt-4 text-2xl font-black">{c.name}</h1>
              {c.subtitle && <p className="text-sm text-zinc-500">{c.subtitle}</p>}
              <p className="brand-text-grad mt-1 text-sm font-bold">{c.role}</p>
              <p className="text-xs text-zinc-400">{c.company}</p>
            </div>

            {c.credentials && c.credentials.length > 0 && (
              <div className="mt-5 space-y-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                {c.credentials.map((line) => (
                  <p key={line} className="text-xs leading-relaxed text-zinc-300">★ {line}</p>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-2.5">
              <a
                href={whatsappDeepLink(c.phone, c.whatsappGreeting)}
                target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-green-500 transition"
              >
                💬 Chat on WhatsApp
              </a>
              <button
                onClick={() => downloadVCard(c)}
                className="brand-grad flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition"
              >
                📇 Save Contact
              </button>
              {c.epkUrl && (
                <a
                  href={c.epkUrl} target="_blank" rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 py-3.5 text-sm font-bold text-zinc-200 hover:border-zinc-500 transition"
                >
                  🎧 View EPK
                </a>
              )}
            </div>

            <div className="mt-6 flex justify-center gap-4 text-xs text-zinc-500">
              {c.instagram && (
                <a href={instagramDeepLink(c.instagram)} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300">
                  Instagram
                </a>
              )}
              {c.youtube && (
                <a href={c.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300">
                  YouTube
                </a>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className="hover:text-zinc-300">
                  Email
                </a>
              )}
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-[11px] text-zinc-700">Emy Vision Group · emyvisiongroup.com</p>
      </div>
    </div>
  );
}
