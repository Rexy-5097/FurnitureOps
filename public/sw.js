// Self-unregistering service worker
// Clears all caches and unregisters itself to remove stale framer-motion bundles
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            return self.registration.unregister();
        }).then(() => {
            return self.clients.matchAll();
        }).then((clients) => {
            clients.forEach((client) => client.navigate(client.url));
        })
    );
});