// ============================================================
// FIREBASE MESSAGING SERVICE WORKER
// Handles push notifications when the app is in the background
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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || '💧 Water Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'Jangan lupa minum air ya!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'water-reminder',
    renotify: true,
    actions: [
      { action: 'open', title: 'Buka App' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
