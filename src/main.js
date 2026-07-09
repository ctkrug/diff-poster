import { diffTokens } from "./diff/diff.js";
import { renderDiffToCanvas } from "./render/canvas.js";

const DEMO_BEFORE = "function greet(name) {\n  return 'hi ' + name;\n}";
const DEMO_AFTER = "function greet(name) {\n  return `hello, ${name}!`;\n}";

function mount(root) {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 200;
  root.appendChild(canvas);

  const segments = diffTokens(DEMO_BEFORE, DEMO_AFTER);
  renderDiffToCanvas(canvas, segments);
}

mount(document.getElementById("app"));
