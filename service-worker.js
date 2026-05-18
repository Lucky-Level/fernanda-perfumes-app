/* Fernanda · Service Worker — cache-first for shell assets */
const CACHE = 'fernanda-v2';
const SHELL = [
  './',
  './index.html',
  './admin.html',
  './manifest.json',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './js/supabase-config.js',
  './js/data.js',
  './js/icons.js',
  './js/app.js',
  './js/admin.js',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => cached)
    )
  );
});
