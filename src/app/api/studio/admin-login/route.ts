import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Checks the /studio/admin password server-side against STUDIO_ADMIN_TOKEN.
 * The token itself never reaches the client — only a true/false answer does.
 */
export async function POST(req: Request) {
  const token = process.env.STUDIO_ADMIN_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Admin access is not configured." }, { status: 401 });
  }

  const { password } = await req.json().catch(() => ({ password: "" }));
  const guess = Buffer.from(String(password ?? ""));
  const real = Buffer.from(token);
  const match = guess.length === real.length && timingSafeEqual(guess, real);

  if (!match) {
    return NextResponse.json({ ok: false, error: "Invalid password." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
