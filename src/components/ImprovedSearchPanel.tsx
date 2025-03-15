import React from "react";
import { Button } from "@/components/ui/button";
import { X, List } from "lucide-react";

interface ImprovedSearchPanelProps {
  showPanel: boolean;
  searchResults: any[];
  detailedResults: any[];
  currentSearchIndex: number;
  onClose: () => void;
  onClear: () => void;
  onResultClick: (index: number, page: number) => void;
}

const ImprovedSearchPanel: React.FC<ImprovedSearchPanelProps> = ({
  showPanel,
  searchResults,
  detailedResults,
  currentSearchIndex,
  onClose,
  onClear,
  onResultClick,
}) => {
  if (!showPanel || detailedResults.length === 0) return null;

  const totalMatches = searchResults.reduce(
    (acc, result) => acc + result.matchCount,
    0
  );

  // Direct click handler that forces page navigation
  const handleResultClick = (index: number, page: number) => {
    console.log(
      `ImprovedSearchPanel: Clicked on result ${index}, page ${page}`
    );

    // Call the parent handler
    onResultClick(index, page);

    // Force direct navigation after a delay
    setTimeout(() => {
      try {
        // Try to directly navigate to the page
        const pageElement = document.getElementById(`pdf-canvas-page-${page}`);
        if (pageElement) {
          console.log(
            `ImprovedSearchPanel: Found page element for page ${page}, scrolling to it`
          );
          pageElement.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          console.log(
            `ImprovedSearchPanel: Page element for page ${page} not found`
          );

          // Try to find any canvas element for this page
          const canvasElements = document.querySelectorAll("canvas");
          console.log(
            `ImprovedSearchPanel: Found ${canvasElements.length} canvas elements`
          );

          // Log all canvas IDs for debugging
          canvasElements.forEach((canvas) => {
            console.log(`ImprovedSearchPanel: Canvas ID: ${canvas.id}`);
          });
        }
      } catch (err) {
        console.error("Error in direct navigation:", err);
      }
    }, 800); // Use a longer delay
  };

  return (
    <div className="search-panel">
      <div className="search-panel-header">
        <h3>Search Results (Improved)</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-slate-700 p-1 h-auto"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="search-panel-content">
        {detailedResults.map((result, index) => (
          <div
            key={`search-result-${index}`}
            className={`search-result-item ${
              index === currentSearchIndex ? "active" : ""
            }`}
            onClick={() => handleResultClick(index, result.page)}
          >
            <div className="search-result-page">
              <span>Page {result.page}</span>
              <span>{result.matches.length} matches</span>
            </div>
            {result.matches.length > 0 && (
              <p className="search-result-text">
                {result.matches[0].contextBefore}
                <mark>{result.matches[0].text}</mark>
                {result.matches[0].contextAfter}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="search-panel-footer">
        <span>Total: {totalMatches} matches</span>
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-white hover:bg-slate-700 p-1 h-auto text-xs"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImprovedSearchPanel;
