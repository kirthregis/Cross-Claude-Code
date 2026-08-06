"use client";
import { useState } from "react";
import { Card, SectionLabel, Button } from "@/components/studio/ui";
import { calculateGigNet, formatAED, type GigFinances } from "@/lib/utils/finance";
import { printInvoice } from "@/lib/utils/invoice-print";

const EMPTY: GigFinances = {
  gigName: "",
  venueName: "",
  gigDate: "",
  fee: 0,
  expenses: 0,
  includeVat: false,
};

export default function BusinessSuite() {
  const [form, setForm] = useState<GigFinances>(EMPTY);
  const result = calculateGigNet(form);

  const set = (patch: Partial<GigFinances>) => setForm(p => ({ ...p, ...patch }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">Revenue Engine</h1>
        <p className="mt-1 text-sm text-zinc-400">Invoice generator, UAE VAT calculator, and net profit tracker.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Gross Revenue</div>
          <div className="text-2xl font-black text-white">{formatAED(result.gross)}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Net Profit</div>
          <div className="text-2xl font-black text-emerald-400">{formatAED(result.net)}</div>
          <div className="text-[10px] text-zinc-600 mt-1">{result.margin}% margin</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Total Invoice</div>
          <div className="text-2xl font-black text-fuchsia-400">{formatAED(result.total + result.expenses)}</div>
          {form.includeVat && <div className="text-[10px] text-zinc-600 mt-1">incl. {formatAED(result.vat)} VAT</div>}
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <SectionLabel>Invoice Details</SectionLabel>
          <Button
            onClick={() => printInvoice(form, result)}
            disabled={!form.gigName.trim() || form.fee <= 0}
          >
            Print / Save PDF
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Gig / Event Name</span>
            <input value={form.gigName} onChange={e => set({ gigName: e.target.value })}
              placeholder="e.g. Saturday Night — White Dubai"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-fuchsia-500 focus:outline-none" />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Venue / Promoter Name</span>
            <input value={form.venueName} onChange={e => set({ venueName: e.target.value })}
              placeholder="e.g. White Dubai"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-fuchsia-500 focus:outline-none" />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Event Date</span>
            <input type="date" value={form.gigDate} onChange={e => set({ gigDate: e.target.value })}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-fuchsia-500 focus:outline-none" />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Performance Fee (AED)</span>
            <input type="number" min={0} value={form.fee || ""} onChange={e => set({ fee: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-fuchsia-500 focus:outline-none" />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Expenses — Travel / Gear (AED)</span>
            <input type="number" min={0} value={form.expenses || ""} onChange={e => set({ expenses: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-fuchsia-500 focus:outline-none" />
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5">
            <input type="checkbox" id="vat" checked={form.includeVat} onChange={e => set({ includeVat: e.target.checked })}
              className="h-4 w-4 accent-fuchsia-500" />
            <label htmlFor="vat" className="text-sm text-zinc-300 cursor-pointer">
              Add UAE VAT (5%) to invoice total
              <span className="block text-[10px] text-zinc-600">Only if your business is VAT-registered</span>
            </label>
          </div>
        </div>

        {form.fee > 0 && (
          <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-400"><span>Performance Fee</span><span>{formatAED(result.gross)}</span></div>
            {form.includeVat && <div className="flex justify-between text-zinc-400"><span>VAT (5%)</span><span>{formatAED(result.vat)}</span></div>}
            {form.expenses > 0 && <div className="flex justify-between text-zinc-400"><span>Expenses</span><span>{formatAED(result.expenses)}</span></div>}
            <div className="flex justify-between font-black text-white border-t border-zinc-800 pt-2">
              <span>Total Due from Venue</span>
              <span className="text-fuchsia-300">{formatAED(result.total + result.expenses)}</span>
            </div>
            <div className="flex justify-between text-zinc-500 text-xs">
              <span>Your Net (after expenses)</span>
              <span className="text-emerald-400">{formatAED(result.net)} ({result.margin}%)</span>
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] text-zinc-600">
          Clicking &quot;Print / Save PDF&quot; opens a print-ready invoice in a new tab. Use your browser&apos;s Print → Save as PDF to download it.
        </p>
      </Card>
    </div>
  );
}
