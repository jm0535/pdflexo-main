
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ChatMessageList, { Message } from './ai-chat/ChatMessageList';
import PresetTaskButtons from './ai-chat/PresetTaskButtons';
import ChatInput from './ai-chat/ChatInput';
import { processAIRequest } from './ai-chat/AIProcessingService';

interface AIAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText?: string;
  documentName?: string;
  initialTask?: string;
}

const AIAgentDialog: React.FC<AIAgentDialogProps> = ({
  open,
  onOpenChange,
  selectedText = '',
  documentName = 'current document',
  initialTask = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Preset tasks that can be clicked
  const presetTasks = [
    "Summarize the selected text",
    "Translate this content to Spanish",
    "Extract key information from this text",
    "Format this content into bullet points",
    "Explain this technical concept",
  ];

  useEffect(() => {
    if (open && messages.length === 0) {
      // Add initial assistant message
      setMessages([
        {
          role: 'assistant',
          content: `Hi there! I can help you with your PDF "${documentName}". What would you like me to do?`
        }
      ]);
      
      // If we have an initial task, run it automatically
      if (initialTask) {
        handleSubmit(initialTask);
      }
    }
  }, [open, documentName, messages.length, initialTask]);

  const handleSubmit = async (promptText: string) => {
    if (!promptText.trim() && !selectedText) return;
    
    try {
      await processAIRequest(
        promptText.trim(),
        selectedText,
        setMessages,
        setIsProcessing
      );
    } catch (error) {
      toast.error('Failed to process your request');
    }
  };

  const handlePresetTask = (task: string) => {
    if (!isProcessing) {
      handleSubmit(task);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#8B5CF6]" />
            <span>PDF AI Assistant</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4">
          {/* Preset tasks */}
          <PresetTaskButtons tasks={presetTasks} onSelectTask={handlePresetTask} />
          
          {/* Chat area */}
          <ChatMessageList messages={messages} isProcessing={isProcessing} />
          
          {/* Input area */}
          <ChatInput 
            initialValue={initialTask} 
            onSubmit={handleSubmit} 
            isProcessing={isProcessing} 
          />
        </div>
        
        <DialogFooter className="sm:justify-start">
          <div className="text-xs text-gray-500">
            This AI assistant can help with summarizing, translating, and extracting information from your PDF.
            <div className="mt-1">Powered by <span className="font-medium text-[#8B5CF6]">in4metrix</span></div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIAgentDialog;
