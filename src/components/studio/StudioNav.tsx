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
    { href: "/studio", label: t("studio", arabic) },
    { href: "/studio/library", label: t("library", arabic) },
    { href: "/studio/epk", label: t("epk", arabic) },
    { href: "/studio/gigradar", label: t("gigradar", arabic) },
    { href: "/studio/planner", label: t("planner", arabic) },
    { href: "/studio/analytics", label: t("analytics", arabic) },
    { href: "/studio/distribute", label: t("distribute", arabic) },
    { href: "/studio/community", label: t("community", arabic) },
    { href: "/studio/settings", label: t("settings", arabic) },
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
