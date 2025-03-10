
import * as pdfjsLib from 'pdfjs-dist';

export interface PDFOutlineItem {
  title: string;
  dest?: string | any[];
  items?: PDFOutlineItem[];
  pageNumber?: number;
}

// Function to extract the outline/table of contents from a PDF
export const extractOutline = async (
  pdfDocument: pdfjsLib.PDFDocumentProxy
): Promise<PDFOutlineItem[]> => {
  try {
    const outline = await pdfDocument.getOutline();
    if (!outline || outline.length === 0) {
      return [];
    }

    // Map the outline items and resolve page numbers
    const outlineWithPageNumbers = await resolveDestinations(pdfDocument, outline);
    return outlineWithPageNumbers;
  } catch (error) {
    console.error('Error extracting PDF outline:', error);
    return [];
  }
};

// Resolve the destination references to actual page numbers
const resolveDestinations = async (
  pdfDocument: pdfjsLib.PDFDocumentProxy,
  outline: PDFOutlineItem[]
): Promise<PDFOutlineItem[]> => {
  const result: PDFOutlineItem[] = [];

  for (const item of outline) {
    const outlineItem: PDFOutlineItem = { ...item };
    
    if (item.dest) {
      try {
        let pageNumber;
        if (typeof item.dest === 'string') {
          const dest = await pdfDocument.getDestination(item.dest);
          const ref = dest[0]; // First element is the page reference
          pageNumber = await pdfDocument.getPageIndex(ref) + 1; // Convert to 1-based page numbering
        } else if (Array.isArray(item.dest)) {
          const ref = item.dest[0]; // First element is the page reference
          pageNumber = await pdfDocument.getPageIndex(ref) + 1; // Convert to 1-based page numbering
        }
        
        outlineItem.pageNumber = pageNumber;
      } catch (error) {
        console.error('Error resolving destination:', error);
      }
    }
    
    if (item.items && item.items.length > 0) {
      outlineItem.items = await resolveDestinations(pdfDocument, item.items);
    }
    
    result.push(outlineItem);
  }
  
  return result;
};
