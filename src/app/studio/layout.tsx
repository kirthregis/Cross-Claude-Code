import type { Metadata } from "next";
import { StudioNav } from "@/components/studio/StudioNav";

export const metadata: Metadata = {
  title: "EMY Studio — DJ Emy's Production Studio",
  description: "Master your mixes, design covers, package releases. Your whole production studio, on your laptop and your phone — offline or online.",
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <StudioNav />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
    </div>
  );
}
