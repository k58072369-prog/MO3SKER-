/* =========================================
   MO3SKER — Service Worker (Fixed)
   تطوير بواسطة المبرمج ادهم ايمن
   ========================================= */

const CACHE_NAME = 'mo3sker-v2.0';
const ASSETS_TO_CACHE = [
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './logo.svg',
  './icon-192.png',
  './icon-512.png'
];

// --- Install: Cache Core Assets ---
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      // Cache each asset individually so one failure doesn't break all
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Failed to cache:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// --- Activate: Clean Old Caches ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[SW] Deleting old cache:', key);
          return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// --- Fetch: Cache First, then Network, fallback to index.html ---
self.addEventListener('fetch', event => {
  // Skip non-GET and non-http(s) requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // For navigation requests (HTML pages) — always serve index.html (SPA fallback)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(cached => {
        if (cached) return cached;
        return fetch('./index.html').catch(() => {
          return new Response('<h1>Offline</h1><p>يرجى الاتصال بالإنترنت.</p>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        });
      })
    );
    return;
  }

  // For all other requests: cache-first, then network, then cache the result
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // For images, return a transparent 1x1 fallback
        if (event.request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      });
    })
  );
});
