import { NextResponse } from "next/server";
import { setStudioFeedbackStatus, listStudioFeedback } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = (await req.json()) as { status: "new" | "open" | "planned" | "done" | "rejected" };
    const valid = ["new", "open", "planned", "done", "rejected"];
    if (!valid.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const item = setStudioFeedbackStatus(id, status);
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const items = listStudioFeedback();
    const filtered = items.filter((i) => i.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem("emy-studio-feedback", JSON.stringify(filtered));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
