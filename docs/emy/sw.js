const C="emy-v1785714680307";
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
self.addEventListener("push",e=>{
  let d={title:"New gig",body:""};
  try{ d=e.data.json() }catch(_){ try{ d.body=e.data.text() }catch(__){} }
  e.waitUntil(self.registration.showNotification(d.title,{
    body:d.body, icon:"./icon.svg", badge:"./icon.svg",
    tag:d.id||"gig", renotify:true, vibrate:[120,60,120], data:d
  }));
});
self.addEventListener("notificationclick",e=>{e.notification.close();
  e.waitUntil(clients.matchAll({type:"window"}).then(l=>l.length?l[0].focus():clients.openWindow("./")))});
