// Keywords shared across the JS- and Python-shaped snippets this tool
// targets. A single merged set (rather than a per-language grammar) keeps
// the classifier a plain lookup — good enough to make control flow and
// declarations visually distinct without a real parser.
const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while",
  "do", "switch", "case", "break", "continue", "class", "extends", "new",
  "this", "typeof", "instanceof", "in", "of", "try", "catch", "finally",
  "throw", "async", "await", "import", "export", "from", "default", "null",
  "undefined", "true", "false", "static", "get", "set", "yield", "delete",
  "void", "super",
  "def", "elif", "except", "pass", "lambda", "None", "True", "False", "and",
  "or", "not", "is", "raise", "with", "as", "global", "nonlocal", "assert",
  "self", "print",
]);

const NUMBER_PATTERN = /^\d/;
const IDENTIFIER_PATTERN = /^\w+$/;
const STRING_START_PATTERN = /^["'`]/;
const COMMENT_START_PATTERN = /^(\/\/|#)/;

/**
 * Classifies a single token (as produced by tokenize()) into a syntax
 * category used for output coloring. Independent of diff type — a token's
 * syntax color and its add/remove highlight are drawn as separate layers.
 */
export function classifyToken(token) {
  if (!token) return "whitespace";
  if (token === "\n") return "newline";
  if (/^[ \t]+$/.test(token)) return "whitespace";
  if (COMMENT_START_PATTERN.test(token)) return "comment";
  if (STRING_START_PATTERN.test(token)) return "string";
  if (NUMBER_PATTERN.test(token)) return "number";
  if (IDENTIFIER_PATTERN.test(token)) {
    return KEYWORDS.has(token) ? "keyword" : "identifier";
  }
  return "punctuation";
}
