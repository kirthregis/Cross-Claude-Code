/**
 * Builds `docs/index.html` — the whole tool as ONE self-contained file.
 *
 * Why: the live Next.js app needs a server, an account and a deploy. This
 * needs none of that. It opens from a link, installs to a phone home screen,
 * and keeps working with no signal. Everything is computed in the browser.
 */
import { mkdirSync, writeFileSync } from "fs";
import { DJ_EMY } from "../src/lib/artist";

const P = DJ_EMY;
const M = P.management;
const B = M.bank!;

const TIERS = [
  ["brand_activation", "Brand / corporate", 15000],
  ["festival", "Festival / main stage", 13000],
  ["private_event", "Private / VIP / yacht", 10000],
  ["superclub", "Nightclub", 8000],
  ["beach_club", "Beach club / pool", 7000],
  ["hotel_lounge", "Hotel / rooftop lounge", 5000],
  ["bar_restaurant", "Bar / restaurant", 3000],
] as const;

/**
 * PUBLIC=1 builds a shareable version with NO settlement or registration data.
 *
 * Emy needs pricing, pitches and negotiation on her phone — she never needs
 * IBANs mid-conversation. Those belong to EVG's invoicing, not to a link that
 * gets forwarded around WhatsApp.
 */
const PUBLIC = process.env.PUBLIC === "1";
// NOTE: GitHub Pages can only serve from the repo root or /docs — never
// /public. docs/ is therefore the published build. Kirth has approved
// including EVG's settlement details, so the default build carries them.

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>DJ Emy — Booking Tool</title>
<meta name="theme-color" content="#0a0a0f">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="DJ Emy">
<link rel="manifest" href="data:application/json;base64,${Buffer.from(JSON.stringify({
  name: "DJ Emy — Booking Tool", short_name: "DJ Emy", start_url: "./index.html",
  display: "standalone", background_color: "#0a0a0f", theme_color: "#0a0a0f",
  icons: [{ src: "data:image/svg+xml;base64," + Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#0a0a0f"/><circle cx="256" cy="256" r="150" fill="none" stroke="#dc2626" stroke-width="14" opacity=".3"/><circle cx="256" cy="256" r="100" fill="none" stroke="#dc2626" stroke-width="14" opacity=".55"/><circle cx="256" cy="256" r="50" fill="none" stroke="#ef4444" stroke-width="14"/><circle cx="256" cy="256" r="18" fill="#f87171"/><circle cx="352" cy="168" r="26" fill="#dc2626"/></svg>`
  ).toString("base64"), sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
})).toString("base64")}">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:#0a0a0f;color:#e4e4e7;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
 padding:env(safe-area-inset-top) 0 calc(76px + env(safe-area-inset-bottom))}
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
</style>
</head>
<body>
<div class="wrap">
  <header style="margin-bottom:14px">
    <h1>DJ <span>Emy</span> — Booking Tool</h1>
    <div class="sub">Emy Vision Group · ${M.phone}</div>
  </header>

  <!-- ============ PRICE ============ -->
  <section id="p-price">
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
    <div class="card"><h2>Company</h2>
      <div class="kv"><span>Legal name</span><span>${M.legalName}</span></div>
      ${PUBLIC ? "" : `<div class="kv"><span>Licence no.</span><span>${M.tradeLicenceNo}</span></div>
      <div class="kv"><span>Formation no.</span><span>4427087</span></div>
      <div class="kv"><span>Licence expiry</span><span>06/01/2027</span></div>`}
      <div class="kv"><span>Type</span><span>Free Zone Company</span></div>
      <div class="kv"><span>Booking contact</span><span>${M.contactName} · ${M.phone}</span></div>
      <div class="kv"><span>Email</span><span>${M.email}</span></div>
    </div>
    ${PUBLIC ? "" : `<div class="card"><h2>Bank — for invoices</h2>
      <div class="kv"><span>Account name</span><span>${B.accountName}</span></div>
      <div class="kv"><span>Bank</span><span>${B.bankName}</span></div>
      <div class="kv"><span>IBAN (AED)</span><span>${B.iban}</span></div>
      <div class="kv"><span>SWIFT / BIC</span><span>${B.swift}</span></div>
      ${(B.alternates ?? []).map((a) => `<div class="kv"><span>IBAN (${a.currency})</span><span>${a.iban}</span></div>`).join("\n      ")}
      <button class="btn alt" onclick="copyBank(this)">Copy bank details</button>
      <div class="warn">Never send the Mashreq customer number (CIF) to a client — it's also the password for the bank's statements. Payments only need the account name, IBAN and SWIFT.</div>
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
    <div class="card"><h2>Artist</h2>
      <div class="kv"><span>Instagram</span><span>${P.instagram}</span></div>
      <div class="kv"><span>Live sets</span><span>youtube.com/@DJEMY-o6d</span></div>
      <div class="kv"><span>Genres</span><span>${P.genres.join(", ")}</span></div>
      <div class="note">Works offline. Add to Home Screen to use it like an app.</div>
    </div>
  </section>
</div>

<nav>
  <button class="on" data-p="price"><i>💰</i>Price</button>
  <button data-p="rates"><i>📋</i>Rates</button>
  <button data-p="neg"><i>💬</i>Negotiate</button>
  <button data-p="info"><i>🏢</i>Details</button>
</nav>

<script>
var FLOOR = ${P.hardFloorAed};
function $(id){return document.getElementById(id)}
function r50(n){return Math.round(n/50)*50}
function fmt(n){return n.toLocaleString('en-US')}

document.querySelectorAll('nav button').forEach(function(b){
  b.onclick=function(){
    document.querySelectorAll('nav button').forEach(function(x){x.classList.remove('on')});
    b.classList.add('on');
    ['price','rates','neg','info'].forEach(function(p){ $('p-'+p).classList.toggle('hide', p!==b.dataset.p) });
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
    ? "She was an official tournament DJ for the FIFA World Cup Qatar 2022 and the FIFA Arab Cup 2025."
    : (k==='hotel_lounge')
    ? "She's known for golden-hour rooftop sessions — deep, tribal grooves that open a room and lift it."
    : "She's one of the GCC's few female Afro House DJs commanding a peak-time floor — 100% live, reads the room.";

  var t='Hi '+who+' — ${M.contactName} here from ${M.company}, representing DJ Emy.\\n\\n'+
    "Saw you're booking for "+date+(venue?' at '+venue:'')+". DJ Emy is available and it's exactly her sound (Afro House, Afro Tech, Tribal).\\n\\n"+
    hook+'\\n\\n'+
    'Fee for a '+hrs+'-hour set is AED '+fmt(fee)+', all-in. She travels with USB and works with your house Pioneer setup.\\n\\n'+
    'Live sets: https://youtube.com/@DJEMY-o6d\\nEPK: ${M.website}\\n\\n'+
    'We can hold the date for you today — shall I send the booking confirmation over?\\n\\n'+
    '${M.contactName} · ${M.company}\\n${M.phone}';

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
 'Account name: ${B.accountName}\\nBank: ${B.bankName}\\nIBAN (AED): ${B.iban}\\nSWIFT/BIC: ${B.swift}',b,'Copied ✓')}`}

['tier','hrs','slot','night','season','budget','who','venue','date'].forEach(function(id){
  $(id).addEventListener('input',calc); $(id).addEventListener('change',calc);
});
calc();
</script>
</body>
</html>`;

const out = PUBLIC ? "public/index.html" : "docs/index.html";
mkdirSync(PUBLIC ? "public" : "docs", { recursive: true });
writeFileSync(out, html);
console.log(`${out} — ${(html.length / 1024).toFixed(0)} KB`);

// Hard gate: never ship credentials or settlement data in a shareable build.
// The CIF is the password to Mashreq's protected statements, so it is a
// credential and must never ship — regardless of what else is included.
const banned: [string, string][] = [["016087359", "Mashreq CIF (bank password)"]];
if (PUBLIC) {
  banned.push([B.iban, "AED IBAN"], [M.tradeLicenceNo!, "trade licence no."]);
  for (const a of B.alternates ?? []) banned.push([a.iban, a.currency + " IBAN"]);
}
for (const [needle, what] of banned) {
  if (html.includes(needle)) { console.error(`FATAL: ${what} leaked into ${out}`); process.exit(1); }
}
console.log(PUBLIC ? "✓ no IBANs, licence no. or CIF — safe to publish" : "✓ CIF absent");
