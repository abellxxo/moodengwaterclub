// ============================================================
// SERVICE WORKER — Water Tracker PWA
// Bump CACHE_NAME version string every time you deploy a
// breaking change so old caches are automatically cleared.
// ============================================================
const CACHE_NAME = 'water-tracker-v6';

// Assets to download & cache immediately on first install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/hippomini.png',
  '/hippo-splash.png',
  '/hippo-landing.webp',
  '/icon-192.png',
  '/icon-512.png',
];

// ----------------------------------------------------------
// INSTALL — pre-cache all static assets
// ----------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()) // activate immediately, don't wait for old SW to die
  );
});

// ----------------------------------------------------------
// ACTIVATE — delete old caches from previous versions
// ----------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME) // delete anything that's not current version
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

// ----------------------------------------------------------
// FETCH — serve from cache when possible
// ----------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-same-origin requests (Firebase, Google APIs, etc.)
  // Let those always go directly to network
  if (url.origin !== location.origin) return;

  // STRATEGY 1: Network First for HTML navigation
  // Always try to get the freshest HTML so users get app updates.
  // Fall back to cached index.html if offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // STRATEGY 2: Cache First for everything else (images, JS, CSS)
  // Serve from cache instantly. If not cached yet, fetch from network
  // and store in cache for next time.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((res) => {
        // Only cache valid responses
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      });
    })
  );
});
