const CACHE = "emy-studio-v3";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["/studio", "/studio/gigradar", "/studio/analytics"])));
});
self.addEventListener("push", e => {
  const data = e.data ? e.data.json() : { title: "EMY Studio", body: "New update available" };
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/icon-192.png" }));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(c => c ?? fetch(e.request)));
});