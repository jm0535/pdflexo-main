import { useToast } from "@/components/ToasterWrapper";

// Create a toast utility that mimics the sonner API
const toast = {
  info: (message: string, options?: any) => {
    const { addToast } = useToastGlobal();
    addToast(message, "info", options?.duration || 3000);
  },
  success: (message: string, options?: any) => {
    const { addToast } = useToastGlobal();
    addToast(message, "success", options?.duration || 3000);
  },
  error: (message: string, options?: any) => {
    const { addToast } = useToastGlobal();
    addToast(message, "error", options?.duration || 3000);
  },
  warning: (message: string, options?: any) => {
    const { addToast } = useToastGlobal();
    addToast(message, "warning", options?.duration || 3000);
  },
  loading: (message: string, options?: any) => {
    const { addToast } = useToastGlobal();
    addToast(message, "info", options?.duration || 3000);
    // Return a promise that resolves immediately
    return Promise.resolve();
  },
};

// Global reference to the toast context
let toastContext: ReturnType<typeof useToast> | null = null;

// Function to set the global toast context
export const setToastContext = (context: ReturnType<typeof useToast>) => {
  toastContext = context;
};

// Function to get the global toast context
const useToastGlobal = () => {
  if (!toastContext) {
    console.warn(
      "Toast context not set. Make sure to use ToastProvider at the app level."
    );
    return {
      addToast: (message: string, type: any, duration: number) => {
        console.log(`Toast (${type}): ${message}`);
      },
      removeToast: (id: string) => {},
    };
  }
  return toastContext;
};

export default toast;
