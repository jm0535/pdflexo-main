
/**
 * Type definitions for the AI processing service
 */
export interface AIRequest {
  type: AIRequestType;
  text: string;
  options?: AIRequestOptions;
}

export interface AIResponse {
  text: string;
  metadata?: Record<string, any>;
}

export type AIRequestType = 'summarize' | 'explain' | 'translate' | 'format' | 'extract' | 'answer' | 'general';

export interface AIRequestOptions {
  language?: string;
  level?: string;
  formatType?: string;
  question?: string;
  [key: string]: any;
}
