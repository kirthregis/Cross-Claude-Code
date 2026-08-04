import { NextResponse } from "next/server";
import { allStudioFeedback, studioFeedbackStats } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/studio/admin-auth";

export const runtime = "nodejs";

/** Developer back end: every suggestion + counts. Requires the admin token. */
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();
  const rows = allStudioFeedback();
  return NextResponse.json({
    ok: true,
    stats: studioFeedbackStats(),
    items: rows.map((r) => ({
      id: r.id,
      clientId: r.clientId,
      text: r.text,
      device: r.device,
      category: r.category,
      priority: r.priority,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      plan: r.plan ? JSON.parse(r.plan) : null,
    })),
  });
}
