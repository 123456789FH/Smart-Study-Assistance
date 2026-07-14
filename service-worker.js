const CACHE_NAME = 'smart-study-plans-v4-corrected';
const ASSETS = [
  './', './index.html', './styles.css?v=4', './app.js?v=4', './manifest.webmanifest',
  './assets/icon-192.png', './assets/icon-512.png', './assets/guide.pdf',
  './assets/forum-logo-circle.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network first prevents an old app.js or index.html from remaining visible
  // after a corrected version is uploaded. The cache remains the offline fallback.
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || (request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
