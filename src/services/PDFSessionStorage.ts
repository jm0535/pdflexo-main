
import { PDFDocument } from '@/lib/types';

/**
 * Service to manage PDF documents persistence during the user's session
 */
class PDFSessionStorage {
  private static readonly STORAGE_KEY = 'loadedPDFs';
  
  /**
   * Gets all stored PDF documents
   */
  public getAllDocuments(): PDFDocument[] {
    try {
      const storedData = sessionStorage.getItem(PDFSessionStorage.STORAGE_KEY);
      if (!storedData) return [];
      
      const parsedDocs = JSON.parse(storedData);
      return parsedDocs.filter((doc: any) => doc.url && doc.name);
    } catch (error) {
      console.error('Error retrieving stored PDFs:', error);
      return [];
    }
  }
  
  /**
   * Stores a PDF document for the session
   */
  public addDocument(document: PDFDocument): void {
    try {
      const currentDocs = this.getAllDocuments();
      // Check if document already exists (by URL)
      const exists = currentDocs.some(doc => doc.url === document.url);
      
      if (!exists) {
        const updatedDocs = [...currentDocs, document];
        sessionStorage.setItem(PDFSessionStorage.STORAGE_KEY, JSON.stringify(updatedDocs));
      }
    } catch (error) {
      console.error('Error storing PDF:', error);
    }
  }
  
  /**
   * Removes a specific PDF document
   */
  public removeDocument(url: string): void {
    try {
      const currentDocs = this.getAllDocuments();
      const updatedDocs = currentDocs.filter(doc => doc.url !== url);
      sessionStorage.setItem(PDFSessionStorage.STORAGE_KEY, JSON.stringify(updatedDocs));
    } catch (error) {
      console.error('Error removing PDF:', error);
    }
  }
  
  /**
   * Removes all stored PDF documents
   */
  public clearAllDocuments(): void {
    try {
      sessionStorage.removeItem(PDFSessionStorage.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing PDFs:', error);
    }
  }
}

// Export as singleton
export const pdfSessionStorage = new PDFSessionStorage();
