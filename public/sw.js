// ============================================================
// SERVICE WORKER — Water Tracker PWA
// Handles both caching AND push notifications
// Bump CACHE_NAME version string every time you deploy a
// breaking change so old caches are automatically cleared.
// ============================================================
const CACHE_NAME = 'water-tracker-v8';

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
// FIREBASE MESSAGING (Push Notifications)
// ----------------------------------------------------------
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

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || '💧 Water Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'Jangan lupa minum air ya!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'water-reminder',
    renotify: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
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

  // Skip non-same-origin requests (Firebase, Google APIs, etc.)
  if (url.origin !== location.origin) return;

  // STRATEGY 1: Network First for HTML navigation
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

  // STRATEGY 2: Cache First for everything else
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
