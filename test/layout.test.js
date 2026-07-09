import { describe, expect, it } from "vitest";
import { fitRows, segmentsToRows } from "../src/render/layout.js";

describe("segmentsToRows", () => {
  it("puts a single line with no newline into one row", () => {
    const segments = [{ type: "equal", value: "foo" }];
    expect(segmentsToRows(segments)).toEqual([segments]);
  });

  it("splits on a newline token into separate rows", () => {
    const segments = [
      { type: "equal", value: "a" },
      { type: "equal", value: "\n" },
      { type: "equal", value: "b" },
    ];
    expect(segmentsToRows(segments)).toEqual([
      [{ type: "equal", value: "a" }],
      [{ type: "equal", value: "b" }],
    ]);
  });

  it("puts a fully removed line and its replacement on separate rows", () => {
    const segments = [
      { type: "remove", value: "foo" },
      { type: "remove", value: "\n" },
      { type: "add", value: "bar" },
      { type: "add", value: "\n" },
    ];
    expect(segmentsToRows(segments)).toEqual([
      [{ type: "remove", value: "foo" }],
      [{ type: "add", value: "bar" }],
    ]);
  });

  it("drops the phantom trailing row from a final newline", () => {
    const segments = [
      { type: "equal", value: "a" },
      { type: "equal", value: "\n" },
    ];
    expect(segmentsToRows(segments)).toEqual([[{ type: "equal", value: "a" }]]);
  });

  it("preserves an intentional blank line in the middle", () => {
    const segments = [
      { type: "equal", value: "a" },
      { type: "equal", value: "\n" },
      { type: "equal", value: "\n" },
      { type: "equal", value: "b" },
    ];
    expect(segmentsToRows(segments)).toEqual([
      [{ type: "equal", value: "a" }],
      [],
      [{ type: "equal", value: "b" }],
    ]);
  });

  it("returns a single empty row for empty input", () => {
    expect(segmentsToRows([])).toEqual([[]]);
  });
});

describe("fitRows", () => {
  it("uses the default size when everything fits", () => {
    const result = fitRows(3, 200);
    expect(result).toEqual({
      fontSize: 16,
      lineHeight: 24,
      visibleRowCount: 3,
      truncatedCount: 0,
    });
  });

  it("shrinks proportionally when a modest reduction makes it fit", () => {
    const result = fitRows(14, 250);
    expect(result.truncatedCount).toBe(0);
    expect(result.visibleRowCount).toBe(14);
    expect(result.lineHeight).toBeLessThan(24);
    expect(result.lineHeight).toBeGreaterThanOrEqual(17);
  });

  it("truncates with a count when even the minimum size can't fit everything", () => {
    const result = fitRows(1000, 200);
    expect(result.fontSize).toBe(11);
    expect(result.lineHeight).toBe(17);
    expect(result.visibleRowCount).toBeGreaterThan(0);
    expect(result.truncatedCount).toBe(1000 - result.visibleRowCount);
  });

  it("returns zero visible rows for zero rows without dividing by zero", () => {
    expect(fitRows(0, 200)).toEqual({
      fontSize: 16,
      lineHeight: 24,
      visibleRowCount: 0,
      truncatedCount: 0,
    });
  });

  it("never reports a negative visible row count for a tiny available height", () => {
    const result = fitRows(50, 1);
    expect(result.visibleRowCount).toBeGreaterThanOrEqual(0);
  });
});
