
/**
 * Utility function for extracting key information from text
 */
export function extractKeyInformation(text: string): string {
  if (!text || text.length < 20) {
    return "The provided text is too short to extract meaningful information.";
  }
  
  // Find dates
  const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{2,4}\b/g;
  const dates = text.match(dateRegex) || [];
  
  // Find names (simplified approach)
  const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
  const names = text.match(nameRegex) || [];
  
  // Find numbers
  const numberRegex = /\b\d+(\.\d+)?\b/g;
  const numbers = text.match(numberRegex) || [];
  
  let result = "Key Information Extracted:\n\n";
  
  if (dates.length > 0) {
    result += "Dates Found:\n";
    dates.forEach(date => result += `• ${date}\n`);
    result += "\n";
  }
  
  if (names.length > 0) {
    result += "Potential Names:\n";
    names.forEach(name => result += `• ${name}\n`);
    result += "\n";
  }
  
  if (numbers.length > 0) {
    result += "Numbers Found:\n";
    const uniqueNumbers = [...new Set(numbers)];
    uniqueNumbers.slice(0, 5).forEach(num => result += `• ${num}\n`);
    result += "\n";
  }
  
  return result;
}
