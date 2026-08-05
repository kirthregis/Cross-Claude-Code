"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import useFetch from "@/lib/useFetch";
import type { Gig } from "@/lib/types";

interface Detail {
  gig: Gig;
  quote: { fee: number; currency: string; note: string };
  pitches: { whatsapp: string; email: string };
  playbook: { openingOffer: number; minimumAcceptable: number; tips: string[] };
}

export default function GigDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useFetch<Detail>(`/api/gigs/${id}`);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-red-400">Gig not found.</p>
          <Link href="/studio/gigradar" className="mt-4 text-blue-400 underline">
            Back to GigRadar
          </Link>
        </div>
      </div>
    );
  }

  const { gig, quote, pitches, playbook } = data;

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/studio/gigradar"
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← Back to GigRadar
        </Link>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-xs uppercase text-blue-500">{gig.sourceKind}</p>
          <h1 className="mt-1 text-2xl font-black">{gig.title}</h1>
          <p className="mt-2 text-sm text-zinc-400">{gig.body}</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-3 font-bold">💰 Quote</h2>
          <p className="text-3xl font-black text-green-400">
            {quote.fee} {quote.currency}
          </p>
          <p className="text-sm text-zinc-500">{quote.note}</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-3 font-bold">📋 Negotiation Playbook</h2>
          <p className="text-sm text-zinc-400">
            Opening offer: {playbook.openingOffer} AED
          </p>
          <p className="text-sm text-zinc-400">
            Minimum: {playbook.minimumAcceptable} AED
          </p>
          <ul className="mt-3 space-y-1">
            {playbook.tips.map((tip, i) => (
              <li key={i} className="text-sm text-zinc-300">
                • {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-3 font-bold">📤 Pitch</h2>
          <a
            href={pitches.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-bold hover:bg-green-500"
          >
            Send WhatsApp Pitch
          </a>
          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-zinc-800 p-4 text-xs text-zinc-300">
            {pitches.email}
          </pre>
        </div>
      </div>
    </div>
  );
}