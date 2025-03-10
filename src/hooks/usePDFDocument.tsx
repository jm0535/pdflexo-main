
import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from '@/lib/types';

// Configure the worker
const pdfjsWorkerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

export const usePDFDocument = (document: PDFDocument) => {
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        const pdf = await pdfjsLib.getDocument(document.url).promise;
        setPdfDocument(pdf);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document.');
        setLoading(false);
      }
    };
    
    loadPdf();
    
    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [document.url]);

  return { pdfDocument, loading, error };
};
