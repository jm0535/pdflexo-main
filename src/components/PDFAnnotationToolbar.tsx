
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Highlighter, PenLine, Trash2, ArrowLeft } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type AnnotationTool = 'select' | 'highlight' | 'signature' | 'none';

interface PDFAnnotationToolbarProps {
  onToolChange: (tool: AnnotationTool) => void;
  currentTool: AnnotationTool;
  onCopy?: () => void;
  onClearAnnotations?: () => void;
  hasSelection?: boolean;
}

const PDFAnnotationToolbar: React.FC<PDFAnnotationToolbarProps> = ({
  onToolChange,
  currentTool,
  onCopy,
  onClearAnnotations,
  hasSelection,
}) => {
  return (
    <div className="flex items-center gap-2 py-2 px-4 bg-background border-b border-border">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onToolChange('select')}
        className={cn(
          currentTool === 'select' ? 'bg-primary/20 text-primary' : 'text-foreground'
        )}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Select
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onToolChange('highlight')}
        className={cn(
          currentTool === 'highlight' ? 'bg-primary/20 text-primary' : 'text-foreground'
        )}
      >
        <Highlighter className="mr-1 h-4 w-4" />
        Highlight
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onToolChange('signature')}
        className={cn(
          currentTool === 'signature' ? 'bg-primary/20 text-primary' : 'text-foreground'
        )}
      >
        <PenLine className="mr-1 h-4 w-4" />
        Sign
      </Button>
      
      {onCopy && onClearAnnotations && (
        <>
          <div className="flex-1" />
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCopy} 
            disabled={!hasSelection}
            className="text-foreground"
          >
            <Copy className="mr-1 h-4 w-4" />
            Copy
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-foreground">
                <Trash2 className="mr-1 h-4 w-4" />
                Clear
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onClearAnnotations}>
                Clear All Annotations
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
};

export default PDFAnnotationToolbar;
