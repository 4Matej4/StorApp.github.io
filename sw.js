const CACHE_NAME = 'storapp-cache';


// Use the install event to pre-cache all initial resources.
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    cache.addAll([
      '/',
      '/index.html',
      '/Views/crop.html',
      '/Views/export.html',
      '/Views/field.html',
      '/Views/mainRecord.html',
      '/Views/storage.html',
      '/Styles/crop.css',
      '/Styles/export.css',
      '/Styles/field.css',
      '/Styles/mainRecord.css',
      '/Styles/mainScreenCss.css',
      '/Styles/storage.css',
      '/Scipts/indexDB.js',
      '/Scipts/mainScreen.js',
      '/Scipts/table2excel.js',
      '/Scipts/addScripts/addCrop.js',
      '/Scipts/addScripts/addField.js',
      '/Scipts/addScripts/addRecord.js',
      '/Scipts/addScripts/addStorage.js',
      '/Scipts/exports/export.js',
      '/Assets/barn.png',
      '/Assets/crop.png',
      '/Assets/edit.png',
      '/Assets/field.png',
      '/Assets/left-arrow.png',
      '/Assets/record.png',
      '/Assets/trash.png',
    ]);
  })());
});

self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Get the resource from the cache.
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    } else {
        try {
          // If the resource was not in the cache, try the network.
          const fetchResponse = await fetch(event.request);

          // Save the resource in the cache and return it.
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        } catch (e) {
          // The network failed.
        }
    }
  })());
});

