import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { addFeedback, listFeedback, setFeedbackStatus } from "@/lib/db";
import { notifyOwner } from "@/lib/notify";

export const dynamic = "force-dynamic";

const CATEGORIES = ["hunting", "alerts", "pricing", "contracts", "look", "other"] as const;

const SubmitBody = z.object({
  message: z.string().min(3, "Tell us a bit more (at least a few words).").max(2000),
  category: z.enum(CATEGORIES).optional(),
  contact: z.string().max(200).optional(),
});

const StatusBody = z.object({
  id: z.string().min(1),
  status: z.enum(["new", "in_progress", "done"]),
});

/**
 * GET  → everything Emy has suggested, newest first. This is the "backend"
 *        inbox you review. Protected by ADMIN_KEY if set.
 * POST → submit a suggestion from the app (public).
 */
export async function GET(req: Request) {
  // The suggestions inbox is for the owner. If ADMIN_KEY is set, require it.
  const adminKey = process.env.ADMIN_KEY;
  if (adminKey) {
    const provided = req.headers.get("x-admin-key");
    if (provided !== adminKey) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  return NextResponse.json({ feedback: await listFeedback() });
}

/** POST body can either be a new suggestion or a status update. */
export async function POST(req: Request) {
  let payload: unknown;
  try { payload = await req.json(); } catch { payload = null; }

  // Status update from the admin inbox.
  if (payload && typeof payload === "object" && "status" in (payload as object)) {
    const adminKey = process.env.ADMIN_KEY;
    if (adminKey && req.headers.get("x-admin-key") !== adminKey) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const parsed = StatusBody.safeParse(payload);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    const ok = await setFeedbackStatus(parsed.data.id, parsed.data.status);
    return NextResponse.json({ ok });
  }

  // New suggestion.
  const parsed = SubmitBody.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  const item = {
    id: nanoid(12),
    createdAt: new Date().toISOString(),
    message: parsed.data.message.trim(),
    category: parsed.data.category,
    contact: parsed.data.contact?.trim() || undefined,
    status: "new" as const,
  };
  await addFeedback(item);

  // Route it to the owner in real time so it can be implemented.
  const notifyText = [
    `💡 New suggestion`,
    ``,
    item.message,
    item.contact ? `\nFrom: ${item.contact}` : "",
    item.category ? `\nCategory: ${item.category}` : "",
  ].filter(Boolean).join("\n");
  await notifyOwner(`New GigRadar suggestion`, notifyText).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}
