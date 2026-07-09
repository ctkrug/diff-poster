const JS_KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while",
  "do", "switch", "case", "break", "continue", "class", "extends", "new",
  "this", "typeof", "instanceof", "in", "of", "try", "catch", "finally",
  "throw", "async", "await", "import", "export", "from", "default", "null",
  "undefined", "true", "false", "static", "get", "set", "yield", "delete",
  "void", "super",
]);

const PY_KEYWORDS = new Set([
  "def", "elif", "except", "pass", "lambda", "None", "True", "False", "and",
  "or", "not", "is", "raise", "with", "as", "global", "nonlocal", "assert",
  "self", "print", "class", "return", "if", "else", "for", "while", "break",
  "continue", "try", "finally", "del", "in", "yield", "async", "await",
  "import", "from", "default",
]);

// Merged set used when no explicit language is picked - good enough to make
// control flow and declarations visually distinct without a real parser or
// per-language grammar.
const MERGED_KEYWORDS = new Set([...JS_KEYWORDS, ...PY_KEYWORDS]);

const KEYWORD_SETS_BY_LANGUAGE = {
  javascript: JS_KEYWORDS,
  python: PY_KEYWORDS,
};

const NUMBER_PATTERN = /^\d/;
const IDENTIFIER_PATTERN = /^\w+$/;
const STRING_START_PATTERN = /^["'`]/;
const COMMENT_START_PATTERN = /^(\/\/|#)/;

/**
 * Classifies a single token (as produced by tokenize()) into a syntax
 * category used for output coloring. Independent of diff type — a token's
 * syntax color and its add/remove highlight are drawn as separate layers.
 *
 * `language` narrows which keyword set applies ("javascript" | "python");
 * omitted, it falls back to the merged set. "plaintext" disables syntax
 * coloring entirely — every non-whitespace token classifies as identifier.
 */
export function classifyToken(token, language) {
  if (!token) return "whitespace";
  if (token === "\n") return "newline";
  if (/^[ \t]+$/.test(token)) return "whitespace";
  if (language === "plaintext") return "identifier";
  if (COMMENT_START_PATTERN.test(token)) return "comment";
  if (STRING_START_PATTERN.test(token)) return "string";
  if (NUMBER_PATTERN.test(token)) return "number";
  if (IDENTIFIER_PATTERN.test(token)) {
    const keywords = KEYWORD_SETS_BY_LANGUAGE[language] ?? MERGED_KEYWORDS;
    return keywords.has(token) ? "keyword" : "identifier";
  }
  return "punctuation";
}
