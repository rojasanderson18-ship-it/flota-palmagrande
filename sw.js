/* v2: cache "network-first". Con "cache-first" (v1), una vez que el
   navegador tenía el HTML guardado, nunca volvía a pedirlo — los cambios
   publicados quedaban invisibles para quien ya había abierto la app antes,
   sin importar cuántas veces recargara. Ahora siempre se intenta la red
   primero (y se actualiza la caché), y solo se usa lo guardado si no hay
   conexión. Subir este número de versión cuando cambie esta lógica, para
   que "activate" limpie la caché vieja de quien ya tenía la app instalada. */
const CACHE = 'flota-palmagrande-v2';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(claves => Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copia = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
