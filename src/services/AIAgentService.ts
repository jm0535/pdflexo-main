
import { generateSummary } from './ai/generateSummary';
import { generateExplanation } from './ai/generateExplanation';
import { mockTranslation } from './ai/mockTranslation';
import { formatToBulletPoints } from './ai/formatToBulletPoints';
import { extractKeyInformation } from './ai/extractKeyInformation';
import { generateAnswer } from './ai/generateAnswer';
import { AIRequest, AIResponse } from './ai/types';

// AI service that coordinates different processing tasks
export const AIAgentService = {
  async processRequest(request: AIRequest): Promise<AIResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Processing AI request:", request);
    
    // Process request based on type
    switch (request.type) {
      case "summarize":
        return {
          text: `Summary of the document:\n\n${generateSummary(request.text)}`,
        };
      
      case "explain":
        return {
          text: `Explanation of "${request.text.substring(0, 50)}...":\n\n${generateExplanation(request.text)}`,
        };
      
      case "translate":
        const targetLanguage = request.options?.language || "Spanish";
        return {
          text: `Translation to ${targetLanguage}:\n\n${mockTranslation(request.text, targetLanguage)}`,
          metadata: { language: targetLanguage }
        };
      
      case "format":
        return {
          text: formatToBulletPoints(request.text),
        };
      
      case "extract":
        return {
          text: extractKeyInformation(request.text),
        };
      
      case "answer":
        return {
          text: generateAnswer(request.text, request.options?.question || ""),
        };
      
      default:
        return {
          text: "I've processed your request. In a real implementation, I would connect to an AI service to provide a more accurate response.",
        };
    }
  }
};
