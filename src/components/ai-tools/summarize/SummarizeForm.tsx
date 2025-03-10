
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface SummarizeFormProps {
  input: string;
  setInput: (value: string) => void;
  isProcessing: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const SummarizeForm: React.FC<SummarizeFormProps> = ({
  input,
  setInput,
  isProcessing,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Textarea
          placeholder="Paste your text here or upload a document to summarize..."
          className="min-h-[200px]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={isProcessing || !input.trim()}>
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Summarizing...
          </>
        ) : (
          'Summarize Text'
        )}
      </Button>
    </form>
  );
};

export default SummarizeForm;
