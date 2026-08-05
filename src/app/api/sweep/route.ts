import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ 
    message: "If you see this, the route is working perfectly. The error is in the imports.",
    time: new Date().toISOString()
  });
}
