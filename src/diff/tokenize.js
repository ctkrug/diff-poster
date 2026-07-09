const TOKEN_PATTERN = /\s+|\w+|[^\s\w]/g;

/**
 * Splits source text into lexical tokens (words, whitespace runs, and single
 * punctuation/operator characters). Diffing at this grain, rather than by
 * line, is what lets a one-argument change highlight just that argument
 * instead of turning the whole line red.
 */
export function tokenize(text) {
  return text.match(TOKEN_PATTERN) ?? [];
}
