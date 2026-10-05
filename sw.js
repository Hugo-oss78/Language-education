// Service worker : permet d'utiliser l'application hors ligne.
// Pense à changer VERSION à chaque mise à jour des fichiers.
const VERSION = 'lingua-v10';
const FILES = [
  './',
  'index.html',
  'css/style.css',
  'css/kids.css',
  'js/app.js',
  'js/srs.js',
  'js/text.js',
  'js/storage.js',
  'js/exercises.js',
  'js/icons.js',
  'js/path.js',
  'js/lookup.js',
  'js/translate.js',
  'js/kids/engine.js',
  'js/kids/store.js',
  'js/kids/ui.js',
  'data/languages.js',
  'data/en.js',
  'data/es.js',
  'data/id.js',
  'data/ne.js',
  'data/ar.js',
  'data/kids/en.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'fonts/fraunces-latin-600-normal.woff2',
  'fonts/fraunces-latin-700-normal.woff2',
  'fonts/ibm-plex-sans-latin-400-normal.woff2',
  'fonts/ibm-plex-sans-latin-500-normal.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Réseau d'abord (pour avoir les mises à jour), cache si hors ligne.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        if (response.ok) caches.open(VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true })),
  );
});
