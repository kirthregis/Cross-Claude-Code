"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StudioNav() {
  const path = usePathname();
  const tabs = [
    { href: "/studio", label: "Studio" },
    { href: "/studio/guide", label: "How to" },
    { href: "/studio/distribute", label: "Distribute" },
    { href: "/studio/settings", label: "Settings" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#0a0a0f]/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/studio" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-600 to-amber-500 text-sm font-black text-white">E</span>
          <span className="bg-gradient-to-r from-fuchsia-400 to-amber-300 bg-clip-text text-base font-extrabold tracking-tight text-transparent">
            EMY STUDIO
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {tabs.map((t) => {
            const active = t.href === "/studio" ? path === "/studio" || path.startsWith("/studio/p") : path === t.href || path.startsWith(t.href + "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="ml-1 hidden rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-200 sm:block"
            title="Back to GigRadar (gigs & bookings)"
          >
            Gigs →
          </Link>
        </nav>
      </div>
    </header>
  );
}
