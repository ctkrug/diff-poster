/**
 * Whether the runtime can write an image blob to the system clipboard.
 * Checked once at mount so the copy button can be disabled with a visible
 * explanation up front instead of failing silently on click in browsers
 * (or contexts, e.g. non-HTTPS) that lack the Clipboard API.
 */
export function isClipboardImageSupported(target = globalThis) {
  return Boolean(
    target.navigator?.clipboard &&
      typeof target.navigator.clipboard.write === "function" &&
      typeof target.ClipboardItem === "function",
  );
}
