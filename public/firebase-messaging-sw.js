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

const messaging = firebase.messaging();

// ----------------------------------------------------------
// FCM — Handle background messages
// ----------------------------------------------------------
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || '💧 Water Reminder';
  const notificationOptions = {
    body: payload.notification?.body || "Don't forget to drink your water!",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'water-reminder',
    renotify: true,
    actions: [
      { action: 'open', title: 'Open App' }
    ]
  };

  // NOTE: FCM otomatis menampilkan notifikasi jika payload berisi objek 'notification'.
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
// PWA CACHE — Install & cache static assets
// ----------------------------------------------------------
const CACHE_NAME = 'water-tracker-v15';
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