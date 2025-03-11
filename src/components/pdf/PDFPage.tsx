import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import './PDFStyles.css';

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
  onPageRendered?: () => void;
}

// A4 dimensions in points (72 points = 1 inch)
// A4 is 210mm x 297mm or 8.27in x 11.69in
// In points: 595 x 842
const A4_WIDTH_PT = 595;
const A4_HEIGHT_PT = 842;

const PDFPage: React.FC<PDFPageProps> = ({
  pdfDocument,
  pageNumber,
  documentName,
  onMouseUp,
  onCanvasClick,
  isAnimating,
  direction,
  pageOffset = 0,
  onPageRendered
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageScale, setPageScale] = useState(1.5);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallMobile = useMediaQuery('(max-width: 480px)');
  const [isRendered, setIsRendered] = useState(false);

  // State for panning functionality
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanOffset, setLastPanOffset] = useState({ x: 0, y: 0 });

  // Handle panning start
  const handlePanStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isAnimating) return;

    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    setIsPanning(true);
    setStartPanPosition({ x: clientX, y: clientY });
  }, [isAnimating]);

  const handleTouchPanStart = useCallback((e: React.TouchEvent) => {
    handlePanStart(e);
  }, [handlePanStart]);

  // Handle panning move
  const handlePanMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isPanning) return;

    e.preventDefault();

    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const deltaX = clientX - startPanPosition.x;
    const deltaY = clientY - startPanPosition.y;

    setPanOffset({
      x: lastPanOffset.x + deltaX,
      y: lastPanOffset.y + deltaY
    });
  }, [isPanning, startPanPosition, lastPanOffset]);

  const handleTouchPanMove = useCallback((e: TouchEvent) => {
    handlePanMove(e);
  }, [handlePanMove]);

  // Handle panning end
  const handlePanEnd = useCallback(() => {
    if (!isPanning) return;
    setIsPanning(false);
    setLastPanOffset(panOffset);
  }, [isPanning, panOffset]);

  const handleTouchPanEnd = useCallback(() => {
    handlePanEnd();
  }, [handlePanEnd]);

  // Add event listeners for panning
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;

      const handleMouseMove = (e: MouseEvent) => handlePanMove(e);
      const handleTouchMove = (e: TouchEvent) => handlePanMove(e);
      const handleMouseUp = () => handlePanEnd();
      const handleTouchEnd = () => handlePanEnd();

      if (isPanning) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchend', handleTouchEnd);
      }

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isPanning, handlePanMove, handlePanEnd]);

  // Update transform CSS variable when panOffset changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--transform-value', `translate(${panOffset.x}px, ${panOffset.y}px)`);
    }
  }, [panOffset]);

  // Render PDF page
  useEffect(() => {
    let isMounted = true;
    let renderTask: pdfjsLib.RenderTask | null = null;
    let textLayerTask: { promise: Promise<void>; cancel?: () => void } | null = null;

    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current || !isMounted) {
        console.log('Cannot render page - missing document or canvas');
        return;
      }

      try {
        console.log(`Rendering page ${pageNumber} of document`);
        // Get the page object
        const page = await pdfDocument.getPage(pageNumber);
        console.log(`Page ${pageNumber} retrieved successfully`);

        // Get device pixel ratio for high-DPI rendering
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Calculate scale to fit A4 width
        const containerWidth = containerRef.current?.clientWidth || window.innerWidth * 0.8;
        const scaleToFitWidth = containerWidth / A4_WIDTH_PT;

        // Use a scale that maintains the A4 aspect ratio but increase it for better quality
        const baseScale = scaleToFitWidth * 1.5; // Increase scale for better quality

        // Create a viewport with the calculated scale
        const viewport = page.getViewport({ scale: baseScale });
        console.log(`Viewport created with width: ${viewport.width}, height: ${viewport.height}`);

        // Get the canvas element
        const canvas = canvasRef.current;

        // Set canvas dimensions to match viewport with pixel ratio for high-DPI rendering
        const scaledWidth = Math.floor(viewport.width * devicePixelRatio);
        const scaledHeight = Math.floor(viewport.height * devicePixelRatio);

        // Reset the canvas
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        // Set display size (CSS pixels)
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        // Force canvas to be visible with important styles
        canvas.style.display = 'block';
        canvas.style.visibility = 'visible';
        canvas.style.opacity = '1';
        canvas.style.backgroundColor = '#FFFFFF';

        // Get the 2D rendering context
        const context = canvas.getContext('2d', {
          alpha: false,
          willReadFrequently: false
        });

        if (!context) {
          throw new Error('Could not get canvas context');
        }

        // Clear the canvas with white background
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, scaledWidth, scaledHeight);

        // Scale context to account for device pixel ratio
        context.scale(devicePixelRatio, devicePixelRatio);

        // Create rendering context with specific options for better compatibility
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          enableWebGL: false,
          renderInteractiveForms: true,
          intent: 'display'
        };

        // Start rendering
        console.log('Starting page render');
        renderTask = page.render(renderContext);

        // Wait for rendering to complete
        await renderTask.promise;
        console.log('Page render completed successfully');

        // Set up text layer if it exists
        if (textLayerRef.current) {
          // Clear previous text layer content
          textLayerRef.current.innerHTML = '';

          // Set text layer dimensions
          textLayerRef.current.style.width = `${Math.floor(viewport.width)}px`;
          textLayerRef.current.style.height = `${Math.floor(viewport.height)}px`;

          // Get text content
          const textContent = await page.getTextContent();

          // Create text layer using PDF.js text layer builder
          try {
            const { renderTextLayer } = await import('pdfjs-dist/web/pdf_viewer');
            
            // Render the text layer using the official API
            renderTextLayer({
              textContent: textContent,
              container: textLayerRef.current,
              viewport: viewport,
              textDivs: []
            });
            
            textLayerTask = { promise: Promise.resolve() };
          } catch (err) {
            console.error('Error creating text layer:', err);
            textLayerTask = { promise: Promise.resolve() };
          }
        }

        // Set up annotation canvas if it exists
        if (annotationCanvasRef.current) {
          const annotationCanvas = annotationCanvasRef.current;
          annotationCanvas.width = scaledWidth;
          annotationCanvas.height = scaledHeight;
          annotationCanvas.style.width = `${Math.floor(viewport.width)}px`;
          annotationCanvas.style.height = `${Math.floor(viewport.height)}px`;
        }

        console.log(`Page ${pageNumber} rendered successfully`);

        if (isMounted) {
          setIsRendered(true);
          if (onPageRendered) {
            onPageRendered();
          }
        }
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    // Render the page
    renderPage();

    return () => {
      isMounted = false;
      if (renderTask && renderTask.cancel) {
        try {
          renderTask.cancel();
        } catch (e) {
          console.error('Error canceling render task:', e);
        }
      }

      if (textLayerTask && textLayerTask.cancel) {
        try {
          textLayerTask.cancel();
        } catch (e) {
          console.error('Error canceling text layer task:', e);
        }
      }
    };
  }, [pdfDocument, pageNumber, isMobile, isSmallMobile, onPageRendered]);

  return (
    <div
      className={`pdf-page ${isMobile ? 'pdf-page-mobile-padding' : 'pdf-page-desktop-padding'} hardware-accelerated`}
      data-page={pageNumber}
    >
      <div
        ref={containerRef}
        className={`pdf-container ${isAnimating ? `animating ${direction}` : ''} ${isPanning ? 'panning' : ''}`}
        data-transform="true"
        onMouseDown={handlePanStart}
        onTouchStart={handleTouchPanStart}
        onMouseUp={(e) => {
          handlePanEnd();
          if (!isPanning) {
            onMouseUp(e, pageOffset);
          }
        }}
        onTouchEnd={handleTouchPanEnd}
        onMouseLeave={handlePanEnd}
      >
        <div className="pdf-canvas-container">
          <canvas
            ref={canvasRef}
            className="pdf-canvas"
            onClick={(e) => {
              if (!isPanning) {
                onCanvasClick(e, pageOffset);
              }
            }}
          />
          <div ref={textLayerRef} className="pdf-text-layer" />
          <canvas ref={annotationCanvasRef} className="pdf-annotation-canvas" />
        </div>

        {/* Reset pan position button */}
        {(panOffset.x !== 0 || panOffset.y !== 0) && (
          <button
            className="pdf-reset-view-button"
            onClick={() => {
              setPanOffset({ x: 0, y: 0 });
              setLastPanOffset({ x: 0, y: 0 });
            }}
            aria-label="Reset view"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {!isRendered && (
        <div className="pdf-loading-indicator">
          <div className="spinner"></div>
          <p>Loading page {pageNumber}...</p>
        </div>
      )}
    </div>
  );
};

export default PDFPage;
