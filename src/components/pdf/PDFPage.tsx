
import React, { useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFPageProps {
  pdfDocument: pdfjsLib.PDFDocumentProxy | null;
  pageNumber: number;
  documentName: string;
  onMouseUp: (e: React.MouseEvent, pageOffset?: number) => void;
  onCanvasClick: (e: React.MouseEvent<HTMLCanvasElement>, pageOffset?: number) => void;
  isAnimating: boolean;
  direction: 'next' | 'prev';
  pageOffset?: number;
}

const PDFPage: React.FC<PDFPageProps> = ({
  pdfDocument,
  pageNumber,
  documentName,
  onMouseUp,
  onCanvasClick,
  isAnimating,
  direction,
  pageOffset = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render the page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current) return;
      
      try {
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        // Setup annotation canvas with the same dimensions
        if (annotationCanvasRef.current) {
          const annotationCanvas = annotationCanvasRef.current;
          annotationCanvas.height = viewport.height;
          annotationCanvas.width = viewport.width;
        }
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();
  }, [pdfDocument, pageNumber]);

  return (
    <div 
      className={`pdf-page bg-white rounded-lg shadow-lg p-4 overflow-hidden ${
        isAnimating ? direction === 'next' ? 'animate-page-turn' : 'animate-page-turn-reverse' : ''
      }`}
      data-page={pageNumber}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Page {pageNumber} of {pdfDocument?.numPages || '?'}</h2>
        <p className="text-gray-500 truncate max-w-xs">{documentName}</p>
      </div>
      <div 
        className="flex justify-center relative" 
        onMouseUp={(e) => onMouseUp(e, pageOffset)}
        data-page={pageNumber}
      >
        <canvas 
          ref={canvasRef} 
          onClick={(e) => onCanvasClick(e, pageOffset)}
          className="cursor-crosshair"
          data-page={pageNumber}
        />
        <canvas 
          ref={annotationCanvasRef}
          className="absolute top-0 left-0 pointer-events-none"
          data-page={pageNumber}
        />
      </div>
    </div>
  );
};

export default PDFPage;
