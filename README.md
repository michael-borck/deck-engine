# deck-engine

A small, dependency-free HTML slide engine for courses, keynotes and client
workshops. Markdown in, one HTML file out, with a chapter rail, speaker notes, a
presenter window, an exercise timer and a canvas that scales to any screen.

**Status:** working engine and Markdown authoring front end. The three course
decks are being migrated from their forked copies.

## Why

The decks this replaces (The Human Edge, ERS, Copilot in Practice) shared three
forks of the same engine. Each fork hard-coded its own chapters and drifted:
one had an accessibility fix the others did not. The parts we actually use are
small — chapter navigation, incremental reveals, speaker notes, a presenter
window, a countdown timer and a fixed 16:9 canvas. reveal.js does much more than
that, and Quarto's Markdown-to-reveal path fought us on scaling and styling.

So: one engine, one theme, a per-deck config. No runtime dependencies, no
bundler, no network requests. It opens from `file://` and works on any static
host.

## Two ways to author

1. **Markdown** for content slides. Standard Markdown plus YAML front matter,
   fenced divs for reveals and notes, and raw HTML/SVG when you need it.
   See [`authoring/schema.md`](authoring/schema.md).
2. **HTML** for designed slides. Write the `section.slide` markup directly, as
   the original course decks do.

Both produce the same contract the engine consumes. Markdown is a build-time
front end; the browser only ever sees HTML.

## Quick start

````bash
git clone https://github.com/michael-borck/deck-engine.git
cd deck-engine

# build every example
bash authoring/build_examples.sh
open examples/keynote/deck.html

# or one deck
python3 authoring/build_deck.py examples/keynote/deck.md
````

Requires `pandoc` and `PyYAML` for the Markdown build. The engine itself needs
nothing.

Keys: Right/Space next · Left back · `1..N` chapters · `N` presenter · `M`
notes · `T` timer · `R` reset · `B` blank · `F` fullscreen. `?print` lays out
every slide for PDF export.

## Check

````bash
python3 tests/smoke.py
````

It builds every example, checks the Markdown mapping and the `--public` strip.
The example HTML files are generated and ignored by git; run the build to open
them.

## Demo site

<https://deck-engine.borck.dev>

GitHub Pages builds every example and the landing page on each push to `main`.
The workflow is [`.github/workflows/pages.yml`](.github/workflows/pages.yml):
it installs pandoc, builds the examples, assembles `_site/` and deploys it.

The domain is set by the `CNAME` file. On Cloudflare:

- CNAME `deck-engine` → `michael-borck.github.io`, **DNS only** (grey cloud)
- In GitHub: Settings → Pages → Custom domain, then enable HTTPS

Only `deck.md` and an optional `custom.css` are committed. `deck.html` is
generated and ignored. The landing page is `index.html` at the repo root.

## Repo layout

```text
engine.js                 the engine
engine.css                shell, chrome, orientation, print
theme/tokens.css          colours, type, spacing
theme/components.css      cards, rows, tables, exercises, reveals
authoring/build_deck.py   Markdown -> deck HTML
authoring/schema.md       the source syntax
index.html                landing page for the demo site
examples/
  keynote/                reveal, spotlight, portrait, notes
  workshop/               exercise timer, tables, code
  client-course/          noindex, accents, decision card
  portrait/               portrait by default, no per-slide override
docs/permission/          the licence permission record
```

## Configuration

Set `window.DECK_CONFIG` before `engine.js` (the build does this for you):

````js
window.DECK_CONFIG = {
  chapters: [
    { label: 'JUDGE', time: '9:00', accent: '#E8B54D' },
    { label: 'BRIEF', time: '11:00', accent: '#4FC9A8' }
  ],
  chapterNoun: 'SESSION',
  navNumbers: true,
  stage: { orientation: 'landscape' },
  presenter: { name: 'deck-presenter' }
};
````

Per-slide attributes: `data-ch`, `data-title`, `data-steps`, `data-min`,
`data-mode="spot"`, `data-orientation`, `data-print-step`.

## Landscape and portrait

The canvas is configurable, not forked. Set a default in `stage.orientation`
and override individual slides with `data-orientation="portrait"`. The stage
resizes and re-fits, and the chapter rail moves from the left edge to the bottom.
Print uses CSS named pages so mixed decks paginate at the right size in Chrome
and Edge.

## Use in a course repo

Vendor a pinned copy into the course:

````bash
git subtree add --prefix deck/engine https://github.com/michael-borck/deck-engine.git main --squash
````

Then build the deck and let the existing site script copy it to `docs/deck/`.
Keep the engine out of the course content: one pinned version, updated
deliberately.

## Credits

- **Dylan Davis** wrote the original engine this is adapted from:
  <https://github.com/D-Squared70/AI-Foundations>. He gave permission to keep
  using and adapting it; the exchange is recorded in
  [`NOTICE.md`](NOTICE.md) and [`docs/permission/`](docs/permission/).
- The default visual language follows the "Broken Ladder" deck named in the
  original course stylesheet.
- Fonts named in the theme — Domine, Funnel Sans and Nanum Gothic Coding — are
  SIL Open Font Licence. They are not bundled; use the fallback stacks or add
  local files.

The clean-room [`SPEC.md`](SPEC.md) is kept for reference. It was written before
permission arrived; the engine is now adapted with attribution instead of
rewritten from scratch.

## Licence

MIT, copyright 2026 Michael Borck. The original engine remains Dylan Davis's
work, used with permission. See [`LICENSE`](LICENSE) and [`NOTICE.md`](NOTICE.md).
