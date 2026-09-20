import { NextResponse } from "next/server";

const UA = "Mozilla/5.0 (compatible; EMYStudioGigRadar/1.0)";

function candidates(venueName: string): string[] {
  const words = venueName.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim().split(/\s+/).filter((w) => w.length > 2);
  const slug = words.join("");
  const first = words[0] ?? slug;
  const bases = [...new Set([first, slug])];
  const urls: string[] = [];
  for (const base of bases) {
    for (const tld of ["com", "ae"]) {
      urls.push(`https://www.${base}.${tld}`);
      urls.push(`https://${base}.${tld}`);
    }
  }
  return [...new Set(urls)];
}

async function checkCandidate(url: string, venueName: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { "User-Agent": UA }, redirect: "follow" });
    const html = await res.text();
    const words = venueName.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter((w) => w.length > 2);
    const lower = html.toLowerCase();
    const matchedWords = words.filter((w) => lower.includes(w));
    return { url, status: res.status, ok: res.ok, htmlLength: html.length, matchedWords, finalUrl: res.url };
  } catch (e) {
    return { url, error: String(e) };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const venue = url.searchParams.get("venue") || "Nammos Dubai";
  const cands = candidates(venue);
  const results = await Promise.all(cands.map((c) => checkCandidate(c, venue)));
  return NextResponse.json({ venue, candidates: cands, results });
}
