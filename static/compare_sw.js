"use strict";

const broadcast = new BroadcastChannel("sw-channel");
const cacheName =  "v20";
const cacheList = [
  "/",
  "/offline/",
  "/404.html",
  "/notifications.js",
  "/manifest.json",
];

oninstall = (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      await cache.addAll(cacheList).catch((error) => {
        broadcast.postMessage({ type: "SW_INSTALL_ERR" });
        console.error("Service worker failed", error);
        return;
      });
    })(),
  );

  broadcast.postMessage({ type: "SW_INSTALL_FINISH" });
};

onfetch = (event) => {
  try {
    const reqUrl = new URL(event.request.url);
    if (reqUrl.hostname === "matrix.cactus.chat") {
      return;
    }
  } catch (e) {
    return;
  }

  console.log("Fetching", event.request.url);
  event.respondWith(
    caches.open(cacheName).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status < 400) {
            console.log("Caching the response to", event.request.url);
            cache.put(event.request, networkResponse.clone());
          } else {
            console.log("Not caching the response to", event.request.url);
          }

          return networkResponse;
        });

        return (
          cachedResponse ||
          fetchedResponse.catch(() => cache.match("/offline/"))
        );
      });
    }),
  );
};

onmessage = (event) => {
  if (event.data.type === "PRECACHE") {
    const data = [...new Set(event.data.payload)];
    var success = true;

    broadcast.postMessage({ type: "SW_PRECACHE" });
    console.log("Precache started", data);

    event.waitUntil(
      (async () => {
        const cache = await caches.open(cacheName);

        // --- replaced cache.addAll(data) with traced loop ---
        for (const url of data) {
          try {
            const req = new Request(url, { method: "GET" });
            const res = await fetch(req);

            if (!res.ok) {
              throw new Error(`HTTP ${res.status} ${res.statusText}`);
            }

            await cache.put(req, res.clone());
            console.log("Cached OK:", url);
          } catch (error) {
            success = false;
            broadcast.postMessage({ type: "SW_PRECACHE_ERR" });

            console.error("Precache failed for URL:", url, error);
            // keep going so you can see more than one failure if needed:
            // but if you prefer "fail fast", you can add `throw error;` here.
          }
        }
        // --- end traced loop ---

        if (success) broadcast.postMessage({ type: "SW_PRECACHE_FINISH" });
      })(),
    );
  }
};

onactivate = (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      return keys.map(async (cache) => {
        if (cache !== cacheName) {
          console.log("Removing old cache", cache);
          return await caches.delete(cache);
        }
      });
    })(),
  );

  broadcast.postMessage({ type: "SW_ACTIVATED" });
};