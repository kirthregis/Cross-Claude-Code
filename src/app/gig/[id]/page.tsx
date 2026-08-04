"use client";

import { use, useState } from "react";
import Link from "next/link";
import useFetch from "@/lib/useFetch";
import type { Gig, PriceQuote, Contact, DealStage } from "@/lib/types";
import type { Scored } from "@/lib/score";

interface Detail {
  gig: Gig;
  scored: Scored;
  quote: PriceQuote;
  strategy: { contact?: Contact; channel: string; why: string }[];
  pitches: Record<string, { subject?: string; body: string }>;
  playbook: { objection: string; response: string }[];
}

const STAGES: DealStage[] = ["new", "pitched", "negotiating", "agreed", "contracted", "confirmed", "performed", "paid", "lost"];
const TABS = ["Price", "Contact", "Negotiate", "Paperwork"] as const;

export default function GigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, refresh } = useFetch<Detail>(`/api/gigs/${id}`);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Price");

  if (!data) return <main className="p-6 text-sm text-zinc-500">Loading…</main>;
  const { gig, scored, quote, strategy, pitches, playbook } = data;

  async function move(stage: DealStage) {
    await fetch(`/api/gigs/${id}/stage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    refresh();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Link href="/" className="text-xs text-red-500">← All gigs</Link>

      <header className="mt-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {gig.sourceName} · score {scored.score}/100
        </div>
        <h1 className="mt-1 text-xl font-bold">{gig.venueName ?? gig.title}</h1>
        <p className="text-xs text-zinc-400">
          {gig.eventDate ? new Date(gig.eventDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "Date TBC"}
          {gig.area && ` · ${gig.area}`} · {gig.venueTier.replace(/_/g, " ")}
        </p>
      </header>

      <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
        {STAGES.map((s) => (
          <button key={s} onClick={() => move(s)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium ${
              gig.stage === s ? "bg-red-600 text-white" : "bg-zinc-800/60 text-zinc-400"
            }`}>
            {s}
          </button>
        ))}
      </div>

      <nav className="mt-5 flex gap-1 rounded-lg bg-zinc-900/60 p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-2 text-xs font-medium ${tab === t ? "bg-zinc-700 text-white" : "text-zinc-400"}`}>
            {t}
          </button>
        ))}
      </nav>

      <ShareLink id={id} />

      <div className="mt-4">
        {tab === "Price" && <PriceTab quote={quote} gig={gig} scored={scored} />}
        {tab === "Contact" && <ContactTab strategy={strategy} pitches={pitches} />}
        {tab === "Negotiate" && <NegotiateTab playbook={playbook} />}
        {tab === "Paperwork" && <PaperworkTab id={id} defaultFee={quote.targetAed} />}
      </div>
    </main>
  );
}

/** One-tap copy of the client-facing booking link for this gig. */
function ShareLink({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${typeof location !== "undefined" ? location.origin : ""}/book/${id}`;
  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
      <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-500">{url}</span>
      <button
        onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="shrink-0 rounded bg-red-600 px-3 py-1.5 text-[11px] font-medium">
        {copied ? "Copied ✓" : "Copy booking link"}
      </button>
    </div>
  );
}

function PriceTab({ quote, gig, scored }: { quote: PriceQuote; gig: Gig; scored: Scored }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Open at", v: quote.askAed, c: "text-emerald-400" },
          { label: "Target", v: quote.targetAed, c: "text-red-400" },
          { label: "Never below", v: quote.walkAwayAed, c: "text-rose-400" },
        ].map((x) => (
          <div key={x.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">{x.label}</div>
            <div className={`mt-1 text-lg font-bold ${x.c}`}>{x.v.toLocaleString()}</div>
            <div className="text-[10px] text-zinc-600">AED</div>
          </div>
        ))}
      </div>

      {gig.budgetStatedAed && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm">
          They stated <strong className="text-white">AED {gig.budgetStatedAed.toLocaleString()}</strong>
        </div>
      )}

      <Block title="What to do">
        <ul className="space-y-2 text-xs text-zinc-300">
          {quote.rationale.map((r, i) => <li key={i} className="flex gap-2"><span className="text-red-500">▸</span>{r}</li>)}
        </ul>
      </Block>

      <Block title={`How this price was built (confidence: ${quote.confidence})`}>
        <table className="w-full text-xs">
          <tbody>
            {quote.breakdown.map((b, i) => (
              <tr key={i} className="border-b border-zinc-800/60 last:border-0">
                <td className="py-1.5 text-zinc-400">{b.label}</td>
                <td className="py-1.5 text-right font-mono text-zinc-200">{b.effect}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Block>

      <Block title="Why this scored " >
        <ul className="space-y-1 text-xs text-zinc-400">
          {scored.reasons.map((r, i) => <li key={i}>· {r}</li>)}
        </ul>
      </Block>

      <Block title="Original post">
        <p className="whitespace-pre-wrap text-xs text-zinc-400">{gig.body}</p>
        {gig.sourceUrl && <a href={gig.sourceUrl} className="mt-2 inline-block text-xs text-red-500 underline">Open source</a>}
      </Block>
    </div>
  );
}

function ContactTab({ strategy, pitches }: { strategy: Detail["strategy"]; pitches: Detail["pitches"] }) {
  const [ch, setCh] = useState<keyof Detail["pitches"]>("whatsapp");
  const [copied, setCopied] = useState(false);
  const p = pitches[ch];

  return (
    <div className="space-y-4">
      <Block title="Who to contact, in order">
        <ol className="space-y-3">
          {strategy.map((s, i) => (
            <li key={i} className="rounded-lg bg-zinc-950/60 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {s.contact
                    ? [s.contact.name, s.contact.company, s.contact.phone ?? s.contact.email ?? s.contact.instagram].filter(Boolean).join(" · ")
                    : "No contact found"}
                </span>
                {s.contact && (
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                    power {s.contact.decisionPower}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-400">{s.why}</p>
              <div className="mt-2 flex gap-2">
                {s.contact?.whatsapp && (
                  <a href={`https://wa.me/${s.contact.whatsapp.replace(/\D/g, "")}`}
                     className="rounded bg-emerald-600/80 px-3 py-1 text-xs font-medium">WhatsApp</a>
                )}
                {s.contact?.email && (
                  <a href={`mailto:${s.contact.email}`} className="rounded bg-zinc-700 px-3 py-1 text-xs">Email</a>
                )}
                {s.contact?.instagram && (
                  <a href={`https://instagram.com/${s.contact.instagram.replace("@", "")}`}
                     className="rounded bg-zinc-700 px-3 py-1 text-xs">Instagram</a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Block>

      <Block title="Ready-to-send pitch">
        <div className="mb-2 flex gap-1">
          {(["whatsapp", "instagram_dm", "email"] as const).map((c) => (
            <button key={c} onClick={() => setCh(c)}
              className={`rounded px-2.5 py-1 text-[11px] ${ch === c ? "bg-red-600" : "bg-zinc-800 text-zinc-400"}`}>
              {c.replace("_", " ")}
            </button>
          ))}
        </div>
        {p.subject && <div className="mb-2 text-xs text-zinc-400">Subject: <span className="text-white">{p.subject}</span></div>}
        <pre className="whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-200">{p.body}</pre>
        <button
          onClick={() => { navigator.clipboard.writeText(p.body); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium">
          {copied ? "Copied ✓" : "Copy message"}
        </button>
      </Block>
    </div>
  );
}

function NegotiateTab({ playbook }: { playbook: Detail["playbook"] }) {
  return (
    <div className="space-y-2">
      <p className="mb-3 text-xs text-zinc-500">
        The objections that actually come up, and exactly what to say back.
      </p>
      {playbook.map((c, i) => (
        <details key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-white">&ldquo;{c.objection}&rdquo;</summary>
          <p className="mt-2 text-xs leading-relaxed text-zinc-300">{c.response}</p>
        </details>
      ))}
    </div>
  );
}

function PaperworkTab({ id, defaultFee }: { id: string; defaultFee: number }) {
  const [fee, setFee] = useState(defaultFee);
  const [doc, setDoc] = useState<keyof typeof LABELS>("contract");
  const { data } = useFetch<{ contract: string; runsheet: string; invoice: string; pressPack: string }>(
    `/api/gigs/${id}/pack?fee=${fee}`
  );

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <label className="text-[11px] uppercase tracking-wide text-zinc-500">Agreed fee (AED)</label>
        <input type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))}
          className="mt-1 w-full rounded bg-zinc-950 p-2 text-sm outline-none" />
        <p className="mt-1 text-[11px] text-zinc-600">Every document below updates from this number.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((k) => (
          <button key={k} onClick={() => setDoc(k)}
            className={`whitespace-nowrap rounded px-2.5 py-1 text-[11px] ${doc === k ? "bg-red-600" : "bg-zinc-800 text-zinc-400"}`}>
            {LABELS[k]}
          </button>
        ))}
      </div>

      {data && (
        <>
          <div className="prose-doc max-h-[60vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <Markdown text={data[doc]} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(data[doc])}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium">Copy Markdown</button>
            <button onClick={() => window.print()}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-xs">Print / Save PDF</button>
          </div>
        </>
      )}
    </div>
  );
}

const LABELS = { contract: "Contract", runsheet: "Runsheet", invoice: "Invoice", pressPack: "Press & IP" } as const;

/** Minimal Markdown renderer — enough for our generated documents. */
function Markdown({ text }: { text: string }) {
  const html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^---$/gm, "<hr/>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^\| (.*) \|$/gm, (_m, row: string) => {
      const cells = row.split(" | ");
      if (cells.every((c) => /^-+$/.test(c.trim()))) return "";
      return `<tr>${cells.map((c) => `<td>${c.trim()}</td>`).join("")}</tr>`;
    })
    .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, (m) => `<table><tbody>${m}</tbody></table>`)
    .replace(/^[-*] (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^(?!<[hutl])(.+)$/gm, "<p>$1</p>");
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</h3>
      {children}
    </section>
  );
}
