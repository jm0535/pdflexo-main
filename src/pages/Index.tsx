import React, { useState, useCallback, useMemo, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import FileUpload from "@/components/FileUpload";
import { SimplePDFViewer } from "@/components/SimplePDFViewer";
import TabBar from "@/components/TabBar";
import { PDFDocument, PDFTab } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import SearchDialog from "@/components/dialogs/SearchDialog";
import { usePDFSearch } from "@/hooks/usePDFSearch";
import { SearchResult } from "@/lib/pdfUtils/searchUtils";
import Layout from "@/components/Layout";
import { pdfSessionStorage } from "@/services/PDFSessionStorage";
import toast from "@/utils/toast";

const Index = () => {
  const [tabs, setTabs] = useState<PDFTab[]>([]);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,
    performSearch,
    jumpToResult,
  } = usePDFSearch(tabs);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleFileLoaded = useCallback((newDoc: PDFDocument) => {
    try {
      pdfSessionStorage.addDocument(newDoc);

      // Generate the UUID outside of the tab object creation
      const tabId = uuidv4();
      const newTab: PDFTab = {
        id: tabId,
        document: newDoc,
        isActive: true,
      };

      setTabs((prevTabs) =>
        prevTabs.map((tab) => ({ ...tab, isActive: false })).concat(newTab)
      );

      toast.success(`PDF loaded: ${newDoc.name}`);
    } catch (error) {
      console.error("Error handling file:", error);
      toast.error("Failed to load PDF file");
    }
  }, []);

  const handleSelectTab = useCallback((id: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => ({
        ...tab,
        isActive: tab.id === id,
      }))
    );
  }, []);

  const handleCloseTab = useCallback((id: string) => {
    setTabs((prevTabs) => {
      const tabToClose = prevTabs.find((tab) => tab.id === id);
      const isClosingActiveTab = tabToClose?.isActive || false;
      const remainingTabs = prevTabs.filter((tab) => tab.id !== id);

      if (isClosingActiveTab && remainingTabs.length > 0) {
        return remainingTabs.map((tab, index) => ({
          ...tab,
          isActive: index === remainingTabs.length - 1,
        }));
      }

      return remainingTabs;
    });
  }, []);

  const handleNewTab = useCallback(() => {
    setTabs((prevTabs) => prevTabs.map((tab) => ({ ...tab, isActive: false })));
  }, []);

  const handleJumpToResult = useCallback(
    (result: SearchResult) => {
      const navigationInfo = jumpToResult(result);
      if (navigationInfo) {
        handleSelectTab(navigationInfo.tabId);
        setShowSearchDialog(false);
      }
    },
    [jumpToResult, handleSelectTab]
  );

  const toggleSearchDialog = useCallback(() => {
    setShowSearchDialog((prev) => !prev);
  }, []);

  const activeTab = useMemo(() => tabs.find((tab) => tab.isActive), [tabs]);
  const showFileUpload = useMemo(
    () => tabs.length === 0 || (tabs.length > 0 && !activeTab),
    [tabs.length, activeTab]
  );

  const TabBarComponent = useMemo(
    () => (
      <div className="flex items-center justify-between px-4 py-1 bg-background border-b border-border">
        <TabBar
          tabs={tabs}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
        />

        {tabs.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSearchDialog}
            className="ml-2"
          >
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
        )}
      </div>
    ),
    [tabs, handleSelectTab, handleCloseTab, handleNewTab, toggleSearchDialog]
  );

  if (!isLoaded) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter={!!activeTab}>
      <div className="flex flex-col h-full">
        {TabBarComponent}

        <div className="flex-1 flex items-stretch overflow-auto">
          {showFileUpload ? (
            <div className="w-full flex items-center justify-center p-6">
              <FileUpload onFileLoaded={handleFileLoaded} maxFileSizeMB={100} />
            </div>
          ) : activeTab ? (
            <div className="w-full h-full overflow-auto">
              <SimplePDFViewer url={activeTab.document.url} />
            </div>
          ) : null}
        </div>
      </div>

      <SearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        searchError={searchError}
        onSearch={performSearch}
        onJumpToResult={handleJumpToResult}
      />
    </Layout>
  );
};

export default React.memo(Index);
