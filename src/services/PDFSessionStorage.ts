import { PDFDocument } from "@/lib/types";

/**
 * Service to manage PDF documents persistence during the user's session
 */
class PDFSessionStorage {
  private static readonly SESSION_STORAGE_KEY = "loadedPDFs";
  private documents: PDFDocument[] = [];

  constructor() {
    this.loadFromSessionStorage();
  }

  /**
   * Load documents from session storage
   */
  private loadFromSessionStorage(): void {
    try {
      const storedData = sessionStorage.getItem(
        PDFSessionStorage.SESSION_STORAGE_KEY
      );
      if (storedData) {
        const parsedDocs = JSON.parse(storedData);
        // Filter out invalid documents
        this.documents = parsedDocs.filter(
          (doc: any) => doc && doc.url && doc.name
        );
      }
    } catch (error) {
      console.error("Error loading stored PDFs:", error);
      this.documents = [];
    }
  }

  /**
   * Save documents to session storage
   */
  private saveToSessionStorage(): void {
    try {
      // We don't store the actual URL objects, just their string representation
      const serializedDocs = this.documents.map((doc) => ({
        ...doc,
        // Ensure we're not storing any circular references
        url: doc.url,
      }));

      sessionStorage.setItem(
        PDFSessionStorage.SESSION_STORAGE_KEY,
        JSON.stringify(serializedDocs)
      );
    } catch (error) {
      console.error("Error saving PDFs to session storage:", error);
    }
  }

  /**
   * Gets all stored PDF documents
   */
  public getAllDocuments(): PDFDocument[] {
    return [...this.documents];
  }

  /**
   * Stores a PDF document for the session
   */
  public addDocument(document: PDFDocument): void {
    try {
      if (!document || !document.url || !document.name) {
        console.warn("Attempted to add invalid document:", document);
        return;
      }

      // Check if document already exists
      if (!this.documents.some((doc) => doc.url === document.url)) {
        this.documents.push(document);
        this.saveToSessionStorage();
      }
    } catch (error) {
      console.error("Error storing PDF:", error);
    }
  }

  /**
   * Removes a PDF document from storage
   */
  public removeDocument(url: string): void {
    try {
      const initialLength = this.documents.length;
      this.documents = this.documents.filter((doc) => doc.url !== url);

      if (this.documents.length !== initialLength) {
        this.saveToSessionStorage();
      }
    } catch (error) {
      console.error("Error removing PDF:", error);
    }
  }

  /**
   * Removes all PDF documents from storage
   */
  public clearAllDocuments(): void {
    try {
      this.documents = [];
      sessionStorage.removeItem(PDFSessionStorage.SESSION_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing PDFs:", error);
    }
  }
}

export const pdfSessionStorage = new PDFSessionStorage();
