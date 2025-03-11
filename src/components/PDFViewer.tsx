import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PDFDocument } from '@/lib/types';
import Navigation from './Navigation';
import SignatureCanvas from './SignatureCanvas';
import { copyToClipboard } from '@/lib/pdfUtils';
import { exportToFormat, ExportFormat } from '@/lib/pdfUtils/exportUtils';
import { toast } from "sonner";
import PDFLoadingState from './pdf/PDFLoadingState';
import { usePDFDocument } from '@/hooks/usePDFDocument';
import { usePDFAnnotations } from '@/hooks/usePDFAnnotations';
import { usePDFNavigation } from '@/hooks/usePDFNavigation';
import { usePDFOutline } from '@/hooks/usePDFOutline';
import AIAgentDialog from './dialogs/AIAgentDialog';
import PDFToolbar from './pdf/PDFToolbar';
import PDFPageContainer from './pdf/PDFPageContainer';
import PDFNavigationPane from './pdf/PDFNavigationPane';
import { setZoomLevel, getZoomLevel, toggleFullscreen } from '@/lib/pdfUtils/viewUtils';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface PDFViewerProps {
  document: PDFDocument;
  onClose: () => void;
  onPageChange: (newPage: number) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ document, onClose, onPageChange }) => {
  // Use a ref to track component mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  const { pdfDocument, loading, error } = usePDFDocument(document);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [zoomLevel, setZoomLevelState] = useState(getZoomLevel());
  const [forceStableRendering, setForceStableRendering] = useState(true);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  
  // Get the total pages from pdfDocument or fall back to document.totalPages
  const totalPages = pdfDocument?.numPages || document.totalPages;
  
  const {
    currentTool,
    selectedText,
    highlightedAreas,
    signatures,
    showSignatureCanvas,
    signaturePosition,
    setShowSignatureCanvas,
    setSignaturePosition,
    handleMouseUp,
    handleCanvasClick,
    handleSignatureSave,
    handleToolChange,
    handleClearAnnotations,
    setSelectedText
  } = usePDFAnnotations();

  const {
    currentPage,
    direction,
    isAnimating,
    viewMode,
    handlePrevPage,
    handleNextPage,
    toggleViewMode
  } = usePDFNavigation(document.currentPage, totalPages, onPageChange);

  const {
    outline,
    isNavPaneVisible,
    navPaneWidth,
    toggleNavPane,
    handleResize,
    loading: outlineLoading
  } = usePDFOutline(pdfDocument);

  const viewerRef = useRef<HTMLDivElement>(null);
  
  // Handle copy
  const handleCopy = async () => {
    if (selectedText) {
      const success = await copyToClipboard(selectedText);
      if (success) {
        toast.success("Text copied to clipboard");
      } else {
        toast.error("Failed to copy text");
      }
    }
  };

  // Handle export to various formats
  const handleExport = (format: ExportFormat = 'pdf') => {
    exportToFormat(document.url, format);
    toast.success(`Exporting document as ${format.toUpperCase()}`);
  };

  // Handle navigation from the outline
  const handleNavigateToPage = (pageNumber: number) => {
    onPageChange(pageNumber);
  };

  // Zoom control functions - wrapped in useCallback to avoid dependency issues
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevel + 0.1, 2.0);
    setZoomLevel(newZoom);
    setZoomLevelState(newZoom);
    toast.success(`Zoomed in to ${Math.round(newZoom * 100)}%`);
  }, [zoomLevel]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevel - 0.1, 0.3);
    setZoomLevel(newZoom);
    setZoomLevelState(newZoom);
    toast.success(`Zoomed out to ${Math.round(newZoom * 100)}%`);
  }, [zoomLevel]);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setZoomLevelState(1);
    toast.success("Zoom reset to 100%");
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    const isNowFullscreen = toggleFullscreen();
    setIsFullscreen(isNowFullscreen);
    toast.success(isNowFullscreen ? "Entered fullscreen mode" : "Exited fullscreen mode");
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Prevent default for these specific shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        handleZoomIn();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        handleZoomOut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        handleResetZoom();
      } else if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault();
        handleToggleFullscreen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomLevel, currentPage, isAnimating, viewMode, handlePrevPage, handleNextPage, handleZoomIn, handleZoomOut, handleResetZoom, handleToggleFullscreen]);

  // Set up component mount tracking
  useEffect(() => {
    isMountedRef.current = true;

    // Force stable rendering mode for better performance and to prevent flickering
    setForceStableRendering(true);

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Display keyboard shortcuts and outline info on load
  useEffect(() => {
    if (!loading && !error && isMountedRef.current) {
      // Show document outline toast if outline is available
      if (outline.length > 0) {
        toast.info("Document Outline Available", {
          description: "Click the outline button in the toolbar to view the document structure",
          action: {
            label: "Open Outline",
            onClick: () => toggleNavPane()
          },
          duration: 5000
        });
      }
    }
  }, [loading, error, outline, toggleNavPane]);

  // Advanced optimization for PDF rendering to completely eliminate flickering during transitions
  useEffect(() => {
    const preloadCache = new Map();
    let renderTimeoutId = null;

    const optimizePDFRendering = () => {
      // Add a CSS class to the document body to disable animations during PDF rendering
      window.document.body.classList.add('pdf-rendering-optimized');

      // Apply hardware acceleration to the viewer container
      if (viewerRef.current) {
        viewerRef.current.style.transform = 'translateZ(0)';
        viewerRef.current.style.backfaceVisibility = 'hidden';
        viewerRef.current.style.willChange = 'transform';
      }

      // Aggressive preloading strategy to eliminate flickering
      if (pdfDocument && totalPages > 0) {
        const preloadAdjacentPages = async () => {
          // Determine which pages to preload based on current page and view mode
          const pagesToPreload = new Set();

          // Current page is always preloaded
          pagesToPreload.add(currentPage);

          // In dual mode, also preload the second page
          if (viewMode === 'dual' && currentPage < totalPages) {
            pagesToPreload.add(currentPage + 1);
          }

          // Preload previous and next pages for smooth navigation
          if (currentPage > 1) pagesToPreload.add(currentPage - 1);
          if (currentPage < totalPages) pagesToPreload.add(currentPage + 1);

          // For dual mode, also preload the page pairs
          if (viewMode === 'dual') {
            if (currentPage > 2) pagesToPreload.add(currentPage - 2);
            if (currentPage + 2 <= totalPages) pagesToPreload.add(currentPage + 2);
          }

          // Convert to array and prioritize
          const prioritizedPages = Array.from(pagesToPreload).sort((a, b) => {
            // Current page has highest priority
            if (a === currentPage) return -1;
            if (b === currentPage) return 1;

            // Then adjacent pages
            const distA = Math.abs(Number(a) - currentPage);
            const distB = Math.abs(Number(b) - currentPage);
            return distA - distB;
          });

          // Preload pages with controlled concurrency
          const preloadPage = async (pageNum) => {
            try {
              // Skip if already in cache
              if (preloadCache.has(pageNum)) return;

              const page = await pdfDocument.getPage(pageNum);

              // Store in cache
              preloadCache.set(pageNum, page);

              // Limit cache size
              if (preloadCache.size > 5) {
                // Remove oldest entries that aren't the current or adjacent pages
                const keysToKeep = new Set([currentPage]);
                if (currentPage > 1) keysToKeep.add(currentPage - 1);
                if (currentPage < totalPages) keysToKeep.add(currentPage + 1);

                for (const key of preloadCache.keys()) {
                  if (!keysToKeep.has(key)) {
                    const pageToRemove = preloadCache.get(key);
                    preloadCache.delete(key);
                    try {
                      if (pageToRemove && typeof pageToRemove.cleanup === 'function') {
                        pageToRemove.cleanup();
                      }
                    } catch (e) {
                      console.error('Error cleaning up page:', e);
                    }
                    break; // Remove only one at a time
                  }
                }
              }
            } catch (e) {
              // Ignore errors during preloading
            }
          };

          // Process pages in priority order with controlled concurrency
          const concurrencyLimit = 2; // Process 2 pages at a time
          for (let i = 0; i < prioritizedPages.length; i += concurrencyLimit) {
            const batchEndIndex = Math.min(i + concurrencyLimit, prioritizedPages.length);
            const batch = prioritizedPages.slice(i, batchEndIndex);
            await Promise.all(batch.map(preloadPage));
          }
        };

        // Start preloading
        preloadAdjacentPages().catch(() => {});
      }

      // Remove the optimization class after rendering is complete with a longer timeout
      renderTimeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          window.document.body.classList.remove('pdf-rendering-optimized');
        }
      }, 1200); // Extended timeout for better stability

      return () => {
        if (renderTimeoutId) clearTimeout(renderTimeoutId);
        window.document.body.classList.remove('pdf-rendering-optimized');

        // Clean up preload cache
        preloadCache.forEach(page => {
          try {
            if (page && typeof page.cleanup === 'function') {
              page.cleanup();
            }
          } catch (e) {
            console.error('Error cleaning up page:', e);
          }
        });
        preloadCache.clear();
      };
    };

    if (!loading && pdfDocument) {
      return optimizePDFRendering();
    }
  }, [loading, pdfDocument, currentPage, isMountedRef, totalPages, viewMode]);

  // Add enhanced CSS styles to the document head to optimize PDF rendering
  useEffect(() => {
    // Create a style element with advanced optimizations
    const styleElement = window.document.createElement('style');
    styleElement.textContent = `
      /* Completely disable animations during rendering to prevent flickering */
      .pdf-rendering-optimized * {
        transition: none !important;
        animation: none !important;
        transform: none !important;
      }

      /* Apply containment strategies for better performance */
      .pdf-container {
        contain: content;
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        will-change: transform;
        isolation: isolate;
        position: relative;
        z-index: 1;
      }

      /* Optimize page rendering */
      .pdf-page {
        contain: content;
        will-change: transform;
        visibility: visible !important;
        transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-transform-style: preserve-3d;
        transform-style: preserve-3d;
      }

      /* Canvas optimizations */
      .pdf-canvas {
        display: block;
        width: 100%;
        height: auto;
        image-rendering: high-quality;
        transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-font-smoothing: subpixel-antialiased;
      }

      /* Annotation layer optimizations */
      .annotation-layer {
        will-change: transform;
        transform: translateZ(0);
        backface-visibility: hidden;
      }
      
      /* Mobile optimizations */
      @media (max-width: 768px) {
        .pdf-container {
          contain: content;
          overscroll-behavior: none;
          touch-action: pan-x pan-y;
        }

        .pdf-canvas {
          image-rendering: crisp-edges;
        }
      }

      /* Safari-specific optimizations */
      @supports (-webkit-overflow-scrolling: touch) {
        .pdf-container {
          -webkit-overflow-scrolling: touch;
        }
      }
    `;

    // Add the style to the head
    window.document.head.appendChild(styleElement);

    // Cleanup function
    return () => {
      if (styleElement.parentNode) {
        window.document.head.removeChild(styleElement);
      }
    };
  }, []);

  // Force hardware acceleration and prevent layout thrashing
  useEffect(() => {
    // Force a repaint to ensure hardware acceleration is active
    const forceRepaint = () => {
      if (isMountedRef.current) {
        // This forces the browser to create a new compositing layer
        window.document.body.style.willChange = 'transform';
        // Force a reflow
        void window.document.body.offsetHeight;
        // Reset
        window.document.body.style.willChange = 'auto';
      }
    };

    forceRepaint();

    // Implement our own debounce function
    const debounce = <T extends (...args: unknown[]) => void>(func: T, wait: number) => {
      let timeout: ReturnType<typeof setTimeout> | null = null;
      return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          func(...args);
        }, wait);
      };
    };
    // Apply this on resize to maintain stability
    const handleResize = debounce(() => {
      if (isMountedRef.current) {
        forceRepaint();
        // Re-apply optimizations
        window.document.body.classList.add('pdf-rendering-optimized');
        setTimeout(() => {
          if (isMountedRef.current) {
            window.document.body.classList.remove('pdf-rendering-optimized');
          }
        }, 300);
      }
    }, 200);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMountedRef]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden pdf-container"
         data-pdf-stabilized="true">
      <PDFToolbar 
        currentTool={currentTool}
        viewMode={viewMode}
        selectedText={selectedText}
        onToolChange={handleToolChange}
        onCopy={handleCopy}
        onClearAnnotations={handleClearAnnotations}
        onShowAIDialog={() => setShowAIDialog(true)}
        onToggleViewMode={toggleViewMode}
        onExport={handleExport}
        onToggleNavPane={toggleNavPane}
        isNavPaneVisible={isNavPaneVisible}
      >
        <div className="flex items-center space-x-1 border-r border-border pr-2 mr-2">
          <button 
            className="p-1.5 rounded-sm hover:bg-muted text-blue-500 dark:text-blue-400"
            onClick={handleZoomIn}
            title="Zoom In (Ctrl/Cmd+=)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button 
            className="p-1.5 rounded-sm hover:bg-muted text-blue-500 dark:text-blue-400"
            onClick={handleZoomOut}
            title="Zoom Out (Ctrl/Cmd+-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button 
            className="p-1.5 rounded-sm hover:bg-muted text-blue-500 dark:text-blue-400"
            onClick={handleToggleFullscreen}
            title="Toggle Fullscreen (Ctrl+F)"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </PDFToolbar>
      
      <div className="flex-1 overflow-hidden flex relative">
        {isNavPaneVisible && (
          <PDFNavigationPane
            outline={outline}
            onNavigate={handleNavigateToPage}
            isVisible={isNavPaneVisible}
            width={navPaneWidth}
            onResize={handleResize}
            currentPage={currentPage}
            onClose={isMobile ? toggleNavPane : undefined}
          />
        )}

        <div className={`flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 flex justify-center items-start ${isMobile ? 'p-2 sm:p-4' : 'p-6'}`}>
          <div ref={viewerRef} className="w-full flex justify-center">
            <PDFLoadingState loading={loading} error={error} />

            {!loading && !error && (
              <div className="w-full flex justify-center">
                <PDFPageContainer 
                  pdfDocument={pdfDocument}
                  document={document}
                  currentPage={currentPage}
                  viewMode={viewMode}
                  isAnimating={isAnimating}
                  direction={direction}
                  highlightedAreas={highlightedAreas}
                  signatures={signatures}
                  onMouseUp={handleMouseUp}
                  onCanvasClick={handleCanvasClick}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showSignatureCanvas && (
        <SignatureCanvas 
          onSave={handleSignatureSave}
          onCancel={() => {
            setShowSignatureCanvas(false);
            setSignaturePosition(null);
          }}
        />
      )}
      
      <AIAgentDialog 
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        selectedText={selectedText}
        documentName={document.name}
      />
      
      <Navigation 
        currentPage={currentPage}
        totalPages={pdfDocument?.numPages || document.totalPages}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
      />
    </div>
  );
};

export default PDFViewer;
