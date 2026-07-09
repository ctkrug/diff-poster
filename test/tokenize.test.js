import { describe, expect, it } from "vitest";
import { tokenize } from "../src/diff/tokenize.js";

describe("tokenize", () => {
  it("splits words, whitespace, and punctuation into separate tokens", () => {
    expect(tokenize("foo(bar)")).toEqual(["foo", "(", "bar", ")"]);
  });

  it("preserves whitespace runs as their own tokens", () => {
    expect(tokenize("a  b")).toEqual(["a", "  ", "b"]);
  });

  it("returns an empty array for empty input", () => {
    expect(tokenize("")).toEqual([]);
  });
});
