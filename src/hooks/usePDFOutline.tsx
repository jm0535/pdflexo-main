
import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFOutlineItem, extractOutline } from '@/lib/pdfUtils/outlineUtils';

export const usePDFOutline = (pdfDocument: pdfjsLib.PDFDocumentProxy | null) => {
  const [outline, setOutline] = useState<PDFOutlineItem[]>([]);
  const [isNavPaneVisible, setIsNavPaneVisible] = useState(true);
  const [navPaneWidth, setNavPaneWidth] = useState(250); // Default width
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOutline = async () => {
      if (!pdfDocument) {
        setOutline([]);
        return;
      }

      setLoading(true);
      try {
        const outlineItems = await extractOutline(pdfDocument);
        setOutline(outlineItems);
      } catch (error) {
        console.error('Error loading outline:', error);
        setOutline([]);
      } finally {
        setLoading(false);
      }
    };

    loadOutline();
  }, [pdfDocument]);

  const toggleNavPane = () => {
    setIsNavPaneVisible(prev => !prev);
  };

  const handleResize = (newWidth: number) => {
    setNavPaneWidth(newWidth);
  };

  return {
    outline,
    isNavPaneVisible,
    navPaneWidth,
    toggleNavPane,
    handleResize,
    loading
  };
};
