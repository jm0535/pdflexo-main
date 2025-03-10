
import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from '@/lib/types';
import { toast } from "sonner";

// Configure the worker
const pdfjsWorkerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Set worker source only if not already set
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
}

// Configure caching options for better performance
// Note: We're not modifying GlobalWorkerOptions directly as the TypeScript definitions don't include these properties

export const usePDFDocument = (document: PDFDocument) => {
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingTaskRef = useRef<pdfjsLib.PDFDocumentLoadingTask | null>(null);
  const renderStartTime = useRef<number>(0);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        renderStartTime.current = performance.now();

        // Cancel any existing loading task
        if (loadingTaskRef.current) {
          loadingTaskRef.current.destroy();
        }
        
        // Create a new loading task with optimized parameters
        const loadingTask = pdfjsLib.getDocument({
          url: document.url,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
          cMapPacked: true,
          rangeChunkSize: 65536, // Optimize chunk size for better streaming
          disableAutoFetch: false, // Enable auto-fetching for faster rendering
          disableStream: false, // Enable streaming for progressive loading
          disableRange: false, // Enable range requests for faster loading
          withCredentials: false
        });

        loadingTaskRef.current = loadingTask;

        // Show loading progress
        loadingTask.onProgress = ({ loaded, total }) => {
          const progress = Math.round((loaded / total) * 100);
          if (progress % 25 === 0) { // Only update at 25%, 50%, 75%, 100%
            console.log(`Loading PDF: ${progress}%`);
          }
        };

        const pdf = await loadingTask.promise;

        // Pre-fetch first page for faster initial rendering
        await pdf.getPage(1);

        setPdfDocument(pdf);
        setLoading(false);

        const loadTime = Math.round(performance.now() - renderStartTime.current);
        console.log(`PDF loaded in ${loadTime}ms`);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document.');
        setLoading(false);
        toast.error("PDF loading failed. Please try again with a different file.");
      }
    };

    loadPdf();
    
    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }

      if (loadingTaskRef.current) {
        loadingTaskRef.current.destroy();
      }
    };
  }, [document.url, pdfDocument]);

  return { pdfDocument, loading, error };
};
