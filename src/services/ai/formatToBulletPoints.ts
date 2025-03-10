
/**
 * Utility function for formatting text into bullet points
 */
export function formatToBulletPoints(text: string): string {
  if (!text || text.length < 10) {
    return "The provided text is too short to format.";
  }
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let bulletPoints = "";
  
  for (let i = 0; i < Math.min(sentences.length, 5); i++) {
    bulletPoints += `• ${sentences[i].trim()}\n`;
  }
  
  return bulletPoints;
}
