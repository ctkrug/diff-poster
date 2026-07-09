import { diffTokens } from "./diff/diff.js";
import { renderDiffToCanvas } from "./render/canvas.js";

function updateGutter(textarea, gutter) {
  const lineCount = textarea.value.split("\n").length;
  const numbers = [];
  for (let i = 1; i <= lineCount; i++) numbers.push(i);
  gutter.textContent = numbers.join("\n");
}

function syncGutterScroll(textarea, gutter) {
  gutter.scrollTop = textarea.scrollTop;
}

function wirePane(textarea, gutter) {
  updateGutter(textarea, gutter);
  textarea.addEventListener("input", () => updateGutter(textarea, gutter));
  textarea.addEventListener("scroll", () => syncGutterScroll(textarea, gutter));
}

export function mount(root = document) {
  const beforeInput = root.getElementById("before-input");
  const afterInput = root.getElementById("after-input");
  const beforeGutter = root.querySelector('[data-gutter="before"]');
  const afterGutter = root.querySelector('[data-gutter="after"]');
  const generateBtn = root.getElementById("generate-btn");
  const outputCard = root.getElementById("output-card");
  const outputEmpty = root.getElementById("output-empty");
  const outputError = root.getElementById("output-error");
  const outputCanvas = root.getElementById("output-canvas");
  const outputActions = root.getElementById("output-actions");
  const outputStatus = root.getElementById("output-status");

  function setOutputState(state) {
    outputCard.dataset.state = state;
    outputEmpty.hidden = state !== "empty";
    outputError.hidden = state !== "error";
    outputCanvas.hidden = state !== "success";
    outputActions.hidden = state !== "success";
  }

  function showError(message) {
    outputError.textContent = message;
    setOutputState("error");
    outputStatus.textContent = message;
  }

  function setRevealOrigin(event) {
    const rect = outputCard.getBoundingClientRect();
    const revealX = event?.clientX
      ? ((event.clientX - rect.left) / rect.width) * 100
      : 50;
    const revealY = event?.clientY
      ? ((event.clientY - rect.top) / rect.height) * 100
      : 50;
    outputCard.style.setProperty("--reveal-x", `${revealX}%`);
    outputCard.style.setProperty("--reveal-y", `${revealY}%`);
  }

  function generate(event) {
    const before = beforeInput.value;
    const after = afterInput.value;

    if (!before.trim() || !after.trim()) {
      showError("Paste code in both panes to generate a diff.");
      return;
    }

    setRevealOrigin(event);

    const segments = diffTokens(before, after);
    const { hasChanges } = renderDiffToCanvas(outputCanvas, segments);

    setOutputState("success");
    outputStatus.textContent = hasChanges
      ? "Diff generated."
      : "No changes between before and after.";
  }

  wirePane(beforeInput, beforeGutter);
  wirePane(afterInput, afterGutter);
  generateBtn.addEventListener("click", generate);

  return { generate };
}

mount();
