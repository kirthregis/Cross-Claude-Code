import { NextResponse } from "next/server";

async function tryFetch(label: string, url: string) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EMYStudioGigRadar/1.0)", "Accept": "application/json,text/html" },
    });
    const text = await res.text();
    return { label, status: res.status, ok: res.ok, length: text.length, snippet: text.slice(0, 400) };
  } catch (e) {
    return { label, error: String(e) };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const venue = url.searchParams.get("venue") || "Nammos Dubai";
  const q = encodeURIComponent(`${venue} official website`);

  const instances = [
    "https://searx.be/search",
    "https://priv.au/search",
    "https://search.inetol.net/search",
    "https://opnxng.com/search",
    "https://searx.tiekoetter.com/search",
    "https://baresearch.org/search",
  ];

  const results = await Promise.all(
    instances.map((base) => tryFetch(base, `${base}?q=${q}&format=json`)),
  );

  return NextResponse.json({ results });
}
