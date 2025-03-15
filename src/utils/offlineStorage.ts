/**
 * Utility functions for handling offline storage and service worker interactions
 */

import { v4 as uuidv4 } from "uuid";

/**
 * Check if the browser supports service workers
 */
export const isServiceWorkerSupported = (): boolean => {
  return "serviceWorker" in navigator && "SyncManager" in window;
};

/**
 * Check if the application is currently online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Register a listener for online/offline status changes
 */
export const registerNetworkStatusListeners = (
  onlineCallback: () => void,
  offlineCallback: () => void
): (() => void) => {
  window.addEventListener("online", onlineCallback);
  window.addEventListener("offline", offlineCallback);

  // Return a cleanup function
  return () => {
    window.removeEventListener("online", onlineCallback);
    window.removeEventListener("offline", offlineCallback);
  };
};

/**
 * Interface for pending uploads
 */
export interface PendingUpload {
  id: string;
  file: File;
  filename: string;
  timestamp: number;
}

/**
 * Queue a file for upload when the device comes back online
 */
export const queueFileForUpload = async (file: File): Promise<string> => {
  if (!isServiceWorkerSupported()) {
    throw new Error("Service workers are not supported in this browser");
  }

  const uploadId = uuidv4();
  const pendingUpload: PendingUpload = {
    id: uploadId,
    file,
    filename: file.name,
    timestamp: Date.now(),
  };

  // Get the active service worker registration
  const registration = await navigator.serviceWorker.ready;

  return new Promise((resolve, reject) => {
    // Set up a one-time message listener for the response
    const messageListener = (event: MessageEvent) => {
      if (
        event.data &&
        event.data.type === "UPLOAD_QUEUED" &&
        event.data.uploadId === uploadId
      ) {
        navigator.serviceWorker.removeEventListener("message", messageListener);

        if (event.data.success) {
          resolve(uploadId);
        } else {
          reject(new Error(event.data.error || "Failed to queue upload"));
        }
      }
    };

    // Listen for the response from the service worker
    navigator.serviceWorker.addEventListener("message", messageListener);

    // Send the pending upload to the service worker
    registration.active?.postMessage({
      type: "ADD_PENDING_UPLOAD",
      upload: pendingUpload,
    });

    // Request background sync
    registration.sync
      .register("pdf-upload")
      .then(() => {
        console.log("Background sync registered for PDF upload");
      })
      .catch((error) => {
        console.error("Background sync registration failed:", error);
        // We still keep the upload in the queue even if sync registration fails
      });
  });
};

/**
 * Listen for upload sync events from the service worker
 */
export const listenForSyncEvents = (
  onUploadSynced: (uploadId: string) => void
): (() => void) => {
  const messageListener = (event: MessageEvent) => {
    if (
      event.data &&
      event.data.type === "UPLOAD_SYNCED" &&
      event.data.success
    ) {
      onUploadSynced(event.data.uploadId);
    }
  };

  navigator.serviceWorker.addEventListener("message", messageListener);

  // Return a cleanup function
  return () => {
    navigator.serviceWorker.removeEventListener("message", messageListener);
  };
};

/**
 * Manually trigger a sync attempt (useful for testing or user-initiated sync)
 */
export const triggerSync = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    throw new Error("Service workers are not supported in this browser");
  }

  const registration = await navigator.serviceWorker.ready;
  return registration.sync.register("pdf-upload");
};
