import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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

  // Simple click handler that just calls the parent handler
  const handleResultClick = (index: number, page: number) => {
    console.log(
      `ImprovedSearchPanel: Clicked on result ${index}, page ${page}`
    );
    onResultClick(index, page);
  };

  return (
    <div className="search-panel">
      <div className="search-panel-header">
        <h3>Search Results</h3>
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
