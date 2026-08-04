import { NextResponse } from "next/server";

export function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.STUDIO_NOTIFY_TO;
  const masked = to
    ? to.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (s.includes("@") ? s.replace(/^(.)(.*)(@.*)$/, "$1***$3") : s)).join(", ")
    : "";
  return NextResponse.json({
    emailConfigured: Boolean(apiKey && to),
    emailTo: masked,
  });
}
