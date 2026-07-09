# Architecture

A static, client-only Vite app. No backend, no build-time codegen, no framework —
plain DOM APIs over a small set of pure modules.

## Data flow

```
before/after textareas
        │  (Generate click)
        ▼
tokenize()          src/diff/tokenize.js   — text → token[] (strings/comments/
                                              newlines atomic, else word/ws/punct)
        ▼
diffTokens()         src/diff/diff.js       — LCS over the two token streams →
                                              flat { type: equal|add|remove, value }[]
        ▼
segmentsToRows()      src/render/layout.js  — split the flat stream into rows at
                                              newline tokens (no cross-line bleed)
fitRows()             src/render/layout.js  — pure sizing: rows + available height →
                                              {fontSize, lineHeight, visibleRowCount,
                                              truncatedCount}
classifyToken()       src/render/highlight.js — token + selected language →
                                              syntax category (keyword/string/
                                              comment/number/identifier/…)
        ▼
renderDiffToCanvas() src/render/canvas.js   — draws the window-chrome card, line
                                              numbers, syntax-colored + diff-
                                              highlighted text, truncation notice,
                                              and "No changes" badge onto <canvas>
        ▼
canvasToBlob()         src/export/canvasExport.js — canvas → Promise<Blob> (image/png)
        │
        ├─ copy   → navigator.clipboard.write([ClipboardItem])
        └─ download → object URL + throwaway <a download> click
```

`src/main.js` is the only module that touches the DOM. `mount()` wires the two
input panes (plus their line-number gutters), the generate button, and the
copy/download buttons to the pipeline above, and manages the output card's
`data-state` (`empty` / `error` / `success`). It exports `api` (the internal
`generate`/`download`/`copyImage` handlers) purely so tests can drive the flow
without simulating DOM events.

## Modules

| Path | Responsibility |
|---|---|
| `src/diff/tokenize.js` | Lexes source text into tokens. Strings, template literals, and line comments are atomic tokens; newlines are always their own token (a clean row-boundary signal for the renderer). |
| `src/diff/diff.js` | Classic LCS diff over two token arrays; returns a flat ordered segment list. |
| `src/render/highlight.js` | Stateless token → syntax-category classifier (merged JS/Python keyword set; no real parser). |
| `src/render/layout.js` | Two pure functions: `segmentsToRows` (row splitting) and `fitRows` (font/line-height/truncation sizing math), kept parser/canvas-free so they're trivially unit-testable. |
| `src/render/constants.js` | `OUTPUT_WIDTH`/`OUTPUT_HEIGHT` — the default 1200×675 social-share frame. |
| `src/render/canvas.js` | Draws everything: DPR-scaled sizing, window chrome, line numbers, syntax+diff coloring, truncation notice, no-changes badge. |
| `src/export/canvasExport.js` | `canvasToBlob` (promise wrapper over `canvas.toBlob`) and `buildDownloadFilename` (`diff-poster-YYYYMMDD-HHMMSS.png`). |
| `src/export/clipboardSupport.js` | `isClipboardImageSupported()` — feature-detects `navigator.clipboard.write` + `window.ClipboardItem` so the UI can disable Copy up front instead of failing on click. |
| `src/main.js` | DOM wiring: panes, gutters, language select, generate/copy/download buttons, output-card state machine. |
| `src/style.css` | Design tokens and component styling per `docs/DESIGN.md` (paper-and-ink direction). |

## Run / test

- `npm run dev` — Vite dev server.
- `npm run build` — static production build (relative `base: "./"` so it works
  from a subpath like `apps.charliekrug.com/diff-poster/`); output in `site/`.
- `npm test` — vitest (jsdom environment); `npm run lint` — eslint.
- `npm run test:e2e` — Playwright, against a real Chromium render at the
  three declared breakpoints (`e2e/`, config in `playwright.config.js`). jsdom
  never computes CSS, so it can't catch an author stylesheet rule beating the
  UA `[hidden]` rule, `:focus-visible` styling, `prefers-reduced-motion`, or
  real layout overflow — that whole class of bug lives here instead. Run
  separately from `npm test`; both run in CI.

## Notable design decisions

- **Canvas, not DOM-to-image.** `renderDiffToCanvas` draws directly rather than
  rasterizing styled DOM, for exact pixel control over the exported image (see
  `docs/VISION.md`).
- **Newline-as-token.** Because `tokenize()` always emits `"\n"` as a standalone
  token, `segmentsToRows` can split a diff segment stream into display rows with
  a single `value === "\n"` check — no special-casing add/remove/equal newlines,
  and no line-boundary bleed.
- **Syntax color is a separate layer from diff highlight.** Each token gets a
  syntax-category text color (`classifyToken`) *and*, independently, an add/remove
  background tint. This is what lets the output look like real syntax-highlighted
  code while still showing exactly what changed.
- **Language selector, not per-language grammars.** `classifyToken` takes an
  optional `language` ("javascript" | "python" | "plaintext") that narrows
  which keyword set applies; omitted, it falls back to a merged JS+Python
  set. "plaintext" disables syntax coloring entirely rather than guessing.
