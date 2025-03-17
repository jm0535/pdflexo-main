import React, { useState } from "react";
import "./PDFOutlineStyles.css";

interface PDFOutlineViewProps {
  outline: any[];
  currentPage: number;
  onItemClick: (item: any) => void;
}

const PDFOutlineView: React.FC<PDFOutlineViewProps> = ({
  outline,
  currentPage,
  onItemClick,
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );

  // Toggle expansion of an outline item
  const toggleOutlineItem = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Recursive function to render outline items with proper nesting
  const renderOutlineItems = (items: any[], parentId = "root") => {
    if (!items || items.length === 0) return null;

    return (
      <ul className="pdf-outline-list" key={`outline-list-${parentId}`}>
        {items.map((item, index) => {
          const itemId = `${parentId}-${index}`;
          const hasChildren = item.items && item.items.length > 0;
          const isExpanded = expandedItems[itemId] || false;

          return (
            <li key={itemId} className="pdf-outline-item">
              <div className="pdf-outline-content">
                {hasChildren && (
                  <button
                    className={`pdf-outline-toggle ${
                      isExpanded ? "expanded" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOutlineItem(itemId);
                    }}
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                )}
                {!hasChildren && (
                  <span
                    className="pdf-outline-toggle"
                    style={{ visibility: "hidden" }}
                  ></span>
                )}

                <button
                  onClick={() => onItemClick(item)}
                  className={currentPage === item.pageNumber ? "active" : ""}
                  type="button"
                >
                  <span className="pdf-outline-text">
                    {item.title || "Untitled Item"}
                  </span>
                  {item.pageNumber && (
                    <span className="pdf-outline-page">
                      p.{item.pageNumber}
                    </span>
                  )}
                </button>
              </div>

              {hasChildren && (
                <div
                  className={`pdf-outline-nested ${
                    isExpanded ? "expanded" : ""
                  }`}
                >
                  {renderOutlineItems(item.items, itemId)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="pdf-outline-view">
      <h3>Document Outline</h3>
      {outline.length > 0 ? (
        renderOutlineItems(outline)
      ) : (
        <p className="text-gray-400 text-sm">
          No outline available for this document.
        </p>
      )}
    </div>
  );
};

export default PDFOutlineView;
