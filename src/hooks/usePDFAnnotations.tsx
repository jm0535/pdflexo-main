
import { useState } from 'react';
import { AnnotationTool } from '@/components/PDFAnnotationToolbar';
import { toast } from 'sonner';

interface SignaturePosition {
  x: number;
  y: number;
  page?: number;
}

interface HighlightArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PageHighlight {
  pageNum: number;
  areas: HighlightArea[];
}

interface Signature {
  pageNum: number;
  dataUrl: string;
  position: {
    x: number;
    y: number;
  };
}

export const usePDFAnnotations = () => {
  const [currentTool, setCurrentTool] = useState<AnnotationTool>('select');
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [highlightedAreas, setHighlightedAreas] = useState<PageHighlight[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition | null>(null);

  const handleMouseUp = (event: React.MouseEvent, pageOffset: number = 0) => {
    try {
      const currentPage = parseInt((event.currentTarget as HTMLElement).getAttribute('data-page') || '1', 10);
      
      if (currentTool === 'select') {
        const selection = window.getSelection();
        if (selection && selection.toString()) {
          setSelectedText(selection.toString());
        }
      } else if (currentTool === 'highlight') {
        const selection = window.getSelection();
        if (selection && selection.toString()) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const canvasRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
          
          // Calculate position relative to the canvas
          const x = rect.left - canvasRect.left;
          const y = rect.top - canvasRect.top;
          
          // Add highlight to the correct page
          const highlightPage = currentPage + pageOffset;
          
          setHighlightedAreas(prev => {
            const pageHighlight = prev.find(h => h.pageNum === highlightPage);
            if (pageHighlight) {
              return prev.map(h => h.pageNum === highlightPage ? {
                ...h,
                areas: [...h.areas, { x, y, width: rect.width, height: rect.height }]
              } : h);
            } else {
              return [...prev, {
                pageNum: highlightPage,
                areas: [{ x, y, width: rect.width, height: rect.height }]
              }];
            }
          });
          
          // Clear selection after highlighting
          selection.removeAllRanges();
          setSelectedText(null);
          toast.success("Text highlighted");
        }
      }
    } catch (error) {
      console.error("Error in handleMouseUp:", error);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>, pageOffset: number = 0) => {
    try {
      const currentPage = parseInt(e.currentTarget.getAttribute('data-page') || '1', 10);
      
      if (currentTool === 'signature') {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Store which page was clicked (for dual mode)
        const signaturePage = currentPage + pageOffset;
        setSignaturePosition({ x, y, page: signaturePage });
        setShowSignatureCanvas(true);
      }
    } catch (error) {
      console.error("Error in handleCanvasClick:", error);
    }
  };

  const handleSignatureSave = (signatureDataUrl: string) => {
    try {
      if (signaturePosition) {
        // Use the page stored in signaturePosition (for dual mode)
        const targetPage = signaturePosition.page || 1; // Default to page 1 if page is not defined
        
        setSignatures(prev => [
          ...prev,
          {
            pageNum: targetPage,
            dataUrl: signatureDataUrl,
            position: { x: signaturePosition.x, y: signaturePosition.y }
          }
        ]);
        
        setShowSignatureCanvas(false);
        setSignaturePosition(null);
        setCurrentTool('select');
        toast.success("Signature added");
      }
    } catch (error) {
      console.error("Error in handleSignatureSave:", error);
      toast.error("Failed to add signature");
    }
  };

  const handleToolChange = (tool: AnnotationTool) => {
    setCurrentTool(tool);
  };

  const handleClearAnnotations = (currentPage?: number) => {
    try {
      if (currentPage) {
        setHighlightedAreas(prev => prev.filter(h => h.pageNum !== currentPage));
        setSignatures(prev => prev.filter(s => s.pageNum !== currentPage));
        toast.success("Page annotations cleared");
      } else {
        setHighlightedAreas([]);
        setSignatures([]);
        toast.success("All annotations cleared");
      }
    } catch (error) {
      console.error("Error in handleClearAnnotations:", error);
      toast.error("Failed to clear annotations");
    }
  };

  return {
    currentTool,
    selectedText,
    highlightedAreas,
    signatures,
    showSignatureCanvas,
    signaturePosition,
    setSignaturePosition,
    setShowSignatureCanvas,
    handleMouseUp,
    handleCanvasClick,
    handleSignatureSave,
    handleToolChange,
    handleClearAnnotations,
    setSelectedText
  };
};
