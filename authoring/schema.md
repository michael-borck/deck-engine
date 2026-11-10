# Authoring a deck

Two ways to make a deck:

- **Markdown** for content slides. Recommended.
- **HTML** for designed slides. Drop to it when you need SVG, a bespoke layout,
  or a precise visual. Both can live in the same deck.

The engine only cares about the final HTML contract. Markdown is a build-time
front end; it never reaches the browser.

## Source file

````markdown
---
title: The Human Edge
lang: en-AU
chapterNoun: SESSION
navNumbers: true
stage:
  orientation: landscape
chapters:
  - { label: JUDGE, time: "9:00", accent: "#E8B54D" }
  - { label: BRIEF, time: "11:00", accent: "#4FC9A8" }
---
````

| Field | Meaning |
|---|---|
| `title` | document title; also used by the browser tab |
| `lang` | language tag, e.g. `en-AU` |
| `chapterNoun` | presenter wording: `SESSION`, `BLOCK`, `PART` |
| `navNumbers` | prefix the chapter rail with `01`, `02` (default `true`) |
| `stage.orientation` | deck default: `landscape` or `portrait` |
| `stage.width` / `stage.height` | optional size for the default orientation |
| `stage.sizes` | optional per-orientation sizes: `{ landscape: {width,height}, portrait: {width,height} }` |
| `presenter.name` | optional popup window name |
| `noindex` | add a `noindex` robots tag (default `false`) |
| `chapters` | required list of `{ label, time, accent }` |

If `chapters` is missing, the engine makes one neutral chapter so the deck still
runs. Legacy `window.DECK_CH` arrays are accepted as a migration shim.

## Slides

Separate slides with a line that contains only `---`:

````markdown
# A title slide

The paragraph after the title becomes the subtitle.

---

## The next slide

Body text.
````

A horizontal rule inside a slide is rare; use `<hr>` if you need one.

### Slide metadata

Put an HTML comment at the top of a slide. It does not render.

````markdown
<!-- ch=0 | title=The gap | steps=3 | class=ex | min=25 | mode=spot | orientation=portrait | print-step=2 | id=s-gap -->
````

| Key | Maps to | Meaning |
|---|---|---|
| `ch` | `data-ch` | chapter index, zero-based |
| `title` | `data-title` | presenter title |
| `steps` | `data-steps` | reveal count; inferred if omitted |
| `min` | `data-min` | exercise timer length in minutes |
| `mode` | `data-mode` | `spot` for spotlight reveal |
| `orientation` | `data-orientation` | `portrait` or `landscape` override |
| `print-step` | `data-print-step` | step shown in print; all if omitted |
| `class` | section class | space-separated extra classes |
| `id` | `id` | stable anchor, useful for custom CSS |
| `private` | `data-private` | removed by a `--public` build |

## Titles and subtitles

- The first `#` or `##` heading in a slide becomes the title (`.t`).
- The first paragraph after it becomes the subtitle (`.sub`).
- Use an eyebrow with a fenced div:

````markdown
::: {.k}
The problem
:::
````

## Speaker notes

````markdown
::: notes
Say this. Then click.

- One cue per line.
- The presenter window shows the same content.
:::
````

`--public` removes every notes block. Never put private information in a slide
you publish; notes are only safe in the source repo.

## Incremental reveals

Add `reveal=N` to any element and `.st` to animate it:

````markdown
::: {.card .hi .st reveal=2}
The second reveal.
:::
````

The adapter turns `reveal=2` into `data-s="2"`. For ordinary reveals, elements
with `data-s <= step` get `.on`. For spotlight slides (`mode=spot`), the current
step gets `.lit` and the rest get `.dimd`.

If you omit `steps`, the engine uses the largest `data-s` on the slide.

## Layout vocabulary

| Class | Use |
|---|---|
| `.row .c2` / `.c3` / `.c4` | equal columns |
| `.card` | bordered content block |
| `.card.hi` | accent-tinted card |
| `.card.dim` | de-emphasised card |
| `.lab` / `.lab.a` | mono label; accent variant |
| `.h` / `.h.lg` | card heading |
| `.p` | body text |
| `.foot` | footer line pinned to the bottom |
| `.q` | quoted prompt or output |
| `.chip` / `.chip.a` | small pill |
| `.src` | source line |

Exercise slides use `class=ex` and `min=N`:

````markdown
::: {.exbar}
<span class="pill">Exercise 1</span><span class="mins">25 MIN · SOLO</span>
:::

::: {.exgrid}
::: {.steps}
1. First step.
2. Second step.
:::

::: {.card .hi}
The task or the debrief.
:::
:::
````

Markdown tables, fenced code, blockquotes, lists and links are styled by the
theme. A table becomes:

````markdown
| Block | What you do | Output |
|---|---|---|
| Open | Pick a task | A brief |
````

## Bespoke slides

Raw HTML and SVG pass through pandoc unchanged. Give the slide an `id` and scope
the CSS:

````markdown
<!-- ch=2 | id=s-matrix | title=The matrix -->
## The matrix

<div class="matrix">
  <div class="cell hi">Strong input</div>
</div>
````

````css
#s-matrix .matrix { display: grid; grid-template-columns: 1fr 1fr; }
````

Keep one-off CSS in `custom.css` next to the deck. Use theme tokens
(`var(--acc)`, `var(--ink)`, `var(--card)`) so bespoke slides follow the chapter
colour and dark theme.

## Orientation

Set the default once in the front matter:

````yaml
stage:
  orientation: portrait
````

Override a single slide:

````markdown
<!-- ch=2 | orientation=landscape -->
````

The stage resizes and re-fits on every slide change. In portrait, the chapter
rail moves to the bottom. Print uses CSS named pages so a mixed deck paginates
at the right size in Chrome and Edge.

At runtime, `o` flips the current slide and `O` flips the deck default. Authored
per-slide overrides are kept; anything else follows the deck default. The toggle
is a manual override, not a reflow: content written for a wide canvas can
overflow in a narrow one.

## Build

````bash
python3 authoring/build_deck.py examples/keynote/deck.md
python3 authoring/build_deck.py examples/keynote/deck.md --public
python3 authoring/build_deck.py examples/keynote/deck.md -o dist/deck.html
````

- Output defaults to the source name with `.html`.
- `--public` removes speaker notes and `private=true` slides.
- Requires `pandoc` and `PyYAML`.
- The build computes relative paths back to `engine.css`, `theme/` and
  `engine.js`, so the output works from `file://`.

## Print and PDF

Open `deck.html?print` and print to PDF, or use headless Chrome:

````python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    pg = b.new_page(viewport={"width": 1280, "height": 720})
    pg.goto("file:///path/to/deck.html?print")
    pg.wait_for_load_state("networkidle")
    pg.pdf(path="slides.pdf", width="1280px", height="720px", print_background=True)
    b.close()
````

## Limits

- The notes block is converted with a simple rule: one `aside.notes` per slide,
  and do not nest `div` elements inside it.
- The first paragraph after a title becomes `.sub`; start with a fenced div if
  you want it to stay body text.
- Mixed-orientation print relies on named pages, supported in Chrome and Edge.
  Test your other target browsers.
- No runtime dependencies and no network requests. Fonts are not bundled; use
  the fallback stacks or add local font files.
