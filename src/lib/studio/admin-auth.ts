import { NextResponse } from "next/server";

/**
 * EMY Studio — admin gate.
 * The developer sets STUDIO_ADMIN_TOKEN in env; the /studio/admin page and
 * admin APIs require it. The artist's device never knows it.
 */

export function isAdminRequest(req: Request): boolean {
  const token = process.env.STUDIO_ADMIN_TOKEN;
  if (!token) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${token}`;
}

export function adminConfigured(): boolean {
  return Boolean(process.env.STUDIO_ADMIN_TOKEN);
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ ok: false, error: "Admin token required. Set STUDIO_ADMIN_TOKEN in env." }, { status: 401 });
}
