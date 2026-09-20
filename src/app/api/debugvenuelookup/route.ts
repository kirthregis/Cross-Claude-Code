import { NextResponse } from "next/server";

async function tryFetch(label: string, url: string, headers: Record<string, string>) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers });
    const html = await res.text();
    return { label, status: res.status, ok: res.ok, htmlLength: html.length, snippet: html.slice(0, 300) };
  } catch (e) {
    return { label, error: String(e) };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const venue = url.searchParams.get("venue") || "Nammos Dubai";
  const q = encodeURIComponent(`${venue} Dubai official website`);
  const browserHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  const results = await Promise.all([
    tryFetch("ddg-html-plain", `https://html.duckduckgo.com/html/?q=${q}`, { "User-Agent": "Mozilla/5.0 (compatible; EMYStudioGigRadar/1.0)" }),
    tryFetch("ddg-html-browser-headers", `https://html.duckduckgo.com/html/?q=${q}`, browserHeaders),
    tryFetch("ddg-lite", `https://lite.duckduckgo.com/lite/?q=${q}`, browserHeaders),
    tryFetch("bing", `https://www.bing.com/search?q=${q}`, browserHeaders),
    tryFetch("marginalia", `https://old-search.marginalia.nu/search?query=${q}`, browserHeaders),
    tryFetch("mojeek", `https://www.mojeek.com/search?q=${q}`, browserHeaders),
  ]);

  return NextResponse.json({ results });
}
