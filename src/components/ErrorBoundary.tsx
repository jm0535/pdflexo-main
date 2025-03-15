import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
          <div className="w-full max-w-md p-6 rounded-lg border border-border bg-card shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-destructive">Something went wrong</h2>
            <p className="mb-4">The application encountered an error. Please try refreshing the page.</p>
            {this.state.error && (
              <div className="p-3 bg-muted rounded-md mb-4 overflow-auto max-h-[200px]">
                <p className="font-mono text-sm">{this.state.error.toString()}</p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
