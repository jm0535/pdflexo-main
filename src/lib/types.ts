export interface PDFDocument {
  name: string;
  size: number;
  type: string;
  url: string;
  lastModified: number;
}

export interface PDFTab {
  id: string;
  document: PDFDocument;
  isActive: boolean;
}
