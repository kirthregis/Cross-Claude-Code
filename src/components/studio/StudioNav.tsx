"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/studio/i18n";
import { useArabic } from "./ArabicToggle";
import { NotificationBell } from "./NotificationBell";
import { ArabicToggle } from "./ArabicToggle";
import { GlobalVoiceButton } from "./GlobalVoice";

export function StudioNav() {
  const path = usePathname();
  const { arabic } = useArabic();
  const tabs = [
    { href: "/studio", label: arabic ? "الرئيسية" : "Home" },
    { href: "/studio/community", label: arabic ? "فرص" : "Gigs" },
    { href: "/studio/library", label: arabic ? "المكتبة" : "Library" },
    { href: "/studio/settings", label: arabic ? "⚙" : "⚙" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 gap-2">
        <Link href="/studio" className="flex items-center gap-2 shrink-0">
          <img src="/icon.svg" alt="EMY Studio" className="h-8 w-8 rounded-lg" />
          <span className="hidden text-base font-extrabold text-white sm:block">EMY STUDIO</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto min-w-0 py-0.5">
          {tabs.map((t) => {
            const active = path === t.href || (t.href !== "/studio" && path.startsWith(t.href));
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition whitespace-nowrap " +
                  (active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white")
                }
              >
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
