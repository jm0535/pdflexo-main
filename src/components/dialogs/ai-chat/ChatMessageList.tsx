
import React, { useRef, useEffect } from 'react';
import { Loader2, Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

interface ChatMessageListProps {
  messages: Message[];
  isProcessing: boolean;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages, isProcessing }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom of messages when new ones arrive
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <ScrollArea className="h-[300px] rounded-md border p-4">
      <div className="space-y-4">
        {messages.map((message, i) => (
          <ChatMessage 
            key={i} 
            role={message.role} 
            content={message.content} 
          />
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-800">
              <Bot className="inline-block h-4 w-4 mr-2 text-blue-500" />
              <Loader2 className="inline-block h-4 w-4 animate-spin" />
              <span className="ml-2">Processing...</span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatMessageList;
