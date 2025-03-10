
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Copy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface AnswerResultProps {
  question: string;
  answer: string;
  onAskAnother: () => void;
}

const AnswerResult: React.FC<AnswerResultProps> = ({
  question,
  answer,
  onAskAnother
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    toast.success('Answer copied to clipboard');
  };
  
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([`Question: ${question}\n\nAnswer: ${answer}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `answer_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Answer downloaded');
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-2">Your Question</h3>
        <div className="bg-primary/10 p-3 rounded-md">
          {question}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Answer</h3>
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
        
        <div className="bg-gray-50 dark:bg-secondary/50 p-4 rounded-md border border-gray-200 dark:border-gray-700 min-h-[200px] whitespace-pre-line font-mono text-sm">
          {answer}
        </div>
      </div>
      
      <div className="flex justify-start">
        <Button variant="outline" onClick={onAskAnother}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Ask Another Question
        </Button>
      </div>
    </div>
  );
};

export default AnswerResult;
