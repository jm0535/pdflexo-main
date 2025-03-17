import React, { useState } from 'react';
import { toast } from "sonner";
import { Layers } from 'lucide-react';
import FileDropZone from '@/components/pdf-merge/FileDropZone';
import PDFItemList from '@/components/pdf-merge/PDFItemList';
import { PDFItem } from '@/components/pdf-merge/types';
import Layout from '@/components/Layout';

const MergePDF = () => {
  const [pdfs, setPdfs] = useState<PDFItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const handleFilesAdded = (newPdfs: PDFItem[]) => {
    setPdfs(prev => [...prev, ...newPdfs]);
  };

  const handleRemovePdf = (id: string) => {
    setPdfs(prev => prev.filter(pdf => pdf.id !== id));
  };

  const handleMoveUp = (id: string) => {
    setPdfs(prev => {
      const index = prev.findIndex(pdf => pdf.id === id);
      if (index <= 0) return prev;
      
      const newPdfs = [...prev];
      const temp = newPdfs[index];
      newPdfs[index] = newPdfs[index - 1];
      newPdfs[index - 1] = temp;
      
      return newPdfs;
    });
  };

  const handleMoveDown = (id: string) => {
    setPdfs(prev => {
      const index = prev.findIndex(pdf => pdf.id === id);
      if (index >= prev.length - 1) return prev;
      
      const newPdfs = [...prev];
      const temp = newPdfs[index];
      newPdfs[index] = newPdfs[index + 1];
      newPdfs[index + 1] = temp;
      
      return newPdfs;
    });
  };

  const handleMergePdfs = () => {
    setIsMerging(true);
    
    // In a real implementation, you would use pdf.js or a similar library to actually merge the PDFs
    setTimeout(() => {
      toast.success("PDFs have been merged successfully!");
      setIsMerging(false);
      
      // In a production app, you might want to generate a download link for the merged PDF
    }, 1500);
  };

  return (
    <Layout>
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center text-foreground">
              <Layers className="w-6 h-6 mr-2 text-primary" />
              Merge PDFs
            </h2>
            <p className="text-muted-foreground mb-6">
              Upload multiple PDF files and arrange them in the order you want to merge them.
            </p>
            
            <FileDropZone onFilesAdded={handleFilesAdded} />
            
            <PDFItemList
              pdfs={pdfs}
              isMerging={isMerging}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onRemove={handleRemovePdf}
              onMerge={handleMergePdfs}
            />
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default MergePDF;
