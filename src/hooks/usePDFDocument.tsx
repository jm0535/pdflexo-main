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

export const usePDFDocument = (document: PDFDocument) => {
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingTaskRef = useRef<pdfjsLib.PDFDocumentLoadingTask | null>(null);
  const renderStartTime = useRef<number>(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    let isMounted = true;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

    const loadPdf = async () => {
      if (!document.url) {
        console.log('No URL provided for PDF document');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Loading PDF document from URL:', document.url);
        // Configure PDF.js worker
        const pdfjsLib = await import('pdfjs-dist');
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
        
        // Create loading task with optimized settings
        loadingTask = pdfjsLib.getDocument({
          url: document.url,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
          cMapPacked: true,
          enableXfa: true,
          disableRange: false,
          disableStream: false,
          disableAutoFetch: false,
          rangeChunkSize: 65536,
          // Enhanced font settings
          fontExtraProperties: true,
          useSystemFonts: true,
          isEvalSupported: true,
          useWorkerFetch: true,
          // Force standard fonts to improve rendering
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/standard_fonts/'
        });

        // Add progress callback
        loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
          const progress = (progressData.loaded / progressData.total) * 100;
          console.log(`Loading progress: ${progress.toFixed(2)}%`);
        };

        // Load the document
        const pdfDoc = await loadingTask.promise;
        console.log('PDF document loaded successfully with', pdfDoc.numPages, 'pages');

        if (isMounted) {
          setPdfDocument(pdfDoc);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading PDF document:', err);
        if (isMounted) {
          setError('Failed to load PDF document. Please try again.');
          setLoading(false);
          toast.error("PDF loading failed. Please try again with a different file.");
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
      if (loadingTask) {
        loadingTask.destroy();
      }
    };
  }, [document.url]);

  return { pdfDocument, loading, error };
};
