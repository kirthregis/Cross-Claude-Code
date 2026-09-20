import { NextResponse } from "next/server";

const browserHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const venue = url.searchParams.get("venue") || "Nammos Dubai";
  const q = encodeURIComponent(`${venue} official website`);
  const res = await fetch(`https://www.google.com/search?q=${q}&num=10`, { signal: AbortSignal.timeout(8000), headers: browserHeaders });
  const html = await res.text();

  // Try several href patterns Google has used across variants.
  const patterns = {
    "url?q=": [...html.matchAll(/\/url\?q=(https?:\/\/[^"&]+)/g)].map((m) => decodeURIComponent(m[1])),
    "plain-a-href": [...html.matchAll(/href="(https?:\/\/(?!www\.google)[^"]+)"/g)].map((m) => m[1]),
    "data-href": [...html.matchAll(/data-href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]),
    "cite-tag": [...html.matchAll(/<cite[^>]*>([^<]+)<\/cite>/g)].map((m) => m[1]),
  };
  const counts = Object.fromEntries(Object.entries(patterns).map(([k, v]) => [k, v.length]));
  const samples = Object.fromEntries(Object.entries(patterns).map(([k, v]) => [k, v.slice(0, 5)]));

  return NextResponse.json({ status: res.status, htmlLength: html.length, counts, samples });
}
