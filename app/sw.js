/* OP% · service worker: o app abre sem internet.
   Páginas: tenta a rede primeiro (para receber atualizações) e cai no cache se estiver offline.
   Demais arquivos (ícones, fontes): cache primeiro. O dado do usuário não passa por aqui (fica no localStorage). */
const CACHE = 'op-baa99c7eb0';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 4000);
      try {
        const res = await fetch(req, { signal: ctl.signal, cache: 'no-cache' });
        clearTimeout(t);
        if (res && res.ok) { const c = await caches.open(CACHE); c.put('index.html', res.clone()); }
        return res;
      } catch (err) {
        clearTimeout(t);
        return (await caches.match('index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => hit || Response.error())));
  }
});
