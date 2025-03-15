/**
 * Utility functions for offline functionality and service worker interactions
 */

// Database configuration
const DB_NAME = "pdflexo-offline";
const DB_VERSION = 1;
const PENDING_UPLOADS_STORE = "pendingUploads";

/**
 * Opens the IndexedDB database for offline storage
 */
export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PENDING_UPLOADS_STORE)) {
        db.createObjectStore(PENDING_UPLOADS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
  });
};

/**
 * Saves a PDF file for later upload when online
 */
export const savePendingUpload = async (
  file: File,
  metadata: any
): Promise<void> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([PENDING_UPLOADS_STORE], "readwrite");
    const store = transaction.objectStore(PENDING_UPLOADS_STORE);

    // Convert File to ArrayBuffer for storage
    const arrayBuffer = await file.arrayBuffer();

    await new Promise<void>((resolve, reject) => {
      const request = store.add({
        file: arrayBuffer,
        filename: file.name,
        type: file.type,
        metadata,
        timestamp: new Date().toISOString(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Trigger background sync if available
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("sync-pdfs");
    }
  } catch (error) {
    console.error("Failed to save pending upload:", error);
    throw error;
  }
};

/**
 * Retrieves all pending uploads
 */
export const getPendingUploads = async (): Promise<any[]> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([PENDING_UPLOADS_STORE], "readonly");
    const store = transaction.objectStore(PENDING_UPLOADS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to get pending uploads:", error);
    return [];
  }
};

/**
 * Removes a pending upload from the database
 */
export const removePendingUpload = async (id: number): Promise<void> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([PENDING_UPLOADS_STORE], "readwrite");
    const store = transaction.objectStore(PENDING_UPLOADS_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to remove pending upload:", error);
    throw error;
  }
};

/**
 * Checks if the app is currently online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Registers event listeners for online/offline status changes
 */
export const registerConnectivityListeners = (
  onOnline: () => void,
  onOffline: () => void
): (() => void) => {
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
};

/**
 * Updates the service worker
 */
export const updateServiceWorker = async (): Promise<void> => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    } catch (error) {
      console.error("Service worker update failed:", error);
    }
  }
};
