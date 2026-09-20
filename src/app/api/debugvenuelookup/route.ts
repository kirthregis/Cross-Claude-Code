import { NextResponse } from "next/server";

const browserHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;

async function checkGoogle(q: string) {
  try {
    const res = await fetch(`https://www.google.com/search?q=${q}&num=10`, { signal: AbortSignal.timeout(8000), headers: browserHeaders });
    const html = await res.text();
    const hasCaptcha = /unusual traffic|sorry\/index|recaptcha/i.test(html);
    const links = [...html.matchAll(/<a href="(https?:\/\/[^"&]+)"/g)].map((m) => m[1])
      .filter((l) => !/google\.com/i.test(l));
    return { status: res.status, htmlLength: html.length, hasCaptcha, linkCount: links.length, sampleLinks: links.slice(0, 8) };
  } catch (e) {
    return { error: String(e) };
  }
}

async function checkNammosDirect() {
  try {
    const res = await fetch(`https://www.nammos.com/dubai/contact`, { signal: AbortSignal.timeout(8000), headers: browserHeaders });
    const html = await res.text();
    const emails = html.match(EMAIL_RE) ?? [];
    return { status: res.status, htmlLength: html.length, emailsFound: [...new Set(emails)] };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const venue = url.searchParams.get("venue") || "Nammos Dubai";
  const q = encodeURIComponent(`${venue} official website`);

  const [google, nammosDirect] = await Promise.all([checkGoogle(q), checkNammosDirect()]);
  return NextResponse.json({ google, nammosDirect });
}
