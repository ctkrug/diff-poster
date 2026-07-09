# Vision

## The problem

Sharing a small code change on Twitter or Slack means either:

- a raw screenshot of your editor's diff view — cluttered with gutters, line numbers,
  minimaps, and whatever theme/window chrome happens to be open, or
- a tool like Snappify or Carbon — beautiful, but built for a bigger job (window
  themes, gradients, carousels, multi-slide decks, saved projects) than "I just want
  to post this one diff."

Either way there's friction between "I made a change I'm proud of" and "here's a clean
picture of it" — an export dialog, a sign-up wall, or a fight with your OS screenshot
tool to crop out the noise.

## Who it's for

Developers who want to share a specific code change — a clever one-liner, a bug fix,
a refactor — as a single image in a tweet, a PR description, or a Slack message. Not
people building a slide deck or a blog post; that's Snappify's job. This is the
"quote-tweet a diff" case: fast, single-shot, disposable.

## The core idea

Two textareas — before, after — a token-level diff engine, and a canvas renderer that
draws the result styled like a nice editor, pre-sized for social sharing. Hit
generate, get an image, copy or download it. That's the whole product surface.

The one non-negotiable technical bet: diffing must happen at the **token** level
(identifiers, operators, literals), not the line level. A line-level diff on
`return 'hi ' + name;` → `` return `hello, ${name}!`; `` just paints the whole line
red/green, which tells the viewer nothing about what actually changed. Token-level
diffing highlights exactly the substitution, which is the entire value proposition
over "screenshot + a filter."

## Key design decisions

- **No backend.** Everything — tokenizing, diffing, rendering, PNG export — happens
  client-side in the browser. No server round-trip means no login, no rate limits, no
  data retention question, and it can be hosted as a static file.
- **Canvas, not DOM-to-image.** Rendering directly to `<canvas>` (rather than styling
  a DOM diff view and rasterizing it with something like `html2canvas`) gives exact
  pixel control over the output dimensions and avoids the font-metrics/layout
  inconsistencies that DOM-to-image libraries are notorious for.
- **LCS-based token diff.** A classic longest-common-subsequence diff over the token
  stream is simple, well-understood, and fast enough for function-sized snippets
  (this is not a tool for diffing whole files). Optimize only if real usage shows the
  short-snippet assumption is wrong.
- **Fixed, social-sized output.** The image is sized for the common share targets
  (tweet / Slack) by default rather than exposing a general "arbitrary canvas size"
  configuration surface — the opinionated default *is* the product.
- **No accounts, no persistence.** Nothing is saved server-side. If you want to keep a
  diff image, you download it, the same way you'd save any other file.

## What "v1 done" looks like

- Two input panes (before/after) with syntax-aware token highlighting in the diff
  output — not solid line blocks.
- One generate action producing a canvas-rendered image sized for social sharing.
- Copy-to-clipboard and download-as-PNG, both one click, no intermediate dialog.
- Looks like a deliberately designed product (see `docs/DESIGN.md`), not a raw
  `<textarea>` + `<pre>` demo.
- Runs entirely as a static site with no server dependency, deployable to
  `apps.charliekrug.com/diff-poster`.
