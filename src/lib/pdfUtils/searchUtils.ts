
import * as pdfjsLib from 'pdfjs-dist';
import { extractTextFromPage, normalizeText } from './textUtils';
import { PDFDocument } from '@/lib/types';

// Interface for search results
export interface SearchResult {
  documentId: string;
  documentName: string;
  pageNumber: number;
  text: string;
  matchIndex: number;
}

// Extract text from all pages of a PDF document
export const extractAllText = async (
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  documentName: string,
  documentId: string
): Promise<{ pageTexts: string[], documentInfo: { id: string, name: string } }> => {
  const numPages = pdfDoc.numPages;
  const pageTexts: string[] = [];
  
  for (let i = 1; i <= numPages; i++) {
    const pageText = await extractTextFromPage(pdfDoc, i);
    pageTexts.push(pageText);
  }
  
  return {
    pageTexts,
    documentInfo: {
      id: documentId,
      name: documentName
    }
  };
};

// Search for text within a single document with improved matching
export const searchInDocument = (
  pageTexts: string[],
  searchQuery: string,
  documentInfo: { id: string, name: string }
): SearchResult[] => {
  const results: SearchResult[] = [];
  const normalizedQuery = normalizeText(searchQuery);
  
  if (!normalizedQuery) {
    return results;
  }
  
  pageTexts.forEach((text, index) => {
    if (!text) return; // Skip empty pages
    
    const normalizedText = normalizeText(text);
    let position = normalizedText.indexOf(normalizedQuery);
    
    while (position !== -1) {
      // Extract a snippet of text around the match with more context
      const contextSize = 60; // Increased context size for better readability
      const startSnippet = Math.max(0, position - contextSize);
      const endSnippet = Math.min(text.length, position + searchQuery.length + contextSize);
      
      // Get the original text for the snippet (not normalized)
      const snippet = text.substring(startSnippet, endSnippet);
      
      // Add ellipsis if we're not at the beginning or end of the text
      const formattedSnippet =
        (startSnippet > 0 ? '...' : '') +
        snippet +
        (endSnippet < text.length ? '...' : '');
      
      results.push({
        documentId: documentInfo.id,
        documentName: documentInfo.name,
        pageNumber: index + 1, // Page numbers start from 1
        text: formattedSnippet,
        matchIndex: position
      });
      
      position = normalizedText.indexOf(normalizedQuery, position + 1);
    }
  });
  
  // Sort results by page number for better navigation
  return results.sort((a, b) => a.pageNumber - b.pageNumber);
};

