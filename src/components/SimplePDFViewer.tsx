import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  initPdfWorker,
  loadPdfDocument,
  clearPdfCache,
} from "@/lib/pdfjs-setup";
import "./SimplePDFViewer.css";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Initialize PDF.js worker
initPdfWorker();

// Remove console.log in production
if (process.env.NODE_ENV === "development") {
  console.log("PDF.js version:", pdfjsLib.version);
}

interface SimplePDFViewerProps {
  url: string;
  onTotalPagesChange?: (totalPages: number) => void;
}

export const SimplePDFViewer = ({ url, onTotalPagesChange }: SimplePDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [fitToWidth, setFitToWidth] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Clean up function to prevent memory leaks
  const cleanupPdf = useCallback(() => {
    if (pdfDocRef.current) {
      try {
        pdfDocRef.current.destroy();
      } catch (err) {
        console.error("Error destroying PDF document:", err);
      }
      pdfDocRef.current = null;
    }
  }, []);

  // Load the PDF document
  useEffect(() => {
    let isMounted = true;

    const loadPDF = async () => {
      // Clean up previous PDF if it exists
      cleanupPdf();

      if (!url) {
        setError("No PDF URL provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use the loadPdfDocument helper from pdfjs-setup
        const pdf = await loadPdfDocument(url);

        if (!isMounted) {
          try {
            pdf.destroy();
          } catch (err) {
            console.error("Error destroying PDF after unmount:", err);
          }
          return;
        }

        pdfDocRef.current = pdf;
        const pageCount = pdf.numPages;
        setNumPages(pageCount);

        // Call the callback if provided
        if (onTotalPagesChange) {
          onTotalPagesChange(pageCount);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to load PDF:", err);
        if (isMounted) {
          setError("Failed to load PDF. Please try again.");
          setLoading(false);
        }
      }
    };

    loadPDF();

    // Cleanup function
    return () => {
      isMounted = false;
      cleanupPdf();
      // Also clear from cache to prevent memory leaks
      try {
        clearPdfCache(url);
      } catch (err) {
        console.error("Error clearing PDF cache:", err);
      }
    };
  }, [url, cleanupPdf, onTotalPagesChange]);

  // Calculate appropriate scale based on container width
  const calculateScale = useCallback(() => {
    if (!containerRef.current || !pdfDocRef.current) return scale;
    
    const containerWidth = containerRef.current.clientWidth;
    // Use a fixed width for consistency (85% of container width)
    const targetWidth = containerWidth * 0.85;
    
    return targetWidth / 595; // 595 is a standard PDF width in points
  }, [scale]);

  // Render the current page
  useEffect(() => {
    let isMounted = true;

    const renderPage = async () => {
      if (!canvasRef.current || loading || !pdfDocRef.current || !numPages) return;

      try {
        const page = await pdfDocRef.current.getPage(currentPage);

        if (!isMounted) {
          return;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) {
          setError("Failed to get canvas context");
          return;
        }

        // Calculate appropriate scale
        let calculatedScale = scale;
        if (fitToWidth) {
          calculatedScale = calculateScale() || scale;
        }
        
        const viewport = page.getViewport({ 
          scale: calculatedScale,
          rotation: rotation
        });
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        try {
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
        } catch (renderErr) {
          console.error("Error during page render:", renderErr);
          if (isMounted) {
            setError("Error rendering PDF page. Please try again.");
          }
        }
      } catch (err) {
        console.error("Failed to render page:", err);
        if (isMounted) {
          setError("Failed to render page. Please try again.");
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [currentPage, loading, numPages, scale, calculateScale, rotation, fitToWidth]);

  // Recalculate scale on window resize
  useEffect(() => {
    const handleResize = () => {
      if (fitToWidth) {
        const newScale = calculateScale();
        if (newScale) {
          setScale(newScale);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial calculation
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateScale, fitToWidth]);

  const handleZoomIn = () => {
    setFitToWidth(false);
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setFitToWidth(false);
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  const handleRotate = () => {
    setRotation(prevRotation => (prevRotation + 90) % 360);
  };

  const toggleFitToWidth = () => {
    setFitToWidth(prev => !prev);
    if (!fitToWidth) {
      const newScale = calculateScale();
      if (newScale) {
        setScale(newScale);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Loading PDF...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full" ref={containerRef}>
      <div className="w-full mb-4 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="mx-2">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFitToWidth}
            className={fitToWidth ? "bg-primary text-white" : ""}
            title={fitToWidth ? "Fit to Width (Active)" : "Fit to Width"}
          >
            Fit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRotate}
            title="Rotate"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="pdf-canvas-container">
        <canvas ref={canvasRef} className="pdf-canvas" />
      </div>
    </div>
  );
};
