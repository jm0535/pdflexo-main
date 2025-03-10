
import React from 'react';
import { Bot } from 'lucide-react';

type MessageRole = 'user' | 'assistant';

interface ChatMessageProps {
  role: MessageRole;
  content: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          role === 'user' 
            ? 'bg-[#0EA5E9] dark:bg-[#33C3F0] text-white' 
            : 'bg-gray-100 dark:bg-gray-800'
        }`}
      >
        {role === 'assistant' && (
          <Bot className="inline-block h-4 w-4 mr-2 text-[#8B5CF6] dark:text-[#D946EF]" />
        )}
        <span className="whitespace-pre-line">{content}</span>
      </div>
    </div>
  );
};

export default ChatMessage;
