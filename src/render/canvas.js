import { classifyToken } from "./highlight.js";
import { fitRows, segmentsToRows } from "./layout.js";
import { OUTPUT_HEIGHT, OUTPUT_WIDTH } from "./constants.js";

const COLORS = {
  bg: "#f3ede1",
  surface1: "#fbf8f1",
  surface2: "#e7ded0",
  ink: "#241f18",
  inkMuted: "#6b6154",
  accentAdd: "#b3541e",
  accentRemove: "#4d5b6b",
  accentAction: "#8a1c1c",
  success: "#3f6b3f",
  addBg: "rgba(179, 84, 30, 0.18)",
  removeBg: "rgba(77, 91, 107, 0.16)",
};

const SYNTAX_COLORS = {
  keyword: COLORS.accentAction,
  string: COLORS.success,
  comment: COLORS.inkMuted,
  number: COLORS.accentAdd,
  identifier: COLORS.ink,
  punctuation: COLORS.ink,
  whitespace: COLORS.ink,
  newline: COLORS.ink,
};

const FONT_STACK = '"JetBrains Mono", ui-monospace, "SF Mono", Consolas, monospace';

const MARGIN = 16;
const TITLE_BAR_HEIGHT = 40;
const CONTENT_PADDING = 20;
const GUTTER_WIDTH = 44;
const CHAR_WIDTH_RATIO = 0.62; // monospace glyph advance as a fraction of font size

/**
 * Renders a token-diff segment stream onto `canvas` as an editor-style,
 * social-share-sized image: window chrome, line numbers, syntax-colored
 * text with add/remove highlight backgrounds, and a "No changes" badge
 * when the diff is empty. Scales to devicePixelRatio so the exported PNG
 * is crisp on retina displays.
 */
export function renderDiffToCanvas(canvas, segments, options = {}) {
  const width = options.width ?? OUTPUT_WIDTH;
  const height = options.height ?? OUTPUT_HEIGHT;
  const language = options.language;
  const dpr =
    options.devicePixelRatio ??
    (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);
  drawWindowChrome(ctx, width, height);

  const hasChanges = segments.some((segment) => segment.type !== "equal");
  const rows = segmentsToRows(segments);

  const contentTop = MARGIN + TITLE_BAR_HEIGHT + CONTENT_PADDING;
  const bottomEdge = height - MARGIN - CONTENT_PADDING;
  const { fontSize, lineHeight, visibleRowCount, truncatedCount } = fitRows(
    rows.length,
    bottomEdge - contentTop,
  );

  drawRows(ctx, rows, visibleRowCount, {
    fontSize,
    lineHeight,
    top: contentTop,
    left: MARGIN + CONTENT_PADDING + GUTTER_WIDTH,
    gutterRight: MARGIN + CONTENT_PADDING + GUTTER_WIDTH - 12,
    language,
  });

  if (truncatedCount > 0) {
    drawTruncationNotice(
      ctx,
      truncatedCount,
      MARGIN + CONTENT_PADDING + GUTTER_WIDTH,
      contentTop + visibleRowCount * lineHeight,
      fontSize,
    );
  }

  if (!hasChanges) {
    drawNoChangesBadge(ctx, width);
  }

  return { hasChanges, truncatedCount };
}

function drawRows(ctx, rows, visibleRowCount, layout) {
  const { fontSize, lineHeight, top, left, gutterRight, language } = layout;
  const charWidth = fontSize * CHAR_WIDTH_RATIO;
  const lineNumberFont = `${Math.max(10, fontSize - 2)}px ${FONT_STACK}`;
  const codeFont = `${fontSize}px ${FONT_STACK}`;

  ctx.textBaseline = "top";

  for (let i = 0; i < visibleRowCount; i++) {
    const row = rows[i];
    const y = top + i * lineHeight;

    ctx.font = lineNumberFont;
    ctx.fillStyle = COLORS.inkMuted;
    ctx.textAlign = "right";
    ctx.fillText(String(i + 1), gutterRight, y + 2);
    ctx.textAlign = "left";

    ctx.font = codeFont;
    let x = left;
    for (const token of row) {
      const tokenWidth = measureToken(ctx, token.value, charWidth);

      if (token.type === "add") {
        ctx.fillStyle = COLORS.addBg;
        ctx.fillRect(x, y - 1, tokenWidth, lineHeight - 2);
      } else if (token.type === "remove") {
        ctx.fillStyle = COLORS.removeBg;
        ctx.fillRect(x, y - 1, tokenWidth, lineHeight - 2);
      }

      ctx.fillStyle = SYNTAX_COLORS[classifyToken(token.value, language)] ?? COLORS.ink;
      ctx.fillText(token.value, x, y);

      if (token.type === "remove") {
        ctx.strokeStyle = COLORS.accentRemove;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + fontSize / 2 + 1);
        ctx.lineTo(x + tokenWidth, y + fontSize / 2 + 1);
        ctx.stroke();
      }

      x += tokenWidth;
    }
  }
}

function measureToken(ctx, value, fallbackCharWidth) {
  if (typeof ctx.measureText === "function") {
    const measured = ctx.measureText(value).width;
    if (measured) return measured;
  }
  return value.length * fallbackCharWidth;
}

function drawTruncationNotice(ctx, truncatedCount, x, y, fontSize) {
  const label = `… +${truncatedCount} more line${truncatedCount === 1 ? "" : "s"}`;
  ctx.font = `italic ${Math.max(10, fontSize - 2)}px ${FONT_STACK}`;
  ctx.fillStyle = COLORS.inkMuted;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(label, x, y);
}

function drawWindowChrome(ctx, width, height) {
  const cardWidth = width - MARGIN * 2;
  const cardHeight = height - MARGIN * 2;

  ctx.save();
  ctx.shadowColor = "rgba(36, 31, 24, 0.18)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = COLORS.surface1;
  roundRectPath(ctx, MARGIN, MARGIN, cardWidth, cardHeight, 10);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = COLORS.surface2;
  roundRectPath(ctx, MARGIN, MARGIN, cardWidth, TITLE_BAR_HEIGHT, 10);
  ctx.fill();
  ctx.fillRect(MARGIN, MARGIN + TITLE_BAR_HEIGHT - 10, cardWidth, 10);

  const dotColors = [COLORS.accentAction, COLORS.accentAdd, COLORS.success];
  dotColors.forEach((color, index) => {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(MARGIN + 20 + index * 18, MARGIN + TITLE_BAR_HEIGHT / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawNoChangesBadge(ctx, width) {
  const label = "No changes";
  ctx.font = `600 13px ${FONT_STACK}`;
  const textWidth = measureToken(ctx, label, 8);
  const paddingX = 10;
  const badgeWidth = textWidth + paddingX * 2;
  const badgeHeight = 22;
  const x = width - MARGIN - 16 - badgeWidth;
  const y = MARGIN + (TITLE_BAR_HEIGHT - badgeHeight) / 2;

  ctx.fillStyle = "rgba(63, 107, 63, 0.15)";
  roundRectPath(ctx, x, y, badgeWidth, badgeHeight, badgeHeight / 2);
  ctx.fill();

  ctx.fillStyle = COLORS.success;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + paddingX, y + badgeHeight / 2 + 1);
  ctx.textBaseline = "top";
}

function roundRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
