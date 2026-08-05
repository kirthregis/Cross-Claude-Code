"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "./NotificationBell";
import { ArabicToggle } from "./ArabicToggle";

export function StudioNav() {
  const path = usePathname();

  const tabs = [
    { href: "/studio", label: "Studio" },
    { href: "/studio/gigradar", label: "🎯 GigRadar" },
    { href: "/studio/admin", label: "💎 Admin" },
    { href: "/studio/library", label: "Library" },
    { href: "/studio/epk", label: "EPK" },
    { href: "/studio/guide", label: "How to" },
    { href: "/studio/distribute", label: "Distribute" },
    { href: "/studio/settings", label: "Settings" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#0a0a0f]/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link href="/studio" className="flex 