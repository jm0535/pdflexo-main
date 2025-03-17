import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  initPdfWorker,
  loadPdfDocument,
  clearPdfCache,
} from "@/lib/pdfjs-setup";
import "./SimplePDFViewer.css";
import "./PDFOutlineStyles.css";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Book,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  Grid2X2,
  List,
  Maximize,
  Printer,
  RotateCw,
  Search,
  SplitSquareVertical,
  X,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  AlignJustify,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImprovedSearchPanel from "./ImprovedSearchPanel";
import PDFOutlineView from "./PDFOutlineView";

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

type ViewMode = "continuous" | "twoPages" | "presentation";
type SidebarTab = "outline" | "bookmarks" | "thumbnails" | "none";

export const SimplePDFViewer = ({
  url,
  onTotalPagesChange,
}: SimplePDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [fitToWidth, setFitToWidth] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>("continuous");
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("outline");
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [outline, setOutline] = useState<any[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [renderedPages, setRenderedPages] = useState<number[]>([]);
  const [thumbnailsRendered, setThumbnailsRendered] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [searchHighlights, setSearchHighlights] = useState<Map<number, any[]>>(
    new Map()
  );
  const [detailedSearchResults, setDetailedSearchResults] = useState<
    {
      page: number;
      text: string;
      matches: {
        text: string;
        position: { left: number; top: number; width: number; height: number };
        originalText: string;
        contextBefore: string;
        contextAfter: string;
      }[];
    }[]
  >([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const highlightsRef = useRef<HTMLDivElement>(null);

  // UTILITY FUNCTIONS - These should come first as they don't depend on other functions

  // Function to get context around a match
  const getTextContext = useCallback(
    (
      text: string,
      matchIndex: number,
      matchLength: number,
      contextSize: number = 20
    ) => {
      const startContext = Math.max(0, matchIndex - contextSize);
      const endContext = Math.min(
        text.length,
        matchIndex + matchLength + contextSize
      );

      return {
        contextBefore: text.substring(startContext, matchIndex),
        contextAfter: text.substring(matchIndex + matchLength, endContext),
      };
    },
    []
  );

  // Function to render search highlights
  const renderSearchHighlights = useCallback(() => {
    if (
      !searchHighlights ||
      searchHighlights.size === 0 ||
      !containerRef.current
    )
      return null;

    // Only render highlights for the current page
    const pageHighlights = searchHighlights.get(currentPage);
    if (!pageHighlights || pageHighlights.length === 0) return null;

    // Get the canvas for the current page
    const canvas = document.querySelector(
      `.pdf-canvas[data-page-number="${currentPage}"]`
    );
    if (!canvas) return null;

    // Get canvas position
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate offset relative to the container
    const offsetX = canvasRect.left - containerRect.left;
    const offsetY = canvasRect.top - containerRect.top;

    // Create highlight elements
    return (
      <div className="pdf-search-highlights">
        {pageHighlights.map((highlight, idx) => {
          const { position } = highlight;
          if (!position) return null;

          // Calculate position relative to the container
          const style = {
            left: `${offsetX + position.left}px`,
            top: `${offsetY + position.top}px`,
            width: `${position.width}px`,
            height: `${position.height}px`,
            position: "absolute" as const,
            backgroundColor: "rgba(255, 255, 0, 0.3)",
            pointerEvents: "none" as const,
            zIndex: 1,
          };

          return <div key={`highlight-${currentPage}-${idx}`} style={style} />;
        })}
      </div>
    );
  }, [searchHighlights, currentPage, containerRef]);

  // EVENT HANDLERS - These depend on utility functions but not on each other

  // Handle search result click
  const handleSearchResultClick = useCallback(
    (index: number, page: number) => {
      console.log(
        `SimplePDFViewer: Handling search result click: index ${index}, page ${page}`
      );

      // Validate page number
      if (page < 1 || page > numPages) {
        console.error(
          `Invalid page number: ${page}. Valid range is 1-${numPages}`
        );
        return;
      }

      // First update the current search index
      setCurrentSearchIndex(index);

      // Then update the current page
      setCurrentPage(page);

      // Use a timeout to ensure the page has time to render before attempting to scroll
      setTimeout(() => {
        try {
          // Try to find the canvas for this page
          const pageElement = document.querySelector(
            `.pdf-canvas[data-page-number="${page}"]`
          );
          if (pageElement) {
            pageElement.scrollIntoView({ behavior: "smooth", block: "start" });
          } else {
            console.warn(`Could not find canvas element for page ${page}`);
            // Try to find any canvas element that might contain this page
            const canvasElements = document.querySelectorAll(".pdf-canvas");
            console.log(`Found ${canvasElements.length} canvas elements`);

            // Log all canvas elements for debugging
            canvasElements.forEach((el, i) => {
              console.log(`Canvas ${i}:`, el.getAttribute("data-page-number"));
            });
          }
        } catch (err) {
          console.error("Error scrolling to page:", err);
        }
      }, 300);
    },
    [numPages]
  );

  // Navigate to next search result
  const navigateToNextSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;

    // Calculate next index
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    const targetPage = searchResults[nextIndex].page;

    console.log(
      `SimplePDFViewer: Navigating to next result: index ${nextIndex}, page ${targetPage}`
    );

    // Use our improved handleSearchResultClick function
    handleSearchResultClick(nextIndex, targetPage);
  }, [searchResults, currentSearchIndex, handleSearchResultClick]);

  // Navigate to previous search result
  const navigateToPrevSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;

    // Calculate previous index
    const prevIndex =
      (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    const targetPage = searchResults[prevIndex].page;

    console.log(
      `SimplePDFViewer: Navigating to previous result: index ${prevIndex}, page ${targetPage}`
    );

    // Use our improved handleSearchResultClick function
    handleSearchResultClick(prevIndex, targetPage);
  }, [searchResults, currentSearchIndex, handleSearchResultClick]);

  // Function to navigate to a specific search result
  const navigateToSearchResult = useCallback(
    (resultIndex: number) => {
      if (resultIndex < 0 || resultIndex >= searchResults.length) return;

      try {
        // Get the target page
        const targetPage = searchResults[resultIndex].page;

        console.log(
          `SimplePDFViewer: Navigating to result: index ${resultIndex}, page ${targetPage}`
        );

        // Use our improved handleSearchResultClick function
        handleSearchResultClick(resultIndex, targetPage);
      } catch (err) {
        console.error("Error navigating to search result:", err);
      }
    },
    [searchResults, handleSearchResultClick]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setShowSearch(false);
    setShowSearchPanel(false);
    setShowSearchResults(false);
    setSearchText("");
    setSearchResults([]);
    setDetailedSearchResults([]);
    setSearchHighlights(new Map());
    setCurrentSearchIndex(-1);
  }, []);

  // Handle search functionality
  const handleSearch = useCallback(async () => {
    if (!searchText || !pdfDocRef.current) return;

    try {
      setIsSearching(true);
      setSearchResults([]);
      setDetailedSearchResults([]);
      setSearchHighlights(new Map());

      const results: any[] = [];
      const detailedResults: any[] = [];
      const highlights = new Map();
      let totalMatchCount = 0;

      // Case insensitive search
      const searchTermLower = searchText.toLowerCase().trim();

      if (searchTermLower.length === 0) {
        setIsSearching(false);
        return;
      }

      // Show a loading indicator in the search bar
      const searchStatusElement = document.getElementById("search-status");
      if (searchStatusElement) {
        searchStatusElement.textContent = "Searching...";
      }

      for (let i = 1; i <= numPages; i++) {
        try {
          // Get the page
          const page = await pdfDocRef.current.getPage(i);

          // Get text content with item positions
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1.0, rotation }); // Use scale 1.0 for position calculations

          // Process text content for this page
          let pageHasMatches = false;
          const pageMatches: any[] = [];

          // Process each text item to find matches
          textContent.items.forEach((item: any) => {
            if (!item.str) return; // Skip items without text

            const itemText = item.str;
            const itemTextLower = itemText.toLowerCase();

            // Find all occurrences of the search term in this text item
            let startIndex = 0;
            while (true) {
              const matchIndex = itemTextLower.indexOf(
                searchTermLower,
                startIndex
              );
              if (matchIndex === -1) break;

              pageHasMatches = true;
              totalMatchCount++;

              // Calculate position for highlighting
              // Use the transform matrix from the text item for accurate positioning
              const [scaleX, skewX, skewY, scaleY, transX, transY] =
                item.transform;

              // Calculate position based on the text's transform and the match position
              const position = {
                left: transX + matchIndex * scaleX,
                top: transY - scaleY, // Adjust for PDF coordinate system
                width: searchTermLower.length * scaleX,
                height: Math.abs(scaleY) * 1.2, // Slightly taller than the text
              };

              // Get context around the match
              const { contextBefore, contextAfter } = getTextContext(
                itemText,
                matchIndex,
                searchTermLower.length
              );

              // Add match to page matches
              pageMatches.push({
                text: itemText.substring(
                  matchIndex,
                  matchIndex + searchTermLower.length
                ),
                position: position,
                originalText: itemText,
                contextBefore,
                contextAfter,
              });

              // Move to next potential match
              startIndex = matchIndex + searchTermLower.length;
            }
          });

          // If we found matches on this page, add to results
          if (pageHasMatches) {
            // Join all text items for the basic result
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(" ");

            // Basic result for navigation
            results.push({
              page: i,
              text: pageText,
              matchCount: pageMatches.length,
            });

            // Add detailed result
            detailedResults.push({
              page: i,
              text: pageText,
              matches: pageMatches,
            });

            // Store highlights for this page
            highlights.set(i, pageMatches);

            // Update search status
            if (searchStatusElement) {
              searchStatusElement.textContent = `Found ${totalMatchCount} matches on ${results.length} pages...`;
            }
          }
        } catch (err) {
          console.error(`Error searching page ${i}:`, err);
        }
      }

      // Update state with search results
      setSearchResults(results);
      setDetailedSearchResults(detailedResults);
      setSearchHighlights(highlights);

      // Show search panel if we have results
      if (results.length > 0) {
        setShowSearchPanel(true);
        setShowSearchResults(true);

        // Navigate to first result if found
        setCurrentSearchIndex(0);
        setCurrentPage(results[0].page);

        // Scroll to the page with the first result
        setTimeout(() => {
          const pageElement = document.querySelector(
            `.pdf-canvas[data-page-number="${results[0].page}"]`
          );
          if (pageElement) {
            pageElement.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 300);
      } else {
        // No results found
        if (searchStatusElement) {
          searchStatusElement.textContent = "No matches found";
        }
      }
    } catch (err) {
      console.error("Error during search:", err);
    } finally {
      setIsSearching(false);
    }
  }, [
    searchText,
    pdfDocRef,
    numPages,
    getTextContext,
    setCurrentPage,
    rotation,
  ]);

  // Calculate appropriate scale based on container width
  const calculateScale = useCallback(() => {
    if (!containerRef.current || !pdfDocRef.current) return scale;

    const containerWidth =
      containerRef.current.clientWidth - (showSidebar ? 250 : 0);
    // Use a fixed width for consistency (85% of container width)
    const targetWidth = containerWidth * 0.85;

    // For two pages view, divide the width by 2 to fit two pages side by side
    if (viewMode === "twoPages") {
      return targetWidth / 2 / 595; // 595 is a standard PDF width in points
    }

    return targetWidth / 595; // 595 is a standard PDF width in points
  }, [scale, showSidebar, viewMode, containerRef, pdfDocRef]);

  // Handle zoom in
  const handleZoomIn = useCallback(() => {
    setFitToWidth(false);
    setScale((prevScale) => Math.min(prevScale + 0.1, 3.0));
  }, []);

  // Handle zoom out
  const handleZoomOut = useCallback(() => {
    setFitToWidth(false);
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));
  }, []);

  // Handle rotation
  const handleRotate = useCallback(() => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  }, []);

  // Toggle fit to width
  const toggleFitToWidth = useCallback(() => {
    setFitToWidth((prev) => !prev);
    if (!fitToWidth) {
      const newScale = calculateScale();
      if (newScale) setScale(newScale);
    }
  }, [fitToWidth, calculateScale]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Toggle sidebar
  const toggleSidebar = useCallback(
    (tab: SidebarTab) => {
      if (showSidebar && sidebarTab === tab) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
        setSidebarTab(tab);
      }
    },
    [showSidebar, sidebarTab]
  );

  // Toggle view mode
  const toggleViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    // Reset to page 1 when changing view mode
    setCurrentPage(1);
  }, []);

  // Add bookmark
  const addBookmark = useCallback(() => {
    // Check if this page is already bookmarked
    const existingBookmark = bookmarks.find((b) => b.page === currentPage);
    if (existingBookmark) {
      // Remove the bookmark if it exists
      setBookmarks((prev) => prev.filter((b) => b.page !== currentPage));
    } else {
      // Add a new bookmark
      const newBookmark: BookmarkItem = {
        id: `bookmark-${Date.now()}`,
        page: currentPage,
        title: `Page ${currentPage}`,
        timestamp: Date.now(),
      };
      setBookmarks((prev) => [...prev, newBookmark]);
    }
  }, [bookmarks, currentPage]);

  // Handle bookmark click
  const handleBookmarkClick = useCallback((bookmark: BookmarkItem) => {
    if (bookmark && bookmark.page) {
      const pageNumber = bookmark.page;
      setCurrentPage(pageNumber);

      // Ensure the page is rendered and scrolled into view
      setTimeout(() => {
        const pageElement = document.querySelector(
          `.pdf-canvas[data-page-number="${pageNumber}"]`
        );
        if (pageElement) {
          pageElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, []);

  // Handle outline item click
  const handleOutlineItemClick = useCallback(
    (item: any) => {
      if (!item || !pdfDocRef.current) return;

      try {
        console.log("Outline item clicked:", item);

        // Force a re-render to ensure the page is properly updated
        setLoading(true);

        // Get the destination from the outline item
        const dest = item.dest;

        const navigateToPage = (pageNumber: number) => {
          console.log(`Navigating to page ${pageNumber} of ${numPages}`);

          // Validate page number
          if (pageNumber < 1 || pageNumber > numPages) {
            console.error(
              `Invalid page number: ${pageNumber}. Valid range is 1-${numPages}`
            );
            pageNumber = 1; // Default to first page
          }

          // Update current page
          setCurrentPage(pageNumber);

          // Use a longer timeout to ensure the page has time to render
          setTimeout(() => {
            setLoading(false);

            // Try multiple methods to find and scroll to the page
            setTimeout(() => {
              try {
                // Method 1: Try to find the canvas by data-page-number attribute
                const pageElement = document.querySelector(
                  `.pdf-canvas[data-page-number="${pageNumber}"]`
                );

                if (pageElement) {
                  console.log(
                    `Found page element for page ${pageNumber} using data-page-number`
                  );
                  pageElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                  return;
                }

                // Method 2: Try to find the canvas by ID
                const canvasById = document.getElementById(
                  `pdf-canvas-page-${pageNumber}`
                );
                if (canvasById) {
                  console.log(
                    `Found page element for page ${pageNumber} using ID`
                  );
                  canvasById.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                  return;
                }

                // Method 3: Try to find any canvas elements and look for one with matching page
                const allCanvases = document.querySelectorAll(".pdf-canvas");
                console.log(`Found ${allCanvases.length} canvas elements`);

                for (let i = 0; i < allCanvases.length; i++) {
                  const canvas = allCanvases[i];
                  const canvasPage = canvas.getAttribute("data-page-number");
                  console.log(`Canvas ${i}: page ${canvasPage}`);

                  if (canvasPage === pageNumber.toString()) {
                    console.log(`Found matching canvas for page ${pageNumber}`);
                    canvas.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                    return;
                  }
                }

                console.warn(
                  `Could not find canvas element for page ${pageNumber}`
                );
              } catch (err) {
                console.error("Error scrolling to page:", err);
              }
            }, 300);
          }, 200);
        };

        if (typeof dest === "string") {
          // Named destination - need to resolve it
          console.log("Resolving named destination:", dest);
          pdfDocRef.current
            .getDestination(dest)
            .then((destArray) => {
              if (!destArray || !destArray[0]) {
                console.error("Invalid destination array:", destArray);
                navigateToPage(1); // Default to first page
                return;
              }

              try {
                pdfDocRef
                  .current!.getPageIndex(destArray[0])
                  .then((pageIndex) => {
                    const pageNumber = pageIndex + 1;
                    console.log(
                      "Resolved named destination to page:",
                      pageNumber
                    );
                    navigateToPage(pageNumber);
                  })
                  .catch((err) => {
                    console.error("Error getting page index:", err);
                    // Try to extract page number from the destination array if possible
                    if (
                      destArray.length > 1 &&
                      typeof destArray[1] === "number"
                    ) {
                      navigateToPage(destArray[1]);
                    } else {
                      navigateToPage(1); // Default to first page
                    }
                  });
              } catch (err) {
                console.error("Error processing destination:", err);
                navigateToPage(1); // Default to first page
              }
            })
            .catch((err) => {
              console.error("Error resolving named destination:", err);
              navigateToPage(1); // Default to first page
            });
        } else if (Array.isArray(dest)) {
          // Explicit destination
          console.log("Processing array destination:", dest);
          try {
            if (!dest[0]) {
              console.error("Invalid destination array:", dest);
              navigateToPage(1); // Default to first page
              return;
            }

            pdfDocRef.current
              .getPageIndex(dest[0])
              .then((pageIndex) => {
                const pageNumber = pageIndex + 1;
                console.log("Resolved array destination to page:", pageNumber);
                navigateToPage(pageNumber);
              })
              .catch((err) => {
                console.error("Error getting page index:", err);
                // Try to extract page number from the destination array if possible
                if (dest.length > 1 && typeof dest[1] === "number") {
                  navigateToPage(dest[1]);
                } else {
                  navigateToPage(1); // Default to first page
                }
              });
          } catch (err) {
            console.error("Error processing array destination:", err);
            navigateToPage(1); // Default to first page
          }
        } else if (item.pageNumber) {
          // Some outline items might have pageNumber directly
          console.log(
            "Using direct pageNumber from outline item:",
            item.pageNumber
          );
          const pageNumber = parseInt(item.pageNumber, 10);
          navigateToPage(pageNumber);
        } else {
          console.error("Unsupported outline destination format:", item);
          navigateToPage(1); // Default to first page
        }
      } catch (error) {
        console.error("Error navigating to outline item:", error);
        setLoading(false);
      }
    },
    [pdfDocRef, numPages]
  );

  // Handle print function
  const handlePrint = useCallback(() => {
    if (!url || !pdfDocRef.current) return;

    try {
      // Show loading indicator
      setLoading(true);

      // Create an iframe to print the PDF
      const printIframe = document.createElement("iframe");
      printIframe.style.display = "none";
      document.body.appendChild(printIframe);

      // Set the source to the PDF URL
      printIframe.src = url;

      printIframe.onload = () => {
        try {
          // Hide loading indicator
          setLoading(false);

          // Trigger print dialog
          setTimeout(() => {
            if (printIframe.contentWindow) {
              printIframe.contentWindow.focus();
              printIframe.contentWindow.print();
            }
          }, 500);
        } catch (error) {
          console.error("Error printing document:", error);
          setLoading(false);
        }

        // Remove the iframe after printing
        setTimeout(() => {
          if (document.body.contains(printIframe)) {
            document.body.removeChild(printIframe);
          }
        }, 2000);
      };

      // Handle error case
      printIframe.onerror = () => {
        console.error("Error loading PDF for printing");
        setLoading(false);

        // Remove the iframe
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }

        // Fallback method: open PDF in new tab for printing
        window.open(url, "_blank");
      };
    } catch (error) {
      console.error("Error setting up print:", error);
      setLoading(false);

      // Fallback method: open PDF in new tab for printing
      window.open(url, "_blank");
    }
  }, [url, pdfDocRef]);

  // Handle download function
  const handleDownload = useCallback(() => {
    if (!url) return;

    // Create a temporary anchor element
    const downloadLink = document.createElement("a");
    downloadLink.href = url;

    // Extract filename from URL or use a default name
    const filename = url.split("/").pop() || "document.pdf";
    downloadLink.download = filename;

    // Append to the document, click it, and remove it
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }, [url]);

  // Go to previous page
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);

      // Scroll to the new page
      setTimeout(() => {
        const pageElement = document.querySelector(
          `.pdf-canvas[data-page-number="${currentPage - 1}"]`
        );
        if (pageElement) {
          pageElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [currentPage]);

  // Go to next page
  const goToNextPage = useCallback(() => {
    if (currentPage < numPages) {
      setCurrentPage((prev) => prev + 1);

      // Scroll to the new page
      setTimeout(() => {
        const pageElement = document.querySelector(
          `.pdf-canvas[data-page-number="${currentPage + 1}"]`
        );
        if (pageElement) {
          pageElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [currentPage, numPages]);

  // Recalculate scale on window resize
  const handleResize = useCallback(() => {
    if (fitToWidth) {
      const newScale = calculateScale() || scale;
      if (newScale) {
        setScale(newScale);
      }
    }
  }, [calculateScale, fitToWidth, scale]);

  // Handle fullscreen change
  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  // Handle retry when there's an error
  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);

    // Force a complete re-render by clearing rendered pages
    setRenderedPages([]);
    canvasesRef.current.clear();

    // Add a delay to ensure DOM updates
    setTimeout(() => {
      // Then set loading to false to trigger re-render
      setLoading(false);
    }, 500);
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Prevent handling if inside an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Handle Ctrl+F for search
      if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); // Prevent browser's default search
        setShowSearch(true);
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          if (currentPage > 1) setCurrentPage((p) => p - 1);
          break;
        case "ArrowRight":
          if (currentPage < numPages) setCurrentPage((p) => p + 1);
          break;
        case "+":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "b":
          addBookmark();
          break;
        case "o":
          toggleSidebar("outline");
          break;
        case "c":
          toggleViewMode("continuous");
          break;
        case "t":
          toggleViewMode("twoPages");
          break;
      }
    },
    [
      currentPage,
      numPages,
      handleZoomIn,
      handleZoomOut,
      toggleFullscreen,
      addBookmark,
      toggleSidebar,
      toggleViewMode,
    ]
  );

  // RENDER FUNCTIONS - These depend on other functions and should come last

  // Render the PDF viewer based on view mode
  const renderPDFViewer = useCallback(() => {
    if (viewMode === "continuous") {
      return (
        <>
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <canvas
              key={`page-${pageNum}`}
              id={`pdf-canvas-page-${pageNum}`}
              className={`pdf-canvas ${
                pageNum === currentPage ? "current-page" : ""
              }`}
              style={{
                marginBottom: pageNum < numPages ? "20px" : "0",
                scrollMargin: "100px",
                scrollSnapAlign: "start",
              }}
              data-page-number={pageNum}
            />
          ))}
        </>
      );
    } else if (viewMode === "twoPages") {
      // For two pages view, we need to show pairs of pages
      // Always start from an odd page number (1, 3, 5, etc.)
      const startPage = currentPage % 2 === 0 ? currentPage - 1 : currentPage;
      const pages = [startPage];

      if (startPage + 1 <= numPages) {
        pages.push(startPage + 1);
      }

      return (
        <div className="flex flex-wrap justify-center">
          {pages.map((pageNum) => (
            <canvas
              key={`page-${pageNum}`}
              id={`pdf-canvas-page-${pageNum}`}
              className={`pdf-canvas ${
                pageNum === currentPage ? "current-page" : ""
              }`}
              style={{ margin: "10px" }}
              data-page-number={pageNum}
            />
          ))}
        </div>
      );
    }

    // Fallback
    return <canvas ref={canvasRef} className="pdf-canvas" />;
  }, [currentPage, numPages, viewMode]);

  // Render sidebar content
  const renderSidebarContent = useCallback(() => {
    if (sidebarTab === "outline") {
      return (
        <PDFOutlineView
          outline={outline}
          currentPage={currentPage}
          onItemClick={handleOutlineItemClick}
        />
      );
    } else if (sidebarTab === "bookmarks") {
      return (
        <>
          <h3>Bookmarks</h3>
          {bookmarks.length > 0 ? (
            <ul className="pdf-bookmarks-list">
              {bookmarks.map((bookmark, index) => (
                <li key={index} className="pdf-bookmark-item">
                  <button onClick={() => handleBookmarkClick(bookmark)}>
                    {bookmark.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <p className="text-gray-400 text-sm mb-4">
                No bookmarks yet. Add bookmarks to pages for quick access.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={addBookmark}
                className="w-full"
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Bookmark Current Page
              </Button>
            </div>
          )}
        </>
      );
    } else if (sidebarTab === "thumbnails") {
      return (
        <>
          <h3>Page Thumbnails</h3>
          <div className="pdf-thumbnail-grid">
            {Array.from({ length: numPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <div
                  key={`thumb-${pageNum}`}
                  className={`pdf-thumbnail-item ${
                    pageNum === currentPage ? "current" : ""
                  }`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  <div
                    className="pdf-thumbnail"
                    ref={(el) => {
                      if (el && !thumbnailsRendered.includes(pageNum)) {
                        renderThumbnail(pageNum, el);
                      }
                    }}
                  ></div>
                  <div className="text-center">Page {pageNum}</div>
                </div>
              )
            )}
          </div>
        </>
      );
    }

    return null;
  }, [
    sidebarTab,
    outline,
    bookmarks,
    thumbnails,
    currentPage,
    handleOutlineItemClick,
    handleBookmarkClick,
    addBookmark,
    numPages,
    renderThumbnail,
    thumbnailsRendered
  ]);

  // Function to render thumbnails
  const renderThumbnail = useCallback(
    async (pageNum: number, container: HTMLElement) => {
      if (!pdfDocRef.current) return;

      try {
        // Get the page
        const page = await pdfDocRef.current.getPage(pageNum);

        // Create a small viewport for the thumbnail
        const viewport = page.getViewport({ scale: 0.2, rotation: 0 });

        // Create a canvas for this thumbnail
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          console.error("Failed to get canvas context for thumbnail");
          return;
        }

        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Clear the container and append the canvas
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        container.appendChild(canvas);

        // Mark this thumbnail as rendered
        setThumbnailsRendered((prev) => [...prev, pageNum]);
      } catch (err) {
        console.error(`Error rendering thumbnail for page ${pageNum}:`, err);
      }
    },
    [pdfDocRef]
  );

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
            console.log("PDF outline loaded:", outline);

            // Process outline items recursively to ensure they have valid page references
            const processOutlineItems = async (items: any[], level = 0) => {
              const processedItems = [];

              for (const item of items) {
                // Add level information for indentation
                const processedItem = { ...item, level };

                // Process destination
                if (item.dest) {
                  try {
                    if (typeof item.dest === "string") {
                      // Named destination - try to resolve it to get the page number
                      try {
                        const destArray = await pdf.getDestination(item.dest);
                        if (destArray && destArray.length > 0 && destArray[0]) {
                          const pageIndex = await pdf.getPageIndex(
                            destArray[0]
                          );
                          processedItem.pageNumber = pageIndex + 1;
                          console.log(
                            `Resolved named destination "${item.dest}" to page ${processedItem.pageNumber}`
                          );
                        }
                      } catch (err) {
                        console.warn(
                          `Could not resolve named destination "${item.dest}":`,
                          err
                        );
                      }
                    } else if (
                      Array.isArray(item.dest) &&
                      item.dest.length > 0
                    ) {
                      // Try to get page number from the destination array
                      try {
                        if (item.dest[0]) {
                          const pageIndex = await pdf.getPageIndex(
                            item.dest[0]
                          );
                          processedItem.pageNumber = pageIndex + 1;
                          console.log(
                            `Resolved array destination to page ${processedItem.pageNumber}`
                          );
                        }
                      } catch (err) {
                        console.warn(
                          "Could not resolve array destination:",
                          err
                        );

                        // Check if dest[0] is a reference object that might cause issues
                        if (
                          typeof item.dest[0] === "object" &&
                          !(item.dest[0] instanceof Uint8Array)
                        ) {
                          console.warn(
                            "Found object reference in destination, trying alternative methods"
                          );

                          // Try to extract page number from the destination array if possible
                          if (
                            item.dest.length > 1 &&
                            typeof item.dest[1] === "number"
                          ) {
                            processedItem.pageNumber = item.dest[1];
                            console.log(
                              `Using page number ${processedItem.pageNumber} from destination array`
                            );
                          }
                        }
                      }
                    }
                  } catch (err) {
                    console.error("Error processing destination:", err);
                  }

                  // If we still don't have a page number, keep the original destination
                  // for later resolution when clicked
                }

                // Process any child items recursively
                if (item.items && item.items.length > 0) {
                  processedItem.items = await processOutlineItems(
                    item.items,
                    level + 1
                  );
                }

                processedItems.push(processedItem);
              }

              return processedItems;
            };

            const processedOutline = await processOutlineItems(outline);
            console.log("Processed outline:", processedOutline);
            setOutline(processedOutline);
          } else {
            console.log("No outline available in this PDF");
            setOutline([]);
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
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
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

  // Determine which pages to render based on view mode
  useEffect(() => {
    if (!numPages) return;

    let pagesToRender: number[] = [];

    switch (viewMode) {
      case "continuous":
        pagesToRender = Array.from({ length: numPages }, (_, i) => i + 1);
        break;
      case "twoPages":
        // Start from an even page number (or page 1)
        const startPage = currentPage % 2 === 0 ? currentPage - 1 : currentPage;
        pagesToRender = [startPage];

        if (startPage + 1 <= numPages) {
          pagesToRender.push(startPage + 1);
        }
        break;
      default:
        pagesToRender = [currentPage];
    }

    setRenderedPages(pagesToRender);

    // Clear any previous error when changing view mode
    setError(null);
  }, [currentPage, numPages, viewMode]);

  // Render pages
  useEffect(() => {
    if (
      loading ||
      !pdfDocRef.current ||
      !numPages ||
      renderedPages.length === 0
    )
      return;

    const renderPages = async () => {
      try {
        // Clear previous canvases references
        canvasesRef.current.clear();

        // Calculate scale
        let calculatedScale = scale;
        if (fitToWidth) {
          calculatedScale = calculateScale() || scale;
        }

        // Track successful renders
        let successfulRenders = 0;
        let totalPages = renderedPages.length;
        let renderErrors = [];

        // Render each page
        for (const pageNum of renderedPages) {
          try {
            // Get the page
            const page = await pdfDocRef.current!.getPage(pageNum);

            // Create viewport
            const viewport = page.getViewport({
              scale: calculatedScale,
              rotation: rotation,
            });

            // Get or create canvas for this page
            const canvasId = `pdf-canvas-page-${pageNum}`;
            let canvas = document.getElementById(canvasId) as HTMLCanvasElement;

            if (!canvas) {
              console.warn(
                `Canvas element not found for page ${pageNum}, skipping render`
              );
              renderErrors.push(`Canvas not found for page ${pageNum}`);
              continue;
            }

            const context = canvas.getContext("2d");
            if (!context) {
              console.error(`Failed to get canvas context for page ${pageNum}`);
              renderErrors.push(
                `Failed to get canvas context for page ${pageNum}`
              );
              continue;
            }

            // Set canvas dimensions
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Store reference to canvas
            canvasesRef.current.set(pageNum, canvas);

            // Clear the canvas
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Render page to canvas with a timeout to prevent blocking
            try {
              await page.render({
                canvasContext: context,
                viewport: viewport,
              }).promise;

              successfulRenders++;
              console.log(`Successfully rendered page ${pageNum}`);
            } catch (renderErr) {
              console.error(`Error rendering page ${pageNum}:`, renderErr);
              renderErrors.push(
                `Error rendering page ${pageNum}: ${renderErr}`
              );
              // Continue with other pages instead of failing completely
            }
          } catch (pageErr) {
            console.error(`Error getting page ${pageNum}:`, pageErr);
            renderErrors.push(`Error getting page ${pageNum}: ${pageErr}`);
            // Continue with other pages
          }
        }

        // Only set error if no pages rendered successfully
        if (successfulRenders === 0 && totalPages > 0) {
          setError(
            `Failed to render any pages. Errors: ${renderErrors
              .slice(0, 3)
              .join(", ")}${renderErrors.length > 3 ? "..." : ""}`
          );
        } else if (error) {
          // Clear error if we had success
          setError(null);
        }
      } catch (err) {
        console.error("Error rendering pages:", err);
        setError(`Failed to render pages: ${err}`);
      }
    };

    // Add a small delay to ensure the DOM is ready
    const timer = setTimeout(() => {
      renderPages();
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [
    renderedPages,
    scale,
    rotation,
    fitToWidth,
    calculateScale,
    loading,
    numPages,
    error,
  ]);

  // Navigation functions for different view modes
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!viewerRef.current || !pdfDocRef.current || viewMode !== "continuous")
        return;

      const container = e.currentTarget;
      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      const scrollHeight = container.scrollHeight;

      // Determine which page is most visible in the viewport
      const pageElements = container.querySelectorAll(".pdf-page");
      if (pageElements.length === 0) return;

      let mostVisiblePage = 1;
      let maxVisibility = 0;

      pageElements.forEach((pageEl) => {
        const rect = pageEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate how much of the page is visible
        const visibleTop = Math.max(rect.top, containerRect.top);
        const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        // Get page number from data attribute
        const pageNumber = parseInt(
          pageEl.getAttribute("data-page-number") || "1",
          10
        );

        if (visibleHeight > maxVisibility) {
          maxVisibility = visibleHeight;
          mostVisiblePage = pageNumber;
        }
      });

      // Update current page if it changed
      if (mostVisiblePage !== currentPage) {
        setCurrentPage(mostVisiblePage);
      }

      // Load more pages when scrolling near the bottom
      if (scrollTop + clientHeight > scrollHeight - 500) {
        // Logic to load more pages if implementing lazy loading
      }
    },
    [viewMode, currentPage]
  );

  // Add intersection observer for continuous mode
  useEffect(() => {
    if (viewMode !== "continuous" || !numPages) return;

    // Create an intersection observer to detect which page is most visible
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the highest intersection ratio
        let highestRatio = 0;
        let visiblePage = currentPage;

        entries.forEach((entry) => {
          if (entry.intersectionRatio > highestRatio) {
            highestRatio = entry.intersectionRatio;
            const pageNum = parseInt(
              entry.target.getAttribute("data-page-number") || "1"
            );
            visiblePage = pageNum;
          }
        });

        // Update current page if a different page is most visible
        if (visiblePage !== currentPage) {
          setCurrentPage(visiblePage);
        }
      },
      {
        root: containerRef.current,
        threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      }
    );

    // Observe all page canvases
    const canvasElements = document.querySelectorAll(
      ".pdf-canvas[data-page-number]"
    );
    canvasElements.forEach((canvas) => {
      observer.observe(canvas);
    });

    return () => {
      observer.disconnect();
    };
  }, [viewMode, numPages, currentPage]);

  // Scroll to current page in continuous mode
  useEffect(() => {
    if (viewMode !== "continuous" || !containerRef.current) return;

    // Find the canvas for the current page
    const currentCanvas = document.querySelector(
      `.pdf-canvas[data-page-number="${currentPage}"]`
    );
    if (currentCanvas) {
      // Scroll the canvas into view with a smooth animation
      currentCanvas.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentPage, viewMode]);

  // Recalculate scale on window resize
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    // Initial calculation
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  // Handle fullscreen mode
  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  // Handle keyboard shortcuts
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

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
      <div className="flex flex-col items-center justify-center h-full p-8 bg-slate-900 text-white">
        <div className="text-red-400 mb-4 text-center">{error}</div>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setError(null);
              setLoading(true);

              // Force a complete re-render by clearing rendered pages
              setRenderedPages([]);
              canvasesRef.current.clear();

              // Add a delay to ensure DOM updates
              setTimeout(() => {
                // Then set loading to false to trigger re-render
                setLoading(false);
              }, 500);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800"
          >
            Reload Viewer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`pdf-viewer-container ${isFullscreen ? "fullscreen" : ""}`}
      ref={viewerRef}
    >
      {/* Top Toolbar */}
      <div className="pdf-toolbar">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
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
              className="w-16 text-center font-medium"
            />
            <span className="mx-2 font-medium">/ {numPages}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
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
            onClick={() => toggleSidebar("outline")}
            className={`font-medium ${
              showSidebar && sidebarTab === "outline"
                ? "bg-primary text-white"
                : ""
            }`}
            title="Outline"
          >
            <List className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Outline</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSidebar("bookmarks")}
            className={`font-medium ${
              showSidebar && sidebarTab === "bookmarks"
                ? "bg-primary text-white"
                : ""
            }`}
            title="Bookmarks"
          >
            <Bookmark className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Bookmarks</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSidebar("thumbnails")}
            className={`font-medium ${
              showSidebar && sidebarTab === "thumbnails"
                ? "bg-primary text-white"
                : ""
            }`}
            title="Thumbnails"
          >
            <Grid2X2 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Thumbnails</span>
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
            <ZoomOut className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">-</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFitToWidth}
            className={`font-medium ${
              fitToWidth ? "bg-primary text-white" : ""
            }`}
            title={fitToWidth ? "Fit to Width (Active)" : "Fit to Width"}
          >
            <Maximize className="h-4 w-4 mr-1 hidden sm:block" />
            <span>Fit</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            title="Zoom In"
            className="font-medium"
          >
            <ZoomIn className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">+</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRotate}
            title="Rotate"
            className="font-medium"
          >
            <RotateCw className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Rotate</span>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleViewMode("continuous")}
            className={`font-medium ${
              viewMode === "continuous" ? "bg-primary text-white" : ""
            }`}
            title="Continuous View"
          >
            <AlignJustify className="h-4 w-4 mr-1 hidden sm:block" />
            <span>Continuous</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleViewMode("twoPages")}
            className={`font-medium ${
              viewMode === "twoPages" ? "bg-primary text-white" : ""
            }`}
            title="Two Pages View"
          >
            <SplitSquareVertical className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Two Pages</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="font-medium"
          >
            <Maximize className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Fullscreen</span>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className={`font-medium ${
              showSearch ? "bg-primary text-white" : ""
            }`}
            title="Search"
          >
            <Search className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Search</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            title="Print"
            className="font-medium"
          >
            <Printer className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Print</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            title="Download"
            className="font-medium"
          >
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="pdf-search-bar">
          <div className="pdf-search-input-container">
            <Search className="search-icon h-4 w-4" />
            <Input
              type="text"
              placeholder="Search in document..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (e.shiftKey) {
                    // Shift+Enter for previous result
                    if (searchResults.length > 0) {
                      e.preventDefault();
                      navigateToPrevSearchResult();
                    }
                  } else if (
                    searchResults.length > 0 &&
                    currentSearchIndex !== -1
                  ) {
                    // Enter for next result if we already have results
                    e.preventDefault();
                    navigateToNextSearchResult();
                  } else {
                    // Otherwise, perform search
                    handleSearch();
                  }
                } else if (e.key === "Escape") {
                  // Escape to close search
                  setShowSearch(false);
                  setShowSearchPanel(false);
                }
              }}
              className="w-full"
            />
          </div>
          <div className="pdf-search-controls">
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToPrevSearchResult}
              disabled={!searchResults.length || currentSearchIndex <= 0}
              title="Previous Result"
              className="font-medium"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToNextSearchResult}
              disabled={
                !searchResults.length ||
                currentSearchIndex >= searchResults.length - 1
              }
              title="Next Result"
              className="font-medium"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSearch}
              title="Search"
              className="font-medium"
            >
              <Search className="h-4 w-4 mr-1" />
              <span>Search</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSearch}
              title="Clear Search"
              className="font-medium"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Content Container */}
      <div className="pdf-content-container">
        {/* Sidebar */}
        {showSidebar && (
          <div className={`pdf-sidebar ${showSidebar ? "open" : ""}`}>
            <div className="pdf-sidebar-content">{renderSidebarContent()}</div>
          </div>
        )}

        {/* PDF Viewer */}
        <div
          className={`pdf-canvas-container ${viewMode}`}
          ref={containerRef}
          onScroll={handleScroll}
        >
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="mt-4 text-white">Loading PDF...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Error Loading PDF
              </h3>
              <p className="text-gray-300 mb-4">{error}</p>
              <div className="flex space-x-4">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retry
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800"
                >
                  Reload Viewer
                </button>
              </div>
            </div>
          ) : (
            renderPDFViewer()
          )}

          {/* Search highlights container */}
          <div className="search-highlights-container" ref={highlightsRef}>
            {renderSearchHighlights()}
          </div>

          {/* Floating page number indicator */}
          {numPages > 0 && !loading && !error && (
            <div className="page-number-indicator">
              Page {currentPage} of {numPages}
            </div>
          )}
        </div>
      </div>

      {/* Search Results Panel */}
      {showSearchResults && searchResults.length > 0 && (
        <ImprovedSearchPanel
          showPanel={showSearchResults}
          searchResults={searchResults}
          detailedResults={detailedSearchResults}
          currentSearchIndex={currentSearchIndex}
          onClose={() => setShowSearchResults(false)}
          onClear={clearSearch}
          onResultClick={handleSearchResultClick}
        />
      )}
    </div>
  );
};
