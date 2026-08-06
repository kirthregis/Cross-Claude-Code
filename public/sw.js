const STATIC = "emy-v10";
const DYN = "emy-dyn-v10";
const SHELL = "/studio";
const PRE = ["/studio","/studio/gigradar","/studio/analytics","/studio/distribute","/studio/community","/studio/epk","/manifest.json","/icon-192.png","/icon-512.png"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(STATIC).then(c => Promise.allSettled(PRE.map(u => c.add(u).catch(() => null)))));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== STATIC && k !== DYN).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.protocol === "chrome-extension:") return;

  // API routes: always network, never cache, never clone
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(req).catch(() => new Response(JSON.stringify({error:"offline"}), {
        status: 503,
        headers: {"Content-Type": "application/json"}
      }))
    );
    return;
  }

  // Navigation: network first, fallback to cache, fallback to shell
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(DYN).then(c => c.put(req, clone));
        }
        return res;
      }).catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        const shell = await caches.match(SHELL);
        return shell ?? new Response("Offline", {status:503});
      })
    );
    return;
  }

  // Static assets: cache first, background revalidate
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(DYN).then(c => c.put(req, clone));
        }
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