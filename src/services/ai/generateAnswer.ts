
/**
 * Utility function for generating answers to questions about a document
 */
export function generateAnswer(text: string, question: string): string {
  if (!question) {
    return "Please provide a specific question about the document.";
  }
  
  if (!text || text.length < 20) {
    return "The provided text is too short to answer questions effectively.";
  }
  
  // Simple question detection
  if (question.toLowerCase().includes("when") || question.toLowerCase().includes("date")) {
    const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{2,4}\b/g;
    const dates = text.match(dateRegex);
    if (dates && dates.length > 0) {
      return `Based on the document, the date appears to be ${dates[0]}.`;
    }
  }
  
  if (question.toLowerCase().includes("who") || question.toLowerCase().includes("person")) {
    const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const names = text.match(nameRegex);
    if (names && names.length > 0) {
      return `The person mentioned in the document is ${names[0]}.`;
    }
  }
  
  // Find most relevant sentence
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const questionWords = question.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  
  let bestSentence = "";
  let bestScore = 0;
  
  sentences.forEach(sentence => {
    let score = 0;
    questionWords.forEach(word => {
      if (sentence.toLowerCase().includes(word)) {
        score++;
      }
    });
    
    if (score > bestScore) {
      bestScore = score;
      bestSentence = sentence;
    }
  });
  
  if (bestScore > 0) {
    return `Based on the document: ${bestSentence.trim()}.`;
  }
  
  return "I couldn't find a direct answer to your question in the provided text. You might want to rephrase your question or provide more context.";
}
