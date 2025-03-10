
import React, { useEffect } from 'react';

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

interface AnnotationRendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  pageNumber: number;
  highlightedAreas: PageHighlight[];
  signatures: Signature[];
}

const AnnotationRenderer: React.FC<AnnotationRendererProps> = ({
  canvasRef,
  pageNumber,
  highlightedAreas,
  signatures,
}) => {
  useEffect(() => {
    const renderAnnotations = () => {
      if (!canvasRef.current) return;
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Render highlights for current page
      const pageHighlights = highlightedAreas.find(h => h.pageNum === pageNumber);
      if (pageHighlights) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        pageHighlights.areas.forEach(area => {
          ctx.fillRect(area.x, area.y, area.width, area.height);
        });
      }
      
      // Render signatures for current page
      const pageSignatures = signatures.filter(s => s.pageNum === pageNumber);
      pageSignatures.forEach(sig => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, sig.position.x, sig.position.y, 150, 80);
        };
        img.src = sig.dataUrl;
      });
    };

    renderAnnotations();
  }, [canvasRef, pageNumber, highlightedAreas, signatures]);

  return null; // This is a non-visual component
};

export default AnnotationRenderer;
