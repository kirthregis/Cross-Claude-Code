import { NextResponse } from "next/server";
import { getProfile, saveProfile, profileGaps, ratesAreEstimates, registerProfileLoader } from "@/lib/profile-store";

registerProfileLoader();

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = getProfile();
  return NextResponse.json({
    profile,
    gaps: profileGaps(),
    ratesAreEstimates: ratesAreEstimates(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    saveProfile(body);
    return NextResponse.json({
      ok: true,
      profile: getProfile(),
      gaps: profileGaps(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}