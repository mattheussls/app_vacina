const CACHE_NAME = 'vacinas-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/detalhar_cidadao.html',
  '/js/db.js',
  '/js/dashboard.js',
  '/js/detalhar_cidadao.js',
  '/js/vacinas_regras.js',
  '/img/logo.png',
  '/img/fundo.png',
  // Adicione mais arquivos se precisar
];

// Instala o Service Worker e faz cache dos arquivos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Abrindo cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Pega as requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se encontrar no cache, retorna
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Atualiza o cache se necessário
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
