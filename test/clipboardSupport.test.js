import { describe, expect, it } from "vitest";
import { isClipboardImageSupported } from "../src/export/clipboardSupport.js";

describe("isClipboardImageSupported", () => {
  it("returns true when both clipboard.write and ClipboardItem exist", () => {
    const target = {
      navigator: { clipboard: { write: () => {} } },
      ClipboardItem: function ClipboardItem() {},
    };
    expect(isClipboardImageSupported(target)).toBe(true);
  });

  it("returns false when navigator.clipboard is missing", () => {
    const target = { navigator: {}, ClipboardItem: function ClipboardItem() {} };
    expect(isClipboardImageSupported(target)).toBe(false);
  });

  it("returns false when ClipboardItem is missing", () => {
    const target = { navigator: { clipboard: { write: () => {} } } };
    expect(isClipboardImageSupported(target)).toBe(false);
  });

  it("returns false for a bare object with neither API", () => {
    expect(isClipboardImageSupported({})).toBe(false);
  });
});
