import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Server-side notification trigger.
 * Called by the sweep cron when a new gig matches saved filters.
 * The client polls this endpoint every 30 seconds when online.
 */

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Notification endpoint live",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, title, message, actionUrl } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, message" },
        { status: 400 }
      );
    }

    // In a full push setup, this would trigger a web push to
    // the stored subscription. For now it logs and returns success
    // so the client can show the in-app notification.
    console.log(`[Notification] ${type}: ${title} — ${message}`);

    return NextResponse.json({
      ok: true,
      sent: true,
      notification: { type, title, message, actionUrl },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}