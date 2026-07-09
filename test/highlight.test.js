import { describe, expect, it } from "vitest";
import { classifyToken } from "../src/render/highlight.js";

describe("classifyToken", () => {
  it("classifies a JS keyword", () => {
    expect(classifyToken("return")).toBe("keyword");
  });

  it("classifies a Python keyword", () => {
    expect(classifyToken("def")).toBe("keyword");
  });

  it("classifies a double-quoted string literal", () => {
    expect(classifyToken('"hello"')).toBe("string");
  });

  it("classifies a template literal", () => {
    expect(classifyToken("`hi ${name}`")).toBe("string");
  });

  it("classifies a line comment", () => {
    expect(classifyToken("// note")).toBe("comment");
  });

  it("classifies a hash comment", () => {
    expect(classifyToken("# note")).toBe("comment");
  });

  it("classifies a numeric literal", () => {
    expect(classifyToken("42")).toBe("number");
  });

  it("classifies a plain identifier", () => {
    expect(classifyToken("greet")).toBe("identifier");
  });

  it("classifies punctuation", () => {
    expect(classifyToken("(")).toBe("punctuation");
  });

  it("classifies a newline distinctly from other whitespace", () => {
    expect(classifyToken("\n")).toBe("newline");
    expect(classifyToken("  ")).toBe("whitespace");
  });

  it("classifies an empty token as whitespace rather than throwing", () => {
    expect(classifyToken("")).toBe("whitespace");
  });

  it("scopes keywords to javascript when a language is given", () => {
    expect(classifyToken("return", "javascript")).toBe("keyword");
    expect(classifyToken("def", "javascript")).toBe("identifier");
  });

  it("scopes keywords to python when a language is given", () => {
    expect(classifyToken("def", "python")).toBe("keyword");
    expect(classifyToken("function", "python")).toBe("identifier");
  });

  it("disables all syntax coloring in plaintext mode", () => {
    expect(classifyToken("return", "plaintext")).toBe("identifier");
    expect(classifyToken('"hello"', "plaintext")).toBe("identifier");
    expect(classifyToken("// note", "plaintext")).toBe("identifier");
    expect(classifyToken("42", "plaintext")).toBe("identifier");
    expect(classifyToken("(", "plaintext")).toBe("identifier");
  });

  it("still classifies whitespace and newlines distinctly in plaintext mode", () => {
    expect(classifyToken("\n", "plaintext")).toBe("newline");
    expect(classifyToken("  ", "plaintext")).toBe("whitespace");
  });
});
