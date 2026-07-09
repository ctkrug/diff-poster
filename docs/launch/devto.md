---
title: "Diff Poster: a browser tool that turns a code change into a shareable image"
published: false
tags: javascript, webdev, canvas, showdev
---

I keep wanting to share a small code change: a one-line fix, a renamed variable, a
tidier version of a function. The options are all a bit annoying. A raw editor
screenshot drags in gutters, minimaps, and whatever theme happens to be open. Tools
like Carbon or Snappify look great but are built for a bigger job, with window themes,
gradients, and multi-slide decks. Most of the time I just want to paste old code,
paste new code, and get one clean picture of the difference.

So I built [Diff Poster](https://apps.charliekrug.com/diff-poster/). Two panes, a
Generate button, and out comes a token-level diff drawn like a tidy editor window,
sized 1200x675 for a tweet. It runs entirely in the browser: no login, no backend,
nothing uploaded. Here are the two build decisions that turned out to matter most.

## Token-level, not line-level

A line diff of `return 'hi ' + name;` becoming ``return `hello, ${name}!`;`` just tells
you "line 2 changed." That hides the actual edit. I wanted the reader to see the exact
substitution, so the diff runs over lexical tokens instead of lines.

The tokenizer treats strings, template literals, and line comments as single atomic
tokens, and always emits a newline as its own token. That newline rule paid off more
than I expected. A whole-line replacement backtracks out of the LCS as "remove old
line, remove its newline, add new line, add its newline," so splitting the flat diff
stream into display rows is a single check:

```js
for (const segment of segments) {
  if (segment.value === "\n") { rows.push([]); continue; }
  rows[rows.length - 1].push(segment);
}
```

No special-casing added versus removed newlines, and no tokens bleeding across a line
boundary. The honest tradeoff: inline token diffing is great for a localized edit and
noisy for a full rewrite, because the longest-common-subsequence match scatters shared
tokens around. GitHub's word-diff has the same property. I leaned into the localized
case instead of fighting it.

## Canvas, and the bugs jsdom could not see

I draw the final image straight onto a `<canvas>` rather than styling a DOM diff and
rasterizing it with something like html2canvas. That gives exact control over the
output dimensions and sidesteps the font-metric surprises DOM-to-image libraries are
known for. The canvas also scales to `devicePixelRatio`, so the exported PNG is crisp
on a retina screen.

The interesting part was testing. My jsdom unit tests were green while two real bugs
sat in the page, because jsdom never computes CSS. One: the output action buttons used
`display: flex`, and an author `display` rule always beats the browser's built-in
`[hidden] { display: none }`, so the Copy and Download buttons stayed visible and
clickable before anything was generated. Two: a hardcoded canvas width overflowed its
container on a narrow viewport. Adding a small Playwright suite that runs against real
Chromium at three breakpoints caught both in minutes, and now guards focus rings,
`prefers-reduced-motion`, and layout overflow that unit tests structurally cannot see.

## What I would do differently

The fixed 1200x675 frame is deliberate, but a short two-line diff leaves a lot of empty
space. A future version could offer a "fit to content" height while keeping the social
size as the default. I would also add more language keyword sets; right now it is
JavaScript, Python, and a plain-text fallback that still diffs correctly with no
coloring.

Code and live demo:

- Live: https://apps.charliekrug.com/diff-poster/
- Source: https://github.com/ctkrug/diff-poster

If you try it, I would love to know what breaks on a diff shape I did not think of.
