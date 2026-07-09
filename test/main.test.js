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
    <button id="generate-btn" type="button"></button>
    <div id="output-card" data-state="empty">
      <p id="output-empty"></p>
      <p id="output-error" hidden></p>
      <canvas id="output-canvas" hidden></canvas>
    </div>
    <div id="output-actions" hidden></div>
    <p id="output-status"></p>
  `;
}

async function loadMain() {
  vi.resetModules();
  return import("../src/main.js");
}

describe("app bootstrap and generate flow", () => {
  beforeEach(() => {
    renderShell();
    stubCanvasContext();
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

  it("shows the same error state when a pane is only whitespace", async () => {
    document.getElementById("before-input").value = "   \n  ";
    document.getElementById("after-input").value = "const x = 1;";
    await loadMain();

    document.getElementById("generate-btn").click();

    expect(document.getElementById("output-card").dataset.state).toBe("error");
  });

  it("keeps line-number gutters in sync as the user types", async () => {
    await loadMain();
    const before = document.getElementById("before-input");
    const gutter = document.querySelector('[data-gutter="before"]');

    before.value = "one\ntwo\nthree";
    before.dispatchEvent(new Event("input"));

    expect(gutter.textContent).toBe("1\n2\n3");
  });
});
