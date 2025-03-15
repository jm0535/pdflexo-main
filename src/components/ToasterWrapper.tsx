import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { setToastContext } from "@/utils/toast";

// Define the toast types
type ToastType = "info" | "success" | "error" | "warning";

// Define the toast interface
interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// Create a context for the toast
interface ToastContextType {
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Custom hook to use the toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Create a simple toast provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info", duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // Export the toast functions
  const contextValue = { addToast, removeToast };

  // Set the global toast context
  useEffect(() => {
    setToastContext(contextValue);
  }, [contextValue]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Create a toast container component
const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({
  toasts,
  removeToast
}) => {
  // Set up auto-dismiss for toasts
  useEffect(() => {
    if (toasts.length > 0) {
      const { id, duration } = toasts[0];
      const timer = setTimeout(() => {
        removeToast(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [toasts, removeToast]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded shadow-lg max-w-sm animate-fade-in ${
            toast.type === "success" ? "bg-green-500 text-white" :
            toast.type === "error" ? "bg-red-500 text-white" :
            toast.type === "warning" ? "bg-yellow-500 text-white" :
            "bg-blue-500 text-white"
          }`}
        >
          <div className="flex justify-between items-center">
            <p>{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Create a simple wrapper for backward compatibility
const ToasterWrapper: React.FC = () => {
  // This is just a placeholder - we'll use the ToastProvider at the app level
  return null;
};

export default ToasterWrapper;
