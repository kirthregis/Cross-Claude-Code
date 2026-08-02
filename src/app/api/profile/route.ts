import { NextResponse } from "next/server";
import { getProfile, saveProfile, profileGaps } from "@/lib/profile-store";
import { registerProfileLoader } from "@/lib/profile-store";

registerProfileLoader();

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = getProfile();
  return NextResponse.json({ profile, gaps: profileGaps(profile) });
}

export async function POST(req: Request) {
  const patch = await req.json();
  const profile = saveProfile(patch);
  return NextResponse.json({ profile, gaps: profileGaps(profile) });
}
