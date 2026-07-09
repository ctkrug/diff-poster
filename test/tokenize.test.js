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

  it("captures a double-quoted string as one atomic token", () => {
    expect(tokenize('"hi " + name')).toEqual(['"hi "', " ", "+", " ", "name"]);
  });

  it("captures a single-quoted string with an escaped quote as one token", () => {
    expect(tokenize("'it\\'s' + x")).toEqual(["'it\\'s'", " ", "+", " ", "x"]);
  });

  it("captures a template literal spanning a newline as one token", () => {
    expect(tokenize("`a\nb`")).toEqual(["`a\nb`"]);
  });

  it("captures a line comment as one atomic token", () => {
    expect(tokenize("x // trailing note\ny")).toEqual([
      "x",
      " ",
      "// trailing note",
      "\n",
      "y",
    ]);
  });

  it("treats each newline as its own token, separate from other whitespace", () => {
    expect(tokenize("a\n  b")).toEqual(["a", "\n", "  ", "b"]);
  });
});
