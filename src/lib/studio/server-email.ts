/**
 * EMY Studio — server-side email (Resend). Keys never reach the browser.
 */

export interface EmailResult {
  configured: boolean;
  sent: boolean;
  error?: string;
}

export async function sendEmail(opts: { to: string; subject: string; text: string; from?: string }): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !opts.to.trim()) {
    return { configured: false, sent: false };
  }
  const from = opts.from || process.env.RESEND_FROM || "EMY Studio <studio@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: opts.to.split(",").map((s) => s.trim()).filter(Boolean),
        subject: opts.subject,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      return { configured: true, sent: false, error: await res.text() };
    }
    return { configured: true, sent: true };
  } catch (e) {
    return { configured: true, sent: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Where the developer wants pings (feedback alerts fall back to STUDIO_NOTIFY_TO). */
export function devEmailTo(): string {
  return process.env.DEV_FEEDBACK_TO || process.env.STUDIO_NOTIFY_TO || "";
}

export function devAppUrl(): string {
  return process.env.APP_URL || "";
}
