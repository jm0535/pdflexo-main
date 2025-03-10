
/**
 * Utility function for generating mock translations
 */
export function mockTranslation(text: string, language: string): string {
  const translations: Record<string, string[]> = {
    "Spanish": ["El documento", "importante", "proceso", "análisis", "tecnología", "información"],
    "French": ["Le document", "important", "processus", "analyse", "technologie", "information"],
    "German": ["Das Dokument", "wichtig", "Prozess", "Analyse", "Technologie", "Information"],
    "Chinese": ["文档", "重要", "过程", "分析", "技术", "信息"],
    "Japanese": ["文書", "重要", "プロセス", "分析", "テクノロジー", "情報"]
  };
  
  const words = translations[language] || translations["Spanish"];
  
  // Generate mock translated text
  let result = "";
  const wordCount = text.split(/\s+/).length;
  
  for (let i = 0; i < wordCount; i++) {
    result += words[i % words.length] + " ";
    if (i % 10 === 9) result += ". ";
  }
  
  return result;
}
