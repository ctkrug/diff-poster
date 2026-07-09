import { beforeEach, describe, expect, it } from "vitest";

// jsdom doesn't implement a real 2D canvas context, so stub just enough of
// it for the render call in main.js to run without throwing.
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

describe("app bootstrap", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    stubCanvasContext();
  });

  it("mounts a canvas into #app on load", async () => {
    await import("../src/main.js");
    const canvas = document.querySelector("#app canvas");
    expect(canvas).not.toBeNull();
  });
});
