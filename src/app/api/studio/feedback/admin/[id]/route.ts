import { NextResponse } from "next/server";
import { setStudioFeedbackStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { status } = body;

    if (status !== "open" && status !== "done") {
      return NextResponse.json(
        { error: "status must be open or done" },
        { status: 400 }
      );
    }

    setStudioFeedbackStatus(id, status);

    return NextResponse.json({ ok: true, id, status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}