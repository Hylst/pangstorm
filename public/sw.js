const CACHE_NAME = 'pang-genesis-v3';
const STATIC_ASSETS = [
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'favicon-CN3bKwYv.webp',
  'og-image.png',
  'images/bg_level1.webp',
  'images/bg_level2.webp',
  'images/bg_level3.webp',
  'images/bg_level4.webp',
  'images/bg_level5.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    }).catch((err) => {
      console.error('[Pang SW] Install failed:', err);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('chrome-extension')) return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        if (response && response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      } catch {
        const fallback = await caches.match('index.html');
        if (fallback) return fallback;
        return new Response('Offline', { status: 503 });
      }
    })()
  );
});
