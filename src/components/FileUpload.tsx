
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const loadingTaskRef = useRef<pdfjsLib.PDFDocumentLoadingTask | null>(null);
  const renderStartTime = useRef<number>(0);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);
  
  const processPDF = useCallback(async (file: File) => {
    // Start loading state and timer
    setLoading(true);
    renderStartTime.current = performance.now();
    toast.info("Processing PDF file...");

    // Validate file type with more robust checking
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error("Please upload a valid PDF file");
      setLoading(false);
      return;
    }
    
    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxFileSizeMB) {
      toast.error(`File size exceeds the maximum limit of ${maxFileSizeMB}MB`);
      setLoading(false);
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
      setLoading(false);
      return;
    }

    try {
      // Cancel any existing loading task
      if (loadingTaskRef.current) {
        loadingTaskRef.current.destroy();
      }

      // Set a timeout to prevent hanging on corrupted PDFs
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PDF loading timeout')), 10000);
      });

      // Create a new loading task with optimized parameters
      const loadingTask = pdfjsLib.getDocument({
        url: fileUrl,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
        cMapPacked: true,
        rangeChunkSize: 65536, // Optimize chunk size for better streaming
        disableAutoFetch: false, // Enable auto-fetching for faster rendering
        disableStream: false, // Enable streaming for progressive loading
        disableRange: false, // Enable range requests for faster loading
        withCredentials: false
      });

      loadingTaskRef.current = loadingTask;

      // Show loading progress
      loadingTask.onProgress = ({ loaded, total }) => {
        if (total > 0) {
          const progress = Math.round((loaded / total) * 100);
          if (progress % 25 === 0) { // Only update at 25%, 50%, 75%, 100%
            console.log(`Loading PDF: ${progress}%`);
          }
        }
      };

      // Get actual page count with timeout protection
      const pdf = await Promise.race([
        loadingTask.promise,
        timeoutPromise
      ]) as pdfjsLib.PDFDocumentProxy;
      
      // Pre-fetch first page for faster initial rendering
      const firstPagePromise = pdf.getPage(1);

      const pageCount = pdf.numPages;

      // Validate reasonable page count to prevent DoS
      if (pageCount <= 0 || pageCount > 5000) {
        throw new Error('Invalid page count');
      }
      
      // Wait for first page to be ready
      await firstPagePromise;
      
      const newDocument: PDFDocument = {
        file,
        url: fileUrl,
        name: file.name.replace(/[<>"'&]/g, ''), // Sanitize filename
        totalPages: pageCount,
        currentPage: 1
      };
      
      // Add to session storage
      pdfSessionStorage.addDocument(newDocument);

      // Calculate and log performance metrics
      const loadTime = Math.round(performance.now() - renderStartTime.current);
      console.log(`PDF processed in ${loadTime}ms`);

      // Notify user and pass document to parent component
      onFileLoaded(newDocument);
      toast.success(`PDF loaded successfully (${loadTime}ms)`);
      setLoading(false);
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
      setLoading(false);
    }
  }, [onFileLoaded, maxFileSizeMB]);
  
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
  
  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (loadingTaskRef.current) {
        loadingTaskRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center p-10 animate-fade-in">
      <div
        className={`file-drop-area w-full max-w-lg flex flex-col items-center ${dragging ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {loading ? (
          <Loader2 className="w-16 h-16 mb-4 text-blue-500 animate-spin" />
        ) : (
          <Upload className={`w-16 h-16 mb-4 ${dragging ? 'text-blue-500' : 'text-gray-400'} animate-float`} />
        )}
        <h3 className="text-xl font-medium mb-2">
          {loading ? 'Processing PDF...' :
           dragging ? 'Drop your PDF here' : 'Drag & Drop your PDF here'}
        </h3>
        <p className="text-gray-500 mb-6 text-center">
          {loading ? 'Please wait while we optimize your PDF for viewing' :
           'or click to browse from your device'}
        </p>
        <label
          htmlFor="file-upload"
          className={`px-6 py-3 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'} text-white rounded-lg shadow-md transition-colors`}
        >
          {loading ? 'Processing...' : 'Browse Files'}
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default FileUpload;
