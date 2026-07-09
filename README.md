# Diff Poster

[![CI](https://github.com/ctkrug/diff-poster/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/diff-poster/actions/workflows/ci.yml)

Paste a before/after code snippet, get back a single crisp image of just the diff —
styled like a nice editor, sized for a tweet, no login, no export dialog.

## Why

Sharing a code change on Twitter/Slack usually means a screenshot of a diff view that's
either too cluttered (line numbers, gutter, full file chrome) or too crude (solid
red/green line highlighting that hides exactly which tokens changed). Tools like
Snappify solve a bigger problem — window chrome, themes, gradients, carousels — for
people who need a lot of that. Most of the time you just want: paste old code, paste
new code, get one clean image with token-level highlighting, done.

Diff Poster does the one thing: paste, render, download/copy. No account, no server
round-trip, no saved projects.

## The wow moment

Paste two versions of a function into the two panes and instantly get a properly
highlighted diff image — token-level, not line-level — cropped and sized exactly for
pasting into a tweet or a Slack message.

## Planned features

- Token-level diff highlighting (not whole-line red/green blocks) via a real diffing
  algorithm over lexical tokens, so a renamed variable or a tweaked argument list reads
  clearly instead of the whole line going red.
- Editor-style rendering: syntax highlighting, a monospace type stack, subtle line
  numbers, rounded window chrome — looks like a screenshot from a nice editor, not a
  raw `<pre>` block.
- Output sized for social sharing (tweet/Slack-friendly aspect ratio) by default, with
  the image rendered client-side onto a `<canvas>` and exported as PNG.
- One-click "Copy image" (Clipboard API) and "Download PNG" — no export dialog, no
  intermediate screen.
- No login, no backend, no stored data: everything happens in the browser.

## Stack

Static, client-side JavaScript (no build-time server, no user accounts):

- Vanilla JS + a small, focused diff library for token-level diffing.
- `<canvas>` for rendering the final shareable image.
- Vitest for unit tests (diff logic, tokenizer, layout math).
- Ships as a static site — no server required at runtime.

See [`docs/VISION.md`](docs/VISION.md) for the full design rationale and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## Status

Early scaffold — see the backlog for what's built vs. planned.

## License

MIT — see [`LICENSE`](LICENSE).
