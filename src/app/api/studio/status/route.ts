import { NextResponse } from "next/server";

/**
 * EMY Studio — capability status.
 * Reports (booleans only, never secrets) which services the developer has
 * configured on the server via env vars, so the client can offer "just
 * works" AI without the user pasting any key.
 */
export function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.STUDIO_NOTIFY_TO;
  const masked = to
    ? to.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (s.includes("@") ? s.replace(/^(.)(.*)(@.*)$/, "$1***$3") : s)).join(", ")
    : "";
  return NextResponse.json({
    emailConfigured: Boolean(apiKey && to),
    emailTo: masked,
    serverGemini: Boolean(process.env.GEMINI_API_KEY),
    serverFal: Boolean(process.env.FAL_KEY),
    adminConfigured: Boolean(process.env.STUDIO_ADMIN_TOKEN),
  });
}
