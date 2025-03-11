import React, { useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from '@/lib/types';
import PDFPage from './PDFPage';
import AnnotationRenderer from './AnnotationRenderer';
import { shouldShowSecondaryPage } from '@/lib/pdfUtils/viewUtils';

// Define types locally to match what AnnotationRenderer expects
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

interface PDFPageContainerProps {
  pdfDocument: pdfjsLib.PDFDocumentProxy | null;
  document: PDFDocument;
  currentPage: number;
  viewMode: 'single' | 'dual';
  isAnimating: boolean;
  direction: 'next' | 'prev';
  highlightedAreas: PageHighlight[];
  signatures: Signature[];
  onMouseUp: (e: React.MouseEvent, pageOffset?: number) => void;
  onCanvasClick: (e: React.MouseEvent<HTMLCanvasElement>, pageOffset?: number) => void;
}

const PDFPageContainer: React.FC<PDFPageContainerProps> = ({
  pdfDocument,
  document,
  currentPage,
  viewMode,
  isAnimating,
  direction,
  highlightedAreas,
  signatures,
  onMouseUp,
  onCanvasClick
}) => {
  const primaryAnnotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const secondaryAnnotationCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const showSecondaryPage = shouldShowSecondaryPage(viewMode, currentPage, pdfDocument?.numPages || 0);
  const secondaryPageNumber = currentPage + 1;

  // Wrapper functions to pass currentPage to annotation handlers
  const handleMouseUpWrapper = (e: React.MouseEvent, pageOffset: number = 0) => {
    onMouseUp(e, pageOffset);
  };

  const handleCanvasClickWrapper = (e: React.MouseEvent<HTMLCanvasElement>, pageOffset: number = 0) => {
    onCanvasClick(e, pageOffset);
  };

  return (
    <div className="pdf-viewer-container">
      <div className={`pdf-viewer ${viewMode === 'dual' ? 'dual-mode' : 'single-mode'}`}>
        {/* Primary Page */}
        <div className="pdf-page-outer-wrapper">
          <div className="pdf-page-wrapper">
            <PDFPage
              pdfDocument={pdfDocument}
              pageNumber={currentPage}
              documentName={document.name}
              onMouseUp={handleMouseUpWrapper}
              onCanvasClick={handleCanvasClickWrapper}
              isAnimating={isAnimating}
              direction={direction}
            />
            {primaryAnnotationCanvasRef.current && (
              <AnnotationRenderer
                canvasRef={primaryAnnotationCanvasRef}
                pageNumber={currentPage}
                highlightedAreas={highlightedAreas}
                signatures={signatures}
              />
            )}
          </div>
        </div>
        {/* Secondary Page (only in dual mode) */}
        {showSecondaryPage && (
          <div className="pdf-page-outer-wrapper">
            <div className="pdf-page-wrapper">
              <PDFPage
                pdfDocument={pdfDocument}
                pageNumber={secondaryPageNumber}
                documentName={document.name}
                onMouseUp={(e) => handleMouseUpWrapper(e, 1)}
                onCanvasClick={(e) => handleCanvasClickWrapper(e, 1)}
                isAnimating={isAnimating}
                direction={direction}
                pageOffset={1}
              />
              {secondaryAnnotationCanvasRef.current && (
                <AnnotationRenderer
                  canvasRef={secondaryAnnotationCanvasRef}
                  pageNumber={secondaryPageNumber}
                  highlightedAreas={highlightedAreas}
                  signatures={signatures}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFPageContainer;
