import { NextResponse } from "next/server";
import { setStudioFeedbackStatus, listStudioFeedback } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json() as { status: "open" | "done" };
    if (!["open", "done"].includes(status)) {
      return NextResponse.json({ error: "status must be open or done" }, { status: 400 });
    }
    setStudioFeedbackStatus(params.id, status);
    const items = listStudioFeedback();
    const item = items.find(i => i.id === params.id);
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const items = listStudioFeedback();
    const filtered = items.filter(i => i.id !== params.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("emy-studio-feedback", JSON.stringify(filtered));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
