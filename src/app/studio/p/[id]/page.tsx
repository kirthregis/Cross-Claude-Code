import { Suspense } from "react";
import ProjectEditorClient from "./client";
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(params);
  if (!id) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-zinc-500">Invalid project link.</p>
      </div>
    );
  }
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="text-zinc-500 text-sm animate-pulse">Loading project...</div></div>}>
      <ProjectEditorClient id={id} />
    </Suspense>
  );
}