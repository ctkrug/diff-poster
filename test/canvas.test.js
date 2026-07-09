import { describe, expect, it } from "vitest";
import { renderDiffToCanvas } from "../src/render/canvas.js";
import { OUTPUT_HEIGHT, OUTPUT_WIDTH } from "../src/render/constants.js";

function makeStubCanvas() {
  const calls = { fillText: [] };
  const ctx = {
    clearRect() {},
    fillRect() {},
    fillText(value, x, y) {
      calls.fillText.push({ value, x, y, color: ctx.fillStyle });
    },
    measureText: (value) => ({ width: value.length * 8 }),
    beginPath() {},
    moveTo() {},
    lineTo() {},
    arcTo() {},
    arc() {},
    closePath() {},
    fill() {},
    stroke() {},
    save() {},
    restore() {},
    setTransform() {},
  };
  const canvas = {
    width: 0,
    height: 0,
    style: {},
    getContext: () => ctx,
  };
  return { canvas, calls };
}

describe("renderDiffToCanvas", () => {
  it("sizes the canvas pixel buffer to the social-share default at devicePixelRatio 1", () => {
    const { canvas } = makeStubCanvas();
    renderDiffToCanvas(canvas, [], { devicePixelRatio: 1 });
    expect(canvas.width).toBe(OUTPUT_WIDTH);
    expect(canvas.height).toBe(OUTPUT_HEIGHT);
  });

  it("scales physical pixel dimensions by devicePixelRatio", () => {
    const { canvas } = makeStubCanvas();
    renderDiffToCanvas(canvas, [], { devicePixelRatio: 2 });
    expect(canvas.width).toBe(OUTPUT_WIDTH * 2);
    expect(canvas.height).toBe(OUTPUT_HEIGHT * 2);
  });

  it("never sets an inline CSS width/height, leaving display sizing to the responsive stylesheet", () => {
    // A hardcoded inline style would override the stylesheet's `width: 100%`
    // rule and force the card past any viewport narrower than OUTPUT_WIDTH,
    // breaking layout on phones and tablets.
    const { canvas } = makeStubCanvas();
    renderDiffToCanvas(canvas, [], { devicePixelRatio: 2 });
    expect(canvas.style.width).toBeFalsy();
    expect(canvas.style.height).toBeFalsy();
  });

  it("reports hasChanges: false and draws a no-changes label for an all-equal diff", () => {
    const { canvas, calls } = makeStubCanvas();
    const result = renderDiffToCanvas(canvas, [{ type: "equal", value: "x" }]);
    expect(result.hasChanges).toBe(false);
    expect(calls.fillText.some((call) => call.value === "No changes")).toBe(true);
  });

  it("reports hasChanges: true for a diff with an added token", () => {
    const { canvas } = makeStubCanvas();
    const result = renderDiffToCanvas(canvas, [{ type: "add", value: "x" }]);
    expect(result.hasChanges).toBe(true);
  });

  it("reports a truncated count instead of silently dropping content", () => {
    const { canvas } = makeStubCanvas();
    const segments = [];
    for (let i = 0; i < 500; i++) {
      segments.push({ type: "equal", value: `line${i}` });
      segments.push({ type: "equal", value: "\n" });
    }
    const result = renderDiffToCanvas(canvas, segments);
    expect(result.truncatedCount).toBeGreaterThan(0);
  });

  it("pluralizes the truncation notice correctly for exactly one hidden line", () => {
    const { canvas, calls } = makeStubCanvas();
    // A tiny content height leaves room for zero visible rows, so a
    // single-row diff is entirely truncated: truncatedCount === 1.
    const result = renderDiffToCanvas(canvas, [{ type: "equal", value: "x" }], { height: 120 });
    expect(result.truncatedCount).toBe(1);
    expect(calls.fillText.some((call) => call.value === "… +1 more line")).toBe(true);
  });

  it("does not throw for an empty diff", () => {
    const { canvas } = makeStubCanvas();
    expect(() => renderDiffToCanvas(canvas, [])).not.toThrow();
  });

  it("colors keywords per the selected language option", () => {
    const jsRun = makeStubCanvas();
    renderDiffToCanvas(jsRun.canvas, [{ type: "equal", value: "def" }], {
      language: "javascript",
    });
    const jsDefColor = jsRun.calls.fillText.find((c) => c.value === "def")?.color;

    const pyRun = makeStubCanvas();
    renderDiffToCanvas(pyRun.canvas, [{ type: "equal", value: "def" }], {
      language: "python",
    });
    const pyDefColor = pyRun.calls.fillText.find((c) => c.value === "def")?.color;

    expect(jsDefColor).not.toBe(pyDefColor);
  });

  it("renders no syntax coloring at all in plaintext mode", () => {
    const { canvas, calls } = makeStubCanvas();
    renderDiffToCanvas(
      canvas,
      [
        { type: "equal", value: "return" },
        { type: "equal", value: " " },
        { type: "equal", value: '"hi"' },
      ],
      { language: "plaintext" },
    );
    const tokenColors = new Set(
      calls.fillText
        .filter((c) => ["return", " ", '"hi"'].includes(c.value))
        .map((c) => c.color),
    );
    expect(tokenColors.size).toBe(1);
  });
});
