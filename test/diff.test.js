import { describe, expect, it } from "vitest";
import { DiffTooLargeError, diffTokens } from "../src/diff/diff.js";

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

  it("handles a deleted word, marking it removed rather than replaced", () => {
    const segments = diffTokens("foo bar", "foo");
    expect(segments).toEqual([
      { type: "equal", value: "foo" },
      { type: "remove", value: " " },
      { type: "remove", value: "bar" },
    ]);
  });

  it("highlights a renamed identifier used twice, not the surrounding lines", () => {
    const before = "greet(name);\ngreet(name);";
    const after = "greet(person);\ngreet(person);";
    const segments = diffTokens(before, after);
    const changed = segments.filter((s) => s.type !== "equal");
    expect(changed).toEqual([
      { type: "remove", value: "name" },
      { type: "add", value: "person" },
      { type: "remove", value: "name" },
      { type: "add", value: "person" },
    ]);
  });

  it("diffs a multi-line change line-by-line without tokens bleeding across lines", () => {
    const before = "function greet(name) {\n  return 'hi ' + name;\n}";
    const after = "function greet(name) {\n  return `hello, ${name}!`;\n}";
    const segments = diffTokens(before, after);

    // The unchanged first and last lines carry no add/remove segments.
    const firstLineEnd = segments.findIndex((s) => s.value === "\n");
    const firstLine = segments.slice(0, firstLineEnd);
    expect(firstLine.every((s) => s.type === "equal")).toBe(true);

    const changed = segments.filter((s) => s.type !== "equal");
    expect(changed.some((s) => s.type === "remove" && s.value === "'hi '")).toBe(true);
    expect(changed.some((s) => s.type === "add" && s.value === "`hello, ${name}!`")).toBe(true);
    // No newline token was itself flagged as changed - only the line's content differs.
    expect(changed.some((s) => s.value === "\n")).toBe(false);
  });

  it("rejects pastes far beyond the LCS table's safe size instead of freezing", () => {
    // The DP table is O(tokens(before) * tokens(after)); a few thousand
    // tokens per side is enough to hang a tab for seconds. A hostile-sized
    // paste must fail fast with a recognizable error instead of grinding.
    const huge = Array(4000).fill("token").join(" ");
    expect(() => diffTokens(huge, huge)).toThrow(DiffTooLargeError);
  });

  it("still diffs realistically large-but-reasonable snippets", () => {
    const before = Array(200).fill("const x = 1;").join("\n");
    const after = Array(200).fill("const x = 2;").join("\n");
    expect(() => diffTokens(before, after)).not.toThrow();
  });
});
