
import * as pdfjsLib from 'pdfjs-dist';

// Function to extract text from a PDF page with improved text handling
export const extractTextFromPage = async (
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number
): Promise<string> => {
  try {
    if (!pdfDoc || pageNumber < 1 || pageNumber > pdfDoc.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }
    
    const page = await pdfDoc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    
    // Process text with better handling of spacing and layout
    let lastY: number | null = null;
    let text = '';
    
    for (const item of textContent.items) {
      if ('str' in item) {
        // Add newline when Y position changes significantly (new paragraph or line)
        if (lastY !== null && 'transform' in item && Math.abs((item.transform as number[])[5] - lastY) > 5) {
          text += '\n';
        }
        
        // Add the text with proper spacing
        text += item.str + ' ';
        
        // Update lastY position
        if ('transform' in item) {
          lastY = (item.transform as number[])[5];
        }
      }
    }
    
    // Clean up the text - remove excessive whitespace
    return text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error(`Error extracting text from page ${pageNumber}:`, error);
    return '';
  }
};

// Function to copy text to clipboard with better error handling
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      throw new Error('Clipboard API not available');
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

// Function to normalize text for better search results
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};
