
import * as pdfjsLib from 'pdfjs-dist';
import { extractTextFromPage } from './textUtils';
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

// Search for text within a single document
export const searchInDocument = (
  pageTexts: string[],
  searchQuery: string,
  documentInfo: { id: string, name: string }
): SearchResult[] => {
  const results: SearchResult[] = [];
  const normalizedQuery = searchQuery.toLowerCase();
  
  pageTexts.forEach((text, index) => {
    const normalizedText = text.toLowerCase();
    let position = normalizedText.indexOf(normalizedQuery);
    
    while (position !== -1) {
      // Extract a snippet of text around the match
      const startSnippet = Math.max(0, position - 40);
      const endSnippet = Math.min(text.length, position + searchQuery.length + 40);
      const snippet = text.substring(startSnippet, endSnippet);
      
      results.push({
        documentId: documentInfo.id,
        documentName: documentInfo.name,
        pageNumber: index + 1, // Page numbers start from 1
        text: snippet,
        matchIndex: position
      });
      
      position = normalizedText.indexOf(normalizedQuery, position + 1);
    }
  });
  
  return results;
};

