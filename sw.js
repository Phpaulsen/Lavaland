/* Offline-Betrieb: Die Seite selbst kommt zuerst aus dem Netz (damit Updates ankommen), sonst oder bei zu langsamem Netz aus dem Cache. Alles andere kommt aus dem Cache und wird bei Bedarf nachgeladen. */
const CACHE='lavaland-v4';
const CORE=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./fonts/andika-400.woff2','./fonts/andika-700.woff2'];

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
    /* Netz zuerst, damit Updates ankommen. Bei schwachem Netz wartet das Kind aber höchstens 4 Sekunden, dann startet die gespeicherte Seite; die neue landet trotzdem im Speicher und gilt beim nächsten Start.
       Antwortet der Server mit einem Fehler (etwa GitHub gestört), startet ebenfalls die gespeicherte Seite statt einer Fehlerseite. */
    const cached=function(){ return caches.match('./index.html').then(function(r){ return r||caches.match('./'); }); };
    const net=fetch(rq);
    e.waitUntil(net.then(function(r){ if(r.ok){ const cp=r.clone(); return caches.open(CACHE).then(function(c){ return c.put('./index.html',cp); }); } }).catch(function(){}));
    e.respondWith(new Promise(function(res,rej){
      let done=false;
      const give=function(r){ if(!done&&r){ done=true; res(r); } };
      const t=setTimeout(function(){ cached().then(give); },4000);
      net.then(function(r){
        if(r.ok){ clearTimeout(t); give(r); return; }
        cached().then(function(c){ clearTimeout(t); give(c||r); });
      },function(){
        clearTimeout(t); cached().then(function(c){ if(c) give(c); else if(!done){ done=true; rej(new Error('offline')); } });
      });
    }));
    return;
  }
  e.respondWith(caches.match(rq).then(function(hit){
    const net=fetch(rq).then(function(r){
      /* Undurchsichtige Antworten (fremde Server ohne CORS) zählen im Speicher bis zu mehrere MB und könnten den Spielstand verdrängen. */
      if(r.ok&&(r.type==='basic'||r.type==='cors')){ const cp=r.clone(); caches.open(CACHE).then(function(c){ c.put(rq,cp); }); }
      return r;
    });
    if(hit){ net.catch(function(){}); return hit; }
    return net;
  }));
});
