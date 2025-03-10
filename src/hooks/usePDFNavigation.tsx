
import { useState, useEffect } from 'react';
import { ViewMode } from '@/lib/pdfUtils';

export const usePDFNavigation = (
  initialPage: number, 
  totalPages: number, 
  onPageChange: (newPage: number) => void
) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [viewMode, setViewMode] = useState<ViewMode>('single');

  const handlePrevPage = () => {
    if (currentPage > 1 && !isAnimating) {
      setDirection('prev');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage(prev => {
          const newPage = viewMode === 'dual' ? Math.max(prev - 2, 1) : prev - 1;
          onPageChange(newPage);
          return newPage;
        });
        setIsAnimating(false);
      }, 300);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages && !isAnimating) {
      setDirection('next');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage(prev => {
          const newPage = viewMode === 'dual' ? 
            Math.min(prev + 2, totalPages) : 
            prev + 1;
          onPageChange(newPage);
          return newPage;
        });
        setIsAnimating(false);
      }, 300);
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'single' ? 'dual' : 'single');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, isAnimating, totalPages, viewMode]);

  // Update local state if the external page changes
  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  return {
    currentPage,
    direction,
    isAnimating,
    viewMode,
    handlePrevPage,
    handleNextPage,
    toggleViewMode
  };
};
