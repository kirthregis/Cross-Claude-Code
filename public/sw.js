/**
 * EMY Studio — service worker.
 * Runtime caching so the studio works offline after the first visit:
 *  - navigations: network-first, fall back to the last good page, then offline shell
 *  - hashed static assets: cache-first (they're immutable)
 *  - push notifications for future "ping when done" (Web Push)
 */
const VERSION = "emy-studio-v1";
const SHELL = "/studio";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) =>
      c
        .addAll([SHELL, "/"])
        .catch(() => {})
        .then(() => self.skipWaiting()),
    ),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API calls always go to network (never cached)
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches
            .match(req)
            .then((r) => r || caches.match("/"))
            .then((r) => r || caches.match(SHELL)),
        ),
    );
    return;
  }

  // static assets (hashed by Next) — cache-first
  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|jpe?g|webp|woff2?|ico|mp3|wav)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          }),
      ),
    );
    return;
  }
});

self.addEventListener("push", (e) => {
  let payload: { title?: string; body?: string; tag?: string; url?: string } = {};
  try {
    payload = e.data?.json() ?? {};
  } catch {
    payload = { body: e.data?.text() ?? "" };
  }
  e.waitUntil(
    self.registration.showNotification(payload.title || "EMY Studio", {
      body: payload.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: payload.tag || "emy-studio",
      renotify: true,
      vibrate: [120, 60, 120],
      data: payload,
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = e.notification.data?.url || "/studio";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
