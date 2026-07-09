import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";

const indexPath = resolve(dirname(fileURLToPath(import.meta.url)), "../index.html");

describe("keyboard and accessibility", () => {
  let dom;

  beforeEach(() => {
    dom = readFileSync(indexPath, "utf8");
    const bodyMatch = dom.match(/<body>([\s\S]*)<\/body>/);
    document.body.innerHTML = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/, "");
  });

  it("moves tab order through before -> after -> language -> generate -> copy -> download", () => {
    // No element in the shipped markup opts out of natural DOM tab order.
    expect(dom).not.toMatch(/tabindex/i);

    const ids = [
      "before-input",
      "after-input",
      "language-select",
      "generate-btn",
      "copy-btn",
      "download-btn",
    ];
    const elements = ids.map((id) => {
      const el = document.getElementById(id);
      expect(el, `#${id} should exist`).toBeTruthy();
      return el;
    });

    for (let i = 0; i < elements.length - 1; i++) {
      const a = elements[i];
      const b = elements[i + 1];
      // DOCUMENT_POSITION_FOLLOWING (4): a precedes b in the document.
      expect(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("gives the output status region a live region so state changes are announced", () => {
    const status = document.getElementById("output-status");
    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
  });

  it("marks the error message as an assertive alert", () => {
    const error = document.getElementById("output-error");
    expect(error.getAttribute("role")).toBe("alert");
  });

  it("hides the purely decorative line-number gutters from assistive tech", () => {
    for (const gutter of document.querySelectorAll("[data-gutter]")) {
      expect(gutter.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("gives every interactive control a non-empty accessible name", () => {
    const controls = [
      document.getElementById("before-input"),
      document.getElementById("after-input"),
      document.getElementById("language-select"),
      document.getElementById("generate-btn"),
      document.getElementById("copy-btn"),
      document.getElementById("download-btn"),
    ];
    for (const control of controls) {
      const label = document.querySelector(`label[for="${control.id}"]`);
      const accessibleName = label?.textContent.trim() || control.textContent.trim();
      expect(accessibleName.length, `#${control.id} needs an accessible name`).toBeGreaterThan(0);
    }
  });
});
