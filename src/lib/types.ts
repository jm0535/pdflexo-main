
export interface PDFDocument {
  file: File;
  url: string;
  name: string;
  totalPages: number;
  currentPage: number;
}

export interface PDFTab {
  id: string;
  document: PDFDocument;
  isActive: boolean;
}
