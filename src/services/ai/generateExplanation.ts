
/**
 * Utility function for generating explanations of complex content
 */
export function generateExplanation(text: string): string {
  return `This passage appears to be discussing ${text.length > 100 ? 'a complex topic' : 'a simple concept'}. 
  
The main points can be understood as follows:

1. The author is presenting information about ${text.includes("data") ? "data analysis or statistics" : "a technical concept"}.
2. There are ${text.split(/\s+/).length > 50 ? "several" : "a few"} key concepts introduced.
3. The context suggests this is meant for ${text.includes("algorithm") || text.includes("function") ? "technical professionals" : "general readers"}.

In simpler terms, this passage is about ${text.substring(0, 20)}... and related concepts.`;
}
