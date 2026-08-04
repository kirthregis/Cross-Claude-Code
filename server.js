/* NexusCommand v4 - single-file local command centre
 * Run with: node server.js (Node 18+). Keep this file beside nexus.db.
 * Gemini is optional; set GEMINI_API_KEY to enable the AI routes.
 */
'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const crypto = require('crypto');
const { URL } = require('url');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Database = require('better-sqlite3');
const { chromium } = require('playwright');

const PORT = Number(process.env.PORT || 4100);
const TZ = process.env.TZ || 'Asia/Dubai';
const PROFILE = process.env.CHROME_USER_DATA_DIR || 'C:\\Users\\kirth\\AppData\\Local\\Google\\Chrome\\User Data';
const DB_FILE = process.env.NEXUS_DB || path.join(process.cwd(), 'nexus.db');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
// Hybrid by default: use online services when reachable, then fall back locally. Set NEXUS_OFFLINE=1 for strict air-gapped mode.
const OFFLINE = process.env.NEXUS_OFFLINE === '1';
const LOCAL_MODEL = process.env.NEXUS_LOCAL_MODEL || '';
const LOCAL_AI_URL = process.env.NEXUS_LOCAL_AI_URL || 'http://127.0.0.1:11434/api/generate';
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const db = new Database(DB_FILE);
const TOKEN_FILE = process.env.NEXUS_TOKEN_FILE || path.join(process.cwd(), '.nexus-access-token');
let ACCESS_TOKEN = process.env.NEXUS_ACCESS_TOKEN || '';
if (!ACCESS_TOKEN) { try { ACCESS_TOKEN = fs.readFileSync(TOKEN_FILE, 'utf8').trim(); } catch {} }
if (!ACCESS_TOKEN) { ACCESS_TOKEN = crypto.randomBytes(32).toString('hex'); try { fs.writeFileSync(TOKEN_FILE, ACCESS_TOKEN, { mode: 0o600 }); } catch {} }
let browserContext = null;
let browserPage = null;

app.disable('x-powered-by');
app.use(cors({ origin: (origin, cb) => cb(null, !origin || origin === `http://localhost:${PORT}` || origin === `http://127.0.0.1:${PORT}`) }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => { res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'no-referrer', 'Permissions-Policy': 'microphone=(self)' }); next(); });
app.use('/api', (req, res, next) => { if (req.path === '/health') return next(); const supplied = String(req.get('authorization') || '').replace(/^Bearer\s+/i, ''); const given = Buffer.from(supplied); const expected = Buffer.from(ACCESS_TOKEN); if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return json(res, { error: 'Unauthorized. Use the Nexus access token.' }, 401); next(); });

// These tables are additive: the user's existing nexus.db is never deleted or reset.
db.exec(`CREATE TABLE IF NOT EXISTS nexus_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS nexus_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, prompt TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued', result TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, finished_at TEXT);
CREATE TABLE IF NOT EXISTS nexus_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS nexus_files (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, mime TEXT NOT NULL DEFAULT '', size INTEGER NOT NULL DEFAULT 0, content BLOB, created_at TEXT NOT NULL);`);

const now = () => new Date().toISOString();
const json = (res, value, status = 200) => res.status(status).json(value);
function setting(key, fallback = '') { const row = db.prepare('SELECT value FROM nexus_settings WHERE key=?').get(key); return row ? row.value : fallback; }
function setSetting(key, value) { db.prepare('INSERT INTO nexus_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, String(value)); }
function publicFile(row) { return { id: row.id, name: row.name, mime: row.mime, size: row.size, created_at: row.created_at }; }

app.get('/api/health', (_req, res) => json(res, { ok: true, port: PORT, timezone: TZ, offline: OFFLINE, provider: OFFLINE ? 'offline' : (process.env.GEMINI_API_KEY ? 'gemini with offline fallback' : 'offline fallback'), chrome: Boolean(browserContext) }));
app.get('/api/dashboard', (_req, res) => {
  const notes = db.prepare('SELECT id,title,body,created_at,updated_at FROM nexus_notes ORDER BY updated_at DESC LIMIT 6').all();
  const files = db.prepare('SELECT id,name,mime,size,created_at FROM nexus_files ORDER BY created_at DESC LIMIT 6').all();
  const tasks = db.prepare('SELECT id,prompt,status,result,created_at,finished_at FROM nexus_tasks ORDER BY created_at DESC LIMIT 8').all();
  json(res, { notes, files, tasks, stats: { notes: notes.length, files: files.length, tasks: tasks.length }, timezone: TZ });
});
app.get('/api/notes', (_req, res) => json(res, db.prepare('SELECT * FROM nexus_notes ORDER BY updated_at DESC').all()));
app.post('/api/notes', (req, res) => { const title = String(req.body.title || 'Untitled').trim(); const body = String(req.body.body || ''); const t = now(); const info = db.prepare('INSERT INTO nexus_notes(title,body,created_at,updated_at) VALUES(?,?,?,?)').run(title, body, t, t); json(res, { id: info.lastInsertRowid, title, body, created_at: t, updated_at: t }, 201); });
app.put('/api/notes/:id', (req, res) => { const t = now(); const info = db.prepare('UPDATE nexus_notes SET title=?,body=?,updated_at=? WHERE id=?').run(String(req.body.title || ''), String(req.body.body || ''), t, req.params.id); json(res, { ok: info.changes > 0 }); });
app.delete('/api/notes/:id', (req, res) => json(res, { ok: db.prepare('DELETE FROM nexus_notes WHERE id=?').run(req.params.id).changes > 0 }));
app.get('/api/files', (_req, res) => json(res, db.prepare('SELECT id,name,mime,size,created_at FROM nexus_files ORDER BY created_at DESC').all()));
app.post('/api/files', upload.single('file'), (req, res) => { if (!req.file) return json(res, { error: 'file is required' }, 400); const t = now(); const info = db.prepare('INSERT INTO nexus_files(name,mime,size,content,created_at) VALUES(?,?,?,?,?)').run(req.file.originalname, req.file.mimetype, req.file.size, req.file.buffer, t); json(res, { ...publicFile({ id: info.lastInsertRowid, name: req.file.originalname, mime: req.file.mimetype, size: req.file.size, created_at: t }) }, 201); });
app.get('/api/files/:id/download', (req, res) => { const f = db.prepare('SELECT * FROM nexus_files WHERE id=?').get(req.params.id); if (!f) return res.sendStatus(404); res.type(f.mime || 'application/octet-stream').set('Content-Disposition', `attachment; filename="${String(f.name).replace(/["\r\n]/g, '')}"`).send(f.content); });
app.get('/api/settings', (_req, res) => json(res, { timezone: TZ, chromeProfile: PROFILE, provider: setting('provider', OFFLINE ? 'offline' : (process.env.GEMINI_API_KEY ? 'gemini with offline fallback' : 'offline fallback')), model: setting('model', OFFLINE ? (LOCAL_MODEL || 'offline-rules') : (process.env.GEMINI_API_KEY ? GEMINI_MODEL : (LOCAL_MODEL || 'offline-rules'))), chromeConnected: Boolean(browserContext) }));
app.put('/api/settings', (req, res) => { for (const key of ['provider', 'model']) if (req.body[key] !== undefined) setSetting(key, req.body[key]); json(res, { ok: true }); });

async function getChrome() {
  if (browserContext && browserContext.pages().length) { browserPage = browserContext.pages()[0]; return browserPage; }
  if (!browserContext) {
    try { browserContext = await chromium.launchPersistentContext(PROFILE, { channel: 'chrome', headless: false, timezoneId: TZ, viewport: null, args: ['--disable-blink-features=AutomationControlled'] }); }
    catch (error) { throw new Error(`Chrome could not open the profile. Close Chrome first, or set CHROME_USER_DATA_DIR. ${error.message}`); }
  }
  browserPage = browserContext.pages()[0] || await browserContext.newPage();
  return browserPage;
}
async function chromeAction(action) {
  const page = await getChrome();
  const type = String(action.type || action.action || '');
  if (type === 'navigate' || type === 'open') await page.goto(String(action.url), { waitUntil: 'domcontentloaded', timeout: 30000 });
  else if (type === 'click') await page.locator(String(action.selector)).first().click({ timeout: 15000 });
  else if (type === 'type' || type === 'fill') await page.locator(String(action.selector)).first().fill(String(action.text || ''));
  else if (type === 'press') await page.locator(String(action.selector)).first().press(String(action.key || 'Enter'));
  else if (type === 'wait') await page.waitForTimeout(Math.min(Number(action.ms) || 1000, 15000));
  else if (type === 'back') await page.goBack({ waitUntil: 'domcontentloaded' });
  else if (type === 'screenshot') { const file = path.join(os.tmpdir(), `nexus-${Date.now()}.png`); await page.screenshot({ path: file, fullPage: true }); return { file }; }
  else throw new Error(`Unsupported Chrome action: ${type}`);
  return { url: page.url(), title: await page.title().catch(() => '') };
}
app.get('/api/chrome/status', (_req, res) => json(res, { connected: Boolean(browserContext), profile: PROFILE, url: browserPage?.url() || '' }));
app.post('/api/chrome/connect', async (_req, res) => { try { const page = await getChrome(); json(res, { ok: true, url: page.url(), title: await page.title() }); } catch (e) { json(res, { error: e.message }, 500); } });
app.post('/api/chrome/action', async (req, res) => { try { json(res, { ok: true, result: await chromeAction(req.body || {}) }); } catch (e) { json(res, { error: e.message }, 500); } });

const DANGEROUS_SHELL = /(^|[&|;])\s*(del|erase|format|rd|rmdir|rm|shutdown|reboot|taskkill|diskpart)\b|\b(remove-item|set-content|clear-content|drop\s+table|truncate)\b|>\s*[A-Za-z]:/i;
function runShell(command, timeout = 30000) { return new Promise((resolve) => { const child = exec(command, { windowsHide: false, timeout: Math.min(Number(timeout) || 30000, 120000), maxBuffer: 2 * 1024 * 1024, cwd: process.cwd(), shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh' }, (error, stdout, stderr) => resolve({ ok: !error, code: error?.code ?? 0, stdout, stderr: stderr || (error ? error.message : '') })); }); }
app.post('/api/shell', async (req, res) => { const command = String(req.body.command || '').trim(); if (!command) return json(res, { error: 'command is required' }, 400); if (DANGEROUS_SHELL.test(command) && process.env.NEXUS_ALLOW_DANGEROUS !== '1') return json(res, { error: 'Blocked potentially destructive command. Set NEXUS_ALLOW_DANGEROUS=1 to explicitly enable it.' }, 403); json(res, await runShell(command, req.body.timeout)); });

function localPlan(prompt) {
  const text = String(prompt).trim();
  const steps = [];
  const url = text.match(/https?:\/\/[^\s]+/i)?.[0]?.replace(/[),.]+$/, '');
  if (url || /\b(open|go to|visit|navigate)\b/i.test(text)) {
    steps.push({ kind: 'chrome', type: 'navigate', url: url || 'https://www.google.com' });
  }
  if (/screenshot|screen shot|capture/i.test(text)) steps.push({ kind: 'chrome', type: 'screenshot' });
  const command = text.match(/(?:run|execute|shell command|command)\s*[:：]?\s*[\"']?(.+?)[\"']?$/i)?.[1];
  if (command && !DANGEROUS_SHELL.test(command)) steps.push({ kind: 'shell', command: command.trim(), timeout: 30000 });
  if (!steps.length) return { message: 'Offline mode is active. I can open URLs, take screenshots, and run safe local commands. Try: “open https://example.com” or “run node --version”.', steps: [] };
  return { message: `Offline plan: ${steps.length} local step${steps.length === 1 ? '' : 's'}.`, steps };
}
async function askLocalModel(prompt, jsonMode = false) {
  if (!LOCAL_MODEL) return null;
  try {
    const response = await fetch(LOCAL_AI_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: LOCAL_MODEL, prompt, stream: false, format: jsonMode ? 'json' : undefined, options: { temperature: 0.2 } }) });
    if (!response.ok) return null;
    const data = await response.json(); return data.response || data.message?.content || null;
  } catch { return null; }
}
async function askGemini(prompt) {
  const localFallback = async () => (await askLocalModel(prompt)) || `No online AI connection is available. NexusCommand is still running locally.\n\nRequest received: ${String(prompt).slice(0, 500)}`;
  if (OFFLINE || !process.env.GEMINI_API_KEY) return localFallback();
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(20000), body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2 } }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error?.message || `Gemini HTTP ${response.status}`); return data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || await localFallback();
  } catch { return localFallback(); }
}
function parsePlan(text) { const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/); if (!match) throw new Error('Gemini returned no executable plan'); return JSON.parse(match[1]); }
async function makeAgentPlan(prompt) {
  if (OFFLINE) {
    const localText = await askLocalModel(`You are an offline desktop automation planner. Return only valid JSON with {message,steps}. Allowed steps are chrome navigate/click/type/press/wait/back/screenshot and safe shell commands. Never delete data or request secrets. User task: ${prompt}`, true);
    if (localText) { try { return parsePlan(localText); } catch {} }
    return localPlan(prompt);
  }
  try {
    const planText = await askGemini(`You are NexusCommand, a local desktop automation planner. Return ONLY valid JSON. Schema: {\"message\":\"short explanation\",\"steps\":[{\"kind\":\"chrome\",\"type\":\"navigate|click|type|press|wait|back|screenshot\",...}|{\"kind\":\"shell\",\"command\":\"...\",\"timeout\":30000}]}. Use CSS selectors. Never request passwords, tokens, payment actions, destructive commands, arbitrary JavaScript/evaluate, or downloading untrusted executables. User task: ${prompt}`);
    const plan = parsePlan(planText); if (!Array.isArray(plan.steps) || plan.steps.length > 20) throw new Error('Invalid or oversized agent plan');
    return plan;
  } catch { return localPlan(prompt); }
}
async function executePlan(plan) {
  const results = [];
  for (const step of plan.steps) { if (step.kind === 'chrome') results.push({ step, result: await chromeAction(step) }); else if (step.kind === 'shell') { if (DANGEROUS_SHELL.test(String(step.command)) && process.env.NEXUS_ALLOW_DANGEROUS !== '1') throw new Error('Agent plan contained a blocked destructive shell command'); results.push({ step, result: await runShell(step.command, step.timeout) }); } else throw new Error('Unknown plan step kind'); }
  return { message: plan.message || 'Task complete.', results };
}
app.post('/api/agent/plan', async (req, res) => { const prompt = String(req.body.prompt || '').trim(); if (!prompt) return json(res, { error: 'prompt is required' }, 400); try { json(res, { plan: await makeAgentPlan(prompt) }); } catch (e) { json(res, { error: e.message }, 500); } });
app.post('/api/agent/run', async (req, res) => { const prompt = String(req.body.prompt || '').trim(); const plan = req.body.plan; if (!prompt || !plan || req.body.confirm !== true) return json(res, { error: 'A generated plan and explicit confirmation are required.' }, 400); const t = now(); const info = db.prepare('INSERT INTO nexus_tasks(prompt,status,result,created_at) VALUES(?,?,?,?)').run(prompt, 'running', JSON.stringify(plan), t); try { const result = await executePlan(plan); db.prepare('UPDATE nexus_tasks SET status=?,result=?,finished_at=? WHERE id=?').run('complete', JSON.stringify(result), now(), info.lastInsertRowid); json(res, { id: info.lastInsertRowid, ...result }); } catch (e) { db.prepare('UPDATE nexus_tasks SET status=?,result=?,finished_at=? WHERE id=?').run('failed', e.message, JSON.stringify({ plan, error: e.message }), now(), info.lastInsertRowid); json(res, { id: info.lastInsertRowid, error: e.message }, 500); } });
app.post('/api/ai/chat', async (req, res) => { try { json(res, { text: await askGemini(String(req.body.message || '')) }); } catch (e) { json(res, { error: e.message }, 500); } });

const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NexusCommand v4</title><style>
:root{color-scheme:dark;--bg:#080b1c;--panel:#111633;--line:#28305f;--muted:#8992bd;--a:#8b5cf6;--b:#22d3ee}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 80% 0,#1e1750 0,#080b1c 45%);color:#eef1ff;font:14px system-ui,Segoe UI,sans-serif}header{height:70px;border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 28px;background:#0b0f27e8;backdrop-filter:blur(12px)}h1{font-size:20px;letter-spacing:.08em;margin:0;color:#fff}h1 i{color:var(--b);font-style:normal}.layout{display:flex;min-height:calc(100vh - 70px)}nav{width:210px;border-right:1px solid var(--line);padding:22px 12px}nav button{display:block;width:100%;color:var(--muted);background:none;border:0;text-align:left;padding:12px 15px;border-radius:9px;cursor:pointer}nav button.active,nav button:hover{color:white;background:linear-gradient(90deg,#332474,#15234b);box-shadow:inset 2px 0 var(--b)}main{max-width:1000px;width:100%;padding:30px}section{display:none}section.active{display:block}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.card{background:#111633cc;border:1px solid var(--line);border-radius:13px;padding:18px;margin:12px 0;box-shadow:0 12px 30px #0002}.stat{font-size:28px;color:var(--b);font-weight:700}textarea,input{width:100%;background:#080d23;border:1px solid #303a70;border-radius:8px;padding:11px;color:white;outline:0}textarea:focus,input:focus{border-color:var(--b);box-shadow:0 0 0 2px #22d3ee22}button.go{background:linear-gradient(90deg,#6d36db,#157caa);border:0;color:white;border-radius:8px;padding:10px 16px;cursor:pointer}pre{white-space:pre-wrap;color:#b8c4f2;background:#080d23;border-radius:8px;padding:12px;min-height:70px}.muted{color:var(--muted)}.voice{float:right;background:none;border:0;color:var(--b);font-size:18px;cursor:pointer}@media(max-width:700px){nav{width:72px}nav button{font-size:0;text-align:center}nav button:first-letter{font-size:20px}main{padding:18px}}
</style></head><body><header><h1>NEXUS<i>COMMAND</i> <small class="muted">v4</small></h1><button id="voiceCommand" class="voice" title="Speak a command">🎙 Voice command</button><span style="margin-left:auto" class="muted">Hybrid · Dubai · <span id="clock"></span></span></header><div class="layout"><nav>${['Dashboard','Notes','Files','Browse','AI Chat','AI Agent','Settings'].map((x,i)=>`<button class="${i?'':'active'}" data-tab="${x.replace(' ','-').toLowerCase()}">${['◈','✎','▣','◎','✦','⚡','⚙'][i]} &nbsp;${x}</button>`).join('')}</nav><main>
<section id="dashboard" class="active"><h2>Command overview</h2><div class="grid"><div class="card"><div class="stat" id="snotes">0</div><div class="muted">Notes</div></div><div class="card"><div class="stat" id="sfiles">0</div><div class="muted">Files</div></div><div class="card"><div class="stat" id="stasks">0</div><div class="muted">Agent tasks</div></div></div><div class="card"><h3>Recent activity</h3><div id="activity" class="muted">Loading…</div></div></section>
<section id="notes"><h2>Notes</h2><div class="card"><input id="nt" placeholder="Title"><button class="voice" data-voice="nt">🎙</button><textarea id="nb" rows="5" placeholder="Write a note…"></textarea><button class="go" onclick="saveNote()">Save note</button></div><div id="notesList"></div></section>
<section id="files"><h2>Files</h2><div class="card"><input type="file" id="upload"><button class="go" onclick="uploadFile()">Upload</button></div><div id="filesList"></div></section>
<section id="browse"><h2>Browse</h2><div class="card"><p class="muted">Control the configured Chrome profile.</p><input id="url" placeholder="https://example.com"><button class="go" onclick="browse()">Open in Chrome</button><pre id="browseOut">Chrome is disconnected.</pre></div></section>
<section id="ai-chat"><h2>AI Chat <span class="muted">· Online + offline fallback</span></h2><div class="card"><textarea id="chat" rows="5" placeholder="Ask Gemini anything…"></textarea><button class="voice" data-voice="chat">🎙</button><button class="go" onclick="chat()">Send</button><pre id="chatOut"></pre></div></section>
<section id="ai-agent"><h2>AI Agent <span class="muted">· Chrome + shell</span></h2><div class="card"><p class="muted">Describe a task. The agent will show and execute a short, bounded plan.</p><textarea id="agent" rows="5" placeholder="Example: open example.com in Chrome"></textarea><button class="voice" data-voice="agent">🎙</button><button class="go" onclick="runAgent()">Run task</button><pre id="agentOut"></pre></div></section>
<section id="settings"><h2>Settings</h2><div class="card" id="settingsOut">Loading…</div></section></main></div><script>
const NEXUS_TOKEN=${JSON.stringify(ACCESS_TOKEN)};
const $=id=>document.getElementById(id);async function api(u,o={}){o.headers=Object.assign({},o.headers,{'Authorization':'Bearer '+NEXUS_TOKEN});let r=await fetch(u,o);let j=await r.json();if(!r.ok)throw Error(j.error||'Request failed');return j}function esc(s){return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}async function load(){let d=await api('/api/dashboard');$('snotes').textContent=d.stats.notes;$('sfiles').textContent=d.stats.files;$('stasks').textContent=d.stats.tasks;$('activity').innerHTML=d.tasks.length?d.tasks.map(x=>'<p><b>'+esc(x.status)+'</b> '+esc(x.prompt)+'</p>').join(''):'No activity yet.';let n=await api('/api/notes');$('notesList').innerHTML=n.map(x=>'<div class="card"><b>'+esc(x.title)+'</b><p class="muted">'+esc(x.body)+'</p></div>').join('');let f=await api('/api/files');$('filesList').innerHTML=f.map(x=>'<div class="card">'+esc(x.name)+' <span class="muted">('+x.size+' bytes)</span></div>').join('');let s=await api('/api/settings');$('settingsOut').innerHTML='<p>Provider: <b>'+esc(s.provider)+'</b></p><p>Model: '+esc(s.model)+'</p><p>Timezone: '+esc(s.timezone)+'</p><p>Chrome: '+esc(s.chromeProfile)+'</p>'}async function saveNote(){await api('/api/notes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:$('nt').value,body:$('nb').value})});$('nt').value='';$('nb').value='';load()}async function uploadFile(){let f=$('upload').files[0];if(!f)return;let x=new FormData();x.append('file',f);await api('/api/files',{method:'POST',body:x});load()}async function browse(){try{$('browseOut').textContent=JSON.stringify(await api('/api/chrome/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'navigate',url:$('url').value})}),null,2)}catch(e){$('browseOut').textContent=e.message}}async function chat(){try{$('chatOut').textContent=(await api('/api/ai/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:$('chat').value})})).text}catch(e){$('chatOut').textContent=e.message}}async function runAgent(){try{let prompt=$('agent').value.trim();if(!prompt)return;let p=await api('/api/agent/plan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt})});$('agentOut').textContent=JSON.stringify(p.plan,null,2)+'\n\nApprove this plan?';if(!confirm('Review the plan in the output, then click OK to execute it.'))return;let r=await api('/api/agent/run',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt,plan:p.plan,confirm:true})});$('agentOut').textContent=JSON.stringify(r,null,2);load()}catch(e){$('agentOut').textContent=e.message;load()}}document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button,section').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(b.dataset.tab).classList.add('active');load()});
function voice(el){if(!('webkitSpeechRecognition'in window||'SpeechRecognition'in window)){alert('Speech recognition is not supported in this browser.');return}let R=window.SpeechRecognition||window.webkitSpeechRecognition,r=new R();r.lang='en-AE';r.interimResults=false;r.onresult=e=>{let v=e.results[0][0].transcript;let start=el.selectionStart,end=el.selectionEnd;el.value=el.value.slice(0,start)+v+el.value.slice(end);el.dispatchEvent(new Event('input',{bubbles:true}))};r.start()}
function voiceCommand(){if(!('webkitSpeechRecognition'in window||'SpeechRecognition'in window)){alert('Speech commands need Chrome or Edge.');return}let R=window.SpeechRecognition||window.webkitSpeechRecognition,r=new R();r.lang='en-AE';r.interimResults=false;r.onstart=()=>$('voiceCommand').textContent='🔴 Listening…';r.onend=()=>$('voiceCommand').textContent='🎙 Voice command';r.onerror=e=>alert('Voice command error: '+e.error);r.onresult=async e=>{$('agent').value=e.results[0][0].transcript;$('ai-agent').classList.add('active');document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.tab==='ai-agent'));await runAgent()};r.start()}
$('voiceCommand').onclick=voiceCommand;document.querySelectorAll('[data-voice]').forEach(b=>b.onclick=()=>voice($(b.dataset.voice)));document.querySelectorAll('textarea,input[type=text]').forEach(el=>{if(!el.id)return;let b=document.createElement('button');b.className='voice';b.textContent='🎙';b.title='Voice input';b.onclick=()=>voice(el);el.parentNode.insertBefore(b,el.nextSibling)});setInterval(()=>{$('clock').textContent=new Intl.DateTimeFormat('en-AE',{timeZone:'Asia/Dubai',dateStyle:'medium',timeStyle:'short'}).format(new Date())},1000);load();</script></body></html>`;
app.use((_req, res) => res.type('html').send(html));
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => console.log(`NexusCommand v4 listening on http://0.0.0.0:${PORT} (${TZ})`));
process.on('SIGINT', async () => { if (browserContext) await browserContext.close().catch(() => {}); db.close(); server.close(() => process.exit(0)); });
