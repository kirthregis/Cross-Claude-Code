"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "./NotificationBell";
import { ArabicToggle } from "./ArabicToggle";
import { GlobalVoiceButton } from "./GlobalVoice";

export function StudioNav() {
  const path = usePathname();
  const tabs = [
    { href: "/studio", label: "Studio" },
    { href: "/studio/gigradar", label: "GigRadar" },
    { href: "/studio/analytics", label: "Analytics" },
    { href: "/studio/distribute", label: "Distribute" },
    { href: "/studio/community", label: "Community" },
    { href: "/studio/epk", label: "EPK" },
    { href: "/studio/settings", label: "Settings" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 gap-2">
        <Link href="/studio" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">E</span>
          <span className="hidden text-base font-extrabold text-white sm:block">EMY STUDIO</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto min-w-0">
          {tabs.map(t => {
            const active = t.href === "/studio" ? path === "/studio" : path.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href}
                className={"rounded-lg px-3 py-1.5 text-xs font-medium transition whitespace-nowrap " + (active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white")}>
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <GlobalVoiceButton />
          <ArabicToggle />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}