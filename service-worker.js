self.addEventListener('install', (e) => {
    e.waitUntil(
      caches.open('vacinas-cache').then((cache) => {
        return cache.addAll([
          'index.html',
          'register.html',
          'dashboard.html',
          'db.js',
          'styles.css'
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', (e) => {
    e.respondWith(
      caches.match(e.request).then((response) => {
        return response || fetch(e.request);
      })
    );
  });
  