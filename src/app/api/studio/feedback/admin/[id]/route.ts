import { NextResponse } from "next/server";
import { setStudioFeedbackStatus, type FeedbackStatus } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/studio/admin-auth";

export const runtime = "nodejs";

const VALID: FeedbackStatus[] = ["new", "planned", "done", "dismissed"];

/** Developer back end: change a suggestion's status. Requires the admin token. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return unauthorized();
  const { id } = await params;
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad body." }, { status: 400 });
  }
  if (!VALID.includes(body.status as FeedbackStatus)) {
    return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
  }
  const row = setStudioFeedbackStatus(id, body.status as FeedbackStatus);
  if (!row) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true, id: row.id, status: row.status });
}
