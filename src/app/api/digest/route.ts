import { NextResponse } from "next/server";
import { sendMorningDigest } from "@/lib/notify";
import { pendingDeferred } from "@/lib/db";
import { registerProfileLoader } from "@/lib/profile-store";

registerProfileLoader();

export const dynamic = "force-dynamic";

export async function GET() {
  const pending = pendingDeferred();
  return NextResponse.json({
    count: pending.length,
    queued: pending.map((p) => ({
      id: p.id,
      gigId: p.gigId,
      queuedAt: p.createdAt,
    })),
  });
}

export async function POST() {
  try {
    const result = await sendMorningDigest();
    return NextResponse.json({
      ok: true,
      sent: result.sent,
      count: result.count,
      at: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}