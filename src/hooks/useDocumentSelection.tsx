
import { useState, useEffect } from 'react';
import { PDFDocument } from '@/lib/types';
import * as pdfjsLib from 'pdfjs-dist';

// Ensure the PDF.js worker is configured
const pdfjsWorkerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

export function useDocumentSelection() {
  const [selectedDocument, setSelectedDocument] = useState<PDFDocument | null>(null);
  const [documentText, setDocumentText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load text content from the selected PDF
  const extractTextFromPdf = async (document: PDFDocument, pagesToExtract: number = 3) => {
    setIsLoading(true);
    setError(null);
    setDocumentText('Loading document content...');
    
    try {
      const pdf = await pdfjsLib.getDocument(document.url).promise;
      let fullText = '';
      
      // Get text from specified number of pages (or fewer if the document has fewer pages)
      const actualPagesToExtract = Math.min(pagesToExtract, pdf.numPages);
      
      for (let i = 1; i <= actualPagesToExtract; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      if (!fullText.trim()) {
        setError('No text content found in the document.');
        setDocumentText('');
      } else {
        setDocumentText(fullText);
      }
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      setError('Failed to extract text from the selected document.');
      setDocumentText('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSelect = async (document: PDFDocument, pagesToExtract: number = 3) => {
    setSelectedDocument(document);
    await extractTextFromPdf(document, pagesToExtract);
  };

  return {
    selectedDocument,
    documentText,
    isLoading,
    error,
    handleDocumentSelect,
    extractTextFromPdf
  };
}
