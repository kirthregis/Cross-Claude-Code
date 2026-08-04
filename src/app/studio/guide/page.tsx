"use client";

import Link from "next/link";
import { Button, Card, SectionLabel } from "@/components/studio/ui";
import { GUIDE_STEPS, GUIDE_QUICK_TIPS, VOICE_EXAMPLES } from "@/lib/studio/guide";
import { useRouter } from "next/navigation";

export default function GuidePage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="bg-gradient-to-r from-fuchsia-400 to-amber-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            How to use EMY Studio
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Everything from finished mix to published release in six steps. You can click your way through each one — or just tell the assistant and it opens the right screen for you.
          </p>
        </div>
        <Link href="/studio" className="text-xs text-zinc-500 hover:text-zinc-300">← Back to studio</Link>
      </div>

      {/* steps */}
      <div className="space-y-3">
        {GUIDE_STEPS.map((s) => (
          <Card key={s.n} id={`step-${s.n}`} className="scroll-mt-24 p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-600/30 to-amber-500/30 text-xl">
                {s.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-fuchsia-400">STEP {s.n}</span>
                  <h2 className="text-base font-extrabold text-white">{s.title}</h2>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-300">{s.detail}</p>
                {s.command && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-zinc-500">Or say:</span>
                    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-mono text-[11px] text-fuchsia-300">{s.command}</span>
                  </div>
                )}
              </div>
              {s.tab ? (
                <Button variant="ghost" className="hidden shrink-0 sm:inline-flex" onClick={() => router.push("/studio")}>
                  Open tab →
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      {/* voice */}
      <Card className="p-4 sm:p-5">
        <SectionLabel>Talk to the studio</SectionLabel>
        <p className="mt-1 text-xs text-zinc-500">Tap the 🎙 button in the assistant (Chrome or Safari on the phone) and say any of these — it opens the right screen and tells you what to do next.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {VOICE_EXAMPLES.map((v) => (
            <span key={v} className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-[12px] text-zinc-300">
              {v}
            </span>
          ))}
        </div>
      </Card>

      {/* tips */}
      <Card className="p-4 sm:p-5">
        <SectionLabel>Good to know</SectionLabel>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {GUIDE_QUICK_TIPS.map((t) => (
            <div key={t.text} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-zinc-300">
              <span className="text-lg">{t.icon}</span>
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* next */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/studio/distribute" className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3.5 transition hover:border-fuchsia-500/50">
          <div>
            <div className="text-sm font-bold text-zinc-100">📤 Get it out there — free</div>
            <div className="text-xs text-zinc-500">The free sites for Spotify/Apple, mixes and labels.</div>
          </div>
          <span className="text-fuchsia-400">→</span>
        </Link>
        <Link href="/studio#improve" className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3.5 transition hover:border-fuchsia-500/50">
          <div>
            <div className="text-sm font-bold text-zinc-100">💡 Suggest an improvement</div>
            <div className="text-xs text-zinc-500">Tell the app what to add — it plans the change and shows you the status.</div>
          </div>
          <span className="text-fuchsia-400">→</span>
        </Link>
      </div>
    </div>
  );
}
