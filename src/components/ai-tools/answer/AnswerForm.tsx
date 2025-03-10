
import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface AnswerFormProps {
  documentText: string;
  documentContext: string;
  setDocumentContext: (context: string) => void;
  question: string;
  setQuestion: (question: string) => void;
  isProcessing: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const AnswerForm: React.FC<AnswerFormProps> = ({
  documentText,
  documentContext,
  setDocumentContext,
  question,
  setQuestion,
  isProcessing,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!documentText && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Document Context (optional if document is selected)
          </label>
          <Textarea
            placeholder="Paste document text here to provide context for your question..."
            className="min-h-[150px]"
            value={documentContext}
            onChange={(e) => setDocumentContext(e.target.value)}
          />
        </div>
      )}
      
      {documentText && (
        <div className="bg-secondary/30 p-4 rounded-md">
          <h3 className="font-medium mb-2">Selected Document</h3>
          <p className="text-sm text-muted-foreground">
            Your question will be answered based on the content in the selected document.
          </p>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Your Question
        </label>
        <Input
          placeholder="Type your question about the document..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={
          isProcessing || 
          !question.trim() || 
          (!documentText && !documentContext.trim())
        }
        className="w-full sm:w-auto"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Finding Answer...
          </>
        ) : (
          'Get Answer'
        )}
      </Button>
    </form>
  );
};

export default AnswerForm;
