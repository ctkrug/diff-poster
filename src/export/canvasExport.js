/**
 * Wraps canvas.toBlob() in a promise so callers can await a PNG blob
 * instead of threading a callback through. Rejects (rather than hanging)
 * when toBlob is missing or produces no blob, so a caller can show a
 * designed error instead of the flow silently doing nothing.
 */
export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== "function") {
      reject(new Error("Canvas export is not supported in this browser."));
      return;
    }
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas export produced an empty image."));
      }
    }, "image/png");
  });
}

/**
 * Builds a deterministic, sortable download filename from a Date:
 * diff-poster-YYYYMMDD-HHMMSS.png.
 */
export function buildDownloadFilename(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  const datePart = [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("");
  const timePart = [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join("");
  return `diff-poster-${datePart}-${timePart}.png`;
}
