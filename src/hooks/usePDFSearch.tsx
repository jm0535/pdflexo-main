import { useState, useCallback, useEffect } from "react";
import { PDFTab } from "@/lib/types";
import {
  extractAllText,
  searchInDocument,
  SearchResult,
} from "@/lib/pdfUtils/searchUtils";
import { initPdfWorker, loadPdfDocument } from "@/lib/pdfjs-setup";

export const usePDFSearch = (tabs: PDFTab[]) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Initialize PDF.js worker
  useEffect(() => {
    initPdfWorker();
  }, []);

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

      // Search across all open tabs/documents
      for (const tab of tabs) {
        const doc = tab.document;

        try {
          if (!doc.url) {
            console.warn(`Document ${doc.name} has no URL, skipping search`);
            continue;
          }

          // Use our loadPdfDocument helper with built-in timeout
          const pdfDocument = await loadPdfDocument(doc.url);

          const { pageTexts, documentInfo } = await extractAllText(
            pdfDocument,
            doc.name,
            tab.id
          );

          const docResults = searchInDocument(
            pageTexts,
            searchQuery,
            documentInfo
          );
          allResults.push(...docResults);

          // We don't destroy the document here as it's cached by loadPdfDocument
        } catch (err) {
          console.error(`Error searching in document ${doc.name}:`, err);
          // Continue with other documents even if one fails
        }
      }

      setSearchResults(allResults);
    } catch (error) {
      console.error("Error during search:", error);
      setSearchError("Failed to perform search. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, tabs]);

  const jumpToResult = useCallback(
    (result: SearchResult) => {
      const tabIndex = tabs.findIndex((tab) => tab.id === result.documentId);
      if (tabIndex === -1) {
        console.warn(`Tab with ID ${result.documentId} not found`);
        return null;
      }

      // Return the page number so the parent component can navigate to it
      return {
        tabId: result.documentId,
        pageNumber: result.pageNumber,
      };
    },
    [tabs]
  );

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,
    performSearch,
    jumpToResult,
  };
};
