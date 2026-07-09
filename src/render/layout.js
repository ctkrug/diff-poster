/**
 * Splits a flat diff-segment stream into rows, breaking at every newline
 * token regardless of that newline's diff type. Because a whole-line
 * replacement backtracks as "remove old line, remove its newline, add new
 * line, add its newline", splitting on the newline token alone naturally
 * puts the removed line and the added line on separate rows without any
 * special-casing - tokens never bleed across a line boundary.
 */
export function segmentsToRows(segments) {
  const rows = [[]];
  for (const segment of segments) {
    if (segment.value === "\n") {
      rows.push([]);
      continue;
    }
    rows[rows.length - 1].push(segment);
  }
  // A trailing newline in the source produces one trailing empty row; drop
  // it so a file ending in "\n" doesn't render a phantom blank last line.
  if (rows.length > 1 && rows[rows.length - 1].length === 0) {
    rows.pop();
  }
  return rows;
}

const DEFAULT_FONT_SIZE = 16;
const DEFAULT_LINE_HEIGHT = 24;
const MIN_FONT_SIZE = 11;
const MIN_LINE_HEIGHT = 17;

/**
 * Computes how to fit `rowCount` rows into `availableHeight` pixels: render
 * at the default size when it fits, shrink proportionally (down to a
 * minimum readable size) when a modest reduction makes it fit, or cap the
 * visible rows at the minimum size and report how many were truncated so
 * the caller can render a "+N more lines" indicator instead of silently
 * cropping content.
 */
export function fitRows(rowCount, availableHeight) {
  if (rowCount <= 0) {
    return {
      fontSize: DEFAULT_FONT_SIZE,
      lineHeight: DEFAULT_LINE_HEIGHT,
      visibleRowCount: 0,
      truncatedCount: 0,
    };
  }

  const maxAtDefault = Math.floor(availableHeight / DEFAULT_LINE_HEIGHT);
  if (rowCount <= maxAtDefault) {
    return {
      fontSize: DEFAULT_FONT_SIZE,
      lineHeight: DEFAULT_LINE_HEIGHT,
      visibleRowCount: rowCount,
      truncatedCount: 0,
    };
  }

  const maxAtMin = Math.floor(availableHeight / MIN_LINE_HEIGHT);
  if (rowCount <= maxAtMin) {
    const lineHeight = Math.max(
      MIN_LINE_HEIGHT,
      Math.floor(availableHeight / rowCount),
    );
    const fontSize = Math.round(
      DEFAULT_FONT_SIZE * (lineHeight / DEFAULT_LINE_HEIGHT),
    );
    return { fontSize, lineHeight, visibleRowCount: rowCount, truncatedCount: 0 };
  }

  const visibleRowCount = Math.max(0, maxAtMin - 1);
  return {
    fontSize: MIN_FONT_SIZE,
    lineHeight: MIN_LINE_HEIGHT,
    visibleRowCount,
    truncatedCount: rowCount - visibleRowCount,
  };
}
