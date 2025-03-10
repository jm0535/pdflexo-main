
import React, { useRef, useState, useEffect } from 'react';
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

interface PDFViewerProps {
  document: PDFDocument;
  onClose: () => void;
  onPageChange: (newPage: number) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ document, onClose, onPageChange }) => {
  const { pdfDocument, loading, error } = usePDFDocument(document);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [zoomLevel, setZoomLevelState] = useState(getZoomLevel());
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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

  // Zoom control functions
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.1, 2.0);
    setZoomLevel(newZoom);
    setZoomLevelState(newZoom);
    toast.success(`Zoomed in to ${Math.round(newZoom * 100)}%`);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.1, 0.3);
    setZoomLevel(newZoom);
    setZoomLevelState(newZoom);
    toast.success(`Zoomed out to ${Math.round(newZoom * 100)}%`);
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setZoomLevelState(1);
    toast.success("Zoom reset to 100%");
  };

  const handleToggleFullscreen = () => {
    const isNowFullscreen = toggleFullscreen();
    setIsFullscreen(isNowFullscreen);
    toast.success(isNowFullscreen ? "Entered fullscreen mode" : "Exited fullscreen mode");
  };

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
  }, [zoomLevel, currentPage, isAnimating, viewMode]);

  // Display keyboard shortcuts on load
  useEffect(() => {
    if (!loading && !error) {
      toast.info(
        "Keyboard shortcuts: Arrow keys (navigation), Ctrl/Cmd+= (zoom in), Ctrl/Cmd+- (zoom out), Ctrl/Cmd+0 (reset), Ctrl+F (fullscreen)",
        { duration: 5000 }
      );
    }
  }, [loading, error]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
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
      
      <div className="flex-1 overflow-hidden flex">
        {isNavPaneVisible && (
          <PDFNavigationPane 
            outline={outline}
            onNavigate={handleNavigateToPage}
            isVisible={isNavPaneVisible}
            width={navPaneWidth}
            onResize={handleResize}
          />
        )}
        
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 flex justify-center items-start p-8">
          <div ref={viewerRef}>
            <PDFLoadingState loading={loading} error={error} />

            {!loading && !error && (
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
