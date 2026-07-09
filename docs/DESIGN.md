# Design

## Aesthetic direction

**Paper-and-ink.** Diff Poster reads like a well-typeset technical broadsheet: warm
cream paper, dense ink-black text, a fountain-pen-red mark for what changed. It's
deliberately *not* another dark terminal/CRT dev-tool skin — the point is that the
generated image should look like it belongs on a printed page or in a design annual,
not in a code editor. Warm and legible over moody and glowing.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f3ede1` | page background (warm, slightly aged paper) |
| `--surface-1` | `#fbf8f1` | panes, cards (lighter paper) |
| `--surface-2` | `#e7ded0` | recessed areas, input chrome, dividers |
| `--ink` | `#241f18` | primary text |
| `--ink-muted` | `#6b6154` | secondary text, captions, placeholders |
| `--accent-add` | `#b3541e` | added tokens (burnt terracotta, not stock green) |
| `--accent-remove` | `#4d5b6b` | removed tokens (muted slate-ink, not stock red) |
| `--accent-action` | `#8a1c1c` | primary buttons, links (fountain-pen red) |
| `--success` | `#3f6b3f` | copy/download confirmation |
| `--danger` | `#8a1c1c` | error state (shares the ink-red family) |

- **Display font:** "Fraunces" (Google Fonts) — a warm, ink-trap serif for the
  wordmark and headings. Fallback: `Georgia, "Times New Roman", serif`.
- **UI/code font:** "JetBrains Mono" (Google Fonts) — for the input panes, the
  rendered diff image, and any UI label that echoes code. Fallback:
  `ui-monospace, "SF Mono", Consolas, monospace`.
- **Spacing unit:** 8px scale (8/16/24/32/48/64).
- **Corner radius:** 6px on panes/buttons — soft, not pill-shaped; paper has a trimmed
  edge, not a rounded one.
- **Shadow:** a single soft, warm-toned drop shadow (`0 4px 16px rgba(36,31,24,0.12)`)
  under raised elements (the generated-image card, dropdowns) — no glow, no neon.
- **Motion:** UI transitions 150–200ms ease-out; the "generate" action gets a brief
  (400ms) ink-blot reveal on the output card (see signature detail).

## Layout intent

**Desktop (1440×900):** a two-column split fills the viewport — left column stacks the
before/after input panes (each ~45vh, monospace, line-numbered gutter), right column
is the live-rendered output card, sized at roughly its final social-share aspect
ratio, with copy/download actions directly beneath it. The output card is the hero:
it's the thing you screenshot mentally before you even click download, so it gets the
strongest shadow, the most whitespace around it, and is never smaller than ~40% of
the viewport width. No sidebar, no nav chrome above the fold beyond the wordmark and
a one-line tagline.

**Phone (390×844):** single column, stacked top to bottom: wordmark/tagline → before
pane → after pane → language selector + generate button → output card → actions. Panes
collapse to a comfortable ~18vh each (scrollable if the snippet is long) so the output
card is still reachable without excessive scrolling and still reads as the payoff, not
an afterthought.

The language selector (JavaScript / Python / plain text) sits directly above the
generate button, bottom-aligned with it in a themed `<select>` — a custom chevron and
paper-and-ink borders, never the native browser control. It stacks full-width above
the button below 480px instead of squeezing two controls onto one cramped row.

## Signature detail

The generate action isn't instant — the output card reveals via a **160ms ink-blot
wipe** (a radial clip-path expanding from the click point, warm-tinted), like a stamp
pressing onto paper, rather than a plain fade or snap-in. It's the one animated
flourish in an otherwise calm, static page, and it ties directly to the paper-and-ink
direction instead of being decoration for its own sake.

## Design polish scope

Every epic in `docs/BACKLOG.md` that touches user-facing UI includes a "design
polish" story so this direction is executed, not just documented: real tokens, real
type, themed controls, the ink-blot reveal, and a designed empty/loading/error state
for the output card. This file is the source of truth BUILD and QA are held to; a
change to it is a deliberate, own-commit decision, not a side effect of a feature
commit.
