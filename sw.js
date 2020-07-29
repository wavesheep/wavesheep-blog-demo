const CACHE_NAME = 'wavesheep-blog-v1';
const preCache = [
  '/js/sw-register.js',
  '/js/snackbar.js',
  '/css/snackbar.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(function (cache) {
      return cache.addAll(preCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (preCache.indexOf(event.request.url) !== -1) { // cache only
    event.respondWith(
      caches.match(event.request)
    )
  } else if (event.request.url.startsWith(self.location.origin) && event.request.url !== self.location.origin + '/' ||
    event.request.url.startsWith('https://cdn.jsdelivr.net')) { // runtime cache
    event.respondWith(
      caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            const responseToCache = response.clone();

            event.waitUntil(
              caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
            )

            return response;
          });
      })
    )
  } else if (event.request.url === self.location.origin + '/') { // stale while revalidate
    const cached = caches.match(event.request);
    const fetched = fetch(event.request.clone()).catch(_ => cached);
    const fetchedCopy = fetched.then(resp => resp.clone());

    event.respondWith(
      caches.match(event.request)
      .then(response => {
        if (response) {
          event.waitUntil(
            fetched.then(fetchedResponse => {
              const fetchedETag = fetchedResponse.headers.get('etag');
              const cachedETag = response.headers.get('etag');

              if (fetchedETag !== cachedETag) {
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, fetchedResponse);
                  })
                  .then(async () => {
                    setTimeout(() => {
                      self.clients.matchAll().then(clients => {
                        clients.forEach(client => {
                          client.postMessage({
                            'command': 'UPDATE_FOUND'
                          })
                        })
                      })
                    }, 2000)
                  })
              }
            })
          )
          return response;
        }
        event.waitUntil(
          fetchedCopy.then(response => {
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, response);
              })
          })
        )
        return fetched;
      })
    )
  } else { // network only
    event.respondWith(
      fetch(event.request).catch(_ => {})
    )
  }
});
