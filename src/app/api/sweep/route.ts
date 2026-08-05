import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leads = [
      {
        sourceName: "Soho Garden",
        title: "Booking opportunity - Soho Garden",
        body: "Venue: Soho Garden\nArea: Meydan\nTier: superclub\nEmail: bookings@sohogarden.ae",
        postedAt: new Date().toISOString()
      },
      {
        sourceName: "Nikki Beach Dubai",
        title: "Booking opportunity - Nikki Beach Dubai",
        body: "Venue: Nikki Beach Dubai\nArea: Pearl Jumeirah\nTier: beach club\nEmail: dubai@nikkibeach.com",
        postedAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      ok: true,
      found: leads.length,
      leads: leads,
      message: "Direct internal test - UAE verified sources active",
      scannedAt: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
