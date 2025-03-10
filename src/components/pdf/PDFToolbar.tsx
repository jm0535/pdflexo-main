
import React from 'react';
import { Button } from '@/components/ui/button';
import { ExportFormat } from '@/lib/pdfUtils/exportUtils';
import { 
  Copy, 
  Book, 
  Eraser, 
  Sparkles,
} from 'lucide-react';
import PDFAnnotationToolbar, { AnnotationTool } from '@/components/PDFAnnotationToolbar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PDFExportMenu from './PDFExportMenu';

interface PDFToolbarProps {
  currentTool: AnnotationTool;
  viewMode: 'single' | 'dual';
  selectedText: string | null;
  onToolChange: (tool: AnnotationTool) => void;
  onCopy: () => void;
  onClearAnnotations: () => void;
  onShowAIDialog: () => void;
  onToggleViewMode: () => void;
  onExport: (format: ExportFormat) => void;
  onToggleNavPane?: () => void;
  isNavPaneVisible?: boolean;
  children?: React.ReactNode;
}

const PDFToolbar: React.FC<PDFToolbarProps> = ({
  currentTool,
  viewMode,
  selectedText,
  onToolChange,
  onCopy,
  onClearAnnotations,
  onShowAIDialog,
  onToggleViewMode,
  onExport,
  onToggleNavPane,
  isNavPaneVisible,
  children
}) => {
  return (
    <TooltipProvider>
      <div className="bg-background border-b border-border p-2 sticky top-0 z-10 flex justify-between">
        <div className="flex items-center space-x-1">
          {children}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleViewMode}
              >
                <Book className="h-5 w-5 text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle view mode ({viewMode === 'single' ? 'Single' : 'Dual'} page)</p>
            </TooltipContent>
          </Tooltip>
          
          <PDFAnnotationToolbar
            currentTool={currentTool}
            onToolChange={onToolChange}
          />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearAnnotations}
              >
                <Eraser className="h-5 w-5 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear annotations</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex items-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCopy}
                disabled={!selectedText}
              >
                <Copy className="h-5 w-5 text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy selected text</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onShowAIDialog}
                disabled={!selectedText}
              >
                <Sparkles className="h-5 w-5 text-accent-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>AI analysis</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <PDFExportMenu onExport={onExport} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Export document</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PDFToolbar;
