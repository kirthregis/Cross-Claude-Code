"use client";

import Link from "next/link";
import { useEffect } from "react";

const LINKS = [
  { href: "/", label: "Gigs" },
  { href: "/profile", label: "Profile" },
  { href: "/customize", label: "Studio" },
  { href: "/sources", label: "Sources" },
];

/** Sets the CSS var the whole app uses for accents, from /customize → Branding. */
export default function Nav() {
  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      document.documentElement.style.setProperty("--accent", d.settings.branding.accentColor ?? "#e11d48");
    }).catch(() => {});
  }, []);
  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-zinc-800 bg-[#0a0a0f]/90 px-4 py-2 backdrop-blur">
      <span className="mr-2 whitespace-nowrap text-xs font-bold tracking-wide text-zinc-400">GigRadar</span>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href}
          className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
