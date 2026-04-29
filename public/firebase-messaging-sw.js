// ============================================================
// UNIFIED SERVICE WORKER — Firebase Messaging + PWA Cache
// This single file handles both FCM push notifications AND caching
// ============================================================

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

// Initialize messaging so FCM can register with the push service
const messaging = firebase.messaging();

// Suppress FCM SDK auto-display of notifications (prevents duplicates)
messaging.onBackgroundMessage(() => {
  // Do nothing — our raw 'push' handler below handles everything.
});

// ----------------------------------------------------------
// FCM — Handle background push using raw 'push' event
// We use DATA-ONLY payloads from the server (no 'notification' key)
// so FCM SDK won't auto-display. Only this handler shows notifications.
// iOS 16.4+ requires explicit event.waitUntil() to avoid
// "silent push" permission revocation.
// ----------------------------------------------------------
self.addEventListener('push', (event) => {
  let title = 'Water Reminder';
  let body = "Don't forget to drink your water!";
  let data = {};

  if (event.data) {
    try {
      const payload = event.data.json();

      // FCM data-only messages put content under payload.data
      // FCM notification messages put content under payload.notification
      // We check both for maximum compatibility
      const d = payload.data || {};
      const n = payload.notification || {};

      title = d.title || n.title || title;
      body = d.body || n.body || body;
      data = d;

      // If this is an FCM message that the SDK already displayed
      // (has notification key AND isFirebaseMessaging flag), skip to avoid double
      if (payload.notification && payload.isFirebaseMessaging) {
        return;
      }
    } catch (e) {
      try {
        body = event.data.text() || body;
      } catch (e2) {
        // Use defaults
      }
    }
  }

  const notificationOptions = {
    body: body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'water-reminder',
    renotify: true,
    data: data,
  };

  // CRITICAL: event.waitUntil() is REQUIRED on iOS.
  event.waitUntil(
    self.registration.showNotification(title, notificationOptions).then(() => {
      // Set app badge on home screen icon (iOS 16.4+ / supported browsers)
      if (self.navigator && 'setAppBadge' in self.navigator) {
        return self.navigator.setAppBadge(1);
      }
    })
  );
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
// PWA CACHE — Install & cache static assets
// ----------------------------------------------------------
const CACHE_NAME = 'water-tracker-v18';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-origin requests (Firebase, Firestore, CDN, dsb.)
  if (url.origin !== location.origin) return;

  // Skip API routes
  if (url.pathname.startsWith('/api/')) return;

  // Hanya cache aset statis
  const isStatic = /\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/.test(url.pathname);

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
        if (res && res.ok && isStatic) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      });
    })
  );
});