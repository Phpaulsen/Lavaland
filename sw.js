/* Offline-Betrieb: Die Seite selbst kommt zuerst aus dem Netz (damit Updates ankommen), sonst aus dem Cache. Alles andere kommt aus dem Cache und wird bei Bedarf nachgeladen. */
const CACHE='lavaland-v1';
const CORE=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch',function(e){
  const rq=e.request;
  if(rq.method!=='GET') return;
  if(rq.mode==='navigate'){
    e.respondWith(fetch(rq).then(function(r){
      if(r.ok){ const cp=r.clone(); caches.open(CACHE).then(function(c){ c.put('./index.html',cp); }); }
      return r;
    }).catch(function(){
      return caches.match('./index.html').then(function(r){ return r||caches.match('./'); });
    }));
    return;
  }
  e.respondWith(caches.match(rq).then(function(hit){
    const net=fetch(rq).then(function(r){
      if(r.ok||r.type==='opaque'){ const cp=r.clone(); caches.open(CACHE).then(function(c){ c.put(rq,cp); }); }
      return r;
    });
    if(hit){ net.catch(function(){}); return hit; }
    return net;
  }));
});
