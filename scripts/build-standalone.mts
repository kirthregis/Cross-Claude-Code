/**
 * Builds the booking tool as ONE self-contained HTML file.
 *
 * Two editions, same engine:
 *   EVG      -> docs/index.html        "EVG DJ Booking Tool"      (company)
 *   PERSONAL -> docs/emy/index.html    "DJ Emy Booking Tool"      (artist)
 *
 * No server, no install, no account. Opens from a link, installs to a phone
 * home screen, works with no signal.
 */
import { mkdirSync, writeFileSync, readFileSync } from "fs";
import { DJ_EMY } from "../src/lib/artist";

const P = DJ_EMY;

const TIERS = [
  ["brand_activation", "Brand / corporate", 15000],
  ["festival", "Festival / main stage", 13000],
  ["private_event", "Private / VIP / yacht", 10000],
  ["superclub", "Nightclub", 8000],
  ["beach_club", "Beach club / pool", 7000],
  ["hotel_lounge", "Hotel / rooftop lounge", 5000],
  ["bar_restaurant", "Bar / restaurant", 3000],
] as const;

interface Edition {
  id: string;
  title: string;        // shown in the header + app name
  shortName: string;
  outDir: string;
  /** Who the pitch is written from. */
  senderName: string;
  senderLine: string;   // signature block under the pitch
  phone: string;
  email: string;
  instagram: string;
  website?: string;
  /** Company card rows. */
  company: [string, string][];
  /** Settlement details for the invoice/bank card. */
  bank: { accountName: string; bankName: string; bankAddress?: string;
          accountNo?: string; iban: string; swift: string;
          alternates?: { currency: string; iban: string }[] };
  /** Extra rows on the artist card. */
  showArtistLegalName: boolean;
  /** Optional background image filename sitting next to index.html. */
  backdrop?: string;
  /** Artist's own contact, shown alongside the company's. */
  artist?: { name: string; phone: string; email: string; instagram: string };
}

const EVG: Edition = {
  id: "evg",
  title: "EVG DJ Booking Tool",
  shortName: "EVG Booking",
  outDir: "docs",
  senderName: "Emy Vision Group",
  senderLine: "Emy Vision Group",
  // Company number is Imen's line, as instructed.
  phone: "+971 50 344 3281",
  email: "admin@emyvisiongroup.com",
  instagram: "@evgroup2026",
  website: "https://emyvisiongroup.com",
  company: [
    ["Legal name", "Emy Vision Group FZC"],
    ["Licence no.", "4427087.01"],
    ["Formation no.", "4427087"],
    ["Type", "Free Zone Company"],
    ["Manager", "Imen Mannai"],
    ["Licence expiry", "06/01/2027"],
    ["Address", "Business Centre, Sharjah Publishing City Free Zone, Sharjah, UAE"],
  ],
  bank: {
    accountName: "EMY VISION GROUP FZC",
    bankName: "Mashreqbank PSC (Mashreq NEO BIZ)",
    accountNo: "019102008190",
    iban: "AE060330000019102008190",
    swift: "BOMLAEAD",
    alternates: [
      { currency: "GBP", iban: "AE760330000019102008191" },
      { currency: "USD", iban: "AE490330000019102008192" },
      { currency: "EUR", iban: "AE220330000019102008193" },
    ],
  },
  showArtistLegalName: false,
};

const PERSONAL: Edition = {
  id: "emy",
  title: "DJ Emy Booking Tool",
  shortName: "DJ Emy",
  outDir: "docs/emy",
  senderName: "DJ Emy",
  senderLine: "DJ Emy",
  phone: "+971 50 344 3281",
  email: "mannaiiman1@gmail.com",
  instagram: "@dj_emy_",
  website: "https://youtube.com/@DJEMY-o6d",
  company: [
    ["Represented by", "Emy Vision Group FZC"],
    ["Licence no.", "4427087.01"],
    ["Company contact", "admin@emyvisiongroup.com"],
    ["Based", "Dubai, UAE"],
  ],
  // Payments ALWAYS settle to the company, even on the artist's own tool —
  // that is what keeps one accountable contracted party on every booking.
  bank: {
    accountName: "EMY VISION GROUP FZC",
    bankName: "Mashreqbank PSC (Mashreq NEO BIZ)",
    accountNo: "019102008190",
    iban: "AE060330000019102008190",
    swift: "BOMLAEAD",
    alternates: [
      { currency: "GBP", iban: "AE760330000019102008191" },
      { currency: "USD", iban: "AE490330000019102008192" },
      { currency: "EUR", iban: "AE220330000019102008193" },
    ],
  },
  showArtistLegalName: true,
  backdrop: "bg.jpg",
  artist: {
    name: "DJ Emy",
    phone: "+971 50 344 3281",
    email: "mannaiiman1@gmail.com",
    instagram: "@dj_emy_",
  },
};

/** PUBLIC=1 strips settlement details entirely (see public/README.md). */
const PUBLIC = process.env.PUBLIC === "1";

function build(E: Edition) {
const B = E.bank;
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${E.title}</title>
<meta name="theme-color" content="#0a0a0f">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${E.shortName}">
<link rel="manifest" href="data:application/json;base64,${Buffer.from(JSON.stringify({
  name: E.title, short_name: E.shortName, start_url: "./index.html",
  display: "standalone", background_color: "#0a0a0f", theme_color: "#0a0a0f",
  icons: [{ src: "data:image/svg+xml;base64," + Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#0a0a0f"/><circle cx="256" cy="256" r="150" fill="none" stroke="#dc2626" stroke-width="14" opacity=".3"/><circle cx="256" cy="256" r="100" fill="none" stroke="#dc2626" stroke-width="14" opacity=".55"/><circle cx="256" cy="256" r="50" fill="none" stroke="#ef4444" stroke-width="14"/><circle cx="256" cy="256" r="18" fill="#f87171"/><circle cx="352" cy="168" r="26" fill="#dc2626"/></svg>`
  ).toString("base64"), sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
})).toString("base64")}">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:#0a0a0f;color:#e4e4e7;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
 padding:env(safe-area-inset-top) 0 calc(76px + env(safe-area-inset-bottom))}
${E.backdrop ? `body::before{content:"";position:fixed;inset:0;z-index:-2;
 background:url("${E.backdrop}") center/cover no-repeat;opacity:.55}
body::after{content:"";position:fixed;inset:0;z-index:-1;
 background:linear-gradient(180deg,rgba(10,10,15,.72) 0%,rgba(10,10,15,.88) 45%,rgba(10,10,15,.96) 100%)}
.card{background:rgba(24,24,27,.82)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
nav{background:rgba(17,17,20,.94)!important;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
h1{text-shadow:0 2px 18px rgba(0,0,0,.85)}` : ""}
.wrap{max-width:640px;margin:0 auto;padding:16px}
h1{font-size:22px;margin:0;letter-spacing:-.4px}h1 span{color:#ef4444}
.sub{font-size:12px;color:#71717a;margin-top:2px}
.card{background:#18181b;border:1px solid #27272a;border-radius:14px;padding:16px;margin-bottom:12px}
label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:#71717a;margin:12px 0 5px}
select,input,textarea{width:100%;background:#0a0a0f;border:1px solid #3f3f46;color:#fff;
 border-radius:10px;padding:13px;font-size:16px;font-family:inherit}
textarea{min-height:90px;resize:vertical}
.row{display:flex;gap:10px}.row>*{flex:1}
.chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:6px}
.chip{background:#27272a;border:1px solid #3f3f46;color:#a1a1aa;border-radius:20px;
 padding:8px 13px;font-size:13px;cursor:pointer;user-select:none}
.chip.on{background:#dc2626;border-color:#dc2626;color:#fff;font-weight:600}
.price{display:flex;gap:8px;text-align:center;margin:16px 0 4px}
.price>div{flex:1;background:#0a0a0f;border:1px solid #27272a;border-radius:12px;padding:12px 6px}
.price b{display:block;font-size:21px;margin-top:3px;letter-spacing:-.5px}
.price small{font-size:9.5px;text-transform:uppercase;letter-spacing:.6px;color:#71717a}
.ask b{color:#34d399}.tgt b{color:#a5b4fc}.flr b{color:#f87171}
.why{font-size:12px;color:#a1a1aa;margin-top:10px}
.why div{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #27272a}
.why div:last-child{border:0}
.btn{display:block;width:100%;background:#dc2626;color:#fff;border:0;border-radius:11px;
 padding:15px;font-size:15px;font-weight:600;cursor:pointer;margin-top:10px;text-align:center;text-decoration:none;font-family:inherit}
.btn.alt{background:#27272a;color:#e4e4e7}
.btn.wa{background:#25D366;color:#062b16}
pre{background:#0a0a0f;border:1px solid #27272a;border-radius:11px;padding:14px;
 font:13px/1.65 ui-monospace,Menlo,monospace;white-space:pre-wrap;word-break:break-word;margin:10px 0 0}
nav{position:fixed;left:0;right:0;bottom:0;display:flex;background:#111114;
 border-top:1px solid #27272a;padding-bottom:env(safe-area-inset-bottom);z-index:9}
nav button{flex:1;background:0;border:0;color:#71717a;padding:11px 2px 13px;font-size:10.5px;cursor:pointer;font-family:inherit}
nav button.on{color:#ef4444}nav button i{display:block;font-size:19px;font-style:normal;margin-bottom:3px}
.hide{display:none}
h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#71717a;margin:0 0 10px}
table{width:100%;border-collapse:collapse;font-size:13.5px}
th,td{text-align:left;padding:9px 6px;border-bottom:1px solid #27272a}
th{font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#71717a}
td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.g{color:#34d399}.r{color:#f87171}.m{color:#a1a1aa}
details{border:1px solid #27272a;border-radius:11px;padding:13px;margin-bottom:8px;background:#18181b}
summary{cursor:pointer;font-weight:600;font-size:14px}
details p{color:#a1a1aa;font-size:13.5px;margin:10px 0 0}
.kv{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #27272a;font-size:13.5px}
.kv:last-child{border:0}.kv span:first-child{color:#71717a}
.kv span:last-child{text-align:right;font-variant-numeric:tabular-nums;word-break:break-all}
.note{font-size:11.5px;color:#71717a;margin-top:10px;line-height:1.55}
.warn{background:#78350f22;border:1px solid #b4530933;color:#fbbf24;border-radius:10px;padding:11px;font-size:12px;margin-top:10px}
.copied{background:#065f46!important}
.src{display:flex;gap:6px;margin-top:6px}
.src div{flex:1;text-align:center;background:#27272a;border:1px solid #3f3f46;color:#a1a1aa;
 border-radius:9px;padding:10px 4px;font-size:12px;cursor:pointer}
.src div.on{background:#dc2626;border-color:#dc2626;color:#fff;font-weight:600}
.found{background:#052e1a;border:1px solid #10b98144;border-radius:10px;padding:11px;font-size:12.5px;color:#6ee7b7;margin-top:10px}
.found b{color:#a7f3d0}
.hint{font-size:11.5px;color:#71717a;margin-top:8px;line-height:1.5}
</style>
</head>
<body>
<div class="wrap">
  <header style="margin-bottom:14px">
    <h1>${E.id === "evg" ? 'EVG <span>DJ</span> Booking Tool' : 'DJ <span>Emy</span> Booking Tool'}</h1>
    <div class="sub">${E.senderLine} · ${E.phone}</div>
  </header>

  <!-- ============ NEW GIG ============ -->
  <section id="p-gig">
    <div class="card">
      <h2>Paste the gig — it fills itself in</h2>
      <div class="hint">Copy the whole message or advert exactly as it arrived. Venue, date, hours, budget and the contact are read out automatically.</div>
      <textarea id="ad" placeholder="e.g. Need an Afro House DJ this Saturday at Cove Beach, Dubai Marina. 2 hour peak slot, AED 6,500. WhatsApp +971 50 442 1188 — Karim"></textarea>

      <label>How did it arrive?</label>
      <div class="src">
        <div class="on" data-src="whatsapp">WhatsApp</div>
        <div data-src="instagram">Instagram</div>
        <div data-src="email">Email</div>
      </div>

      <button class="btn" onclick="readAd()">Read it</button>
      <div id="found" class="found hide"></div>
    </div>

    <div class="card" id="gigOut">
      <h2>Your reply</h2>
      <div class="hint">Change anything you like — especially the price — then send.</div>
      <div class="row">
        <div><label>Fee (AED)</label><input id="gFee" type="number" inputmode="numeric"></div>
        <div><label>Their name</label><input id="gWho" placeholder="optional"></div>
      </div>
      <div class="row">
        <div><label>Venue</label><input id="gVenue" placeholder="optional"></div>
        <div><label>Date</label><input id="gDate" placeholder="optional"></div>
      </div>
      <label id="gSubjL">Subject</label>
      <input id="gSubj">
      <pre id="gMsg"></pre>
      <a class="btn wa" id="gSend" href="#" target="_blank" rel="noopener">Send</a>
      <button class="btn alt" onclick="copyMsg(this)">Copy instead</button>
      <div id="gWarn" class="warn hide"></div>
    </div>

    <div class="card">
      <h2>Gig alerts</h2>
      <div class="hint" id="alertHint">Get a ping on this phone the moment a new gig is worth chasing.</div>
      <button class="btn alt" id="alertBtn" onclick="toggleAlerts()">Turn on alerts</button>
      <div id="alertState" class="hint"></div>
    </div>
  </section>

  <!-- ============ PRICE ============ -->
  <section id="p-price" class="hide">
    <div class="card">
      <label>What kind of booking?</label>
      <select id="tier">
        ${TIERS.map(([k, label, v]) => `<option value="${v}" data-k="${k}">${label}</option>`).join("\n        ")}
      </select>

      <div class="row">
        <div><label>Set length</label>
          <select id="hrs"><option value="1">1 hour</option><option value="1.5">1.5 h</option>
          <option value="2" selected>2 hours</option><option value="3">3 hours</option>
          <option value="4">4 hours</option><option value="5">5 hours</option></select></div>
        <div><label>Slot</label>
          <select id="slot"><option value="1">Peak time</option><option value="0.7">Warm-up</option>
          <option value="0.9">Closing</option><option value="1.3">All night</option></select></div>
      </div>

      <label>Which night?</label>
      <select id="night"><option value="1.25">Friday or Saturday</option><option value="1.1">Thursday</option>
        <option value="1.05">Tuesday (ladies')</option><option value="0.95">Sunday</option>
        <option value="0.85">Mon / Tue / Wed</option></select>

      <label>Time of year</label>
      <select id="season"><option value="1.35">December / NYE</option><option value="1.2">Feb – Apr</option>
        <option value="1.15">Oct – Nov</option><option value="1">May</option>
        <option value="0.8">Jun – Sep (summer)</option><option value="0.55">Ramadan</option></select>

      <label>Anything else?</label>
      <div class="chips">
        <div class="chip" data-m="1.25" id="c-rush">Within 3 days</div>
        <div class="chip" data-m="1.3" id="c-excl">Wants exclusivity</div>
        <div class="chip" data-m="1.2" id="c-trav">Outside UAE/Qatar</div>
        <div class="chip" data-m="0.85" id="c-res">Residency</div>
      </div>

      <label>Did they say a budget? (optional)</label>
      <input id="budget" type="number" inputmode="numeric" placeholder="e.g. 9000">

      <div class="price">
        <div class="ask"><small>Ask</small><b id="ask">—</b></div>
        <div class="tgt"><small>Target</small><b id="tgt">—</b></div>
        <div class="flr"><small>Never below</small><b id="flr">—</b></div>
      </div>
      <div class="why" id="why"></div>
      <div id="advice" class="warn hide"></div>
    </div>

    <div class="card">
      <h2>Pitch — ready to send</h2>
      <label>Their name (optional)</label>
      <input id="who" placeholder="e.g. Karim">
      <label>Venue / event (optional)</label>
      <input id="venue" placeholder="e.g. Cove Beach">
      <label>Date (optional)</label>
      <input id="date" placeholder="e.g. Saturday 14 September">
      <pre id="pitch"></pre>
      <button class="btn" onclick="copyPitch(this)">Copy pitch</button>
      <a class="btn wa" id="waLink" href="#" target="_blank" rel="noopener">Send on WhatsApp</a>
    </div>
  </section>

  <!-- ============ RATES ============ -->
  <section id="p-rates" class="hide">
    <div class="card">
      <h2>Rate card — 2-hour peak set</h2>
      <table><thead><tr><th>Booking type</th><th class="n">Ask</th><th class="n">Target</th><th class="n">Floor</th></tr></thead>
      <tbody>${TIERS.map(([, label, v]) => {
        const t = Math.round(v / 50) * 50, a = Math.round(t * 1.25 / 50) * 50, f = Math.max(Math.round(t * 0.72 / 50) * 50, P.hardFloorAed);
        return `<tr><td>${label}</td><td class="n g">${a.toLocaleString()}</td><td class="n">${t.toLocaleString()}</td><td class="n r">${f.toLocaleString()}</td></tr>`;
      }).join("")}</tbody></table>
      <div class="note">All figures AED. Quote the <b>Ask</b>. Expect to land near <b>Target</b>.
      Never sign below the <b>Floor</b>. Absolute minimum any booking: <b>AED ${P.hardFloorAed.toLocaleString()}</b>.</div>
    </div>
    <div class="card">
      <h2>Adjustments</h2>
      <table><tbody>
        <tr><td>Friday / Saturday</td><td class="n g">+25%</td></tr>
        <tr><td>Thursday</td><td class="n g">+10%</td></tr>
        <tr><td>Weeknight</td><td class="n r">−15%</td></tr>
        <tr><td>December / NYE</td><td class="n g">+35%</td></tr>
        <tr><td>Feb – Apr</td><td class="n g">+20%</td></tr>
        <tr><td>Jun – Sep (summer)</td><td class="n r">−20%</td></tr>
        <tr><td>Ramadan</td><td class="n r">−45%</td></tr>
        <tr><td><b>Booked within 3 days</b></td><td class="n g"><b>+25%</b></td></tr>
        <tr><td>Each hour beyond 2h</td><td class="n g">+35%</td></tr>
        <tr><td>Warm-up slot</td><td class="n r">−30%</td></tr>
        <tr><td><b>Exclusivity clause</b></td><td class="n g"><b>+30%</b></td></tr>
        <tr><td>Outside UAE / Qatar</td><td class="n g">+20%</td></tr>
        <tr><td>Residency</td><td class="n r">−15%</td></tr>
      </tbody></table>
      <div class="note">Doha and Abu Dhabi are home markets — <b>no</b> travel premium.
      Residency: quote AED 6,000–8,000 per night on a 3-month minimum, or AED 25,000–32,000/month for four nights.</div>
    </div>
  </section>

  <!-- ============ NEGOTIATE ============ -->
  <section id="p-neg" class="hide">
    <div class="card"><h2>When they push back</h2>
    <div class="note" style="margin:0 0 12px">Tap any objection.</div>
    <details><summary>"That's above our budget"</summary><p>"I understand — what number are you working with?" <b>Make them say it first.</b> If it's above the floor, trade instead of discounting: shorten the set, drop exclusivity, or ask for three dates at the same rate.</p></details>
    <details><summary>"We can get a DJ for AED 2–3,000"</summary><p>True for the open-format pool — Dubai marketplaces average about AED 2,400 across hundreds of part-time DJs. <b>That is not the comparable set.</b> "Emy was an official tournament DJ for the FIFA World Cup Qatar 2022 and the FIFA Arab Cup 2025, she's one of the few female Afro House DJs holding a peak-time floor in the GCC, and she's contracted through Emy Vision Group. The premium tier in Dubai runs AED 6,000–15,000." <b>Reframe the category — never argue the average.</b></p></details>
    <details><summary>"Do it for exposure"</summary><p>"I'd love to work with you — the rate for this type of event is [target]. If budget is genuinely fixed this round, let's do a paid trial at [floor] and agree the rate for following bookings in writing." <b>Never work free. Convert exposure into a written future rate.</b></p></details>
    <details><summary>"We need her exclusive that week"</summary><p>Exclusivity is a product, not a courtesy. "A 5km / 7-day radius clause is +30%. Without the clause it stays at [target]." <b>Let them choose.</b></p></details>
    <details><summary>"We'll confirm closer to the date"</summary><p>"I can pencil you in, but I release held dates to confirmed bookings. A 50% deposit locks it." <b>A deposit is the only real confirmation</b> — verbal holds cost her paid work.</p></details>
    <details><summary>"Payment 30–60 days after"</summary><p>"Standard terms are deposit on signature, balance on the night." If they insist on credit terms, require 100% upfront or add 15%. <b>Chasing money is unpaid labour.</b></p></details>
    <details><summary>"Can she also MC / play an extra hour?"</summary><p>Every add-on is a line item. An extra hour is +35% of base. <b>Never absorb scope silently</b> — reprice and re-send in writing.</p></details>
    </div>
    <div class="card"><h2>Three rules</h2>
      <div class="kv"><span>1</span><span>Make them say a number first</span></div>
      <div class="kv"><span>2</span><span>A deposit is the only confirmation</span></div>
      <div class="kv"><span>3</span><span>Every add-on is a line item, in writing</span></div>
    </div>
  </section>

  <!-- ============ DETAILS ============ -->
  <section id="p-info" class="hide">
    <div class="card"><h2>${E.id === "evg" ? "Company" : "Artist"}</h2>
      ${E.company.map(([k, v]) => `<div class="kv"><span>${k}</span><span>${v}</span></div>`).join("\n      ")}
      <div class="kv"><span>Booking contact</span><span>${E.phone}</span></div>
      <div class="kv"><span>Email</span><span>${E.email}</span></div>
      <div class="kv"><span>Instagram</span><span>${E.instagram}</span></div>
    </div>
    ${E.artist ? `<div class="card"><h2>Artist contact</h2>
      <div class="kv"><span>Name</span><span>${E.artist.name} (Imen Mannai)</span></div>
      <div class="kv"><span>Phone</span><span>${E.artist.phone}</span></div>
      <div class="kv"><span>Email</span><span>${E.artist.email}</span></div>
      <div class="kv"><span>Instagram</span><span>${E.artist.instagram}</span></div>
      <div class="note">Payments always settle to Emy Vision Group — one contracted party on every booking.</div>
    </div>` : ""}
    ${PUBLIC ? "" : `<div class="card"><h2>Bank — for invoices</h2>
      <div class="kv"><span>Beneficiary</span><span>${B.accountName}</span></div>
      <div class="kv"><span>Bank</span><span>${B.bankName}</span></div>
      ${B.bankAddress ? `<div class="kv"><span>Bank address</span><span>${B.bankAddress}</span></div>` : ""}
      ${B.accountNo ? `<div class="kv"><span>Account no.</span><span>${B.accountNo}</span></div>` : ""}
      <div class="kv"><span>IBAN (AED)</span><span>${B.iban}</span></div>
      <div class="kv"><span>SWIFT / BIC</span><span>${B.swift}</span></div>
      ${(B.alternates ?? []).map((a) => `<div class="kv"><span>IBAN (${a.currency})</span><span>${a.iban}</span></div>`).join("\n      ")}
      <button class="btn alt" onclick="copyBank(this)">Copy bank details</button>
      <div class="warn">Never send the Mashreq customer number (CIF) to a client — it is also the password for the bank's statements. Payments only need the beneficiary name, IBAN and SWIFT.</div>
    </div>`}
    <div class="card"><h2>Tech rider</h2>
      <div class="kv"><span>Players</span><span>2× Pioneer CDJ-3000<br>(2000NXS2 acceptable)</span></div>
      <div class="kv"><span>Mixer</span><span>1× Pioneer DJM-900NXS2</span></div>
      <div class="kv"><span>Monitoring</span><span>Booth monitor + house PA</span></div>
      <div class="kv"><span>Media</span><span>Travels with USB</span></div>
      <div class="note">Soundcheck 45 min before doors. Backline tested and confirmed 24h before.</div>
    </div>
    <div class="card"><h2>Standard terms</h2>
      <div class="kv"><span>Deposit</span><span>50% on signature</span></div>
      <div class="kv"><span>Balance</span><span>On the night</span></div>
      <div class="kv"><span>Cancel &lt;7 days</span><span>100% payable</span></div>
      <div class="kv"><span>Cancel &lt;14 days</span><span>75% payable</span></div>
      <div class="kv"><span>Cancel &lt;30 days</span><span>50% payable</span></div>
      <div class="kv"><span>Governing law</span><span>Dubai / UAE</span></div>
    </div>
    <div class="card"><h2>Sound</h2>
      <div class="kv"><span>Genres</span><span>${P.genres.join(", ")}</span></div>
      <div class="kv"><span>Live sets</span><span>youtube.com/@DJEMY-o6d</span></div>
      <div class="note">Works offline. Add to Home Screen to use it like an app.</div>
    </div>
  </section>
</div>

<nav>
  <button class="on" data-p="gig"><i>⚡</i>New gig</button>
  <button data-p="price"><i>💰</i>Price</button>
  <button data-p="rates"><i>📋</i>Rates</button>
  <button data-p="neg"><i>💬</i>Negotiate</button>
  <button data-p="info"><i>🏢</i>Details</button>
</nav>

<script>
var FLOOR = ${P.hardFloorAed};
/* Voice differs per edition: the company speaks about her, she speaks as herself. */
var IS_EVG = ${E.id === "evg" ? "true" : "false"};
var SENDER_SUBJ = ${JSON.stringify(E.id === "evg" ? "DJ Emy" : "DJ Emy")};
var INTRO_SHORT = ${JSON.stringify(E.id === "evg"
  ? "Emy Vision Group here, representing DJ Emy."
  : "DJ Emy here.")};
var INTRO_LONG = ${JSON.stringify(E.id === "evg"
  ? "I am writing from Emy Vision Group, which represents and manages DJ Emy, a GCC-based Afro House, Afro Tech and open-format DJ."
  : "I am DJ Emy, a GCC-based Afro House, Afro Tech and open-format DJ, represented by Emy Vision Group.")};
var AVAIL = ${JSON.stringify(E.id === "evg"
  ? "She is available and it is exactly her sound (Afro House, Afro Tech, Tribal)."
  : "I am available and it is exactly my sound (Afro House, Afro Tech, Tribal).")};
var USB = ${JSON.stringify(E.id === "evg"
  ? "she travels with USB and adapts to venue equipment"
  : "I travel with USB and adapt to venue equipment")};
var USB_CAP = ${JSON.stringify(E.id === "evg"
  ? "She travels with USB and works with your house Pioneer setup."
  : "I travel with USB and work with your house Pioneer setup.")};
var EPK = ${JSON.stringify(E.website ?? "https://emyvisiongroup.com")};
var SIGN = ${JSON.stringify(E.id === "evg"
  ? "Emy Vision Group\n" + E.phone
  : "DJ Emy\n" + E.phone)};
function DEAR(w){return w==='there'?'Dear Booking Team,':'Dear '+w+','}
function HOOK(k){
  if(k==='brand_activation'||k==='festival')
    return IS_EVG ? 'She was an official tournament DJ for the FIFA World Cup Qatar 2022 and the FIFA Arab Cup 2025.'
                  : 'I was an official tournament DJ for the FIFA World Cup Qatar 2022 and the FIFA Arab Cup 2025.';
  if(k==='hotel_lounge')
    return IS_EVG ? 'She is known for golden-hour rooftop sessions \u2014 deep, tribal grooves that open a room and lift it.'
                  : 'I am known for golden-hour rooftop sessions \u2014 deep, tribal grooves that open a room and lift it.';
  return IS_EVG ? 'She is one of the GCC\u2019s few female Afro House DJs commanding a peak-time floor \u2014 100% live, reads the room.'
                : 'I am one of the GCC\u2019s few female Afro House DJs commanding a peak-time floor \u2014 100% live, I read the room.';
}
function $(id){return document.getElementById(id)}
function r50(n){return Math.round(n/50)*50}
function fmt(n){return n.toLocaleString('en-US')}

document.querySelectorAll('nav button').forEach(function(b){
  b.onclick=function(){
    document.querySelectorAll('nav button').forEach(function(x){x.classList.remove('on')});
    b.classList.add('on');
    ['gig','price','rates','neg','info'].forEach(function(p){ $('p-'+p).classList.toggle('hide', p!==b.dataset.p) });
    window.scrollTo(0,0);
  };
});
document.querySelectorAll('.chip').forEach(function(c){
  c.onclick=function(){ c.classList.toggle('on'); calc(); };
});

function calc(){
  var base=+$('tier').value, hrs=+$('hrs').value, mult=1, why=[];
  var tierLabel=$('tier').options[$('tier').selectedIndex].text;
  why.push([tierLabel+' base','AED '+fmt(base)]);

  if(hrs>2){var m=1+(hrs-2)*0.35; mult*=m; why.push([hrs+' hours','+'+Math.round((m-1)*100)+'%']);}
  else if(hrs<1.5){mult*=0.85; why.push(['Short set','−15%']);}

  var s=+$('slot').value; if(s!==1){mult*=s; why.push([$('slot').options[$('slot').selectedIndex].text, (s>1?'+':'−')+Math.round(Math.abs(s-1)*100)+'%']);}
  var n=+$('night').value; mult*=n; if(n!==1) why.push([$('night').options[$('night').selectedIndex].text,(n>1?'+':'−')+Math.round(Math.abs(n-1)*100)+'%']);
  var se=+$('season').value; mult*=se; if(se!==1) why.push([$('season').options[$('season').selectedIndex].text,(se>1?'+':'−')+Math.round(Math.abs(se-1)*100)+'%']);

  document.querySelectorAll('.chip.on').forEach(function(c){
    var m=+c.dataset.m; mult*=m;
    why.push([c.textContent,(m>1?'+':'−')+Math.round(Math.abs(m-1)*100)+'%']);
  });

  var target=r50(base*mult), ask=r50(target*1.25), floor=Math.max(r50(target*0.72),FLOOR);
  // The floor is absolute. If the multipliers drag the quote under it, the
  // whole quote lifts — otherwise she'd be shown an Ask below her own minimum.
  if(target<floor) target=floor;
  if(ask<floor) ask=floor;
  var stated=parseFloat($('budget').value);
  // Their budget only ever raises the ask, never lowers it.
  if(stated>0 && stated>ask) ask=r50(stated);

  $('ask').textContent=fmt(ask); $('tgt').textContent=fmt(target); $('flr').textContent=fmt(floor);
  $('why').innerHTML=why.map(function(w){return '<div><span>'+w[0]+'</span><span>'+w[1]+'</span></div>'}).join('');

  var a=$('advice');
  if(stated>0){
    a.classList.remove('hide');
    if(stated>=ask) a.innerHTML='✅ Their budget of AED '+fmt(stated)+' is at or above our ask. <b>Accept it — do not undercut.</b>';
    else if(stated>=r50(target*1.25)) a.innerHTML='✅ AED '+fmt(stated)+' is above our ask. <b>Take it.</b>';
    else if(stated>=target) a.innerHTML='👍 AED '+fmt(stated)+' beats the target. Ask once for AED '+fmt(ask)+' citing the night and slot, then settle at their number.';
    else if(stated>=floor) a.innerHTML='⚖️ AED '+fmt(stated)+' is workable but under target. <b>Counter at AED '+fmt(target)+'</b>, or trade: shorter set, no exclusivity, or a multi-date deal.';
    else a.innerHTML='🛑 AED '+fmt(stated)+' is below the floor of AED '+fmt(floor)+'. <b>Decline politely</b> and leave the door open, or offer a reduced 1-hour set at AED '+fmt(floor)+'.';
  } else a.classList.add('hide');

  buildPitch(ask,hrs);
}

function buildPitch(fee,hrs){
  var who=$('who').value.trim()||'there', venue=$('venue').value.trim(), date=$('date').value.trim()||'[date]';
  var k=$('tier').options[$('tier').selectedIndex].dataset.k;
  var hook = (k==='brand_activation'||k==='festival')
    ? ${E.id === "evg" ? '"She was an official tournament DJ for the FIFA World Cup Qatar 2022 and the FIFA Arab Cup 2025."' : '"I was an official tournament DJ for the FIFA World Cup Qatar 2022 and the FIFA Arab Cup 2025."'}
    : (k==='hotel_lounge')
    ? ${E.id === "evg" ? '"She\'s known for golden-hour rooftop sessions — deep, tribal grooves that open a room and lift it."' : '"I\'m known for golden-hour rooftop sessions — deep, tribal grooves that open a room and lift it."'}
    : ${E.id === "evg" ? '"She\'s one of the GCC\'s few female Afro House DJs commanding a peak-time floor — 100% live, reads the room."' : '"I\'m one of the GCC\'s few female Afro House DJs commanding a peak-time floor — 100% live, I read the room."'};

  var t=${E.id === "evg"
    ? "'Hi '+who+' — Emy Vision Group here, representing DJ Emy.\\n\\n'+"
    : "'Hi '+who+' — DJ Emy here.\\n\\n'+"}
    "Saw you're booking for "+date+(venue?' at '+venue:'')+". ${E.id === "evg" ? "DJ Emy is available and it's" : "I'm available and it's"} exactly ${E.id === "evg" ? "her" : "my"} sound (Afro House, Afro Tech, Tribal).\\n\\n"+
    hook+'\\n\\n'+
    'Fee for a '+hrs+'-hour set is AED '+fmt(fee)+', all-in. ${E.id === "evg" ? "She travels" : "I travel"} with USB and work${E.id === "evg" ? "s" : ""} with your house Pioneer setup.\\n\\n'+
    'Live sets: https://youtube.com/@DJEMY-o6d\\nEPK: ${E.website}\\n\\n'+
    'We can hold the date for you today — shall I send the booking confirmation over?\\n\\n'+
    '${E.senderLine}\\n${E.phone}';

  $('pitch').textContent=t;
  $('waLink').href='https://wa.me/?text='+encodeURIComponent(t);
}

function flash(b,msg){var o=b.textContent;b.textContent=msg;b.classList.add('copied');
  setTimeout(function(){b.textContent=o;b.classList.remove('copied')},1600);}
function copyTxt(t,b,msg){
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(function(){flash(b,msg)});}
  else{var a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';
    document.body.appendChild(a);a.select();try{document.execCommand('copy');flash(b,msg)}catch(e){}
    document.body.removeChild(a);}
}
function copyPitch(b){copyTxt($('pitch').textContent,b,'Copied ✓')}
${PUBLIC ? "" : `function copyBank(b){copyTxt(
 'Beneficiary: ${B.accountName}\\nBank: ${B.bankName}\\nIBAN: ${B.iban}\\nSWIFT/BIC: ${B.swift}',b,'Copied ✓')}`}


/* ===================== GIG PARSER =====================
   Reads a pasted advert the way the server-side engine does: venue tier,
   date, hours, slot, budget and contact. Everything stays in the browser. */
var SRC='whatsapp';
document.querySelectorAll('.src div').forEach(function(d){
  d.onclick=function(){
    document.querySelectorAll('.src div').forEach(function(x){x.classList.remove('on')});
    d.classList.add('on'); SRC=d.dataset.src; buildReply();
  };
});

var TIERMAP=[
  [/beach club|nikki beach|cove beach|zero gravity|pool party|day party/i,'beach_club',7000,'Beach club / pool'],
  [/festival|main stage|arena|tournament|fan zone/i,'festival',13000,'Festival / main stage'],
  [/brand|activation|product launch|corporate|company party|gala|conference|expo|fashion/i,'brand_activation',15000,'Brand / corporate'],
  [/private|wedding|yacht|villa|birthday|engagement/i,'private_event',10000,'Private / VIP / yacht'],
  [/rooftop|sky ?bar|hotel|lounge|brunch|resort/i,'hotel_lounge',5000,'Hotel / rooftop lounge'],
  [/super ?club|night ?club|soho garden|white dubai|base dubai|club/i,'superclub',8000,'Nightclub'],
  [/\\bbar\\b|restaurant|bistro|cafe|pub/i,'bar_restaurant',3000,'Bar / restaurant']
];

function pBudget(t){
  var re=/(?:aed|dhs?|dirhams?)\\s*(\\d[\\d,]*(?:\\.\\d+)?)\\s*(k)?|(\\d[\\d,]*(?:\\.\\d+)?)\\s*(k)?\\s*(?:aed|dhs?|dirhams?)/gi,m,out=[];
  while((m=re.exec(t))){var n=m[1]||m[3],k=m[2]||m[4];if(!n)continue;
    var v=parseFloat(n.replace(/,/g,''));if(k)v*=1000;if(v>=200&&v<=500000)out.push(v);}
  return out.length?Math.max.apply(null,out):null;
}
function pHours(t){
  var h=t.match(/(\\d+(?:\\.\\d+)?)\\s*(?:-\\s*(\\d+(?:\\.\\d+)?)\\s*)?(?:h|hr|hrs|hour|hours)\\b/i);
  if(h)return parseFloat(h[2]||h[1]);
  var m=t.match(/(\\d{2,3})\\s*(?:min|mins|minutes)\\b/i);
  return m?Math.round(parseInt(m[1],10)/60*10)/10:null;
}
function pSlot(t){
  if(/warm ?up|opener|opening set|early/i.test(t))return 0.7;
  if(/closing|last set/i.test(t))return 0.9;
  if(/all night|open to close/i.test(t))return 1.3;
  return 1;
}
function pPhone(t){var m=t.match(/(?:\\+?971|00971|0)\\s?5\\d(?:[\\s-]?\\d){7}/);return m?m[0].replace(/[\\s-]/g,''):null}
function pEmail(t){var m=t.match(/[\\w.+-]+@[\\w-]+\\.[\\w.]+/);return m?m[0]:null}
function pHandle(t){var m=t.match(/(?:^|\\s)@([A-Za-z0-9._]{3,30})/);return m?'@'+m[1]:null}
function pName(t){
  var m=t.match(/[—\\-]\\s*([A-Z][a-z]{2,15})\\s*$/m)||t.match(/\\b(?:contact|ask for|speak to|call)\\s+([A-Z][a-z]{2,15})/);
  return m?m[1]:''
}
function pVenue(t){
  var m=t.match(/\\b(?:at|@)\\s+([A-Z][\\w'&.]*(?:\\s+[A-Z][\\w'&.]*){0,3})/);
  return m?m[1].trim():''
}
function pDate(t){
  var wd=t.match(/\\b(this|next)?\\s?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\\b/i);
  if(wd)return (wd[1]?wd[1]+' ':'')+wd[2][0].toUpperCase()+wd[2].slice(1).toLowerCase();
  var dm=t.match(/\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\\w*/i);
  if(dm)return dm[0];
  if(/\\btonight\\b/i.test(t))return 'tonight';
  if(/\\btomorrow\\b/i.test(t))return 'tomorrow';
  return ''
}
function pNight(d){
  if(/friday|saturday/i.test(d))return 1.25;
  if(/thursday/i.test(d))return 1.1;
  if(/sunday/i.test(d))return .95;
  if(/monday|tuesday|wednesday/i.test(d))return .85;
  return 1
}

var AD={};
function readAd(){
  var t=$('ad').value; if(!t.trim())return;
  var tier=null;
  for(var i=0;i<TIERMAP.length;i++){ if(TIERMAP[i][0].test(t)){tier=TIERMAP[i];break} }
  if(!tier)tier=[null,'unknown',6000,'Nightclub'];

  var date=pDate(t), hrs=pHours(t)||2, budget=pBudget(t), slot=pSlot(t);
  AD={tier:tier,date:date,hrs:hrs,budget:budget,slot:slot,
      phone:pPhone(t),email:pEmail(t),handle:pHandle(t),
      who:pName(t),venue:pVenue(t),rush:/urgent|asap|tonight|tomorrow|cancelled|last minute/i.test(t),
      excl:/exclusiv/i.test(t)};

  // Feed the price engine.
  var opts=$('tier').options;
  for(var j=0;j<opts.length;j++) if(opts[j].dataset.k===tier[1]) $('tier').selectedIndex=j;
  $('hrs').value=String(hrs).replace(/\\.0$/,'');
  if(!Array.prototype.some.call($('hrs').options,function(o){return o.value==$('hrs').value}))$('hrs').value='2';
  $('slot').value=String(slot);
  $('night').value=String(pNight(date));
  document.querySelectorAll('.chip').forEach(function(c){c.classList.remove('on')});
  if(AD.rush)$('c-rush').classList.add('on');
  if(AD.excl)$('c-excl').classList.add('on');
  $('budget').value=budget||'';
  calc();

  // Auto-pick the channel from what the ad actually contains.
  var guess = AD.email && !AD.phone ? 'email' : (AD.handle && !AD.phone ? 'instagram' : 'whatsapp');
  document.querySelectorAll('.src div').forEach(function(x){
    x.classList.toggle('on', x.dataset.src===guess)});
  SRC=guess;

  $('gWho').value=AD.who; $('gVenue').value=AD.venue; $('gDate').value=AD.date;
  $('gFee').value=$('ask').textContent.replace(/,/g,'');

  var bits=[];
  bits.push('<b>'+tier[3]+'</b>');
  if(date)bits.push(date);
  bits.push(hrs+'h');
  if(budget)bits.push('they said AED '+fmt(budget));
  if(AD.rush)bits.push('urgent');
  if(AD.excl)bits.push('exclusivity');
  var c=AD.phone||AD.email||AD.handle;
  if(c)bits.push(c);
  $('found').innerHTML='Read: '+bits.join(' · ')+'<br>Ask <b>AED '+$('ask').textContent+'</b> — floor AED '+$('flr').textContent;
  $('found').classList.remove('hide');
  buildReply();
  $('gigOut').scrollIntoView({behavior:'smooth',block:'start'});
}

/* ===================== REPLY BUILDER ===================== */
function buildReply(){
  var fee=parseFloat($('gFee').value)||0;
  var who=$('gWho').value.trim()||'there';
  var venue=$('gVenue').value.trim();
  var date=$('gDate').value.trim()||'[date]';
  var hrs=$('hrs').value;
  var k=$('tier').options[$('tier').selectedIndex].dataset.k;
  var hook=HOOK(k);
  var isEmail=SRC==='email';

  $('gSubjL').classList.toggle('hide',!isEmail);
  $('gSubj').classList.toggle('hide',!isEmail);
  if(isEmail && !$('gSubj').value)
    $('gSubj').value=SENDER_SUBJ+' — availability for '+date+(venue?' at '+venue:'');

  var msg;
  if(isEmail){
    msg=DEAR(who)+'\n\n'+INTRO_LONG+'\n\n'+
      'I understand you are booking for '+date+(venue?' at '+venue:'')+'. '+AVAIL+'\n\n'+
      hook+'\n\n'+
      'Proposed terms:\n'+
      '  \u2022 Performance: '+hrs+'-hour set\n'+
      '  \u2022 Fee: AED '+fmt(fee)+', all-in\n'+
      '  \u2022 Payment: 50% deposit to confirm the date, balance on the night\n'+
      '  \u2022 Technical: 2\u00d7 CDJ-3000 (or 2000NXS2) + DJM-900NXS2; '+USB+'\n\n'+
      'Live sets: https://youtube.com/@DJEMY-o6d\nEPK: ' + EPK + '\n\n' +
      'We can hold the date for 48 hours pending confirmation.\n\n'+
      'Kind regards,\n'+SIGN;
  } else {
    msg='Hi '+who+' \u2014 '+INTRO_SHORT+'\n\n'+
      'Saw you\u2019re booking for '+date+(venue?' at '+venue:'')+'. '+AVAIL+'\n\n'+
      hook+'\n\n'+
      'Fee for a '+hrs+'-hour set is AED '+fmt(fee)+', all-in. '+USB_CAP+'\n\n'+
      'Live sets: https://youtube.com/@DJEMY-o6d\n\n'+
      'Happy to hold the date today \u2014 shall I send the booking confirmation over?\n\n'+
      SIGN;
  }
  $('gMsg').textContent=msg;

  var a=$('gSend'), w=$('gWarn');
  w.classList.add('hide');
  if(SRC==='whatsapp'){
    a.textContent='Send on WhatsApp';
    a.href = AD.phone ? 'https://wa.me/'+AD.phone.replace(/\\D/g,'')+'?text='+encodeURIComponent(msg)
                      : 'https://wa.me/?text='+encodeURIComponent(msg);
    if(!AD.phone){w.textContent='No number found in the advert — WhatsApp will ask you to pick the chat.';w.classList.remove('hide')}
  } else if(SRC==='email'){
    a.textContent='Open email';
    a.href='mailto:'+(AD.email||'')+'?subject='+encodeURIComponent($('gSubj').value)+'&body='+encodeURIComponent(msg);
    if(!AD.email){w.textContent='No email address found — add it in your mail app.';w.classList.remove('hide')}
  } else {
    a.textContent=AD.handle?('Open Instagram '+AD.handle):'Open Instagram';
    a.href=AD.handle?('https://instagram.com/'+AD.handle.replace('@','')):'https://instagram.com/';
    w.textContent='Instagram has no way to pre-fill a DM. Tap "Copy instead", then paste it in the chat.';
    w.classList.remove('hide');
  }
}
function copyMsg(b){copyTxt($('gMsg').textContent,b,'Copied \u2713')}
['gFee','gWho','gVenue','gDate','gSubj'].forEach(function(id){
  $(id).addEventListener('input',buildReply)});


/* ===================== GIG ALERTS =====================
   Honest scope: a static page can show a notification and re-check on open,
   but it cannot poll Instagram/WhatsApp in the background. What this does:
   - asks for notification permission
   - registers a service worker so the app is installable and works offline
   - shows a notification for gigs added to the shared feed (feed.json),
     checked whenever the app is open or resumed
   For true always-on push, deploy the server build (see repo README). */
var ALERTS_KEY='emy_alerts_on', SEEN_KEY='emy_seen_gigs';
function alertsOn(){return localStorage.getItem(ALERTS_KEY)==='1'}

function paintAlerts(){
  var b=$('alertBtn'), st=$('alertState');
  if(!('Notification' in window)){
    b.classList.add('hide');
    st.textContent='This browser cannot show notifications. Open the app in Safari or Chrome.';
    return;
  }
  if(Notification.permission==='denied'){
    b.classList.add('hide');
    st.textContent='Notifications are blocked for this site. Enable them in your phone settings, then reopen.';
    return;
  }
  b.textContent = alertsOn() ? 'Turn off alerts' : 'Turn on alerts';
  st.textContent = alertsOn()
    ? 'On. New gigs ping this phone when the app is open or you reopen it.'
    : '';
}

function toggleAlerts(){
  if(alertsOn()){ localStorage.setItem(ALERTS_KEY,'0'); paintAlerts(); return; }
  Notification.requestPermission().then(function(p){
    if(p==='granted'){
      localStorage.setItem(ALERTS_KEY,'1'); paintAlerts();
      notify('Alerts on', 'You will be pinged when a new gig lands.');
      checkFeed();
    } else paintAlerts();
  });
}

function notify(title, body, tag){
  if(!('Notification' in window) || Notification.permission!=='granted') return;
  try{
    if(navigator.serviceWorker && navigator.serviceWorker.ready){
      navigator.serviceWorker.ready.then(function(r){
        r.showNotification(title,{body:body,tag:tag||'gig',icon:'icon.svg',badge:'icon.svg'});
      }).catch(function(){ new Notification(title,{body:body}); });
    } else new Notification(title,{body:body});
  }catch(e){}
}

/* Shared gig feed. Drop new gigs into feed.json next to this file and every
   installed phone picks them up. */
function checkFeed(){
  if(!alertsOn()) return;
  fetch('feed.json?t='+Date.now()).then(function(r){return r.ok?r.json():null}).then(function(d){
    if(!d||!d.gigs) return;
    var seen={};
    try{seen=JSON.parse(localStorage.getItem(SEEN_KEY)||'{}')}catch(e){}
    var fresh=d.gigs.filter(function(g){return !seen[g.id]});
    fresh.slice(0,3).forEach(function(g){
      notify('New gig: '+(g.venue||'opportunity'),
             [g.date,g.fee?('AED '+g.fee.toLocaleString()):null].filter(Boolean).join(' \u00b7 '),
             g.id);
      seen[g.id]=1;
    });
    if(fresh.length){
      d.gigs.forEach(function(g){seen[g.id]=1});
      localStorage.setItem(SEEN_KEY,JSON.stringify(seen));
    }
  }).catch(function(){});
}

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(function(){});
}
document.addEventListener('visibilitychange',function(){ if(!document.hidden) checkFeed(); });
paintAlerts(); checkFeed(); setInterval(checkFeed, 120000);

['tier','hrs','slot','night','season','budget','who','venue','date'].forEach(function(id){
  $(id).addEventListener('input',calc); $(id).addEventListener('change',calc);
});
calc(); buildReply();
</script>
</body>
</html>`;

const out = `${PUBLIC ? "public" : E.outDir}/index.html`;
mkdirSync(PUBLIC ? "public" : E.outDir, { recursive: true });
writeFileSync(out, html);

// Hard gate. The CIF is the password to Mashreq's protected statements, so it
// is a credential and must never ship in any edition.
const banned: [string, string][] = [["016087359", "Mashreq CIF (bank password)"]];
if (PUBLIC) {
  banned.push([B.iban, "IBAN"]);
  for (const a of B.alternates ?? []) banned.push([a.iban, a.currency + " IBAN"]);
}
for (const [needle, what] of banned) {
  if (html.includes(needle)) { console.error(`FATAL: ${what} leaked into ${out}`); process.exit(1); }
}

// Both editions settle to EVG by design — one accountable contracted party.
// Guard instead that no PERSONAL account number ever reaches a client document.
const PERSONAL_ACCOUNTS = ["AE270330000019102066206", "019102066206"];
if (!PUBLIC) {
  for (const acct of PERSONAL_ACCOUNTS) {
    if (html.includes(acct)) {
      console.error(`FATAL: personal account ${acct} leaked into ${out} — payments must settle to EVG`);
      process.exit(1);
    }
  }
}

writeFileSync(`${E.outDir}/sw.js`, `const C="emy-v${Date.now()}";
self.addEventListener("install",e=>{self.skipWaiting();
  e.waitUntil(caches.open(C).then(c=>c.addAll(["./","./index.html"]).catch(()=>{})))});
self.addEventListener("activate",e=>{e.waitUntil(
  caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  if(e.request.url.includes("feed.json"))return;           // always fresh
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
    const c=res.clone();caches.open(C).then(x=>x.put(e.request,c));return res;
  }).catch(()=>caches.match("./index.html"))));
});
self.addEventListener("notificationclick",e=>{e.notification.close();
  e.waitUntil(clients.matchAll({type:"window"}).then(l=>l.length?l[0].focus():clients.openWindow("./")))});
`);
writeFileSync(`${E.outDir}/icon.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#0a0a0f"/><circle cx="256" cy="256" r="150" fill="none" stroke="#dc2626" stroke-width="14" opacity=".3"/><circle cx="256" cy="256" r="100" fill="none" stroke="#dc2626" stroke-width="14" opacity=".55"/><circle cx="256" cy="256" r="50" fill="none" stroke="#ef4444" stroke-width="14"/><circle cx="256" cy="256" r="18" fill="#f87171"/><circle cx="352" cy="168" r="26" fill="#dc2626"/></svg>`);
try { readFileSync(`${E.outDir}/feed.json`); } catch {
  writeFileSync(`${E.outDir}/feed.json`, JSON.stringify({ updated: new Date().toISOString(), gigs: [] }, null, 2));
}

console.log(`${out.padEnd(24)} ${(html.length / 1024).toFixed(0)} KB  — ${E.title}`);
}

build(EVG);
if (!PUBLIC) build(PERSONAL);

// A tiny chooser so ONE link reaches both editions.
if (!PUBLIC) {
  writeFileSync("docs/pick.html", `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Booking Tools</title><style>
body{margin:0;background:#0a0a0f;color:#e4e4e7;font:16px/1.5 -apple-system,system-ui,sans-serif;
 display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.w{max-width:420px;width:100%}h1{font-size:22px;margin:0 0 4px}h1 span{color:#ef4444}
p{color:#71717a;font-size:13px;margin:0 0 22px}
a{display:block;background:#18181b;border:1px solid #27272a;border-radius:14px;padding:18px;
 margin-bottom:12px;text-decoration:none;color:#fff}
a b{display:block;font-size:17px}a small{color:#71717a;font-size:12.5px}
</style></head><body><div class="w">
<h1>Booking <span>Tools</span></h1><p>Choose which one to open.</p>
<a href="./index.html"><b>EVG DJ Booking Tool</b><small>Company edition — pitches from Emy Vision Group, EVG bank details</small></a>
<a href="./emy/"><b>DJ Emy Booking Tool</b><small>Personal edition — pitches from Emy, her own account</small></a>
</div></body></html>`);
  console.log("docs/pick.html            chooser");
}
