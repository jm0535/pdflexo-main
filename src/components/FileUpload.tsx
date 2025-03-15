import React, { useState, useCallback, useEffect } from "react";
import { Upload, Loader2, AlertTriangle } from "lucide-react";
import { PDFDocument } from "@/lib/types";
import toast from "@/utils/toast";
import { SimplePDFViewer } from "./SimplePDFViewer";

interface FileUploadProps {
  onFileLoaded: (doc: PDFDocument) => void;
  maxFileSizeMB?: number;
  onTotalPagesChange?: (totalPages: number) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileLoaded,
  maxFileSizeMB = 10,
  onTotalPagesChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clean up URL objects when component unmounts or when URL changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Clean up previous URL if it exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      // Reset states
      setLoading(true);
      setError(null);

      // Validate file type
      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        setError("Please upload a valid PDF file");
        toast.error("Please upload a valid PDF file");
        setLoading(false);
        return;
      }

      // Validate file size
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > maxFileSizeMB) {
        setError(`File size exceeds the maximum limit of ${maxFileSizeMB}MB`);
        toast.error(
          `File size exceeds the maximum limit of ${maxFileSizeMB}MB`
        );
        setLoading(false);
        return;
      }

      try {
        // Create URL for preview
        const fileUrl = URL.createObjectURL(file);
        setPreviewUrl(fileUrl);

        // Create PDF document object
        const doc: PDFDocument = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: fileUrl,
          lastModified: file.lastModified,
        };

        // Call the callback with the document
        onFileLoaded(doc);
        toast.success(`PDF uploaded: ${file.name}`);
      } catch (error) {
        console.error("Error processing PDF:", error);
        setError("Failed to process the PDF file");
        toast.error("Failed to process the PDF file");
      } finally {
        setLoading(false);
      }
    },
    [maxFileSizeMB, onFileLoaded, previewUrl]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        // Create a synthetic event to reuse the handleFileChange logic
        const syntheticEvent = {
          target: {
            files: files,
          },
        } as React.ChangeEvent<HTMLInputElement>;

        handleFileChange(syntheticEvent);
      }
    },
    [handleFileChange]
  );

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {error ? (
              <>
                <AlertTriangle className="w-10 h-10 mb-2 text-red-500" />
                <p className="mb-2 text-sm text-red-500">{error}</p>
                <p className="text-xs text-gray-500">
                  Try again with a different file
                </p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 mb-2 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF files only (max {maxFileSizeMB}MB)
                </p>
              </>
            )}
          </div>
        </label>
      </div>

      {loading && (
        <div className="flex items-center justify-center mt-4">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Processing PDF...</span>
        </div>
      )}

      {previewUrl && !loading && (
        <div className="mt-4">
          <SimplePDFViewer
            url={previewUrl}
            onTotalPagesChange={onTotalPagesChange}
          />
        </div>
      )}
    </div>
  );
};

export default FileUpload;
