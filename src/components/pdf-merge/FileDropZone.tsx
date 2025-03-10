
import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { PDFItem } from './types';

interface FileDropZoneProps {
  onFilesAdded: (newPdfs: PDFItem[]) => void;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onFilesAdded }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const processFiles = (files: File[]) => {
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      toast.error("Only PDF files are allowed");
    }
    
    if (pdfFiles.length > 0) {
      const newPdfs = pdfFiles.map(file => ({
        id: uuidv4(),
        file,
        name: file.name
      }));
      
      onFilesAdded(newPdfs);
      toast.success(`${pdfFiles.length} PDF files added`);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
        dragOver ? 'border-primary bg-secondary/50' : 'border-border hover:border-primary/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center">
        <Upload className={`w-12 h-12 mb-4 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
        <h3 className="text-lg font-medium mb-2 text-foreground">
          {dragOver ? 'Drop PDFs here' : 'Drag & Drop PDF files here'}
        </h3>
        <p className="text-muted-foreground mb-4 text-center">
          or click to browse from your device
        </p>
        <label className="px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors">
          Select PDF Files
          <input 
            type="file" 
            multiple 
            accept=".pdf" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
};

export default FileDropZone;
