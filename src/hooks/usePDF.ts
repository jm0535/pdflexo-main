import { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "@/lib/types";
import {
  initPdfWorker,
  loadPdfDocument,
  clearPdfCache,
  getPageTextContent,
} from "@/lib/pdfjs-setup";

// Initialize PDF.js worker
initPdfWorker();

interface UsePDFOptions {
  initialPage?: number;
  onDocumentLoad?: (pdf: pdfjsLib.PDFDocumentProxy) => void;
  onPageChange?: (pageNumber: number) => void;
  onError?: (error: Error) => void;
}

interface UsePDFResult {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  debugInfo: string | null;
  pageRendering: boolean;
  scale: number;
  setScale: (scale: number) => void;
  setCurrentPage: (page: number) => void;
  changePage: (offset: number) => void;
  renderPage: (pageNum: number, canvas: HTMLCanvasElement) => Promise<void>;
  retry: () => void;
  getTextContent: (pageNum: number) => Promise<pdfjsLib.TextContent | null>;
}

/**
 * Custom hook for handling PDF operations with optimized performance
 */
export function usePDF(
  document: PDFDocument,
  options: UsePDFOptions = {}
): UsePDFResult {
  const {
    initialPage = document.currentPage || 1,
    onDocumentLoad,
    onPageChange,
    onError,
  } = options;

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(document.totalPages || 0);
  const [pageRendering, setPageRendering] = useState(false);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Page cache to avoid re-rendering the same pages
  const pageCache = useRef<Map<string, ImageBitmap | null>>(new Map());
  // Track if component is mounted to avoid state updates after unmount
  const isMounted = useRef(true);
  // Text content cache for search functionality
  const textContentCache = useRef<Map<string, pdfjsLib.TextContent>>(new Map());

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      try {
        if (!isMounted.current) return;

        setLoading(true);
        setError(null);
        setDebugInfo(null);

        // Clear page cache when loading a new document
        pageCache.current.clear();
        textContentCache.current.clear();

        if (process.env.NODE_ENV === "development") {
          console.log("Loading PDF from URL:", document.url);
        }

        // Use the centralized PDF loading function
        const pdf = await loadPdfDocument(document.url);

        if (!isMounted.current) return;

        if (process.env.NODE_ENV === "development") {
          console.log("PDF loaded successfully, pages:", pdf.numPages);
        }

        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setLoading(false);
        setRetryCount(0); // Reset retry count on successful load

        // Call onDocumentLoad callback if provided
        if (onDocumentLoad) {
          onDocumentLoad(pdf);
        }
      } catch (err) {
        if (!isMounted.current) return;

        console.error("Error loading PDF:", err);
        let errorMessage = "Failed to load PDF document. Please try again.";
        let debugMessage = "";

        if (err instanceof Error) {
          debugMessage = `Error: ${err.name} - ${err.message}`;

          // Provide more specific error messages
          if (err.message.includes("Invalid PDF structure")) {
            errorMessage = "The PDF file appears to be corrupted or invalid.";
          } else if (err.message.includes("Not found")) {
            errorMessage =
              "The PDF file could not be found. It may have been moved or deleted.";
          } else if (err.message.includes("network")) {
            errorMessage =
              "Network error while loading the PDF. Please check your connection.";
          } else if (err.message.includes("password")) {
            errorMessage =
              "This PDF is password protected. Please remove the password protection and try again.";
          }

          // Call onError callback if provided
          if (onError) {
            onError(err);
          }
        }

        setError(errorMessage);
        setDebugInfo(debugMessage);
        setLoading(false);
      }
    };

    loadPdf();

    // Cleanup function
    return () => {
      isMounted.current = false;

      // Clean up cached pages
      pageCache.current.forEach((bitmap) => {
        if (bitmap) bitmap.close();
      });
      pageCache.current.clear();

      // Clean up text content cache
      textContentCache.current.clear();

      // Clean up PDF document
      if (pdfDoc) {
        clearPdfCache(document.url);
      }
    };
  }, [document.url, retryCount, onDocumentLoad, onError, pdfDoc]);

  // Update current page in parent component when it changes
  useEffect(() => {
    if (onPageChange && !loading && pdfDoc) {
      onPageChange(currentPage);
    }
  }, [currentPage, loading, pdfDoc, onPageChange]);

  // Render PDF page
  const renderPage = useCallback(
    async (pageNum: number, canvas: HTMLCanvasElement) => {
      if (!pdfDoc || !canvas) return;

      try {
        setPageRendering(true);
        setError(null);
        setDebugInfo(null);

        if (process.env.NODE_ENV === "development") {
          console.log(`Rendering page ${pageNum} at scale ${scale}`);
        }

        // Create a cache key based on page number and scale
        const cacheKey = `${pageNum}-${scale}`;

        // Check if page is in cache
        if (pageCache.current.has(cacheKey)) {
          const cachedBitmap = pageCache.current.get(cacheKey);
          if (cachedBitmap) {
            const context = canvas.getContext("2d");

            if (context) {
              // Get device pixel ratio for high-DPI rendering
              const devicePixelRatio = window.devicePixelRatio || 1;

              // Set canvas dimensions
              canvas.width = cachedBitmap.width;
              canvas.height = cachedBitmap.height;

              // Set display size (CSS pixels)
              canvas.style.width = `${cachedBitmap.width / devicePixelRatio}px`;
              canvas.style.height = `${
                cachedBitmap.height / devicePixelRatio
              }px`;

              // Draw cached bitmap
              context.drawImage(cachedBitmap, 0, 0);

              setPageRendering(false);
              return;
            }
          }
        }

        // Get the page
        const page = await pdfDoc.getPage(pageNum);

        // Get device pixel ratio for high-DPI rendering
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Get viewport with higher scale for better quality
        const viewport = page.getViewport({ scale: scale });

        // Create an offscreen canvas for rendering
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = viewport.width * devicePixelRatio;
        offscreenCanvas.height = viewport.height * devicePixelRatio;

        // Get context from offscreen canvas
        const offscreenContext = offscreenCanvas.getContext("2d", {
          alpha: false,
          willReadFrequently: true,
        });

        if (!offscreenContext) {
          throw new Error("Could not get canvas context");
        }

        // Scale context to ensure proper resolution
        offscreenContext.scale(devicePixelRatio, devicePixelRatio);

        // Clear canvas with white background
        offscreenContext.fillStyle = "#FFFFFF";
        offscreenContext.fillRect(
          0,
          0,
          offscreenCanvas.width,
          offscreenCanvas.height
        );

        // Render PDF page with simplified settings for better compatibility
        const renderContext = {
          canvasContext: offscreenContext,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        await renderTask.promise;

        // Create ImageBitmap for caching
        try {
          const bitmap = await createImageBitmap(offscreenCanvas);

          // Cache the rendered page
          if (
            pageCache.current.has(cacheKey) &&
            pageCache.current.get(cacheKey)
          ) {
            pageCache.current.get(cacheKey)?.close();
          }
          pageCache.current.set(cacheKey, bitmap);

          // Draw to the visible canvas
          const context = canvas.getContext("2d");

          if (context) {
            // Set canvas dimensions
            canvas.width = offscreenCanvas.width;
            canvas.height = offscreenCanvas.height;

            // Set display size (CSS pixels)
            canvas.style.width = `${viewport.width}px`;
            canvas.style.height = `${viewport.height}px`;

            // Draw bitmap to visible canvas
            context.drawImage(bitmap, 0, 0);
          }
        } catch (err) {
          console.error("Error creating bitmap:", err);

          // Fallback: if bitmap creation fails, draw directly to the visible canvas
          const context = canvas.getContext("2d");

          if (context) {
            // Set canvas dimensions
            canvas.width = offscreenCanvas.width;
            canvas.height = offscreenCanvas.height;

            // Set display size (CSS pixels)
            canvas.style.width = `${viewport.width}px`;
            canvas.style.height = `${viewport.height}px`;

            // Draw from offscreen canvas
            context.drawImage(offscreenCanvas, 0, 0);
          }
        }

        setPageRendering(false);
      } catch (err) {
        console.error("Error rendering page:", err);

        let errorMessage = "Failed to render page. Please try again.";
        let debugMessage = "";

        if (err instanceof Error) {
          debugMessage = `Render Error: ${err.name} - ${err.message}`;

          // Provide more specific error messages
          if (err.message.includes("canvas")) {
            errorMessage =
              "Error with canvas rendering. Try a different browser.";
          }
        }

        setPageRendering(false);
        setError(errorMessage);
        setDebugInfo(debugMessage);
      }
    },
    [pdfDoc, scale]
  );

  // Handle page navigation
  const changePage = useCallback(
    (offset: number) => {
      const newPage = currentPage + offset;
      if (newPage >= 1 && newPage <= totalPages && !pageRendering) {
        setCurrentPage(newPage);
      }
    },
    [currentPage, totalPages, pageRendering]
  );

  // Handle retry
  const retry = useCallback(() => {
    if (error && error.includes("Failed to load")) {
      // For document loading errors, increment retry count to trigger useEffect
      setRetryCount((prev) => prev + 1);
    } else {
      // For page rendering errors, clear error state
      setError(null);
      setDebugInfo(null);
    }
  }, [error]);

  // Get text content for a page (for search functionality)
  const getTextContent = useCallback(
    async (pageNum: number): Promise<pdfjsLib.TextContent | null> => {
      if (!pdfDoc) return null;

      try {
        // Create a cache key based on page number
        const cacheKey = `text-${pageNum}`;

        // Check if text content is in cache
        if (textContentCache.current.has(cacheKey)) {
          return textContentCache.current.get(cacheKey)!;
        }

        // Get text content from page
        const textContent = await getPageTextContent(pdfDoc, pageNum);

        // Cache the text content
        textContentCache.current.set(cacheKey, textContent);

        return textContent;
      } catch (err) {
        console.error(`Error getting text content for page ${pageNum}:`, err);
        return null;
      }
    },
    [pdfDoc]
  );

  return {
    pdfDoc,
    currentPage,
    totalPages,
    loading,
    error,
    debugInfo,
    pageRendering,
    scale,
    setScale,
    setCurrentPage,
    changePage,
    renderPage,
    retry,
    getTextContent,
  };
}
