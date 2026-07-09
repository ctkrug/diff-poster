import { DiffTooLargeError, diffTokens } from "./diff/diff.js";
import { renderDiffToCanvas } from "./render/canvas.js";
import { buildDownloadFilename, canvasToBlob } from "./export/canvasExport.js";
import { isClipboardImageSupported } from "./export/clipboardSupport.js";

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
  const downloadBtn = root.getElementById("download-btn");
  const copyBtn = root.getElementById("copy-btn");

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

    let segments;
    try {
      segments = diffTokens(before, after);
    } catch (err) {
      if (err instanceof DiffTooLargeError) {
        showError("These snippets are too large to diff — try a shorter excerpt.");
        return;
      }
      throw err;
    }

    setRevealOrigin(event);

    const { hasChanges } = renderDiffToCanvas(outputCanvas, segments);

    setOutputState("success");
    outputStatus.textContent = hasChanges
      ? "Diff generated."
      : "No changes between before and after.";
  }

  async function download() {
    try {
      const blob = await canvasToBlob(outputCanvas);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildDownloadFilename();
      link.click();
      URL.revokeObjectURL(url);
      outputStatus.textContent = "Downloaded.";
    } catch {
      outputStatus.textContent = "Couldn't download the image — try again.";
    }
  }

  async function copyImage() {
    try {
      const blob = await canvasToBlob(outputCanvas);
      await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
      outputStatus.textContent = "Copied to clipboard.";
    } catch {
      outputStatus.textContent = "Couldn't copy the image — try downloading instead.";
    }
  }

  if (isClipboardImageSupported()) {
    copyBtn.addEventListener("click", copyImage);
  } else {
    copyBtn.disabled = true;
    copyBtn.textContent = "Copy unavailable";
    copyBtn.title = "Clipboard image copy isn't supported in this browser — use Download instead.";
  }

  wirePane(beforeInput, beforeGutter);
  wirePane(afterInput, afterGutter);
  generateBtn.addEventListener("click", generate);
  downloadBtn.addEventListener("click", download);

  return { generate, download, copyImage };
}

export const api = mount();
