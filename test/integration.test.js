import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const indexPath = resolve(dirname(fileURLToPath(import.meta.url)), "../index.html");

function stubCanvasContext() {
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect() {},
    fillRect() {},
    fillText() {},
    measureText: () => ({ width: 0 }),
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
  });
}

function renderRealIndexHtml() {
  const html = readFileSync(indexPath, "utf8");
  const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
  if (!bodyMatch) throw new Error("index.html has no <body> to extract");
  // Drop the module <script> tag: we import main.js directly instead of
  // relying on the browser's module loader inside jsdom.
  document.body.innerHTML = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/, "");
}

async function loadMain() {
  vi.resetModules();
  return import("../src/main.js");
}

describe("the real index.html markup wired to main.js", () => {
  beforeEach(() => {
    renderRealIndexHtml();
    stubCanvasContext();
    HTMLCanvasElement.prototype.toBlob = function toBlob(callback) {
      callback({ type: "image/png" });
    };
    window.URL.createObjectURL = () => "blob:stub";
    window.URL.revokeObjectURL = () => {};
    delete window.navigator.clipboard;
    delete window.ClipboardItem;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("mounts against the shipped markup without missing-element errors", async () => {
    await expect(loadMain()).resolves.toBeTruthy();
    expect(document.getElementById("output-card").dataset.state).toBe("empty");
  });

  it("drives paste -> language select -> generate -> download through real markup", async () => {
    document.getElementById("before-input").value = "def greet():\n    pass";
    document.getElementById("after-input").value = "def greet():\n    return None";
    document.getElementById("language-select").value = "python";
    const { api } = await loadMain();

    api.generate();
    expect(document.getElementById("output-card").dataset.state).toBe("success");

    let downloadedName = null;
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = (tag) => {
      const el = originalCreateElement(tag);
      if (tag === "a") el.click = () => (downloadedName = el.download);
      return el;
    };
    await api.download();
    document.createElement = originalCreateElement;

    expect(downloadedName).toMatch(/^diff-poster-\d{8}-\d{6}\.png$/);
  });

  it("shows the designed empty-pane error through real markup", async () => {
    document.getElementById("before-input").value = "x";
    const { api } = await loadMain();
    api.generate();
    expect(document.getElementById("output-card").dataset.state).toBe("error");
  });
});
