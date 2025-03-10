
import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SummarizeHeaderProps {
  onOpenDialog: () => void;
}

const SummarizeHeader: React.FC<SummarizeHeaderProps> = ({ onOpenDialog }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-[#0EA5E9] dark:text-[#33C3F0]" />
        <h1 className="text-2xl font-bold">Summarize Documents</h1>
      </div>
      <Button variant="outline" onClick={onOpenDialog}>
        Open AI Assistant
      </Button>
    </div>
  );
};

export default SummarizeHeader;
