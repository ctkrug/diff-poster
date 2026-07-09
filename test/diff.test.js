import { describe, expect, it } from "vitest";
import { diffTokens } from "../src/diff/diff.js";

describe("diffTokens", () => {
  it("marks identical text as entirely equal", () => {
    const segments = diffTokens("const x = 1;", "const x = 1;");
    expect(segments.every((s) => s.type === "equal")).toBe(true);
  });

  it("highlights only the changed token, not the whole line", () => {
    const segments = diffTokens("const x = 1;", "const x = 2;");
    const changed = segments.filter((s) => s.type !== "equal");
    expect(changed).toEqual([
      { type: "remove", value: "1" },
      { type: "add", value: "2" },
    ]);
  });

  it("handles an appended word as a new token", () => {
    const segments = diffTokens("foo", "foo bar");
    expect(segments).toEqual([
      { type: "equal", value: "foo" },
      { type: "add", value: " " },
      { type: "add", value: "bar" },
    ]);
  });
});
