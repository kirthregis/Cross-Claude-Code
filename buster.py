# -*- coding: utf-8 -*-
import os, subprocess

def write(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

# 1. THE CACHE BUSTER - Force browser to refresh immediately on load
write("src/components/PwaRegister.tsx", '''"use client";
import { useEffect } from "react";
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for (let reg of regs) { reg.unregister(); }
      });
      navigator.serviceWorker.register("/sw.js?v=final");
    }
    // Self-healing: Clear any stuck re-render loops in storage
    const lastVersion = localStorage.getItem("emy-version");
    if (lastVersion !== "1.0.5") {
      localStorage.clear(); 
      localStorage.setItem("emy-version", "1.0.5");
      window.location.reload();
    }
  }, []);
  return null;
}
''')

# 2. THE BRANDED HOME - Fixed Nav + Logo
write("src/app/studio/page.tsx", '''"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, SectionLabel } from "@/components/studio/ui";
import { useProjects, createProject } from "@/lib/studio/store";

export default function StudioHome() {
  const router = useRouter();
  const projects = useProjects();
  const [name, setName] = useState("");

  const make = () => {
    const p = createProject({ name: name || "New Mix", kind: "mix", genre: "Afro House", mood: "Deep" });
    router.push("/studio/p/" + p.meta.id + "?tab=master");
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/icon-192.png" alt="logo" className="h-10 w-10 rounded-xl shadow-lg" />
          <h1 className="brand-text-grad text-3xl font-black tracking-tight">Emy Studio</h1>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: "??", title: "Mastering", tab: "master" },
          { icon: "??", title: "Artwork", tab: "artwork" },
          { icon: "??", title: "Release", tab: "release" }
        ].map(f => (
          <button key={f.title} onClick={() => {
            if (projects.length > 0) router.push("/studio/p/" + projects[0].meta.id + "?tab=" + f.tab);
            else make();
          }} className="p-8 rounded-3xl border border-zinc-800 bg-zinc-900/40 text-left hover:border-fuchsia-500 transition-all active:scale-95">
            <div className="text-4xl mb-2">{f.icon}</div>
            <div className="font-bold text-zinc-100">{f.title}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/studio/gigradar" className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900 font-bold text-center hover:bg-zinc-800 transition">?? GigRadar</Link>
        <Link href="/studio/settings" className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900 font-bold text-center hover:bg-zinc-800 transition">?? Settings</Link>
      </div>
    </div>
  );
}
''')

subprocess.run(["git", "add", "-A"], check=True)
subprocess.run(["git", "commit", "-m", "Phase 13: Auto-Refresh Cache Buster + Fixed Branded Nav"], check=True)
subprocess.run(["git", "push", "origin", "main"], check=True)
print("ALIGNED AND PUSHED")
