self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('Service Worker Aktif!');
});

self.addEventListener('fetch', (e) => {
  // Biarkan fetch berjalan normal
});
