
import React from 'react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TranslateHeaderProps {
  onOpenDialog: () => void;
}

const TranslateHeader: React.FC<TranslateHeaderProps> = ({ onOpenDialog }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <Languages className="h-6 w-6 text-[#F97316] dark:text-[#F97316]" />
        <h1 className="text-2xl font-bold">Translate Documents</h1>
      </div>
      <Button variant="outline" onClick={onOpenDialog}>
        Open AI Assistant
      </Button>
    </div>
  );
};

export default TranslateHeader;
