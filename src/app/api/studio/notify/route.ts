import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/studio/server-email";
import { DEFAULT_STUDIO_NAME } from "@/lib/studio/brand";

/**
 * EMY Studio — email ping.
 * Server-side only; the Resend key never reaches the browser.
 * Set RESEND_API_KEY + STUDIO_NOTIFY_TO in .env.local / Vercel env.
 */

export async function POST(req: Request) {
  let body: { subject?: string; text?: string; to?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ configured: false, sent: false, error: "bad body" }, { status: 400 });
  }
  const result = await sendEmail({
    to: body.to || process.env.STUDIO_NOTIFY_TO || "",
    subject: body.subject || DEFAULT_STUDIO_NAME,
    text: body.text || "",
  });
  return NextResponse.json(result);
}
