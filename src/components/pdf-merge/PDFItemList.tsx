
import React from 'react';
import { Button } from "@/components/ui/button";
import PDFListItem from './PDFListItem';
import { PDFItem } from './types';

interface PDFItemListProps {
  pdfs: PDFItem[];
  isMerging: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
  onMerge: () => void;
}

const PDFItemList: React.FC<PDFItemListProps> = ({ 
  pdfs, 
  isMerging, 
  onMoveUp, 
  onMoveDown, 
  onRemove, 
  onMerge 
}) => {
  if (pdfs.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4 text-foreground">Selected PDFs ({pdfs.length})</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Drag and drop to reorder, or use the arrows to change the order. PDFs will be merged in the order shown below.
      </p>
      
      <div className="space-y-2 mb-6">
        {pdfs.map((pdf, index) => (
          <PDFListItem
            key={pdf.id}
            pdf={pdf}
            index={index}
            totalItems={pdfs.length}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onRemove={onRemove}
          />
        ))}
      </div>
      
      <Button 
        onClick={onMerge} 
        disabled={pdfs.length < 2 || isMerging}
        className="w-full"
      >
        {isMerging ? (
          <>
            <span className="animate-spin mr-2">⊷</span>
            Merging PDFs...
          </>
        ) : (
          <>Merge {pdfs.length} PDFs</>
        )}
      </Button>
    </div>
  );
};

export default PDFItemList;
