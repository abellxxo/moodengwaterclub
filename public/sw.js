// ============================================================
// SERVICE WORKER — Water Tracker PWA
// Handles both caching AND push notifications
// ============================================================
const CACHE_NAME = 'water-tracker-v9';

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
// PUSH NOTIFICATIONS (raw Web Push — works on iOS + Android)
// ----------------------------------------------------------
self.addEventListener('push', (event) => {
  console.log('[sw.js] Push event received:', event);

  let title = '💧 Water Reminder';
  let options = {
    body: 'Jangan lupa minum air ya!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'water-reminder',
    renotify: true,
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.notification?.title || title;
      options.body = payload.notification?.body || options.body;
      if (payload.notification?.image) {
        options.image = payload.notification.image;
      }
    } catch (e) {
      // If not JSON, use as text
      options.body = event.data.text() || options.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// ----------------------------------------------------------
// TRY loading Firebase Messaging for additional features
// (may fail silently on iOS — that's OK, raw push above handles it)
// ----------------------------------------------------------
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

  firebase.initializeApp({
    apiKey: 'AIzaSyAt7roNCIyeOKjNHx7lZXJ3DFULmCak1uw',
    authDomain: 'water-tracker-kita.firebaseapp.com',
    projectId: 'water-tracker-kita',
    storageBucket: 'water-tracker-kita.firebasestorage.app',
    messagingSenderId: '1065083698538',
    appId: '1:1065083698538:web:0198badb0d75388e4db913'
  });

  firebase.messaging();
  console.log('[sw.js] Firebase Messaging initialized');
} catch (err) {
  console.log('[sw.js] Firebase Messaging not available, using raw push only:', err.message);
}

// ----------------------------------------------------------
// INSTALL — pre-cache all static assets
// ----------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
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
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ----------------------------------------------------------
// FETCH — serve from cache when possible
// ----------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) return;

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

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      });
    })
  );
});
