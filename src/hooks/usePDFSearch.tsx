
import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, PDFTab } from '@/lib/types';
import { extractAllText, searchInDocument, SearchResult } from '@/lib/pdfUtils/searchUtils';

export const usePDFSearch = (tabs: PDFTab[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      setSearchResults([]);

      const allResults: SearchResult[] = [];

      // Configure the worker
      const pdfjsWorkerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

      // Search across all open tabs/documents
      for (const tab of tabs) {
        const doc = tab.document;
        
        try {
          const pdfDocument = await pdfjsLib.getDocument(doc.url).promise;
          const { pageTexts, documentInfo } = await extractAllText(
            pdfDocument, 
            doc.name, 
            tab.id
          );
          
          const docResults = searchInDocument(pageTexts, searchQuery, documentInfo);
          allResults.push(...docResults);
          
          // Clean up
          pdfDocument.destroy();
        } catch (err) {
          console.error(`Error searching in document ${doc.name}:`, err);
        }
      }

      setSearchResults(allResults);
    } catch (error) {
      console.error('Error during search:', error);
      setSearchError('Failed to perform search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, tabs]);

  const jumpToResult = useCallback((result: SearchResult) => {
    const tabIndex = tabs.findIndex(tab => tab.id === result.documentId);
    if (tabIndex === -1) return false;
    
    // Return the page number so the parent component can navigate to it
    return {
      tabId: result.documentId,
      pageNumber: result.pageNumber
    };
  }, [tabs]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,
    performSearch,
    jumpToResult
  };
};
