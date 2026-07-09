import { tokenize } from "./tokenize.js";

/**
 * Computes a token-level diff between two source strings using an LCS
 * (longest common subsequence) table over tokens. Returns a flat list of
 * { type: "equal" | "add" | "remove", value } segments in display order.
 *
 * This is the placeholder scaffold implementation (O(n*m) DP, fine for the
 * short snippets this tool targets) — swapped for a faster algorithm only if
 * real-world snippet sizes demand it.
 */
export function diffTokens(before, after) {
  const a = tokenize(before);
  const b = tokenize(after);
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
