export interface Token {
  text: string;
  translation?: string;
  isWord: boolean;
}

export interface ParagraphData {
  tokens: Token[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Strip any markdown code fences the model might have wrapped output in.
 * e.g. ```\n[[Hello|Привет]]\n``` → [[Hello|Привет]]
 */
function stripCodeFences(text: string): string {
  return text.replace(/^```[a-z]*\n?/gm, '').replace(/\n?```$/gm, '').trim();
}

/**
 * Primary format: [[Word|Translation]]
 * Uses [^\]]* (0+ chars) so [[word|]] with empty translation is also matched.
 */
const PRIMARY_REGEX = /\[\[([^|\]]+)\|([^\]]*)\]\]/g;

/**
 * No-pipe format: [[Word]] without translation.
 * Model uses this for proper nouns / untranslatable terms.
 * We strip the brackets and keep the word as plain text.
 * Must be applied BEFORE the primary regex so it doesn't interfere.
 */
const NO_PIPE_REGEX = /\[\[([^|\]]+)\]\]/g;

/**
 * Fallback format A: [Word](Translation) — some models use markdown-style links.
 */
const FALLBACK_MARKDOWN_REGEX = /\[([^\]]+)\]\(([^)]*)\)/g;

/**
 * Fallback format B: Word (Translation) — parenthetical format.
 * Matches a word followed by a parenthesised translation.
 */
const FALLBACK_PARENS_REGEX = /(\b[\wа-яА-ЯёЁ'-]+\b)\s+\(([^)]+)\)/g;

// ─── Single-paragraph tokenizer ───────────────────────────────────────────────

function tokenizeParagraph(paragraph: string): Token[] {
  const tokens: Token[] = [];

  // Step 1: Pre-process — strip [[word]] (no-pipe) → just "word" as plain text.
  // This handles proper nouns/acronyms the model wraps without a translation.
  const noPipeCount = [...paragraph.matchAll(new RegExp(NO_PIPE_REGEX.source, 'g'))].length;
  const para = paragraph.replace(new RegExp(NO_PIPE_REGEX.source, 'g'), '$1');
  if (noPipeCount > 0) {
    console.log(`[PARSER] Stripped ${noPipeCount} [[word]] (no-pipe) token(s) → plain text.`);
  }

  // Step 2: Determine which format the model used
  const primaryMatches = [...para.matchAll(new RegExp(PRIMARY_REGEX.source, 'g'))];
  const matchCount = primaryMatches.length;

  let regex: RegExp;
  let format: 'primary' | 'markdown' | 'parens' | 'raw';

  if (matchCount >= 1) {
    // Primary [[Word|Translation]] format detected
    regex = new RegExp(PRIMARY_REGEX.source, 'g');
    format = 'primary';
  } else {
    // Try fallback A: [Word](Translation)
    const markdownMatches = [...para.matchAll(new RegExp(FALLBACK_MARKDOWN_REGEX.source, 'g'))];
    if (markdownMatches.length >= 1) {
      regex = new RegExp(FALLBACK_MARKDOWN_REGEX.source, 'g');
      format = 'markdown';
      console.log(`[PARSER] Using fallback markdown format (${markdownMatches.length} matches).`);
    } else {
      // Try fallback B: Word (Translation)
      const parensMatches = [...para.matchAll(new RegExp(FALLBACK_PARENS_REGEX.source, 'g'))];
      if (parensMatches.length >= 1) {
        regex = new RegExp(FALLBACK_PARENS_REGEX.source, 'g');
        format = 'parens';
        console.log(`[PARSER] Using fallback parens format (${parensMatches.length} matches).`);
      } else {
        // No recognisable format — return the (preprocessed) text as a plain token
        console.warn(`[PARSER] No recognised format (primary=${matchCount}). Returning as raw text.`);
        return [{ text: para, isWord: false }];
      }
    }
  }

  // Step 3: Tokenize using the chosen regex against the preprocessed string
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(para)) !== null) {
    // Text before this match (punctuation / spaces)
    if (match.index > lastIndex) {
      const between = para.substring(lastIndex, match.index);
      if (between) tokens.push({ text: between, isWord: false });
    }

    const word = match[1].trim();
    const translation = format === 'primary' || format === 'markdown' ? match[2].trim() : match[2].trim();

    // Validation: word must not be pure brackets/garbage
    if (word && !/^[\[\]{}|]+$/.test(word)) {
      tokens.push({ text: word, translation: translation || undefined, isWord: true });
    } else {
      tokens.push({ text: match[0], isWord: false });
    }

    lastIndex = regex.lastIndex;
  }

  // Trailing text after the last match
  if (lastIndex < para.length) {
    const trailing = para.substring(lastIndex);
    if (trailing) tokens.push({ text: trailing, isWord: false });
  }

  return tokens;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export const parseAnnotatedTextToParagraphs = (annotatedText: string): ParagraphData[] => {
  // Step 1: Strip any markdown code fences the model might have added
  const cleaned = stripCodeFences(annotatedText);

  // Step 2: Split into paragraphs (by one or more newlines)
  const paragraphs = cleaned.split(/\n+/).filter(p => p.trim());

  // Step 3: Tokenize each paragraph
  const result = paragraphs.map((p) => {
    const normalised = p.replace(/[ \t]{2,}/g, ' ').trim();
    const tokens = tokenizeParagraph(normalised);

    const wordCount = tokens.filter(t => t.isWord).length;
    const rawCount = tokens.filter(t => !t.isWord).length;
    console.log(`[PARSER] Paragraph: ${tokens.length} tokens total, ${wordCount} clickable, ${rawCount} plain.`);

    if (tokens.length > 0 && wordCount === 0) {
      console.warn('[PARSER] Warning: paragraph has 0 clickable word tokens.');
    }

    return { tokens };
  });

  const totalWords = result.reduce((sum, p) => sum + p.tokens.filter(t => t.isWord).length, 0);
  const totalTokens = result.reduce((sum, p) => sum + p.tokens.length, 0);
  console.log(`[PARSER] Done: ${result.length} paragraphs, ${totalTokens} tokens, ${totalWords} clickable words.`);

  return result;
};
