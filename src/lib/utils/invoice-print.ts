"use client";

import type { GigFinances, GigFinancesResult } from "@/lib/utils/finance";
import { formatAED } from "@/lib/utils/finance";

export function printInvoice(fin: GigFinances, result: GigFinancesResult): void {
  const invoiceNumber = "INV-" + Date.now().toString().slice(-6);
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111; background: #fff; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .brand { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
    .brand span { color: #7c3aed; }
    .meta { text-align: right; font-size: 12px; color: #555; }
    .meta h2 { font-size: 20px; color: #111; margin-bottom: 4px; }
    .from-to { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .from-to h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
    .from-to p { font-size: 13px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #0a0a0f; color: #fff; padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    td { padding: 12px 14px; border-bottom: 1px solid #eee; font-size: 13px; }
    .amount { text-align: right; }
    .totals { margin-left: auto; width: 280px; }
    .totals tr td { border: none; padding: 6px 14px; }
    .totals .grand { font-weight: 900; font-size: 16px; border-top: 2px solid #111; padding-top: 10px; }
    .bank { margin-top: 32px; padding: 16px; background: #f8f8f8; border-radius: 8px; font-size: 12px; }
    .bank h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
    .bank p { line-height: 1.8; color: #333; }
    .footer { margin-top: 32px; font-size: 11px; color: #aaa; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">EMY<span>.</span></div>
      <p style="font-size:12px;color:#555;margin-top:4px;">Emy Vision Group FZC</p>
      <p style="font-size:11px;color:#888;">Trade Licence: 4427087.01</p>
      <p style="font-size:11px;color:#888;">Sharjah Publishing City Free Zone, UAE</p>
    </div>
    <div class="meta">
      <h2>INVOICE</h2>
      <p><strong>${invoiceNumber}</strong></p>
      <p>Date: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
      <p>Due: On receipt</p>
    </div>
  </div>

  <div class="from-to">
    <div>
      <h3>From</h3>
      <p><strong>Emy Vision Group FZC</strong><br/>
      DJ Emy — Imen Mannai<br/>
      admin@emyvisiongroup.com<br/>
      +971 50 344 3281</p>
    </div>
    <div>
      <h3>Bill To</h3>
      <p><strong>${fin.venueName || "Venue / Promoter"}</strong><br/>
      Event: ${fin.gigName || "DJ Performance"}<br/>
      Date: ${fin.gigDate || "TBC"}</p>
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th>Details</th><th class="amount">Amount</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>DJ Performance</strong><br/><span style="font-size:11px;color:#666;">${fin.gigName}</span></td>
        <td>${fin.gigDate}</td>
        <td class="amount">${formatAED(result.gross)}</td>
      </tr>
      ${fin.expenses > 0 ? `<tr><td>Expenses (Travel / Accommodation)</td><td></td><td class="amount">${formatAED(fin.expenses)}</td></tr>` : ""}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td class="amount">${formatAED(result.gross)}</td></tr>
    ${fin.includeVat ? `<tr><td>VAT (5% UAE)</td><td class="amount">${formatAED(result.vat)}</td></tr>` : ""}
    ${fin.expenses > 0 ? `<tr><td>Expenses</td><td class="amount">${formatAED(result.expenses)}</td></tr>` : ""}
    <tr class="grand"><td><strong>TOTAL DUE</strong></td><td class="amount"><strong>${formatAED(result.total + result.expenses)}</strong></td></tr>
  </table>

  <div class="bank">
    <h3>Payment Details</h3>
    <p>
      Account Name: <strong>EMY VISION GROUP FZC</strong><br/>
      Bank: Mashreqbank PSC (Mashreq NEO BIZ)<br/>
      IBAN (AED): AE060330000019102008190<br/>
      SWIFT: BOMLAEAD<br/>
      <em>Other currencies (GBP / USD / EUR) available on request.</em>
    </p>
  </div>

  <div class="footer">
    <p>Payment due on receipt. Issued by Emy Vision Group FZC — emyvisiongroup.com</p>
    <p style="margin-top:4px;">For queries: admin@emyvisiongroup.com · +971 50 344 3281</p>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
}
