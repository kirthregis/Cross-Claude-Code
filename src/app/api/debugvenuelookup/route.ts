import { NextResponse } from "next/server";

const UA = "Mozilla/5.0 (compatible; EMYStudioGigRadar/1.0; +https://emy-studio-rho.vercel.app)";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const venue = url.searchParams.get("venue") || "Nammos Dubai";
  const q = encodeURIComponent(`${venue} Dubai official website`);
  const searchUrl = `https://html.duckduckgo.com/html/?q=${q}`;

  try {
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": UA } });
    const html = await res.text();
    const linkMatches = [...html.matchAll(/result__a"[^>]*href="[^"]*uddg=([^&"]+)/g)].map((m) => m[1]);
    return NextResponse.json({
      searchStatus: res.status,
      searchOk: res.ok,
      htmlLength: html.length,
      htmlSnippet: html.slice(0, 500),
      linksFound: linkMatches.length,
      links: linkMatches.slice(0, 5),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
