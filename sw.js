/* PWA NOCTURNA — almacenamiento limitado a documentos y recursos estáticos.
   Nunca interceptar Supabase ni almacenar solicitudes autenticadas. */
const VERSION='nocturna-static-v2';
const SHELL=['./','./index.html','./musica.html','./explorar.html','./perfil.html','./styles.css','./revamp.css','./config.js','./app.js','./manifest.webmanifest','./assets/nocturna-192.png','./assets/nocturna-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nocturna-static-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const r=event.request;
 if(r.method!=='GET'||r.cache==='no-store'||r.headers.has('Authorization'))return;
 const url=new URL(r.url);
 if(url.origin!==self.location.origin||url.pathname.includes('/admin')||url.pathname.includes('/api/'))return;
 if(r.mode==='navigate'){
   event.respondWith(fetch(r).then(response=>{if(response.ok){const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(r,copy))}return response}).catch(()=>caches.match(r).then(x=>x||caches.match('./index.html'))));return;
 }
 if(/\.(?:html|css|js|json|webmanifest|svg|png|ico|woff2?)$/i.test(url.pathname)){
   event.respondWith(fetch(r).then(response=>{if(response.ok){const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(r,copy))}return response}).catch(()=>caches.match(r)));
 }
});
