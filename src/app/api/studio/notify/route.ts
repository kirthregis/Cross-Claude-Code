import { NextResponse } from "next/server";

/**
 * EMY Studio — email ping.
 * Server-side only; the Resend key never reaches the browser.
 * Set RESEND_API_KEY + STUDIO_NOTIFY_TO in .env.local / Vercel env.
 */

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.STUDIO_NOTIFY_TO;
  if (!apiKey || !to) {
    return NextResponse.json({ configured: false, sent: false }, { status: 200 });
  }
  let body: { subject?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ configured: true, sent: false, error: "bad body" }, { status: 400 });
  }
  const from = process.env.RESEND_FROM || "EMY Studio <studio@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: to.split(",").map((s) => s.trim()).filter(Boolean),
      subject: body.subject || "EMY Studio",
      text: body.text || "",
    }),
  });
  if (!res.ok) {
    return NextResponse.json({ configured: true, sent: false, error: await res.text() }, { status: 200 });
  }
  return NextResponse.json({ configured: true, sent: true });
}
