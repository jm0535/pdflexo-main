
import React, { useState, useCallback, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { PDFDocument } from '@/lib/types';
import { toast } from "sonner";
import * as pdfjsLib from 'pdfjs-dist';
import { pdfSessionStorage } from '@/services/PDFSessionStorage';

// Configure the worker with a more secure approach
// This avoids using template literals with variables in URLs which can be a security risk
const pdfjsVersion = pdfjsLib.version;
const pdfjsWorkerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

// Set worker source only after component mounts to avoid SSR issues
const initPdfWorker = () => {
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
  }
};

interface FileUploadProps {
  onFileLoaded: (doc: PDFDocument) => void;
  maxFileSizeMB?: number; // Optional max file size in MB
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded, maxFileSizeMB = 10 }) => {
  // Initialize PDF worker after component mounts
  useEffect(() => {
    initPdfWorker();
  }, []);
  const [dragging, setDragging] = useState(false);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);
  
  const processPDF = useCallback(async (file: File) => {
    // Validate file type with more robust checking
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error("Please upload a valid PDF file");
      return;
    }
    
    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxFileSizeMB) {
      toast.error(`File size exceeds the maximum limit of ${maxFileSizeMB}MB`);
      return;
    }
    
    // Create a safe URL object
    let fileUrl: string;
    try {
      if (typeof URL === 'undefined') {
        throw new Error('URL API not available');
      }
      fileUrl = URL.createObjectURL(file);
    } catch (error) {
      console.error("Error creating object URL:", error);
      toast.error("Failed to process the file");
      return;
    }
    
    try {
      // Set a timeout to prevent hanging on corrupted PDFs
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PDF loading timeout')), 10000);
      });
      
      // Get actual page count with timeout protection
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await Promise.race([
        loadingTask.promise,
        timeoutPromise
      ]) as pdfjsLib.PDFDocumentProxy;
      
      const pageCount = pdf.numPages;
      
      // Validate reasonable page count to prevent DoS
      if (pageCount <= 0 || pageCount > 5000) {
        throw new Error('Invalid page count');
      }
      
      const newDocument: PDFDocument = {
        file,
        url: fileUrl,
        name: file.name.replace(/[<>"'&]/g, ''), // Sanitize filename
        totalPages: pageCount,
        currentPage: 1
      };
      
      // Add to session storage
      pdfSessionStorage.addDocument(newDocument);
      
      onFileLoaded(newDocument);
      toast.success("PDF loaded successfully");
    } catch (error) {
      // Revoke the URL if there's an error
      try {
        if (typeof URL !== 'undefined' && fileUrl) {
          URL.revokeObjectURL(fileUrl);
        }
      } catch (revokeError) {
        console.error("Error revoking object URL:", revokeError);
      }
      
      console.error("Error loading PDF:", error);
      if (error instanceof Error && error.message === 'PDF loading timeout') {
        toast.error("PDF loading timed out. The file might be corrupted or too large.");
      } else {
        toast.error("Failed to load PDF. Please ensure it's a valid PDF file.");
      }
    }
  }, [onFileLoaded]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    try {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        // Only process the first file
        if (e.dataTransfer.files.length > 1) {
          toast.info("Only the first file will be processed");
        }
        const file = e.dataTransfer.files[0];
        processPDF(file);
      }
    } catch (error) {
      console.error("Error handling file drop:", error);
      toast.error("Failed to process the dropped file");
    }
  }, [processPDF]);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        processPDF(file);
        
        // Reset the input value to allow uploading the same file again if needed
        e.target.value = '';
      }
    } catch (error) {
      console.error("Error handling file selection:", error);
      toast.error("Failed to process the selected file");
    }
  }, [processPDF]);
  
  return (
    <div className="w-full flex flex-col items-center justify-center p-10 animate-fade-in">
      <div 
        className={`file-drop-area w-full max-w-lg flex flex-col items-center ${dragging ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className={`w-16 h-16 mb-4 ${dragging ? 'text-blue-500' : 'text-gray-400'} animate-float`} />
        <h3 className="text-xl font-medium mb-2">
          {dragging ? 'Drop your PDF here' : 'Drag & Drop your PDF here'}
        </h3>
        <p className="text-gray-500 mb-6 text-center">
          or click to browse from your device
        </p>
        <label 
          htmlFor="file-upload" 
          className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors cursor-pointer"
        >
          Browse Files
        </label>
        <input 
          id="file-upload" 
          type="file" 
          accept=".pdf" 
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default FileUpload;
