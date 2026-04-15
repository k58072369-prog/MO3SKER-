/* =========================================
   MO3SKER — Service Worker
   تطوير بواسطة المبرمج ادهم ايمن
   ========================================= */

const CACHE_NAME = 'mo3sker-v1.2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/logo.svg',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Cairo:wght@400;700;900&family=JetBrains+Mono:wght@700&display=swap'
];

// --- Install: Cache Core Assets ---
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE.filter(url => !url.startsWith('http')));
    }).then(() => self.skipWaiting())
  );
});

// --- Activate: Clean Old Caches ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// --- Fetch: Serve from Cache, fallback to Network ---
self.addEventListener('fetch', event => {
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Fetch from network and cache dynamically
      return fetch(event.request).then(response => {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
