/**
 * Error handling utility for PDFlexo
 */

// Log errors to console with additional context
export function logError(error: Error, context?: string): void {
  console.error(`PDFlexo Error${context ? ` [${context}]` : ""}:`, error);

  // You could add additional error reporting here (e.g., to a service like Sentry)
}

// Handle runtime errors
export function handleRuntimeError(error: Error, componentName?: string): void {
  logError(error, componentName || "Runtime");

  // You could implement fallback UI or recovery logic here
}

// Handle async errors (for use with async/await)
export async function handleAsyncError<T>(
  promise: Promise<T>,
  errorContext: string
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error(String(error)),
      errorContext
    );
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

// Create a fallback UI element
export function createErrorFallbackUI(message: string): HTMLElement {
  const container = document.createElement("div");
  container.style.padding = "20px";
  container.style.margin = "20px";
  container.style.backgroundColor = "#fee2e2";
  container.style.border = "1px solid #ef4444";
  container.style.borderRadius = "5px";
  container.style.color = "#b91c1c";

  const heading = document.createElement("h3");
  heading.textContent = "Something went wrong";
  heading.style.marginTop = "0";

  const text = document.createElement("p");
  text.textContent =
    message || "An error occurred while loading this component.";

  const reload = document.createElement("button");
  reload.textContent = "Reload Page";
  reload.style.padding = "8px 16px";
  reload.style.backgroundColor = "#b91c1c";
  reload.style.color = "white";
  reload.style.border = "none";
  reload.style.borderRadius = "4px";
  reload.style.cursor = "pointer";
  reload.onclick = () => window.location.reload();

  container.appendChild(heading);
  container.appendChild(text);
  container.appendChild(reload);

  return container;
}

// Check if a module is loaded correctly
export function isModuleLoaded(moduleName: string): boolean {
  try {
    return typeof require(moduleName) !== "undefined";
  } catch (e) {
    return false;
  }
}

// Add global error handler
export function setupGlobalErrorHandlers(): void {
  window.addEventListener("error", (event) => {
    logError(event.error || new Error(event.message), "Global");

    // Prevent the browser from showing its own error dialog
    event.preventDefault();

    // You could show a custom error UI here
    return true;
  });

  window.addEventListener("unhandledrejection", (event) => {
    logError(
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason)),
      "Unhandled Promise"
    );

    // Prevent default handling
    event.preventDefault();
    return true;
  });
}
