
import React from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface NavigationProps {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentPage, 
  totalPages, 
  onPrevPage, 
  onNextPage 
}) => {
  return (
    <div className="page-controls animate-fade-in">
      <button 
        className="btn-icon" 
        onClick={onPrevPage}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className={`w-5 h-5 ${currentPage <= 1 ? 'text-gray-400' : 'text-gray-700'}`} />
      </button>
      
      <div className="px-4 flex items-center">
        <BookOpen className="w-4 h-4 text-gray-600 mr-2" />
        <span className="text-sm font-medium">
          {currentPage} / {totalPages}
        </span>
      </div>
      
      <button 
        className="btn-icon" 
        onClick={onNextPage}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className={`w-5 h-5 ${currentPage >= totalPages ? 'text-gray-400' : 'text-gray-700'}`} />
      </button>
    </div>
  );
};

export default Navigation;
