
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, File, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchResult } from '@/lib/pdfUtils/searchUtils';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  searchError: string | null;
  onSearch: () => void;
  onJumpToResult: (result: SearchResult) => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({
  open,
  onOpenChange,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  searchError,
  onSearch,
  onJumpToResult
}) => {
  // Automatically focus the search input when the dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const input = document.querySelector('input[name="search-query"]') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    
    return (
      <>
        {before}
        <span className="bg-yellow-300 text-black font-medium">{match}</span>
        {after}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <span>Search in PDFs</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex gap-2 my-4">
          <Input
            name="search-query"
            placeholder="Enter search term..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </form>
        
        {searchError && (
          <div className="text-red-500 mb-4">
            {searchError}
          </div>
        )}
        
        <div className="flex-1 overflow-hidden">
          {searchResults.length > 0 ? (
            <ScrollArea className="h-[50vh]">
              <div className="space-y-4 p-1">
                {searchResults.map((result, index) => (
                  <div 
                    key={`${result.documentId}-${result.pageNumber}-${index}`}
                    className="border border-border rounded-md p-3 hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => onJumpToResult(result)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{result.documentName}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Page {result.pageNumber}
                      </div>
                    </div>
                    <div className="text-sm bg-background p-2 rounded border border-border">
                      {highlightMatch(result.text, searchQuery)}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-blue-500 hover:text-blue-700 px-0"
                      onClick={() => onJumpToResult(result)}
                    >
                      <span>Jump to this result</span>
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : searchQuery && !isSearching ? (
            <div className="flex flex-col items-center justify-center h-[30vh] text-center p-4">
              <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-medium">No results found</h3>
              <p className="text-muted-foreground mt-1">
                Try a different search term or check another document
              </p>
            </div>
          ) : !searchQuery ? (
            <div className="flex flex-col items-center justify-center h-[30vh] text-center p-4">
              <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-medium">Search across your PDFs</h3>
              <p className="text-muted-foreground mt-1">
                Enter a search term to find text within your open documents
              </p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;
