const CACHE_NAME = 'wavesheep-blog-v1';
const selfToCache = [
  '/js/sw-register.js',
  '/js/snackbar.js',
  '/css/snackbar.css'
].map((url) => self.location.origin + url);

const thirdPartToCache = [
  '//cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.1.2/build/styles/atom-one-dark.min.css',
  '//cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
  '//cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Zero.woff',
  '//cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Math-Italic.woff',
  '//cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Main-Regular.woff'
].map((url) => self.location.protocol + url);

const urlsToCache = selfToCache.concat(thirdPartToCache);

self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(function (cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (urlsToCache.indexOf(event.request.url) !== -1) { // cache only
    event.respondWith(
      caches.match(event.request)
    )
  } else if (event.request.url.startsWith(self.location.origin) && event.request.url !== self.location.origin + '/' ||
    event.request.url.startsWith('https://cdn.jsdelivr.net/gh/twitter/')) { // runtime cache
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
              // console.log(event.request.url, fetchedETag, cachedETag)

              if (fetchedETag !== cachedETag) {
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, fetchedResponse);
                  })
                  .then(async () => {
                    setTimeout(() => {
                      self.clients.matchAll().then(clients => {
                        clients.forEach(client => {
                          console.log(client);
                          client.postMessage({
                            'command': 'UPDATE_FOUND'
                          })
                        })
                      })
                    }, 5000)
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
  } else { // network first
    event.respondWith(
      fetch(event.request).catch(_ => {})
    )
  }
});
