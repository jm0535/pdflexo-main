// PDFlexo Service Worker for caching and offline support
const CACHE_NAME = "pdflexo-cache-v3"; // Incremented version to force cache refresh
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/assets/index.css",
  "/assets/index.js",
  "/favicon.ico",
  "/logo.svg"
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing new version");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Force activation without waiting
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating new version");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Service Worker: Clearing old cache", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker: Now controlling all clients");
        return self.clients.claim(); // Take control of all clients
      })
  );
});

// Fetch event - serve from cache or network with network-first strategy for HTML and JS/CSS
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip PDF files - we'll handle them separately
  if (event.request.url.endsWith(".pdf")) {
    return;
  }

  // Network-first strategy for HTML and JS/CSS files to ensure updates are applied
  const isHtmlOrAsset = event.request.url.endsWith(".html") ||
                        event.request.url.endsWith(".js") ||
                        event.request.url.endsWith(".css") ||
                        event.request.mode === "navigate";

  if (isHtmlOrAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone();
          // Update the cache with the new version
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first strategy for other assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();

            // Cache the new response
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch((error) => {
            console.error("Service Worker fetch failed:", error);
            // Return a custom offline page if available
            if (event.request.mode === "navigate") {
              return caches.match("/offline.html");
            }
            return new Response("Network error happened", {
              status: 408,
              headers: { "Content-Type": "text/plain" }
            });
          })
      })
    );
  }
});

// Cache PDF files separately with a special strategy
self.addEventListener("fetch", (event) => {
  if (event.request.url.endsWith(".pdf")) {
    event.respondWith(
      caches.open("pdf-cache").then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Return cached PDF if available
          if (cachedResponse) {
            // Refresh cache in the background
            fetch(event.request)
              .then((response) => {
                if (response && response.status === 200) {
                  cache.put(event.request, response);
                }
              })
              .catch(() => {
                console.log("Background refresh failed, but using cached PDF");
              });

            return cachedResponse;
          }

          // Otherwise fetch from network and cache
          return fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200) {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();

              // Cache the PDF
              cache.put(event.request, responseToCache);
              return response;
            })
            .catch((error) => {
              console.error("PDF fetch failed:", error);
              return new Response("Failed to load PDF", {
                status: 408,
                headers: { "Content-Type": "text/plain" }
              });
            });
        });
      })
    );
  }
});

// Handle messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // Add a new message type to clear the cache
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log("Service Worker: Clearing cache", cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

// Background sync for offline operations
self.addEventListener("sync", (event) => {
  if (event.tag === "pdf-upload") {
    event.waitUntil(syncPDFs());
  }
});

// IndexedDB setup for pending uploads
const DB_NAME = "pdflexo-offline-db";
const STORE_NAME = "pending-uploads";
const DB_VERSION = 1;

// Open or create the IndexedDB database
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject("IndexedDB error: " + event.target.errorCode);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Create object store for pending uploads if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

// Function to sync PDFs when back online
async function syncPDFs() {
  try {
    const pendingUploads = await getPendingUploads();
    console.log(`Attempting to sync ${pendingUploads.length} pending uploads`);

    for (const upload of pendingUploads) {
      try {
        // Attempt to upload the PDF
        const formData = new FormData();
        formData.append("file", upload.file, upload.filename);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });

        if (response.ok) {
          console.log(`Successfully synced upload: ${upload.id}`);
          await removePendingUpload(upload.id);
        } else {
          console.error(`Failed to sync upload: ${upload.id}`);
        }
      } catch (error) {
        console.error(`Error syncing upload ${upload.id}:`, error);
      }
    }

    return true;
  } catch (error) {
    console.error("Error in syncPDFs:", error);
    return false;
  }
}

// Get all pending uploads from IndexedDB
async function getPendingUploads() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject("Error getting pending uploads: " + event.target.errorCode);
      };
    });
  } catch (error) {
    console.error("Error in getPendingUploads:", error);
    return [];
  }
}

// Remove a pending upload from IndexedDB
async function removePendingUpload(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = (event) => {
        reject("Error removing pending upload: " + event.target.errorCode);
      };
    });
  } catch (error) {
    console.error("Error in removePendingUpload:", error);
    return false;
  }
}

// Add a new pending upload to IndexedDB
async function addPendingUpload(upload) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(upload);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = (event) => {
        reject("Error adding pending upload: " + event.target.errorCode);
      };
    });
  } catch (error) {
    console.error("Error in addPendingUpload:", error);
    return false;
  }
}

// Listen for requests to add pending uploads
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "ADD_PENDING_UPLOAD") {
    addPendingUpload(event.data.upload)
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch((error) => {
        console.error("Failed to add pending upload:", error);
        event.ports[0].postMessage({ success: false, error: error.toString() });
      });
  }
});
