"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, SectionLabel } from "@/components/studio/ui";
import { useProjects, useSettings, createProject } from "@/lib/studio/store";

export default function StudioHome() {
  const router = useRouter();
  const projects = useProjects();
  const settings = useSettings();
  const [showForm, setShowForm] = useState(false);
  const makeProject = (n) => {
    const p = createProject({ name: n, kind: "mix", genre: "House", mood: "Deep" });
    router.push("/studio/p/" + p.meta.id + "?tab=master");
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/icon-192.png" className="h-10 w-10 rounded-xl shadow-lg" />
          <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">Emy Studio</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ New"}</Button>
      </div>

      {showForm && (
        <Card className="p-4"><Button onClick={() => makeProject("New Mix")}>Create Afro House Mix</Button></Card>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: "??", title: "Mastering", tab: "master" },
          { icon: "??", title: "Artwork", tab: "artwork" },
          { icon: "??", title: "Release", tab: "release" }
        ].map(f => (
          <button key={f.title} onClick={() => {
            if (projects.length === 0) setShowForm(true);
            else router.push("/studio/p/" + projects[0].meta.id + "?tab=" + f.tab);
          }} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 text-left hover:border-fuchsia-500 transition">
            <div className="text-3xl">{f.icon}</div>
            <div className="mt-2 font-bold">{f.title}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/studio/gigradar" className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900">GigRadar ?</Link>
        <Link href="/studio/settings" className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900">Settings ?</Link>
      </div>
    </div>
  );
}