
import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageScale, setPageScale] = useState(1.5);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallMobile = useMediaQuery('(max-width: 480px)');

  // State for panning functionality
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanOffset, setLastPanOffset] = useState({ x: 0, y: 0 });

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

  // Handle panning start
  const handlePanStart = useCallback((clientX: number, clientY: number) => {
    setIsPanning(true);
    setStartPanPosition({ x: clientX, y: clientY });
  }, []);

  // Handle panning movement
  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    if (isPanning && containerRef.current) {
      const deltaX = clientX - startPanPosition.x;
      const deltaY = clientY - startPanPosition.y;

      const newOffsetX = lastPanOffset.x + deltaX;
      const newOffsetY = lastPanOffset.y + deltaY;

      setPanOffset({ x: newOffsetX, y: newOffsetY });

      // Apply the transform directly for smoother performance
      containerRef.current.style.transform = `translate(${newOffsetX}px, ${newOffsetY}px)`;
    }
  }, [isPanning, startPanPosition, lastPanOffset]);

  // Handle panning end
  const handlePanEnd = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setLastPanOffset(panOffset);
    }
  }, [isPanning, panOffset]);

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
        className="flex justify-center relative overflow-hidden" 
        onMouseDown={(e) => {
          // Start panning on mouse down
          handlePanStart(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          // Continue panning on mouse move
          handlePanMove(e.clientX, e.clientY);
        }}
        onMouseUp={(e) => {
          // If we were panning, end the pan
          if (isPanning) {
            handlePanEnd();
            e.stopPropagation(); // Prevent other handlers
          } else {
            // Otherwise, handle as a regular click/annotation
            onMouseUp(e, pageOffset);
          }
        }}
        onMouseLeave={() => {
          // End panning if mouse leaves the element
          handlePanEnd();
        }}
        onTouchStart={(e) => {
          // Start panning on touch start
          if (e.touches && e.touches.length === 1) {
            handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          // Continue panning on touch move
          if (e.touches && e.touches.length === 1) {
            e.preventDefault(); // Prevent scrolling
            handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={(e) => {
          // End panning on touch end
          handlePanEnd();

          // Only handle annotation if we weren't panning significantly
          if (Math.abs(panOffset.x - lastPanOffset.x) < 10 && Math.abs(panOffset.y - lastPanOffset.y) < 10) {
            // Handle touch end for annotations without creating a MouseEvent
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
          }
        }}
        data-page={pageNumber}
      >
        <div
          ref={containerRef}
          className="pdf-container touch-none" // Combine classes and disable browser's default touch actions
        >
          <canvas
            ref={canvasRef}
            onClick={(e) => {
              // Only trigger click if we weren't panning significantly
              if (!isPanning && Math.abs(panOffset.x - lastPanOffset.x) < 10 && Math.abs(panOffset.y - lastPanOffset.y) < 10) {
                onCanvasClick(e, pageOffset);
              }
            }}
            className="cursor-move max-w-full" // Changed cursor to indicate panning ability
            data-page={pageNumber}
          />
          <canvas
            ref={annotationCanvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            data-page={pageNumber}
          />
        </div>
      </div>

      {/* Reset pan position button */}
      {(panOffset.x !== 0 || panOffset.y !== 0) && (
        <button 
          className="absolute bottom-4 right-4 bg-primary text-white p-2 rounded-full shadow-lg opacity-70 hover:opacity-100 transition-opacity"
          onClick={() => {
            setPanOffset({ x: 0, y: 0 });
            setLastPanOffset({ x: 0, y: 0 });
            if (containerRef.current) {
              containerRef.current.style.transform = 'translate(0px, 0px)';
            }
          }}
          aria-label="Reset view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"></path>
            <path d="M12 8v8"></path>
            <path d="M8 12h8"></path>
          </svg>
        </button>
      )}
    </div>
  );
};

export default PDFPage;
