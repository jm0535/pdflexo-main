import { logError } from "../errorHandler";
import { getEnvironment } from "./utils";

/**
 * Register the service worker with appropriate cache handling based on environment
 */
export const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const environment = getEnvironment();
      console.log(`Registering service worker in ${environment} environment`);
      
      // For development and preview, we'll unregister any existing service workers
      // and clear the cache to ensure the latest changes are always visible
      if (environment === 'development' || environment === 'preview') {
        await unregisterServiceWorkers();
        await clearServiceWorkerCache();
      }
      
      // Wait a moment for the unregistration to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const registration = await navigator.serviceWorker.register("/service-worker.js", {
        updateViaCache: 'none' // Prevent the browser from using cached service worker
      });
      
      console.log("Service Worker registered with scope:", registration.scope);
      
      // Force update for development and preview environments
      if (environment === 'development' || environment === 'preview') {
        await registration.update();
      }
      
      return registration;
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), "Service Worker Registration");
      return null;
    }
  }
  return null;
};

/**
 * Clear the service worker cache
 */
export const clearServiceWorkerCache = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // Send message to clear cache to all active service workers
      const clearPromises = registrations.map(registration => {
        if (registration.active) {
          return new Promise<void>((resolve) => {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = () => resolve();
            
            registration.active.postMessage(
              { type: "CLEAR_CACHE" },
              [messageChannel.port2]
            );
            
            // Resolve after a timeout in case the service worker doesn't respond
            setTimeout(resolve, 1000);
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(clearPromises);
      console.log("Service Worker cache cleared");
      
      // Also clear browser caches directly
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
        console.log("Browser caches cleared");
      }
      
      return true;
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), "Service Worker Cache Clearing");
      return false;
    }
  }
  return false;
};

/**
 * Unregister all service workers and clear caches
 */
export const unregisterServiceWorkers = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log("Service worker unregistered");
      }
      
      // Clear all caches
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log("All caches cleared");
      }
      
      console.log("All service workers unregistered and caches cleared");
      return true;
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), "Service Worker Unregistration");
      return false;
    }
  }
  return false;
};
