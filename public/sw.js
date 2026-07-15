// Service worker simples para deixar o app utilizável offline após a 1ª visita.
// Estratégia: precache das rotas do app; navegações = network-first com fallback
// ao cache DA PRÓPRIA URL (nunca servir o Início no lugar de outra tela);
// demais assets same-origin = stale-while-revalidate.
const CACHE = 'bgs-v2';

// Com trailingSlash, cada rota é uma pasta com index.html.
const ROUTES = [
  '/',
  '/historico/',
  '/partida/',
  '/novo/flip7/',
  '/novo/catan/',
  '/novo/azul/',
  '/novo/ticket-to-ride/',
  '/novo/trio/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ROUTES).catch(() => cache.add('/')))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          // Guarda pela rota (sem query) para /partida/?id=x reusar /partida/.
          caches.open(CACHE).then((cache) => cache.put(url.pathname, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request, { ignoreSearch: true })
            // Último recurso (rota nunca visitada, offline): o Início.
            .then((cached) => cached || caches.match('/')),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
