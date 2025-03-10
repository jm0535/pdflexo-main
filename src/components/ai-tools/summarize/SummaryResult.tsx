
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Copy, ArrowLeft } from "lucide-react";
import { toast } from 'sonner';

export interface SummaryResultProps {
  result: string;
  onBackToInput: () => void;
}

const SummaryResult: React.FC<SummaryResultProps> = ({ result, onBackToInput }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success('Summary copied to clipboard');
  };
  
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([result], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `summary_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Summary downloaded');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Summary Result</h3>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 min-h-[200px] whitespace-pre-wrap font-mono text-sm">
        {result}
      </div>
      
      <div className="flex justify-start">
        <Button variant="outline" onClick={onBackToInput}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Input
        </Button>
      </div>
    </div>
  );
};

export default SummaryResult;
