# Backlog

Epic/story breakdown for v1. Every story has verifiable acceptance criteria. The
first story of Epic 1 is the wow moment — it must be reachable before anything else.

## Epic 1 — Paste, diff, image (the wow moment)

- [x] **Paste before/after, get a rendered diff image.** Two textareas (before/after)
  and a generate action produce a single canvas-rendered image showing a token-level
  diff, styled per `docs/DESIGN.md`.
  - Pasting two differing snippets and clicking "Generate" renders an image within
    the same page (no navigation, no loading spinner longer than a frame or two).
  - The rendered image highlights only the changed tokens (e.g. changing `1` to `2`
    in `const x = 1;` highlights just `1`/`2`, not the whole line).
  - Pasting identical before/after text renders an image with zero highlighted
    tokens and a visible "no changes" indicator rather than a blank/broken image.

- [x] **Token-level diff correctness.** The diff engine correctly classifies
  equal/added/removed tokens across realistic code edits (renames, reordering,
  multi-line changes), not just single-word substitutions.
  - A renamed identifier used twice highlights both occurrences, not the whole
    surrounding line.
  - A multi-line before/after (3+ lines each) diffs correctly line-by-line without
    tokens bleeding across line boundaries in the rendered output.
  - Unit tests cover: no-op diff, single-token change, insertion, deletion, and a
    multi-line change, all green in CI.

- [x] **Editor-style syntax highlighting in the output.** The rendered image looks
  like a screenshot from a real editor (monospace font, syntax colors for at least
  JS/Python-shaped code, subtle line numbers, rounded window chrome) rather than
  flat black-on-white text.
  - Keywords, strings, and comments render in visibly distinct colors in the output
    image for a JS snippet.
  - The output card includes a window-chrome treatment (rounded corners + subtle
    title bar or inset) consistent with `docs/DESIGN.md`.

- [x] **Social-sized output by default.** The generated image defaults to a
  tweet/Slack-friendly aspect ratio and resolution without any size configuration
  required from the user.
  - The default exported PNG's pixel dimensions match the documented social-share
    target (checked by a test asserting canvas width/height).
  - Long snippets that exceed the default height either scroll within a fixed frame
    or scale down, but never silently crop content without indication.

- [x] **Design polish — landing/app shell.** The app matches `docs/DESIGN.md`'s
  paper-and-ink direction: real tokens, both fonts loaded, themed input panes and
  buttons, and the ink-blot reveal on generate.
  - At 1440px and 390px widths the layout matches the composition described in
    `docs/DESIGN.md` (no horizontal scroll, no dead empty margins).
  - Every interactive control (textareas, generate button, copy/download buttons)
    has a visibly distinct hover, focus-visible, and active state.

## Epic 2 — Export and share

- [x] **Copy image to clipboard.** One click copies the generated PNG to the system
  clipboard via the Clipboard API, no intermediate dialog.
  - Clicking "Copy image" after a successful generate populates the clipboard with a
    `image/png` blob (verified via a Clipboard API mock in tests).
  - If the Clipboard API is unavailable (unsupported browser/context), the button is
    replaced or disabled with a visible explanation rather than failing silently.

- [x] **Download as PNG.** One click downloads the generated image as a `.png` file
  with a sensible default filename.
  - Clicking "Download" triggers a file download named like
    `diff-poster-YYYYMMDD-HHMMSS.png` (or similar deterministic pattern).
  - The downloaded file's pixel dimensions match what was rendered on screen.

- [x] **Shareable "no server" guarantee is visible.** The UI communicates that
  nothing is uploaded or stored, reinforcing the no-login/no-backend value prop.
  - The page includes a visible, non-buried statement that processing happens
    entirely in the browser and nothing is sent to a server.
  - No network request is made to any first-party backend when generating an image
    (verified by inspecting network calls in a manual or automated check).

- [x] **Design polish — output card states.** The output card has a designed empty
  state (before first generate), a designed error state (e.g. one input empty), and
  the success state with copy/download actions — none of them a blank box.
  - Loading the app fresh shows a designed empty-state placeholder in the output
    card, not a blank canvas or missing element.
  - Submitting with one pane empty shows an inline, designed validation message
    instead of a crash or silent no-op.

## Epic 3 — Language awareness and robustness

- [x] **Language selector for syntax highlighting.** A dropdown lets the user pick
  the snippet's language (JS, Python, and a plain-text fallback at minimum),
  affecting keyword/string/comment coloring in the output.
  - Selecting "Python" and pasting Python code highlights Python keywords (e.g.
    `def`, `import`) distinctly from a JS selection on the same textual keywords.
  - The plain-text fallback still renders a correct token-level diff with no syntax
    coloring, never a crash, for languages not explicitly supported.

- [x] **Large/pathological input handling.** The app stays responsive and gives
  clear feedback when pasted input is unusually large or malformed.
  - Pasting a snippet far beyond the intended "function-sized" use case (e.g.
    several thousand lines) shows a visible size-limit message instead of freezing
    the tab.
  - Pasting binary-looking or non-UTF-8-safe garbled text does not throw an
    unhandled exception; the app shows a graceful inline error.

- [ ] **Keyboard and accessibility pass.** The full paste-to-download flow is usable
  by keyboard alone and announces state changes to assistive tech.
  - Tab order moves logically through before-pane → after-pane → generate →
    copy/download without keyboard traps.
  - The output region uses an ARIA live region so "generated" / "copied" /
    "downloaded" states are announced, not just visually shown.

- [ ] **Design polish — responsive and motion-reduced pass.** The app is verified at
  768px in addition to 1440/390, and respects `prefers-reduced-motion`.
  - At 768px width the two-column desktop layout gracefully reflows without
    overlapping elements or clipped text.
  - With `prefers-reduced-motion` enabled, the ink-blot reveal is replaced by a plain
    fade (functionally identical, no motion).
