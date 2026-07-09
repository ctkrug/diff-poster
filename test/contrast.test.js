import { describe, expect, it } from "vitest";

// Mirrors the token values in src/style.css and the COLORS map in
// src/render/canvas.js. There's no shared JS module for design tokens (they
// live as CSS custom properties + a duplicate canvas color table), so this
// is a deliberate hardcoded snapshot - if a token value changes, update it
// here too and re-check the ratio against docs/DESIGN.md's 4.5:1 bar.
const PAIRS = {
  "ink text on page background": ["#241f18", "#f3ede1"],
  "muted ink text on page background": ["#6b6154", "#f3ede1"],
  "ink text on surface-1": ["#241f18", "#fbf8f1"],
  "muted ink text on surface-1": ["#6b6154", "#fbf8f1"],
  "accent-action text/links on page background": ["#8a1c1c", "#f3ede1"],
  "white button text on accent-action background": ["#ffffff", "#8a1c1c"],
  "success status text on surface-1": ["#3f6b3f", "#fbf8f1"],
  "danger/error text on surface-1": ["#8a1c1c", "#fbf8f1"],
  "accent-add (diff highlight) on surface-1": ["#b3541e", "#fbf8f1"],
  "accent-remove (diff highlight) on surface-1": ["#4d5b6b", "#fbf8f1"],
};

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}

function relativeLuminance([r, g, b]) {
  const [R, G, B] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hexA, hexB) {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];
  return (lighter + 0.05) / (darker + 0.05);
}

describe("design token contrast", () => {
  it.each(Object.entries(PAIRS))("%s meets WCAG AA (>= 4.5:1)", (_label, [fg, bg]) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
