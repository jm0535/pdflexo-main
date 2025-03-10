
import React from 'react';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { PDFItem } from './types';

interface PDFListItemProps {
  pdf: PDFItem;
  index: number;
  totalItems: number;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
}

const PDFListItem: React.FC<PDFListItemProps> = ({ 
  pdf, 
  index, 
  totalItems, 
  onMoveUp, 
  onMoveDown, 
  onRemove 
}) => {
  return (
    <div className="flex items-center bg-secondary p-3 rounded-md">
      <div className="flex-shrink-0 w-8 text-center font-medium text-muted-foreground">
        {index + 1}
      </div>
      <div className="flex-1 truncate ml-2 text-foreground">
        {pdf.name}
      </div>
      <div className="flex space-x-1 ml-2">
        <button 
          className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30"
          onClick={() => onMoveUp(pdf.id)}
          disabled={index === 0}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button 
          className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30"
          onClick={() => onMoveDown(pdf.id)}
          disabled={index === totalItems - 1}
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button 
          className="p-1 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(pdf.id)}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PDFListItem;
