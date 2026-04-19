// ============================================================
// UNIFIED SERVICE WORKER
// Firebase Messaging + PWA Cache
// FINAL PRODUCTION VERSION
// ============================================================

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAt7roNCIyeOKjNHx7lZXJ3DFULmCak1uw",
  authDomain: "water-tracker-kita.firebaseapp.com",
  projectId: "water-tracker-kita",
  storageBucket: "water-tracker-kita.firebasestorage.app",
  messagingSenderId: "1065083698538",
  appId: "1:1065083698538:web:0198badb0d75388e4db913",
});

const messaging = firebase.messaging();

// ============================================================
// FCM background handler
// ============================================================
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message received:", payload);

  const notificationTitle =
    payload.notification?.title || "💧 Water Reminder";

  const notificationOptions = {
    body:
      payload.notification?.body || "Don't forget to drink your water!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.notification?.tag || "water-reminder",
    renotify: true,
    requireInteraction: true,
    data: {
      url: "/",
    },
    actions: [
      { action: "open", title: "Open App" },
    ],
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// ============================================================
// Notification click handler
// ============================================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const sameOrigin = client.url.startsWith(self.location.origin);

        if (sameOrigin && "focus" in client) {
          if ("navigate" in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});

// ============================================================
// PWA cache
// ============================================================
const CACHE_NAME = "water-tracker-v14";
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  const isStatic = /\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/i.test(url.pathname);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response && response.ok && isStatic) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});