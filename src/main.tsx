import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";

// Set dark theme by default
document.documentElement.classList.add("dark");

// Register service worker for offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}

// Create root element
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

// Create root and render app
const root = createRoot(rootElement);

// Render app
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Prevent React from being garbage collected in development
if (process.env.NODE_ENV === "development") {
  const devTools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (devTools) {
    devTools.inject = function () {};
  }
}
