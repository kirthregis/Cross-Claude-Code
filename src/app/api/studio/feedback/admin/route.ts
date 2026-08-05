import { NextResponse } from "next/server";
import { allStudioFeedback, studioFeedbackStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = allStudioFeedback();
  const report = studioFeedbackStats();
  return NextResponse.json({ items, stats: report });
}