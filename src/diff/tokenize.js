const TOKEN_PATTERN =
  /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\/[^\n]*|#[^\n]*|\n|[ \t]+|\w+|[^\s\w]/g;

/**
 * Splits source text into lexical tokens: string/template literals and line
 * comments as single atomic tokens (so a string edit diffs as "one thing"
 * and the renderer can color it as a unit), newlines as their own token
 * (so line breaks are unambiguous row boundaries), then words, runs of
 * horizontal whitespace, and single punctuation/operator characters.
 * Diffing at this grain, rather than by line, is what lets a one-argument
 * change highlight just that argument instead of turning the whole line red.
 */
export function tokenize(text) {
  return text.match(TOKEN_PATTERN) ?? [];
}
