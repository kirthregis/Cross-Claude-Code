"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StudioNav() {
  const path = usePathname();
  const tabs = [
    { href: "/studio", label: "Studio" },
    { href: "/studio/library", label: "Library" },
    { href: "/studio/guide", label: "How to" },
    { href: "/studio/distribute", label: "Distribute" },
    { href: "/studio/settings", label: "Settings" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#0a0a0f]/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link href="/studio" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-600 to-amber-500 text-sm font-black text-white">E</span>
          <span className="hidden bg-gradient-to-r from-fuchsia-400 to-amber-300 bg-clip-text text-base font-extrabold tracking-tight text-transparent sm:block">
            EMY STUDIO
          </span>
        </Link>
        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
          {tabs.map((t) => {
            const active = t.href === "/studio" ? path === "/studio" || path.startsWith("/studio/p") : path === t.href || path.startsWith(t.href + "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition sm:px-3 ${
                  active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="ml-1 shrink-0 rounded-lg bg-zinc-800/80 px-2.5 py-1.5 text-[13px] font-semibold text-zinc-200 transition hover:bg-zinc-700"
            title="GigRadar — find, price, pitch and contract gigs"
          >
            💼 Gigs
          </Link>
        </nav>
      </div>
    </header>
  );
}
