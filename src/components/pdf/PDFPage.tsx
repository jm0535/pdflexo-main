
import React, { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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
  const [pageScale, setPageScale] = useState(1.5);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallMobile = useMediaQuery('(max-width: 480px)');

  // Calculate appropriate scale based on device size
  useEffect(() => {
    if (isSmallMobile) {
      setPageScale(0.8);
    } else if (isMobile) {
      setPageScale(1.0);
    } else {
      setPageScale(1.5);
    }
  }, [isMobile, isSmallMobile]);

  // Render the page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current) return;
      
      try {
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: pageScale });
        
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
  }, [pdfDocument, pageNumber, pageScale]);

  return (
    <div 
      className={`pdf-page bg-white rounded-lg shadow-lg ${isMobile ? 'p-2' : 'p-4'} overflow-hidden ${
        isAnimating ? direction === 'next' ? 'animate-page-turn' : 'animate-page-turn-reverse' : ''
      }`}
      data-page={pageNumber}
    >
      <div className={`flex justify-between items-center ${isMobile ? 'mb-2' : 'mb-4'}`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-xl'} font-medium`}>Page {pageNumber} of {pdfDocument?.numPages || '?'}</h2>
        <p className="text-gray-500 truncate max-w-xs text-sm">{documentName}</p>
      </div>
      <div 
        className="flex justify-center relative" 
        onMouseUp={(e) => onMouseUp(e, pageOffset)}
        onTouchEnd={(e) => {
          // Handle touch end for annotations without creating a MouseEvent
          // Instead, extract the coordinates and call the handler directly
          if (e.changedTouches && e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            const rect = e.currentTarget.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            // Create a minimal synthetic event with required properties
            const syntheticEvent = {
              clientX: touch.clientX,
              clientY: touch.clientY,
              target: e.target,
              currentTarget: e.currentTarget,
              preventDefault: () => {},
              stopPropagation: () => {},
              // Add missing properties required by MouseEvent
              altKey: false,
              button: 0,
              buttons: 0,
              ctrlKey: false,
              metaKey: false,
              shiftKey: false,
              type: 'mouseup'
            } as unknown as React.MouseEvent;
            
            onMouseUp(syntheticEvent, pageOffset);
          }
        }}
        data-page={pageNumber}
      >
        <canvas 
          ref={canvasRef} 
          onClick={(e) => onCanvasClick(e, pageOffset)}
          onTouchStart={(e) => {
            // Prevent default to avoid zooming on double-tap on mobile
            e.preventDefault();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            // Handle touch end for canvas clicks without creating a MouseEvent
            if (e.changedTouches && e.changedTouches.length > 0) {
              const touch = e.changedTouches[0];
              const rect = e.currentTarget.getBoundingClientRect();
              const x = touch.clientX - rect.left;
              const y = touch.clientY - rect.top;
              // Create a minimal synthetic event with required properties
              const syntheticEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: e.target,
                currentTarget: e.currentTarget,
                preventDefault: () => {},
                stopPropagation: () => {},
                // Add missing properties required by MouseEvent
                altKey: false,
                button: 0,
                buttons: 0,
                ctrlKey: false,
                metaKey: false,
                shiftKey: false,
                type: 'click'
              } as unknown as React.MouseEvent<HTMLCanvasElement>;
              
              onCanvasClick(syntheticEvent, pageOffset);
            }
          }}
          className="cursor-crosshair max-w-full"
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
