
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Add passive: false to event listener options to enable preventDefault() on touch events
declare global {
  interface AddEventListenerOptions {
    passive?: boolean;
  }
}

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
      setPageScale(1.0); // Increased from 0.8 to improve text visibility
    } else if (isMobile) {
      setPageScale(1.2); // Increased from 1.0 to improve text visibility
    } else {
      setPageScale(1.5);
    }
  }, [isMobile, isSmallMobile]);

  // Add event listeners for touch events directly to the container element
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Direct event handlers with passive: false to allow preventDefault
    const touchStartHandler = (e: TouchEvent) => {
      if (e.touches && e.touches.length === 1) {
        e.preventDefault();
        setIsPanning(true);
        setStartPanPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    };

    const touchMoveHandler = (e: TouchEvent) => {
      if (e.touches && e.touches.length === 1 && isPanning) {
        e.preventDefault();
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        
        const deltaX = clientX - startPanPosition.x;
        const deltaY = clientY - startPanPosition.y;

        const newOffsetX = lastPanOffset.x + deltaX;
        const newOffsetY = lastPanOffset.y + deltaY;

        setPanOffset({ x: newOffsetX, y: newOffsetY });
        container.style.transform = `translate(${newOffsetX}px, ${newOffsetY}px)`;
      }
    };

    const touchEndHandler = (e: TouchEvent) => {
      if (isPanning) {
        e.preventDefault();
        setIsPanning(false);
        setLastPanOffset(panOffset);
      }
    };

    // Add event listeners with passive: false to allow preventDefault
    container.addEventListener('touchstart', touchStartHandler, { passive: false });
    container.addEventListener('touchmove', touchMoveHandler, { passive: false });
    container.addEventListener('touchend', touchEndHandler, { passive: false });

    // Clean up event listeners
    return () => {
      container.removeEventListener('touchstart', touchStartHandler);
      container.removeEventListener('touchmove', touchMoveHandler);
      container.removeEventListener('touchend', touchEndHandler);
    };
  }, [containerRef, isPanning, startPanPosition, lastPanOffset, panOffset]);

  // Render the page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current) return;
      
      try {
        const page = await pdfDocument.getPage(pageNumber);

        // Create a viewport with higher resolution for mobile to ensure text clarity
        const pixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: pageScale * pixelRatio });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { alpha: false });
        
        if (!context) return;
        
        // Set canvas dimensions to match the viewport (with device pixel ratio)
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Set display size to match the desired scale (accounting for device pixel ratio)
        canvas.style.width = `${viewport.width / pixelRatio}px`;
        canvas.style.height = `${viewport.height / pixelRatio}px`;
        
        // Enhanced rendering context with text rendering options
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          enableWebGL: true,
          renderInteractiveForms: true,
          textLayer: true
        };

        // Clear the canvas before rendering
        context.fillStyle = 'rgb(255, 255, 255)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render the page with enhanced settings
        await page.render(renderContext).promise;
        
        // Setup annotation canvas with the same dimensions
        if (annotationCanvasRef.current) {
          const annotationCanvas = annotationCanvasRef.current;
          annotationCanvas.height = viewport.height;
          annotationCanvas.width = viewport.width;
          annotationCanvas.style.width = `${viewport.width / pixelRatio}px`;
          annotationCanvas.style.height = `${viewport.height / pixelRatio}px`;
        }

        console.log(`Page ${pageNumber} rendered with scale ${pageScale} and pixel ratio ${pixelRatio}`);
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
          // Start panning on mouse down (desktop only)
          handlePanStart(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          // Continue panning on mouse move (desktop only)
          handlePanMove(e.clientX, e.clientY);
        }}
        onMouseUp={(e) => {
          // If we were panning, end the pan (desktop only)
          if (isPanning) {
            handlePanEnd();
            e.stopPropagation(); // Prevent other handlers
          } else {
            // Otherwise, handle as a regular click/annotation
            onMouseUp(e, pageOffset);
          }
        }}
        onMouseLeave={() => {
          // End panning if mouse leaves the element (desktop only)
          handlePanEnd();
        }}
        // We're handling touch events with direct event listeners instead of React events
        // because we need to set passive: false to prevent default browser behavior
        data-page={pageNumber}
      >
        <div
          ref={containerRef}
          className="pdf-container touch-none select-none" // Disable browser's default touch actions and text selection
          style={{
            touchAction: 'none', // Explicitly disable browser touch actions for better mobile support
            willChange: 'transform', // Optimize for transform animations
            transformOrigin: 'center center' // Set transform origin to center for better panning
          }}
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
          className="absolute bottom-4 right-4 bg-primary text-white p-2 rounded-full shadow-lg opacity-70 hover:opacity-100 transition-opacity z-10"
          onClick={() => {
            setPanOffset({ x: 0, y: 0 });
            setLastPanOffset({ x: 0, y: 0 });
            if (containerRef.current) {
              containerRef.current.style.transform = 'translate(0px, 0px)';
            }
          }}
          aria-label="Reset view"
          onTouchEnd={(e) => {
            // Prevent event propagation to avoid triggering other touch handlers
            e.stopPropagation();
          }}
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
