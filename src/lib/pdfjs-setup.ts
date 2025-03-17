import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
const PDFJS_VERSION = pdfjsLib.version; // Use the version from the library

// Use CDN worker path for reliability
export const PDF_WORKER_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;

// Track worker initialization to avoid duplicate initialization
let isWorkerInitialized = false;

// Initialize PDF.js worker with enhanced error handling
export function initPdfWorker() {
  if (typeof window !== "undefined" && !isWorkerInitialized) {
    try {
      console.log("Initializing PDF.js worker");

      // Set worker source to CDN
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_CDN;
      console.log("Using CDN PDF worker:", PDF_WORKER_CDN);
      isWorkerInitialized = true;
    } catch (error) {
      console.error("Error initializing PDF worker:", error);
      // Fallback to a different CDN if the primary one fails
      try {
        const fallbackWorkerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;
        console.log("Trying fallback PDF worker:", fallbackWorkerSrc);
        pdfjsLib.GlobalWorkerOptions.workerSrc = fallbackWorkerSrc;
        isWorkerInitialized = true;
      } catch (fallbackError) {
        console.error("Fallback PDF worker initialization failed:", fallbackError);
        // Mark as initialized to prevent repeated attempts
        isWorkerInitialized = true;
      }
    }
  }
}

// Default PDF.js document loading options with optimized settings
export const DEFAULT_PDF_LOAD_OPTIONS = {
  cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
  cMapPacked: true,
  disableRange: false,
  disableStream: false,
  disableAutoFetch: false,
  rangeChunkSize: 65536, // Optimize chunk size for better streaming
  useSystemFonts: true, // Use system fonts when available for better rendering
};

// Cache for PDF documents to avoid reloading the same PDF
const pdfCache = new Map<string, pdfjsLib.PDFDocumentProxy>();

// Helper function to load a PDF document with consistent options and caching
export async function loadPdfDocument(url: string) {
  try {
    // Make sure worker is initialized
    initPdfWorker();

    // Check cache first
    if (pdfCache.has(url)) {
      return pdfCache.get(url)!;
    }

    console.log(`Loading PDF document from URL: ${url}`);

    // Create loading task with optimized options and timeout
    const loadingTask = pdfjsLib.getDocument({
      url,
      ...DEFAULT_PDF_LOAD_OPTIONS,
    });

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("PDF loading timeout")), 30000); // 30 second timeout
    });

    // Get the PDF document with timeout
    const pdf = await Promise.race([
      loadingTask.promise,
      timeoutPromise
    ]) as pdfjsLib.PDFDocumentProxy;

    console.log(`PDF document loaded successfully: ${url}, pages: ${pdf.numPages}`);

    // Cache the document for future use
    pdfCache.set(url, pdf);

    return pdf;
  } catch (error) {
    console.error("Error loading PDF document:", error);
    throw error;
  }
}

// Clean up cached PDFs to prevent memory leaks
export function clearPdfCache(url?: string) {
  if (url) {
    // Clear specific PDF
    const pdf = pdfCache.get(url);
    if (pdf) {
      pdf.destroy().catch((err) => console.error("Error destroying PDF:", err));
      pdfCache.delete(url);
    }
  } else {
    // Clear all PDFs
    pdfCache.forEach((pdf) => {
      pdf.destroy().catch((err) => console.error("Error destroying PDF:", err));
    });
    pdfCache.clear();
  }
}

// Preload a PDF document in the background
export function preloadPdfDocument(url: string) {
  if (!url || pdfCache.has(url)) return;
  console.log(`Preloading PDF document: ${url}`);
  loadPdfDocument(url).catch(error => {
    console.error(`Failed to preload PDF document ${url}:`, error);
  });
}

// Get page text content for search functionality
export async function getPageTextContent(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number
) {
  try {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    return textContent;
  } catch (error) {
    console.error(`Error getting text content for page ${pageNumber}:`, error);
    throw error;
  }
}
