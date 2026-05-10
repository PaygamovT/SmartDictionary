export interface Token {
  text: string;
  translation?: string;
  isWord: boolean;
}

export interface ParagraphData {
  tokens: Token[];
}

export const parseAnnotatedTextToParagraphs = (annotatedText: string): ParagraphData[] => {
  const paragraphs = annotatedText.split(/\n+/).filter(p => p.trim());
  
  return paragraphs.map((p) => {
    const tokens: Token[] = [];
    // Match [[Word|Translation]]
    const regex = /\[\[([^|\]]+)\|([^\]]+)\]\]/g;
    let lastIndex = 0;
    
    let match;
    while ((match = regex.exec(p)) !== null) {
      // Add any punctuation/spaces before the annotated word
      if (match.index > lastIndex) {
        tokens.push({ text: p.substring(lastIndex, match.index), isWord: false });
      }
      
      // Add the annotated word
      tokens.push({ text: match[1], translation: match[2], isWord: true });
      lastIndex = regex.lastIndex;
    }
    
    // Add any trailing punctuation/spaces
    if (lastIndex < p.length) {
      tokens.push({ text: p.substring(lastIndex), isWord: false });
    }
    
    return { tokens };
  });
};
