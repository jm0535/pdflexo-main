import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from '@/components/FileUpload';
import PDFViewer from '@/components/PDFViewer';
import TabBar from '@/components/TabBar';
import { PDFDocument, PDFTab } from '@/lib/types';
import { Toaster } from "sonner";
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import SearchDialog from '@/components/dialogs/SearchDialog';
import { usePDFSearch } from '@/hooks/usePDFSearch';
import { SearchResult } from '@/lib/pdfUtils/searchUtils';
import Layout from '@/components/Layout';
import { pdfSessionStorage } from '@/services/PDFSessionStorage';

const Index = () => {
  const [tabs, setTabs] = useState<PDFTab[]>([]);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,
    performSearch,
    jumpToResult
  } = usePDFSearch(tabs);
  
  const handleFileLoaded = (newDoc: PDFDocument) => {
    pdfSessionStorage.addDocument(newDoc);
    
    const newTab: PDFTab = {
      id: uuidv4(),
      document: newDoc,
      isActive: true,
    };
    
    setTabs(prevTabs => 
      prevTabs.map(tab => ({ ...tab, isActive: false })).concat(newTab)
    );
  };

  const handleSelectTab = (id: string) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => ({
        ...tab,
        isActive: tab.id === id,
      }))
    );
  };

  const handleCloseTab = (id: string) => {
    setTabs(prevTabs => {
      const tabToClose = prevTabs.find(tab => tab.id === id);
      const isClosingActiveTab = tabToClose?.isActive || false;
      const remainingTabs = prevTabs.filter(tab => tab.id !== id);
      
      if (isClosingActiveTab && remainingTabs.length > 0) {
        return remainingTabs.map((tab, index) => ({
          ...tab,
          isActive: index === remainingTabs.length - 1,
        }));
      }
      
      return remainingTabs;
    });
  };

  const handleNewTab = () => {
    setTabs(prevTabs => 
      prevTabs.map(tab => ({ ...tab, isActive: false }))
    );
  };

  const handleUpdatePage = (tabId: string, newPage: number) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === tabId 
          ? { 
              ...tab, 
              document: { 
                ...tab.document, 
                currentPage: newPage 
              } 
            } 
          : tab
      )
    );
  };

  const handleJumpToResult = (result: SearchResult) => {
    const navigationInfo = jumpToResult(result);
    if (navigationInfo) {
      handleSelectTab(navigationInfo.tabId);
      handleUpdatePage(navigationInfo.tabId, navigationInfo.pageNumber);
      setShowSearchDialog(false);
    }
  };

  const activeTab = tabs.find(tab => tab.isActive);
  const showFileUpload = tabs.length === 0 || (tabs.length > 0 && !activeTab);

  return (
    <Layout hideFooter={!!activeTab}>
      <Toaster position="top-right" />
      
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border">
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
              onClick={() => setShowSearchDialog(true)}
              className="ml-2"
            >
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
          )}
        </div>
        
        <div className="flex-1 flex items-stretch overflow-hidden">
          {showFileUpload ? (
            <div className="w-full flex items-center justify-center p-6">
              <FileUpload onFileLoaded={handleFileLoaded} />
            </div>
          ) : activeTab ? (
            <PDFViewer 
              document={activeTab.document} 
              onClose={() => handleCloseTab(activeTab.id)}
              onPageChange={(newPage) => handleUpdatePage(activeTab.id, newPage)} 
            />
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

export default Index;
