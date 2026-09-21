const CACHE = 'cv-match-studio-v1';
const APP = ['./', './index.html', './css/styles.css', './js/app.js', './js/analyser.js', './js/data.js', './js/exporter.js', './js/parsers.js', './manifest.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
  if (event.request.method === 'GET' && response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
  return response;
}))));
