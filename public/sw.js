const CACHE_NAME = "emy-studio-v13-live";
const PRECACHE_URLS = ["/icon-192.png", "/icon-512.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((n) => n !== CACHE_NAME ? caches.delete(n) : undefined)))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((cls) => cls.forEach((c) => c.postMessage({ type: "SW_UPDATED" })))
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(
    fetch(event.request)
      .then((r) => { if (r.ok) { const cl = r.clone(); caches.open(CACHE_NAME).then((c) => c.put(event.request, cl)); } return r; })
      .catch(() => caches.match(event.request).then((c) => c || caches.match("/studio")))
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "EMY Studio", body: "New update available" };
  try { if (event.data) data = event.data.json(); } catch { if (event.data) data.body = event.data.text(); }
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/icon-192.png", badge: "/icon-192.png", data }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((list) => {
      for (const c of list) { if (c.url.includes("/studio") && "focus" in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow("/studio");
    })
  );
});
