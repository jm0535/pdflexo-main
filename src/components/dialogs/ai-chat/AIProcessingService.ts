
import { AIAgentService } from '@/services/AIAgentService';
import { AIRequestType, AIRequestOptions } from '@/services/ai/types';
import { Message } from './ChatMessageList';

export interface AIProcessRequest {
  type: AIRequestType;
  text: string;
  options?: AIRequestOptions;
}

export const determineRequestType = (userMessage: string): { 
  requestType: AIRequestType; 
  options: AIRequestOptions 
} => {
  let requestType: AIRequestType = "general";
  let options: AIRequestOptions = {};
  
  if (userMessage.toLowerCase().includes('summarize')) {
    requestType = "summarize";
  } else if (userMessage.toLowerCase().includes('explain')) {
    requestType = "explain";
  } else if (userMessage.toLowerCase().includes('translate')) {
    requestType = "translate";
    // Extract language if specified
    const languageMatch = userMessage.match(/translate\s+(?:this|to|into)\s+([a-zA-Z]+)/i);
    if (languageMatch && languageMatch[1]) {
      options = { language: languageMatch[1] };
    }
  } else if (userMessage.toLowerCase().includes('format') || userMessage.toLowerCase().includes('bullet')) {
    requestType = "format";
  } else if (userMessage.toLowerCase().includes('extract')) {
    requestType = "extract";
  } else if (userMessage.toLowerCase().includes('question') || userMessage.toLowerCase().includes('answer')) {
    requestType = "answer";
    options = { question: userMessage };
  }
  
  return { requestType, options };
};

export const processAIRequest = async (
  userMessage: string, 
  selectedText: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>
): Promise<void> => {
  // Add user message to chat
  setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
  setIsProcessing(true);

  try {
    // Determine request type based on user message
    const { requestType, options } = determineRequestType(userMessage);
    
    // Process the request
    const response = await AIAgentService.processRequest({
      type: requestType,
      text: selectedText || "This is a sample document that would normally contain the text from your PDF.",
      options
    });
    
    // Add AI response to chat
    setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
    setIsProcessing(false);
    
  } catch (error) {
    console.error('Error processing AI request:', error);
    
    // Add error message to chat
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: "I'm sorry, I encountered an error while processing your request. Please try again."
    }]);
    
    setIsProcessing(false);
  }
};
