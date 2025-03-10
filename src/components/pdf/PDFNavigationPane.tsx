
import React, { useRef, useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { PDFOutlineItem } from '@/lib/pdfUtils/outlineUtils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
}> = ({ item, onNavigate, level }) => {
  const [expanded, setExpanded] = React.useState(level < 2); // Auto-expand top two levels
  const hasChildren = item.items && item.items.length > 0;
  
  const handleClick = () => {
    if (item.pageNumber) {
      onNavigate(item.pageNumber);
    }
  };
  
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };
  
  return (
    <div className="text-sm">
      <div 
        className={`py-1.5 px-2 flex items-center rounded-md hover:bg-muted dark:hover:bg-muted cursor-pointer ${
          level === 0 ? 'font-medium' : ''
        }`}
        onClick={handleClick}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren && (
          <span 
            className="mr-1 text-muted-foreground" 
            onClick={toggleExpand}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <ChevronRight 
              className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} 
            />
          </span>
        )}
        {!hasChildren && <span className="w-5" />}
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PDFNavigationPane: React.FC<PDFNavigationPaneProps> = ({
  outline,
  onNavigate,
  isVisible,
  width,
  onResize
}) => {
  const [resizing, setResizing] = useState(false);
  const [initialX, setInitialX] = useState(0);
  const [initialWidth, setInitialWidth] = useState(width);
  const resizerRef = useRef<HTMLDivElement>(null);
  
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);
    setInitialX(e.clientX);
    setInitialWidth(width);
    document.body.style.cursor = 'col-resize';
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing) {
        const newWidth = initialWidth + (e.clientX - initialX);
        // Clamp width between 180px and 500px
        const clampedWidth = Math.max(180, Math.min(500, newWidth));
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
  }, [resizing, initialX, initialWidth, onResize]);
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <div className="relative h-full flex-shrink-0 bg-background dark:bg-gray-950" style={{ width: `${width}px` }}>
      <div className="border-r border-border h-full flex flex-col">
        <div className="p-3 border-b border-border">
          <h3 className="font-medium text-foreground">Document Outline</h3>
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
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Resizer handle */}
      <div 
        ref={resizerRef}
        className="absolute top-0 right-0 w-1 h-full bg-border hover:bg-primary/50 cursor-col-resize group"
        onMouseDown={startResizing}
        aria-hidden="true"
      >
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 h-8 w-2 rounded-sm opacity-0 group-hover:opacity-100 bg-primary transition-opacity" />
      </div>
    </div>
  );
};

export default PDFNavigationPane;
