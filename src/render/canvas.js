/**
 * Renders diff segments onto a canvas element as plain monospace text.
 * Placeholder scaffold — real editor-style rendering (syntax highlighting,
 * window chrome, social-image sizing) lands in the BUILD phase per
 * docs/DESIGN.md.
 */
export function renderDiffToCanvas(canvas, segments) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "16px monospace";
  ctx.textBaseline = "top";

  const colors = {
    equal: "#ffffff",
    add: "#4ade80",
    remove: "#f87171",
  };

  let x = 8;
  let y = 8;
  for (const segment of segments) {
    ctx.fillStyle = colors[segment.type];
    ctx.fillText(segment.value, x, y);
    x += ctx.measureText(segment.value).width;
    if (x > canvas.width - 16) {
      x = 8;
      y += 20;
    }
  }
}
