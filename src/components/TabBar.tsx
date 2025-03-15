import React from 'react';
import { X, Plus } from 'lucide-react';
import { PDFTab } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TabBarProps {
  tabs: PDFTab[];
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, onSelectTab, onCloseTab, onNewTab }) => {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-background flex items-center overflow-x-auto hide-scrollbar">
      <div className="flex-1 flex items-center">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "flex items-center min-w-[200px] max-w-[250px] h-8 px-4 border-r border-border cursor-pointer transition-colors",
              tab.isActive 
                ? "bg-primary/10 text-primary font-medium" 
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onSelectTab(tab.id)}
          >
            <div className="flex-1 truncate mr-2 text-sm">
              {tab.document.name}
            </div>
            <button
              className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <button
        className="p-2 text-foreground hover:text-primary hover:bg-muted"
        onClick={onNewTab}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
};

export default TabBar;
