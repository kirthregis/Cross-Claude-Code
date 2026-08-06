const STATIC = "emy-v9";
const DYN = "emy-dyn-v9";
const SHELL = "/studio";
const PRE = ["/studio","/studio/gigradar","/studio/analytics","/studio/distribute","/studio/community","/studio/epk","/manifest.json","/icon-192.png","/icon-512.png"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(STATIC).then(c => Promise.allSettled(PRE.map(u => c.add(u).catch(() => null)))));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== STATIC && k !== DYN).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(req).catch(() => new Response(JSON.stringify({error:"offline"}), {status:503,headers:{"Content-Type":"application/json"}})));
    return;
  }
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) caches.open(DYN).then(c => c.put(req, res.clone()));
        return res;
      }).catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        const shell = await caches.match(SHELL);
        return shell ?? new Response("<!DOCTYPE html><html><head><meta charset=utf-8><title>EMY Studio</title></head><body style='background:#0a0a0f;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px'><img src='/icon-192.png' style='width:64px;border-radius:16px'><div style='font-size:20px;font-weight:900'>EMY Studio</div><div style='color:#71717a;font-size:14px'>You are offline. Reconnect and refresh.</div><a href='/studio' style='background:#7c3aed;color:#fff;padding:10px 28px;border-radius:12px;text-decoration:none;font-weight:700'>Open Studio</a></body></html>", {status:200,headers:{"Content-Type":"text/html"}});
      })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res.ok) caches.open(DYN).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => cached ?? new Response("", {status:408}));
      return cached ?? net;
    })
  );
});

self.addEventListener("message", e => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push", e => {
  const d = e.data ? e.data.json() : {title:"EMY Studio",body:"New update"};
  e.waitUntil(self.registration.showNotification(d.title, {body:d.body,icon:"/icon-192.png"}));
});
