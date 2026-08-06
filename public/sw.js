const STATIC_V = "emy-v8";
const DYNAMIC_V = "emy-dyn-v8";
const OFFLINE_URL = "/studio";
const PRECACHE = [
  "/studio",
  "/studio/gigradar",
  "/studio/analytics",
  "/studio/distribute",
  "/studio/community",
  "/studio/epk",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(STATIC_V).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url).catch(() => null)))
    )
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== STATIC_V && k !== DYNAMIC_V).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.protocol === "chrome-extension:") return;
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(DYNAMIC_V).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match(OFFLINE_URL);
          return fallback ?? new Response("<!DOCTYPE html><html><head><meta charset=utf-8><title>EMY Studio</title></head><body style='background:#0a0a0f;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:12px'><div style='font-size:48px'>🎧</div><div style='font-size:18px;font-weight:bold'>EMY Studio</div><div style='color:#71717a'>You are offline. Connect and refresh.</div><a href='/studio' style='margin-top:16px;background:#7c3aed;color:#fff;padding:10px 24px;border-radius:12px;text-decoration:none'>Open Studio</a></body></html>", { status: 200, headers: { "Content-Type": "text/html" } });
        })
    );
    return;
  }
  e.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) caches.open(DYNAMIC_V).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => cached ?? new Response("", { status: 408 }));
      return cached ?? network;
    })
  );
});
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});
