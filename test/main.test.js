import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

function renderShell() {
  document.body.innerHTML = `
    <textarea id="before-input"></textarea>
    <div data-gutter="before"></div>
    <textarea id="after-input"></textarea>
    <div data-gutter="after"></div>
    <select id="language-select">
      <option value="javascript" selected>JavaScript</option>
      <option value="python">Python</option>
      <option value="plaintext">Plain text</option>
    </select>
    <button id="generate-btn" type="button"></button>
    <div id="output-card" data-state="empty">
      <p id="output-empty"></p>
      <p id="output-error" hidden></p>
      <canvas id="output-canvas" hidden></canvas>
    </div>
    <div id="output-actions" hidden>
      <button id="copy-btn" type="button"></button>
      <button id="download-btn" type="button"></button>
    </div>
    <p id="output-status"></p>
  `;
}

function stubDownloadApis() {
  HTMLCanvasElement.prototype.toBlob = function toBlob(callback) {
    callback({ type: "image/png" });
  };
  window.URL.createObjectURL = () => "blob:stub";
  window.URL.revokeObjectURL = () => {};
}

function clearClipboardApis() {
  delete window.navigator.clipboard;
  delete window.ClipboardItem;
}

function stubClipboardApis({ write = async () => {} } = {}) {
  Object.defineProperty(window.navigator, "clipboard", {
    value: { write },
    configurable: true,
  });
  window.ClipboardItem = function ClipboardItem(data) {
    this.data = data;
  };
}

async function loadMain() {
  vi.resetModules();
  return import("../src/main.js");
}

describe("app bootstrap and generate flow", () => {
  beforeEach(() => {
    renderShell();
    stubCanvasContext();
    stubDownloadApis();
    clearClipboardApis();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("starts in the empty output state on a fresh load", async () => {
    await loadMain();
    const card = document.getElementById("output-card");
    expect(card.dataset.state).toBe("empty");
    expect(document.getElementById("output-canvas").hidden).toBe(true);
    expect(document.getElementById("output-actions").hidden).toBe(true);
  });

  it("renders a canvas and reveals actions on a valid generate", async () => {
    document.getElementById("before-input").value = "const x = 1;";
    document.getElementById("after-input").value = "const x = 2;";
    await loadMain();

    document.getElementById("generate-btn").click();

    const card = document.getElementById("output-card");
    expect(card.dataset.state).toBe("success");
    expect(document.getElementById("output-canvas").hidden).toBe(false);
    expect(document.getElementById("output-actions").hidden).toBe(false);
    expect(document.getElementById("output-status").textContent).toMatch(/generated/i);
  });

  it("stays in a consistent success state under rapid double-clicking of generate", async () => {
    document.getElementById("before-input").value = "const x = 1;";
    document.getElementById("after-input").value = "const x = 2;";
    await loadMain();

    const generateBtn = document.getElementById("generate-btn");
    expect(() => {
      generateBtn.click();
      generateBtn.click();
      generateBtn.click();
    }).not.toThrow();

    const card = document.getElementById("output-card");
    expect(card.dataset.state).toBe("success");
    expect(document.getElementById("output-canvas").hidden).toBe(false);
    expect(document.getElementById("output-actions").hidden).toBe(false);
  });

  it("reports no changes when before and after are identical", async () => {
    document.getElementById("before-input").value = "const x = 1;";
    document.getElementById("after-input").value = "const x = 1;";
    await loadMain();

    document.getElementById("generate-btn").click();

    expect(document.getElementById("output-status").textContent).toMatch(/no changes/i);
  });

  it("shows a designed error state instead of crashing when a pane is empty", async () => {
    document.getElementById("before-input").value = "const x = 1;";
    document.getElementById("after-input").value = "";
    await loadMain();

    document.getElementById("generate-btn").click();

    const card = document.getElementById("output-card");
    expect(card.dataset.state).toBe("error");
    expect(document.getElementById("output-error").hidden).toBe(false);
    expect(document.getElementById("output-error").textContent.length).toBeGreaterThan(0);
    expect(document.getElementById("output-canvas").hidden).toBe(true);
  });

  it("recovers to the success state on a valid retry after an error", async () => {
    document.getElementById("before-input").value = "const x = 1;";
    document.getElementById("after-input").value = "";
    await loadMain();

    document.getElementById("generate-btn").click();
    expect(document.getElementById("output-card").dataset.state).toBe("error");

    document.getElementById("after-input").value = "const x = 2;";
    document.getElementById("generate-btn").click();

    const card = document.getElementById("output-card");
    expect(card.dataset.state).toBe("success");
    expect(document.getElementById("output-error").hidden).toBe(true);
    expect(document.getElementById("output-canvas").hidden).toBe(false);
    expect(document.getElementById("output-actions").hidden).toBe(false);
  });

  it("shows the same error state when a pane is only whitespace", async () => {
    document.getElementById("before-input").value = "   \n  ";
    document.getElementById("after-input").value = "const x = 1;";
    await loadMain();

    document.getElementById("generate-btn").click();

    expect(document.getElementById("output-card").dataset.state).toBe("error");
  });

  it("shows a designed error instead of hanging on a hostile-sized paste", async () => {
    const huge = Array(4000).fill("token").join(" ");
    document.getElementById("before-input").value = huge;
    document.getElementById("after-input").value = huge;
    await loadMain();

    document.getElementById("generate-btn").click();

    const card = document.getElementById("output-card");
    expect(card.dataset.state).toBe("error");
    expect(document.getElementById("output-error").textContent).toMatch(/too large/i);
    expect(document.getElementById("output-canvas").hidden).toBe(true);
  });

  it("passes the selected language through to the renderer on generate", async () => {
    document.getElementById("before-input").value = "def greet(): pass";
    document.getElementById("after-input").value = "def greet(): return";
    document.getElementById("language-select").value = "python";
    const { api } = await loadMain();

    expect(() => api.generate()).not.toThrow();
    expect(document.getElementById("output-card").dataset.state).toBe("success");
  });

  it("keeps line-number gutters in sync as the user types", async () => {
    await loadMain();
    const before = document.getElementById("before-input");
    const gutter = document.querySelector('[data-gutter="before"]');

    before.value = "one\ntwo\nthree";
    before.dispatchEvent(new Event("input"));

    expect(gutter.textContent).toBe("1\n2\n3");
  });

  it("mirrors the gutter's scroll position to the textarea's", async () => {
    await loadMain();
    const before = document.getElementById("before-input");
    const gutter = document.querySelector('[data-gutter="before"]');

    before.scrollTop = 42;
    before.dispatchEvent(new Event("scroll"));

    expect(gutter.scrollTop).toBe(42);
  });

  it("triggers a download with a timestamped filename on download click", async () => {
    document.getElementById("before-input").value = "const x = 1;";
    document.getElementById("after-input").value = "const x = 2;";
    const { api } = await loadMain();
    api.generate();

    let downloadedName = null;
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = (tag) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        el.click = () => {
          downloadedName = el.download;
        };
      }
      return el;
    };

    await api.download();

    expect(downloadedName).toMatch(/^diff-poster-\d{8}-\d{6}\.png$/);
    expect(document.getElementById("output-status").textContent).toMatch(/download/i);

    document.createElement = originalCreateElement;
  });

  it("disables copy with a visible explanation when the Clipboard API is unavailable", async () => {
    await loadMain();
    const copyBtn = document.getElementById("copy-btn");

    expect(copyBtn.disabled).toBe(true);
    expect(copyBtn.textContent.length).toBeGreaterThan(0);
    expect(copyBtn.title.length).toBeGreaterThan(0);
  });

  it("copies the rendered image via the Clipboard API when supported", async () => {
    let writtenItems = null;
    stubClipboardApis({
      write: async (items) => {
        writtenItems = items;
      },
    });
    document.getElementById("before-input").value = "const x = 1;";
    document.getElementById("after-input").value = "const x = 2;";
    const { api } = await loadMain();
    api.generate();

    expect(document.getElementById("copy-btn").disabled).toBe(false);

    await api.copyImage();

    expect(writtenItems).not.toBeNull();
    expect(document.getElementById("output-status").textContent).toMatch(/copied/i);
  });

  it("shows a designed error status when the download blob export fails", async () => {
    document.getElementById("before-input").value = "const x = 1;";
    document.getElementById("after-input").value = "const x = 2;";
    const { api } = await loadMain();
    api.generate();

    HTMLCanvasElement.prototype.toBlob = function toBlob(callback) {
      callback(null);
    };

    await api.download();

    expect(document.getElementById("output-status").textContent).toMatch(/couldn't download/i);
  });

  it("shows a designed error status when the clipboard write rejects", async () => {
    stubClipboardApis({
      write: async () => {
        throw new Error("clipboard denied");
      },
    });
    document.getElementById("before-input").value = "const x = 1;";
    document.getElementById("after-input").value = "const x = 2;";
    const { api } = await loadMain();
    api.generate();

    await api.copyImage();

    expect(document.getElementById("output-status").textContent).toMatch(/couldn't copy/i);
  });
});
