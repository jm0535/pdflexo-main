
import React from 'react';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnswerHeaderProps {
  onOpenDialog: () => void;
}

const AnswerHeader: React.FC<AnswerHeaderProps> = ({ onOpenDialog }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <FileQuestion className="h-6 w-6 text-[#D946EF] dark:text-[#8B5CF6]" />
        <h1 className="text-2xl font-bold">Ask Questions About Documents</h1>
      </div>
      <Button variant="outline" onClick={onOpenDialog}>
        Open AI Assistant
      </Button>
    </div>
  );
};

export default AnswerHeader;
