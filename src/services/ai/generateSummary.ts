
/**
 * Utility function for generating document summaries
 */
export function generateSummary(text: string): string {
  if (!text || text.length < 10) {
    return "The provided text is too short to summarize effectively.";
  }
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const selectedSentences = sentences.slice(0, Math.min(3, sentences.length));
  
  return selectedSentences.join(". ") + ".";
}
