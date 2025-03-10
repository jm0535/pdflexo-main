
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendHorizontal } from 'lucide-react';

interface ChatInputProps {
  initialValue?: string;
  onSubmit: (input: string) => void;
  isProcessing: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ initialValue = '', onSubmit, isProcessing }) => {
  const [input, setInput] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
    >
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask the AI assistant..."
        disabled={isProcessing}
        className="flex-1"
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={isProcessing || !input.trim()}
      >
        <SendHorizontal className="h-5 w-5" />
      </Button>
    </form>
  );
};

export default ChatInput;
