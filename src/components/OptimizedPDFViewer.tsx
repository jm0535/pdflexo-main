import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { PDFDocument } from "@/lib/types";
import { usePDF } from "@/hooks/usePDF";
import "./SimplePDFViewer.css"; // Reuse the same CSS

interface OptimizedPDFViewerProps {
  document: PDFDocument;
  onClose?: () => void;
  onPageChange?: (pageNumber: number) => void;
}

const OptimizedPDFViewer: React.FC<OptimizedPDFViewerProps> = ({
  document,
  onClose,
  onPageChange,
}) => {
  // Use our custom PDF hook
  const {
    pdfDoc,
    currentPage,
    totalPages,
    loading,
    error,
    debugInfo,
    pageRendering,
    scale,
    setScale,
    setCurrentPage,
    changePage,
    renderPage,
    retry: handleRetry,
  } = usePDF(document, {
    onPageChange,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Render current page when it changes or when scale changes
  useEffect(() => {
    if (pdfDoc && canvasRef.current && !loading) {
      renderPage(currentPage, canvasRef.current);
    }
  }, [pdfDoc, currentPage, scale, loading, renderPage]);

  // Adjust container size based on window size
  useEffect(() => {
    // Debounce resize handler
    let resizeTimer: number;
    const handleResize = () => {
      if (pdfDoc && canvasRef.current) {
        renderPage(currentPage, canvasRef.current);
      }
    };

    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleResize, 100);
    };

    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(resizeTimer);
    };
  }, [pdfDoc, currentPage, renderPage]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is in an input element
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Left arrow or Page Up for previous page
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        changePage(-1);
      }
      // Right arrow or Page Down for next page
      else if (e.key === "ArrowRight" || e.key === "PageDown") {
        changePage(1);
      }
      // Home key for first page
      else if (e.key === "Home") {
        setCurrentPage(1);
      }
      // End key for last page
      else if (e.key === "End") {
        setCurrentPage(totalPages);
      }
      // + key for zoom in
      else if (e.key === "+" || e.key === "=") {
        const newScale = Math.min(scale + 0.25, 3);
        setScale(newScale);
      }
      // - key for zoom out
      else if (e.key === "-") {
        const newScale = Math.max(scale - 0.25, 0.5);
        setScale(newScale);
      }
      // 0 key for reset zoom
      else if (e.key === "0") {
        setScale(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changePage, setCurrentPage, totalPages, scale, setScale]);

  // Add direct page input
  const [pageInput, setPageInput] = useState(currentPage.toString());

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPageInput(e.target.value);
    },
    []
  );

  const handlePageInputSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const pageNum = parseInt(pageInput, 10);
      if (
        !isNaN(pageNum) &&
        pageNum >= 1 &&
        pageNum <= totalPages &&
        !pageRendering
      ) {
        setCurrentPage(pageNum);
      } else {
        setPageInput(currentPage.toString());
      }
    },
    [pageInput, totalPages, pageRendering, currentPage, setCurrentPage]
  );

  // Add keyboard shortcuts help tooltip
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  const toggleKeyboardShortcuts = useCallback(() => {
    setShowKeyboardShortcuts((prev) => !prev);
  }, []);

  // Memoize zoom options to prevent unnecessary re-renders
  const zoomOptions = useMemo(
    () => [
      { value: 0.5, label: "50%" },
      { value: 0.75, label: "75%" },
      { value: 1, label: "100%" },
      { value: 1.25, label: "125%" },
      { value: 1.5, label: "150%" },
      { value: 2, label: "200%" },
      { value: 3, label: "300%" },
    ],
    []
  );

  // Memoize the toolbar to prevent unnecessary re-renders
  const Toolbar = useMemo(
    () => (
      <div className="simple-pdf-toolbar">
        <div className="simple-pdf-info">
          <h2 className="simple-pdf-title">{document.name}</h2>
          <div className="simple-pdf-pagination">
            <form
              onSubmit={handlePageInputSubmit}
              className="simple-pdf-page-form"
            >
              <span>Page </span>
              <input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                className="simple-pdf-page-input"
                aria-label="Current page"
              />
              <span> of {totalPages}</span>
            </form>
          </div>
        </div>

        <div className="simple-pdf-controls">
          <button
            className="simple-pdf-button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1 || pageRendering}
            title="First Page (Home)"
          >
            First
          </button>

          <button
            className="simple-pdf-button"
            onClick={() => changePage(-1)}
            disabled={currentPage <= 1 || pageRendering}
            title="Previous Page (Left Arrow)"
          >
            Previous
          </button>

          <button
            className="simple-pdf-button"
            onClick={() => changePage(1)}
            disabled={currentPage >= totalPages || pageRendering}
            title="Next Page (Right Arrow)"
          >
            Next
          </button>

          <button
            className="simple-pdf-button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages || pageRendering}
            title="Last Page (End)"
          >
            Last
          </button>

          <select
            className="simple-pdf-zoom-select"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            title="Zoom Level (+ to zoom in, - to zoom out, 0 to reset)"
          >
            {zoomOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            className="simple-pdf-button"
            onClick={toggleKeyboardShortcuts}
            title="Keyboard Shortcuts"
          >
            Shortcuts
          </button>

          {onClose && (
            <button
              className="simple-pdf-button simple-pdf-close-button"
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>
    ),
    [
      document.name,
      totalPages,
      pageInput,
      currentPage,
      pageRendering,
      scale,
      zoomOptions,
      handlePageInputSubmit,
      handlePageInputChange,
      setCurrentPage,
      changePage,
      setScale,
      toggleKeyboardShortcuts,
      onClose,
    ]
  );

  return (
    <div className="simple-pdf-viewer-container" ref={containerRef}>
      {Toolbar}

      <div className="simple-pdf-content">
        {loading && (
          <div className="simple-pdf-loading">
            <div className="simple-pdf-spinner"></div>
            <p>Loading PDF document...</p>
          </div>
        )}

        {error && (
          <div className="simple-pdf-error">
            <p>{error}</p>
            {debugInfo && <p className="simple-pdf-debug">{debugInfo}</p>}
            <button className="simple-pdf-button" onClick={handleRetry}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="simple-pdf-canvas-container">
            <canvas ref={canvasRef} className="simple-pdf-canvas" />
            {pageRendering && (
              <div className="simple-pdf-page-loading">
                <div className="simple-pdf-spinner simple-pdf-spinner-small"></div>
              </div>
            )}
          </div>
        )}

        {showKeyboardShortcuts && (
          <div className="simple-pdf-keyboard-shortcuts">
            <h3>Keyboard Shortcuts</h3>
            <ul>
              <li>
                <strong>Left Arrow / Page Up:</strong> Previous page
              </li>
              <li>
                <strong>Right Arrow / Page Down:</strong> Next page
              </li>
              <li>
                <strong>Home:</strong> First page
              </li>
              <li>
                <strong>End:</strong> Last page
              </li>
              <li>
                <strong>+/=:</strong> Zoom in
              </li>
              <li>
                <strong>-:</strong> Zoom out
              </li>
              <li>
                <strong>0:</strong> Reset zoom
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(OptimizedPDFViewer);
