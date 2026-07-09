import { tokenize } from "./tokenize.js";

// The LCS table is O(tokens(before) * tokens(after)) in both time and
// memory. This product keeps the table build well under a second and its
// backing arrays well under browser tab memory limits, even in the worst
// case where every token is a single character (see docs/ARCHITECTURE.md).
// Above it, the DP table stops being "fine for short snippets" (the
// documented assumption) and starts hanging or OOM-crashing the tab.
export const MAX_DIFF_TOKEN_PRODUCT = 4_000_000;

export class DiffTooLargeError extends Error {
  constructor() {
    super("These snippets are too large to diff in the browser.");
    this.name = "DiffTooLargeError";
  }
}

/**
 * Computes a token-level diff between two source strings using an LCS
 * (longest common subsequence) table over tokens. Returns a flat list of
 * { type: "equal" | "add" | "remove", value } segments in display order.
 *
 * This is the placeholder scaffold implementation (O(n*m) DP, fine for the
 * short snippets this tool targets) — swapped for a faster algorithm only if
 * real-world snippet sizes demand it. Inputs whose token counts would blow
 * past that assumption are rejected up front with `DiffTooLargeError` rather
 * than left to hang or exhaust memory.
 */
export function diffTokens(before, after) {
  const a = tokenize(before);
  const b = tokenize(after);
  if (a.length * b.length > MAX_DIFF_TOKEN_PRODUCT) {
    throw new DiffTooLargeError();
  }
  const lengths = buildLcsTable(a, b);
  return backtrack(a, b, lengths);
}

function buildLcsTable(a, b) {
  const table = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] =
        a[i] === b[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}

function backtrack(a, b, lengths) {
  const segments = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      segments.push({ type: "equal", value: a[i] });
      i++;
      j++;
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
      segments.push({ type: "remove", value: a[i] });
      i++;
    } else {
      segments.push({ type: "add", value: b[j] });
      j++;
    }
  }
  while (i < a.length) {
    segments.push({ type: "remove", value: a[i++] });
  }
  while (j < b.length) {
    segments.push({ type: "add", value: b[j++] });
  }

  return segments;
}
