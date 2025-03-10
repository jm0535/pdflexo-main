
import * as pdfjsLib from 'pdfjs-dist';

// Function to extract text from a PDF page
export const extractTextFromPage = async (
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number
): Promise<string> => {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    return textContent.items.map((item: any) => item.str).join(' ');
  } catch (error) {
    console.error('Error extracting text:', error);
    return '';
  }
};

// Function to copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};
