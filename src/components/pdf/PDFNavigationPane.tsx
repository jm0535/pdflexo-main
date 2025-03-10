
import React, { useRef, useState, useEffect } from 'react';
import { ChevronRight, X, FileText, Menu } from 'lucide-react';
import { PDFOutlineItem } from '@/lib/pdfUtils/outlineUtils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface PDFNavigationPaneProps {
  outline: PDFOutlineItem[];
  onNavigate: (pageNumber: number) => void;
  isVisible: boolean;
  width: number;
  onResize: (newWidth: number) => void;
}

const OutlineItem: React.FC<{
  item: PDFOutlineItem;
  onNavigate: (pageNumber: number) => void;
  level: number;
  isMobile: boolean;
  currentPage?: number;
}> = ({ item, onNavigate, level, isMobile, currentPage }) => {
  const [expanded, setExpanded] = React.useState(level < 2); // Auto-expand top two levels
  const hasChildren = item.items && item.items.length > 0;
  const isCurrentPage = currentPage === item.pageNumber;
  
  const handleClick = () => {
    if (item.pageNumber) {
      onNavigate(item.pageNumber);
    }
  };
  
  const toggleExpand = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };
  
  return (
    <div className="text-sm">
      <div 
        className={`py-1.5 px-2 flex items-center rounded-md hover:bg-muted/80 dark:hover:bg-muted/60 cursor-pointer transition-colors duration-150 ${
          level === 0 ? 'font-medium' : ''
        } ${
          isCurrentPage ? 'bg-primary/10 text-primary dark:bg-primary/20' : ''
        } ${
          isMobile ? 'py-2.5' : ''
        }`}
        onClick={handleClick}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren && (
          <span
            className="mr-1 text-muted-foreground touch-manipulation"
            onClick={toggleExpand}
            onTouchEnd={toggleExpand}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''} ${isMobile ? 'h-5 w-5' : ''}`}
            />
          </span>
        )}
        {!hasChildren && (
          <span className={`w-5 ${isMobile ? 'w-6' : ''}`}>
            {!hasChildren && level === 0 && (
              <FileText className="h-3.5 w-3.5 text-muted-foreground/70" />
            )}
          </span>
        )}
        <span className="truncate">{item.title || "Untitled Section"}</span>
      </div>
      
      {hasChildren && expanded && (
        <div>
          {item.items?.map((child, i) => (
            <OutlineItem
              key={`${child.title || "item"}-${i}`}
              item={child}
              onNavigate={onNavigate}
              level={level + 1}
              isMobile={isMobile}
              currentPage={currentPage}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface PDFNavigationPaneProps {
  outline: PDFOutlineItem[];
  onNavigate: (pageNumber: number) => void;
  isVisible: boolean;
  width: number;
  onResize: (newWidth: number) => void;
  currentPage?: number;
  onClose?: () => void;
}

const PDFNavigationPane: React.FC<PDFNavigationPaneProps> = ({
  outline,
  onNavigate,
  isVisible,
  width,
  onResize,
  currentPage,
  onClose
}) => {
  const [resizing, setResizing] = useState(false);
  const [initialX, setInitialX] = useState(0);
  const [initialWidth, setInitialWidth] = useState(width);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallMobile = useMediaQuery('(max-width: 480px)');

  // Adjust width for mobile devices
  useEffect(() => {
    if (isMobile && isVisible) {
      // Use a percentage of screen width on mobile
      const mobileWidth = isSmallMobile ?
        Math.min(window.innerWidth * 0.85, 300) :
        Math.min(window.innerWidth * 0.7, 350);
      onResize(mobileWidth);
    }
  }, [isMobile, isSmallMobile, isVisible, onResize]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);
    setInitialX(e.clientX);
    setInitialWidth(width);
    document.body.style.cursor = 'col-resize';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
      setInitialWidth(width);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX !== null && e.touches.length === 1) {
      const touchX = e.touches[0].clientX;
      const newWidth = initialWidth + (touchX - touchStartX);
      // Clamp width between 180px and 500px, or smaller on mobile
      const minWidth = isMobile ? 250 : 180;
      const maxWidth = isMobile ? 350 : 500;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      onResize(clampedWidth);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing) {
        const newWidth = initialWidth + (e.clientX - initialX);
        // Clamp width between 180px and 500px, or smaller on mobile
        const minWidth = isMobile ? 250 : 180;
        const maxWidth = isMobile ? 350 : 500;
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        onResize(clampedWidth);
      }
    };
    
    const handleMouseUp = () => {
      if (resizing) {
        setResizing(false);
        document.body.style.cursor = '';
      }
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [resizing, initialX, initialWidth, onResize, isMobile]);
  
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`relative h-full flex-shrink-0 bg-background dark:bg-gray-950 shadow-lg ${isMobile ? 'fixed z-40 left-0 top-0 bottom-0' : ''}`}
      style={{ width: `${width}px` }}
    >
      <div className="border-r border-border h-full flex flex-col">
        <div className="p-3 border-b border-border flex justify-between items-center">
          <h3 className="font-medium text-foreground flex items-center">
            <Menu className="h-4 w-4 mr-2 text-primary" />
            Document Outline
          </h3>
          {isMobile && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1 pb-4">
          <div className="p-2">
            {outline.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-4">No outline available for this document</p>
            ) : (
              outline.map((item, i) => (
                <OutlineItem
                  key={`${item.title || "section"}-${i}`}
                  item={item}
                  onNavigate={onNavigate}
                  level={0}
                  isMobile={isMobile}
                  currentPage={currentPage}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Resizer handle - desktop only */}
      {!isMobile && (
        <div
          ref={resizerRef}
          className="absolute top-0 right-0 w-1 h-full bg-border hover:bg-primary/50 cursor-col-resize group"
          onMouseDown={startResizing}
          aria-hidden="true"
        >
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 h-8 w-2 rounded-sm opacity-0 group-hover:opacity-100 bg-primary transition-opacity" />
        </div>
      )}
      
      {/* Touch resizer - mobile only */}
      {isMobile && (
        <div
          className="absolute top-0 right-0 w-4 h-full bg-transparent touch-manipulation"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-hidden="true"
        >
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 h-20 w-1 rounded-full opacity-30 bg-primary" />
        </div>
      )}
    </div>
  );
};

export default PDFNavigationPane;
