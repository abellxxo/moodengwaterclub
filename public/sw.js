// This service worker has been deprecated.
// All functionality has moved to firebase-messaging-sw.js
// This file will auto-unregister itself from any browser that still has it.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => {
      return self.clients.matchAll({ type: 'window' });
    }).then((clients) => {
      clients.forEach(client => client.navigate(client.url));
    })
  );
});
