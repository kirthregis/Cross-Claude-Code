"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ProjectEditorClient from "./client";

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="text-zinc-500 text-sm animate-pulse">Loading project…</div></div>}>
      <ProjectEditorClient id={params.id} />
    </Suspense>
  );
}
