import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  initPdfWorker,
  loadPdfDocument,
  clearPdfCache,
} from "@/lib/pdfjs-setup";
import "./SimplePDFViewer.css";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize, 
  List, 
  Bookmark, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Grid2X2,
  SplitSquareVertical,
  ArrowUp,
  ArrowDown,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Initialize PDF.js worker
initPdfWorker();

// Remove console.log in production
if (process.env.NODE_ENV === "development") {
  console.log("PDF.js version:", pdfjsLib.version);
}

interface SimplePDFViewerProps {
  url: string;
  onTotalPagesChange?: (totalPages: number) => void;
}

type BookmarkItem = {
  id: string;
  page: number;
  title: string;
  timestamp: number;
};

type ViewMode = 'single' | 'continuous' | 'twoPages' | 'presentation';
type SidebarTab = 'outline' | 'bookmarks' | 'thumbnails' | 'none';

export const SimplePDFViewer = ({ url, onTotalPagesChange }: SimplePDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [fitToWidth, setFitToWidth] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('continuous');
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('outline');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [outline, setOutline] = useState<any[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Clean up function to prevent memory leaks
  const cleanupPdf = useCallback(() => {
    if (pdfDocRef.current) {
      try {
        pdfDocRef.current.destroy();
      } catch (err) {
        console.error("Error destroying PDF document:", err);
      }
      pdfDocRef.current = null;
    }
  }, []);

  // Load the PDF document
  useEffect(() => {
    let isMounted = true;

    const loadPDF = async () => {
      // Clean up previous PDF if it exists
      cleanupPdf();

      if (!url) {
        setError("No PDF URL provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use the loadPdfDocument helper from pdfjs-setup
        const pdf = await loadPdfDocument(url);

        if (!isMounted) {
          try {
            pdf.destroy();
          } catch (err) {
            console.error("Error destroying PDF after unmount:", err);
          }
          return;
        }

        pdfDocRef.current = pdf;
        const pageCount = pdf.numPages;
        setNumPages(pageCount);

        // Load outline (table of contents)
        try {
          const outline = await pdf.getOutline();
          if (outline && outline.length > 0) {
            // Process outline items to ensure they have valid page references
            const processedOutline = outline.map((item: any) => {
              // Ensure dest is properly formatted for navigation
              if (item.dest && Array.isArray(item.dest) && typeof item.dest[0] === 'object') {
                // If dest[0] is an object (reference), we need to resolve the page number
                return {
                  ...item,
                  dest: [1] // Default to page 1 if we can't resolve
                };
              }
              return item;
            });
            setOutline(processedOutline);
          }
        } catch (err) {
          console.error("Error loading outline:", err);
          // Set empty outline to prevent rendering errors
          setOutline([]);
        }

        // Generate thumbnails (simplified)
        const thumbs: string[] = [];
        for (let i = 1; i <= Math.min(pageCount, 20); i++) {
          try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.2 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            if (context) {
              await page.render({
                canvasContext: context,
                viewport: viewport,
              }).promise;
              
              thumbs.push(canvas.toDataURL());
            }
          } catch (err) {
            console.error(`Error generating thumbnail for page ${i}:`, err);
          }
        }
        setThumbnails(thumbs);

        // Call the callback if provided
        if (onTotalPagesChange) {
          onTotalPagesChange(pageCount);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to load PDF:", err);
        if (isMounted) {
          setError("Failed to load PDF. Please try again.");
          setLoading(false);
        }
      }
    };

    loadPDF();

    // Load saved bookmarks for this document
    try {
      const savedBookmarks = localStorage.getItem(`bookmarks-${url}`);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    } catch (err) {
      console.error("Error loading bookmarks:", err);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      cleanupPdf();
      // Also clear from cache to prevent memory leaks
      try {
        clearPdfCache(url);
      } catch (err) {
        console.error("Error clearing PDF cache:", err);
      }
    };
  }, [url, cleanupPdf, onTotalPagesChange]);

  // Calculate appropriate scale based on container width
  const calculateScale = useCallback(() => {
    if (!containerRef.current || !pdfDocRef.current) return scale;
    
    const containerWidth = containerRef.current.clientWidth - (showSidebar ? 250 : 0);
    // Use a fixed width for consistency (85% of container width)
    const targetWidth = containerWidth * 0.85;
    
    return targetWidth / 595; // 595 is a standard PDF width in points
  }, [scale, showSidebar]);

  // Render the current page
  useEffect(() => {
    let isMounted = true;

    const renderPage = async () => {
      if (!canvasRef.current || loading || !pdfDocRef.current || !numPages) return;

      try {
        const page = await pdfDocRef.current.getPage(currentPage);

        if (!isMounted) {
          return;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) {
          setError("Failed to get canvas context");
          return;
        }

        // Calculate appropriate scale
        let calculatedScale = scale;
        if (fitToWidth) {
          calculatedScale = calculateScale() || scale;
        }
        
        const viewport = page.getViewport({ 
          scale: calculatedScale,
          rotation: rotation
        });
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        try {
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
        } catch (renderErr) {
          console.error("Error during page render:", renderErr);
          if (isMounted) {
            setError("Error rendering PDF page. Please try again.");
          }
        }
      } catch (err) {
        console.error("Failed to render page:", err);
        if (isMounted) {
          setError("Failed to render page. Please try again.");
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [currentPage, loading, numPages, scale, calculateScale, rotation, fitToWidth]);

  // Recalculate scale on window resize
  useEffect(() => {
    const handleResize = () => {
      if (fitToWidth) {
        const newScale = calculateScale();
        if (newScale) {
          setScale(newScale);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial calculation
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateScale, fitToWidth]);

  // Handle fullscreen mode
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent handling if inside an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          if (currentPage > 1) setCurrentPage(p => p - 1);
          break;
        case 'ArrowRight':
          if (currentPage < numPages) setCurrentPage(p => p + 1);
          break;
        case '+':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'b':
          addBookmark();
          break;
        case 'o':
          toggleSidebar('outline');
          break;
        case 'c':
          toggleViewMode('continuous');
          break;
        case 's':
          toggleViewMode('single');
          break;
        case 'p':
          toggleViewMode('presentation');
          break;
        case 't':
          toggleViewMode('twoPages');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, numPages]);

  // Handle search functionality
  const handleSearch = async () => {
    if (!searchText || !pdfDocRef.current) return;

    try {
      setLoading(true);
      const results: any[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocRef.current.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.toLowerCase().includes(searchText.toLowerCase())) {
          results.push({ page: i, text: pageText });
        }
      }

      setSearchResults(results);
      if (results.length > 0) {
        setCurrentSearchIndex(0);
        setCurrentPage(results[0].page);
      } else {
        setCurrentSearchIndex(-1);
      }
    } catch (err) {
      console.error("Error searching PDF:", err);
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions
  const navigateToNextSearchResult = () => {
    if (searchResults.length === 0 || currentSearchIndex === -1) return;
    
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    setCurrentPage(searchResults[nextIndex].page);
  };

  const navigateToPrevSearchResult = () => {
    if (searchResults.length === 0 || currentSearchIndex === -1) return;
    
    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    setCurrentPage(searchResults[prevIndex].page);
  };

  // Bookmark functions
  const addBookmark = () => {
    const newBookmark: BookmarkItem = {
      id: `bookmark-${Date.now()}`,
      page: currentPage,
      title: `Page ${currentPage}`,
      timestamp: Date.now()
    };
    
    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);
    
    // Save to localStorage
    try {
      localStorage.setItem(`bookmarks-${url}`, JSON.stringify(updatedBookmarks));
    } catch (err) {
      console.error("Error saving bookmark:", err);
    }
  };

  const removeBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== id);
    setBookmarks(updatedBookmarks);
    
    // Save to localStorage
    try {
      localStorage.setItem(`bookmarks-${url}`, JSON.stringify(updatedBookmarks));
    } catch (err) {
      console.error("Error removing bookmark:", err);
    }
  };

  // View mode functions
  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    
    if (mode === 'presentation') {
      toggleFullscreen();
    }
  };

  // Sidebar functions
  const toggleSidebar = (tab: SidebarTab) => {
    if (showSidebar && sidebarTab === tab) {
      setShowSidebar(false);
    } else {
      setShowSidebar(true);
      setSidebarTab(tab);
    }
  };

  // Zoom functions
  const handleZoomIn = () => {
    setFitToWidth(false);
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setFitToWidth(false);
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  const handleRotate = () => {
    setRotation(prevRotation => (prevRotation + 90) % 360);
  };

  const toggleFitToWidth = () => {
    setFitToWidth(prev => !prev);
    if (!fitToWidth) {
      const newScale = calculateScale();
      if (newScale) {
        setScale(newScale);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!viewerRef.current) return;
    
    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Render sidebar content
  const renderSidebarContent = () => {
    switch (sidebarTab) {
      case 'outline':
        return (
          <div className="pdf-sidebar-content">
            <h3 className="text-lg font-medium mb-2">Document Outline</h3>
            {outline && outline.length > 0 ? (
              <ul className="pdf-outline-list">
                {outline.map((item: any, index) => (
                  <li key={`outline-${index}`} className="pdf-outline-item">
                    <button 
                      onClick={() => handleOutlineItemClick(item)}
                      className="text-left hover:text-primary"
                    >
                      {item.title || 'Untitled Section'}
                    </button>
                    {item.items && item.items.length > 0 && (
                      <ul className="pl-4">
                        {item.items.map((subItem: any, subIndex: number) => (
                          <li key={`outline-${index}-${subIndex}`} className="pdf-outline-item">
                            <button 
                              onClick={() => handleOutlineItemClick(subItem)}
                              className="text-left hover:text-primary"
                            >
                              {subItem.title || 'Untitled Item'}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No outline available</p>
            )}
          </div>
        );
      
      case 'bookmarks':
        return (
          <div className="pdf-sidebar-content">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Bookmarks</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addBookmark}
                title="Add Bookmark"
              >
                Add
              </Button>
            </div>
            {bookmarks.length > 0 ? (
              <ul className="pdf-bookmarks-list">
                {bookmarks.map((bookmark) => (
                  <li key={bookmark.id} className="pdf-bookmark-item flex justify-between items-center py-2">
                    <button 
                      onClick={() => setCurrentPage(bookmark.page)}
                      className="text-left hover:text-primary flex-1"
                    >
                      {bookmark.title}
                    </button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeBookmark(bookmark.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No bookmarks added</p>
            )}
          </div>
        );
      
      case 'thumbnails':
        return (
          <div className="pdf-sidebar-content">
            <h3 className="text-lg font-medium mb-2">Page Thumbnails</h3>
            <div className="grid grid-cols-2 gap-2">
              {thumbnails.map((thumb, index) => (
                <div 
                  key={`thumb-${index}`} 
                  className={`pdf-thumbnail-item cursor-pointer border-2 ${currentPage === index + 1 ? 'border-primary' : 'border-transparent'}`}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  <img src={thumb} alt={`Page ${index + 1}`} className="w-full" />
                  <div className="text-center text-xs mt-1">Page {index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const handleOutlineItemClick = async (item: any) => {
    if (!pdfDocRef.current) return;
    
    try {
      let pageNumber = 1; // Default to first page
      
      if (item.dest) {
        // Handle different types of destinations
        if (typeof item.dest === 'string') {
          // Named destination - needs to be resolved
          const dest = await pdfDocRef.current.getDestination(item.dest);
          if (dest && dest.length > 0 && typeof dest[0] === 'object') {
            const ref = dest[0];
            // Get page number from reference
            pageNumber = await pdfDocRef.current.getPageIndex(ref) + 1;
          }
        } else if (Array.isArray(item.dest)) {
          // Direct destination array
          if (typeof item.dest[0] === 'object') {
            // Reference to page object
            try {
              pageNumber = await pdfDocRef.current.getPageIndex(item.dest[0]) + 1;
            } catch (err) {
              console.error("Error resolving page reference:", err);
            }
          } else if (typeof item.dest[0] === 'number') {
            // Direct page number (1-based)
            pageNumber = item.dest[0];
          }
        }
      } else if (item.pageNumber) {
        // Some outlines might have direct pageNumber property
        pageNumber = item.pageNumber;
      }
      
      // Ensure valid page number
      if (pageNumber < 1) pageNumber = 1;
      if (pageNumber > numPages) pageNumber = numPages;
      
      setCurrentPage(pageNumber);
    } catch (err) {
      console.error("Error navigating to outline item:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Loading PDF...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`pdf-viewer-container ${isFullscreen ? 'fullscreen' : ''}`} 
      ref={viewerRef}
    >
      {/* Top Toolbar */}
      <div className="pdf-toolbar">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            title="Previous Page"
            className="font-medium"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center">
            <Input
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= numPages) {
                  setCurrentPage(page);
                }
              }}
              className="w-20 text-center font-medium text-lg"
            />
            <span className="mx-2 text-lg font-medium">/ {numPages}</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            title="Next Page"
            className="font-medium"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toggleSidebar('outline')}
            className={`font-medium ${showSidebar && sidebarTab === 'outline' ? "bg-primary text-white" : ""}`}
            title="Outline"
          >
            <List className="h-5 w-5 mr-1" />
            <span>Outline</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toggleSidebar('bookmarks')}
            className={`font-medium ${showSidebar && sidebarTab === 'bookmarks' ? "bg-primary text-white" : ""}`}
            title="Bookmarks"
          >
            <Bookmark className="h-5 w-5 mr-1" />
            <span>Bookmarks</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toggleSidebar('thumbnails')}
            className={`font-medium ${showSidebar && sidebarTab === 'thumbnails' ? "bg-primary text-white" : ""}`}
            title="Thumbnails"
          >
            <Grid2X2 className="h-5 w-5 mr-1" />
            <span>Thumbnails</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomOut}
            title="Zoom Out"
            className="font-medium"
          >
            <ZoomOut className="h-5 w-5 mr-1" />
            <span>-</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFitToWidth}
            className={`font-medium ${fitToWidth ? "bg-primary text-white" : ""}`}
            title={fitToWidth ? "Fit to Width (Active)" : "Fit to Width"}
          >
            <span>Fit</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomIn}
            title="Zoom In"
            className="font-medium"
          >
            <ZoomIn className="h-5 w-5 mr-1" />
            <span>+</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRotate}
            title="Rotate"
            className="font-medium"
          >
            <RotateCw className="h-5 w-5 mr-1" />
            <span>Rotate</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toggleViewMode('single')}
            className={`font-medium ${viewMode === 'single' ? "bg-primary text-white" : ""}`}
            title="Single Page View"
          >
            <span>Single</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toggleViewMode('continuous')}
            className={`font-medium ${viewMode === 'continuous' ? "bg-primary text-white" : ""}`}
            title="Continuous View"
          >
            <span>Continuous</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toggleViewMode('twoPages')}
            className={`font-medium ${viewMode === 'twoPages' ? "bg-primary text-white" : ""}`}
            title="Two Pages View"
          >
            <SplitSquareVertical className="h-5 w-5 mr-1" />
            <span>Two Pages</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="font-medium"
          >
            <Maximize className="h-5 w-5 mr-1" />
            <span>Fullscreen</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSearch(!showSearch)}
            className={`font-medium ${showSearch ? "bg-primary text-white" : ""}`}
            title="Search"
          >
            <Search className="h-5 w-5 mr-1" />
            <span>Search</span>
          </Button>
        </div>
      </div>
      
      {/* Search Bar */}
      {showSearch && (
        <div className="pdf-search-bar">
          <div className="flex items-center w-full max-w-md">
            <Input
              type="text"
              placeholder="Search in document..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="mr-2 bg-slate-700 text-white placeholder-slate-300 border-slate-600 text-base"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSearch}
              className="font-medium bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
            >
              <Search className="h-5 w-5 mr-1" />
              <span>Find</span>
            </Button>
            {searchResults.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={navigateToPrevSearchResult}
                  className="ml-2 font-medium bg-slate-700 text-white border-slate-600"
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={navigateToNextSearchResult}
                  className="ml-2 font-medium bg-slate-700 text-white border-slate-600"
                >
                  <ArrowDown className="h-5 w-5" />
                </Button>
                <span className="ml-4 text-white font-medium">
                  {currentSearchIndex + 1} of {searchResults.length}
                </span>
              </>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSearch(false)}
            className="ml-auto text-white hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      {/* Main Content */}
      <div className="pdf-content-container" ref={containerRef}>
        {/* Sidebar */}
        {showSidebar && (
          <div className="pdf-sidebar">
            {renderSidebarContent()}
          </div>
        )}
        
        {/* PDF Viewer */}
        <div className={`pdf-canvas-container ${viewMode}`}>
          <canvas ref={canvasRef} className="pdf-canvas" />
        </div>
      </div>
    </div>
  );
};
