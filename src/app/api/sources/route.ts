import { NextResponse } from "next/server";
import { sourceStatus } from "@/lib/sources";

export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json({ sources: sourceStatus() }); }
