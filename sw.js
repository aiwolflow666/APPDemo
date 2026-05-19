var CACHE_NAME = 'toeic-pwa-v1';
var ASSETS = [
  '/',
  '/index.html',
  '/vocabulary_app.html',
  '/practice_coach.html',
  '/vocab_story.html',
  '/question_batch_generator.html',
  '/question_bank.html',
  '/js/db.js',
  '/js/sql-wasm.js',
  '/js/sql-wasm.wasm',
  '/word_database.json',
  '/toeic_questions_sample.json',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var fetchPromise = fetch(e.request).then(function(resp) {
        if (resp && resp.status === 200) {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return resp;
      }).catch(function() {
        return cached;
      });
      return cached || fetchPromise;
    })
  );
});
