/* Offline cache. The version changes whenever the page changes, so an update replaces the old copy. */
const CACHE = 'pokedex-26228052d5';
const ASSETS = ["./", "index.html", "fonts.css", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "fonts/PressStart2P-latin-ext.woff2", "fonts/PressStart2P-latin.woff2", "fonts/VT323-latin-ext.woff2", "fonts/VT323-latin.woff2", "fonts/VT323-vietnamese.woff2"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  /* page itself: try the network first so updates arrive, fall back to the saved copy when offline */
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./', copy)); return r; })
      .catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
