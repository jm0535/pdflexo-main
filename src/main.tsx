import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { setupGlobalErrorHandlers, logError } from "./errorHandler";
import { registerServiceWorker, unregisterServiceWorkers } from "./lib/serviceWorkerUtils";
import { getEnvironment } from "./lib/utils";

// Set up global error handlers
setupGlobalErrorHandlers();

// Set dark theme by default
document.documentElement.classList.add("dark");

// Handle service worker registration based on environment
const environment = getEnvironment();
console.log(`Application starting in ${environment} environment`);

// For development and preview, unregister service workers first to ensure fresh content
if (environment === 'development' || environment === 'preview') {
  unregisterServiceWorkers().then(() => {
    console.log("Service workers unregistered for development/preview mode");
    // Register service worker after unregistration
    setTimeout(() => {
      registerServiceWorker().catch(error => {
        logError(error instanceof Error ? error : new Error(String(error)), "Service Worker");
      });
    }, 1000);
  });
} else {
  // For production, just register the service worker
  registerServiceWorker().catch(error => {
    logError(error instanceof Error ? error : new Error(String(error)), "Service Worker");
  });
}

// Create root element with error handling
const rootElement = document.getElementById("root");
if (!rootElement) {
  logError(new Error("Failed to find the root element"), "DOM Initialization");

  // Create fallback element
  const fallbackRoot = document.createElement("div");
  fallbackRoot.id = "root";
  document.body.appendChild(fallbackRoot);

  console.warn("Created fallback root element");
}

try {
  // Create root and render app
  const root = createRoot(rootElement || document.body);

  // Render app
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );

  console.log("Application rendered successfully");
} catch (error) {
  logError(
    error instanceof Error ? error : new Error(String(error)),
    "React Rendering"
  );

  // Display fallback message
  document.body.innerHTML = `
    <div style="padding: 20px; margin: 20px; background-color: #fee2e2; border: 1px solid #ef4444; border-radius: 5px; color: #b91c1c;">
      <h3 style="margin-top: 0;">Failed to initialize application</h3>
      <p>There was a problem loading the application. Please try refreshing the page.</p>
      <button onclick="window.location.reload()" style="padding: 8px 16px; background-color: #b91c1c; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Reload Page
      </button>
    </div>
  `;
}

// Prevent React from being garbage collected in development
if (process.env.NODE_ENV === "development") {
  // Define a more specific type for React DevTools hook
  interface ReactDevToolsHook {
    inject: () => void;
    [key: string]: unknown;
  }
  
  const devTools = (window as Window & { __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook }).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (devTools) {
    devTools.inject = function () {};
  }
}
