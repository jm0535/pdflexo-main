
import React from 'react';

interface PDFLoadingStateProps {
  loading: boolean;
  error: string | null;
}

const PDFLoadingState: React.FC<PDFLoadingStateProps> = ({ loading, error }) => {
  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-lg min-h-[600px]">
        <div className="text-xl font-medium mb-4">Loading PDF...</div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-lg min-h-[600px]">
        <div className="text-xl font-medium mb-4 text-red-500">Error</div>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }
  
  return null;
};

export default PDFLoadingState;
