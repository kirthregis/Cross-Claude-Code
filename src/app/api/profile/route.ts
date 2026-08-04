import { NextResponse } from "next/server";
import { getProfile, saveProfile, profileGaps, ratesAreEstimates } from "@/lib/profile-store";
import { registerProfileLoader } from "@/lib/profile-store";

export const dynamic = "force-dynamic";

export async function GET() {
  await registerProfileLoader();
  const profile = await getProfile();
  return NextResponse.json({ profile, gaps: profileGaps(profile), ratesAreEstimates: ratesAreEstimates(profile) });
}

export async function POST(req: Request) {
  await registerProfileLoader();
  const patch = await req.json();
  const profile = await saveProfile(patch);
  return NextResponse.json({ profile, gaps: profileGaps(profile), ratesAreEstimates: ratesAreEstimates(profile) });
}
