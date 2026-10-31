# Deck Engine — Clean-Room Specification

Status: draft for independent implementation
Version: 0.1
Date: 2026-10-31
Spec author: Michael Borck
Implementation: TBD

## 1. Purpose

Build a small, dependency-free browser slide engine that reproduces the
user-facing behaviour of the decks currently used by the Human Edge, ERS and
Copilot in Practice courses, without reusing the existing engine's code.

The engine is deliberately narrower than reveal.js:

- one HTML file per deck, opened directly in a browser
- fixed 16:9 canvas (1280 × 720) scaled to fit
- chapter/section navigation
- incremental reveals within a slide
- speaker notes
- a separate presenter window
- a per-exercise countdown timer
- print/PDF layout with selected reveal steps

It is not a framework. There are no plugins, no markdown layer, no build step
and no runtime dependencies.

## 2. Clean-room protocol

The implementer must work only from:

- this specification
- the deck HTML and CSS in the three course repositories (markup, content,
  theme)
- the engine's observable behaviour in a browser
- public web platform documentation

The implementer must not read, copy or adapt:

- `the-human-edge/deck/deck.js` or any `docs/deck/deck.js`
- `ers/deck/deck.js` or any copies
- `copilot-in-practice/deck/deck.js` or any copies
- Dylan Davis's `AI-Foundations` or `AI-Foundations-Workshop` source
- any earlier or derived version of this engine

Do not copy code, comments, identifier names, CSS rules, file structure or
comment phrasing from those sources. Implement from the behaviour described
here.

Important: do not implement this from the conversation that produced this
spec. Use a fresh session/agent that receives only this file, the deck HTML and
the test decks. Existing decks may be opened in a browser for black-box
observation, but their JavaScript must not be opened.

Keep a short implementation log:

```
Date | Read | Decision / note
```

At the end, the implementer signs:

```
I wrote this implementation from SPEC.md and the deck markup only.
I did not read or copy the prior engine source.
Name / date:
```

## 3. Deliverables

```
deck-engine/
  SPEC.md                 this file
  deck.js                 the engine
  engine.css              layout and behaviour styles
  theme.example.css       optional sample theme
  deck.config.example.js  documented config example
  demo/
    deck.html             smoke deck covering every feature
  README.md               contract, usage, licence
  tests/                  optional; manual checklist is acceptable
```

Constraints:

- plain ES2018+; no modules required, but an IIFE or ES module is fine
- no build step, no bundler, no npm dependency at runtime
- works from `file://` and from static hosting (GitHub Pages)
- no network requests
- no inline event-handler attributes in generated markup

## 4. HTML contract

A deck provides this shell. IDs are required unless marked optional.

```html
<div id="stage">
  <section class="slide"
           data-ch="0"
           data-title="Opening"
           data-steps="3"
           data-min="5"
           data-mode="spot"
           data-print-step="2">
    <h1 class="t">Slide title</h1>
    <p data-s="1">First reveal</p>
    <p data-s="2">Second reveal</p>
    <aside class="notes">Speaker notes for this slide.</aside>
  </section>
  <!-- more .slide elements -->
</div>

<nav id="nav"></nav>
<span id="cn">1</span><span id="ct">1</span>
<div id="timer"></div>
<div id="blank"></div>
```

Rules:

- `#stage` contains one or more `section.slide`.
- `data-ch`: zero-based chapter index. Missing means chapter 0.
- `data-title` (optional): presenter title. Fallback: text of the first `.t`
  inside the slide, trimmed. If neither exists, empty string.
- `data-steps` (optional): total reveal steps. Fallback: the largest
  `data-s` value among descendants, or 0.
- `[data-s="N"]`: reveal target, N >= 1. Elements may share a step.
- `data-min` (optional): exercise length in minutes. No timer without it.
- `data-mode="spot"` (optional): spotlight reveal semantics (see 7.7).
- `data-print-step` (optional): step to show in print. Default: all steps.
- `aside.notes` (optional): speaker notes, may contain HTML.
- `#nav`, `#cn`, `#ct`, `#timer`, `#blank` are required shell nodes.
- The engine sets the CSS custom property `--acc` on `document.documentElement`
  to the current chapter accent colour.

The engine must not require per-deck edits. All deck-specific values come from
the markup or the config.

## 5. Configuration

Decks provide `window.DECK_CONFIG` before loading `deck.js`:

```js
window.DECK_CONFIG = {
  chapters: [
    { label: 'JUDGE', time: '9:00', accent: '#E8B54D' },
    { label: 'BRIEF', time: '11:00', accent: '#4FC9A8' }
  ],
  chapterNoun: 'SESSION', // presenter wording only
  navNumbers: true        // prefix nav labels with 01, 02, ...
};
```

Rules:

- `chapters` is required. The number of chapters defines the keyboard range
  `1..N` and the nav items.
- If a slide's `data-ch` has no matching chapter, fall back to chapter 0.
- `chapterNoun` defaults to `'SESSION'`.
- `navNumbers` defaults to `true`.
- If `DECK_CONFIG` is absent, create one neutral chapter so the deck still runs.
- Accent is applied only through `--acc`; the engine must not hard-code colours.

The engine should also tolerate a legacy `window.DECK_CH` array of
`{label, time, acc}` objects by mapping it to `DECK_CONFIG.chapters`
(`acc` -> `accent`). This is for migrating the three existing decks; new decks
should use `DECK_CONFIG`.

## 6. State model

- `index`: current slide, 0-based.
- `step`: current reveal step, `minStep(slide)..steps(slide)`.
- `minStep(slide)` is `1` when `data-mode="spot"`, otherwise `0`.
- `steps(slide)` as defined in section 4.
- Timer state, only for the active slide: `remaining` seconds, `running`,
  `lastTick` timestamp.
- Presenter state: popup reference, opened-at timestamp.

Only one slide is current. Only one step is current per slide.

## 7. Behaviour

### 7.1 Boot

1. Read config (section 5).
2. Collect slides in document order.
3. Compute each chapter's first slide index.
4. Build nav items from `chapters`.
5. Set total count in `#ct`.
6. If `location.hash` is `#n` with `1 <= n <= slides.length`, start at
   `n - 1`; otherwise 0. Set `step = minStep(current)`.
7. Render.

### 7.2 Navigation

- Forward: if `step < steps(slide)`, increment step. Otherwise advance one
  slide and set `step = minStep(newSlide)`.
- Back: if `step > minStep(slide)`, decrement step. Otherwise move back one
  slide and set `step = steps(previousSlide)`.
- Never move before the first slide or past the last.
- Jumping to a slide always sets `step = minStep(slide)`.

### 7.3 Keyboard

Ignore when `metaKey`, `ctrlKey` or `altKey` is pressed.

| Key | Action |
| --- | --- |
| Right, Space, PageDown, Down | forward |
| Left, PageUp, Up | back |
| Home | first slide |
| End | last slide |
| 1..N | jump to the first slide of chapter N |
| N | open/focus presenter window |
| M | toggle notes drawer |
| T | start/pause exercise timer |
| R | reset timer |
| B, . | toggle blank overlay |
| F | toggle fullscreen |

Call `preventDefault()` for handled keys. Unhandled keys must not be blocked.
The same handler must work when focus is in the presenter popup.

### 7.4 Touch

Record the first touch X. On touch end, if the horizontal delta is greater than
50 px, left swipe moves forward, right swipe moves back. Do not interfere with
vertical scrolling.

### 7.5 Render

On every state change:

- exactly one slide has class `cur`
- current slide gets `aria-hidden="false"`; all others `aria-hidden="true"`
- set `--acc` from the current chapter's accent
- `#cn` shows `index + 1`
- nav items get `cur` for the active chapter and `done` for earlier chapters
- apply reveal classes for the current step
- update the URL hash with `history.replaceState(null, '', '#' + (index + 1))`
- update timer, presenter and notes drawer

### 7.6 Reveal semantics (normal)

For every `[data-s]` in the current slide:

- if `data-s <= step`, add class `on`
- otherwise remove `on`

No inline styles for reveals; use classes only.

In print mode, treat the print step as the current step, or all steps when
`data-print-step` is absent.

### 7.7 Reveal semantics (spotlight)

When the slide has `data-mode="spot"`:

- the element whose `data-s` equals the current step gets class `lit`
- all other `[data-s]` elements get class `dimd`
- in print with all steps, every element gets `lit` and none gets `dimd`

Initial step for a spotlight slide is 1, not 0.

### 7.8 Notes drawer

- `M` toggles a fixed-position drawer.
- Heading: `<slide number> · <title>` and a hint that `M` hides it.
- Body: innerHTML of the current slide's `aside.notes`.
- If the current slide has no notes but other slides do, show
  "No notes for this slide."
- If the deck has no notes at all, show a message explaining that this copy has
  no speaker notes and pointing to the repo copy.

### 7.9 Presenter window

`N` opens a popup window, reusing the same window name on subsequent presses.
If blocked, show a toast explaining how to allow pop-ups or use `M` instead.

The popup is a self-contained HTML document generated by the engine. It shows:

- slide number / total
- chapter number and label
- slide title
- `STEP x OF y` when the slide has steps
- speaker notes (same fallback as the drawer)
- next slide title, or "End of deck"
- elapsed time since the window opened, with a reset button
- wall clock time
- exercise remaining time, including paused/overrun state

The popup must forward keyboard events to the main deck so navigation works
while it is focused. Updates continue while it is open; stop when it is closed.
If the deck has no notes at all, `N` should show a toast instead of opening an
empty presenter (or open it with the fallback message; either is acceptable,
but document the choice).

### 7.10 Exercise timer

- `T` on a slide with `data-min`: start a countdown of `data-min * 60` seconds.
- `T` again: pause; `T` again: resume.
- `R`: clear and hide.
- The timer is visible while the slide's timer is active or running.
- Format `m:ss`, with a `+` prefix when overrun.
- Indicate paused state (for example a trailing marker) and overrun state
  (for example a class that the theme can style).
- Update at roughly 4 Hz using `Date.now()` deltas; do not drift.
- Moving to another slide does not reset the timer; the timer is tied to the
  slide that started it. `R` is the only reset.

### 7.11 Print

When `location.search` contains `print`:

- add class `print` to `body`
- set `--acc` for every slide from its chapter
- apply either `data-print-step` or all steps to every slide
- do not initialise chrome, keys or the timer
- rely on CSS for one slide per page and for hiding chrome

No PDF generation in JavaScript.

### 7.12 Blank and fullscreen

- `B` or `.` toggles class `on` on `#blank`.
- `F` enters/exits fullscreen on `document.documentElement`.

### 7.13 Fit

Scale `#stage` by:

```
k = min(innerWidth / 1280, innerHeight / 720)
```

Apply `transform: scale(k)` with a centred transform origin. Recalculate on
resize. The stage keeps its 1280 × 720 layout size; the browser scales it.

### 7.14 Toast

A transient message element appended to `body`. Show a message for about 6
seconds, then hide. Only one toast at a time. Used for popup-blocked and
no-notes cases.

### 7.15 Reduced motion

Respect `prefers-reduced-motion` in CSS by disabling slide/reveal transitions.

## 8. Accessibility

- Only the current slide is exposed to assistive technology.
- All interactive presenter controls are real buttons with accessible names.
- Full keyboard operation is possible without a mouse.
- The notes drawer is readable and dismissible from the keyboard.
- Do not rely on colour alone for timer or nav state; pair with text or shape.
- The demo document declares a language.

## 9. Non-goals

Do not add:

- markdown parsing
- plugins or an event bus
- vertical slides
- an overview/thumbnail mode
- slide transitions beyond CSS fade
- automatic PDF generation
- remote control, multi-window sync or analytics
- npm packaging, bundling, TypeScript or a build step
- per-deck forks of the engine

## 10. Compatibility

Current and previous major versions of Chrome, Edge, Firefox and Safari.
Works from `file://` and static hosting. No network access at runtime.

## 11. Acceptance tests

Run the demo deck and each of the three course decks. Verify:

1. Deck boots with no console errors.
2. Forward and back cross step boundaries correctly in both directions.
3. `#12` opens slide 12; the hash updates while navigating.
4. `1..N` jumps to the first slide of the matching chapter.
5. Spotlight mode shows only the current step as `lit`.
6. Normal reveals accumulate and can be stepped back.
7. `?print` lays out all slides; `data-print-step` is honoured.
8. Presenter opens, shows correct title, notes, step, next slide and timers.
9. Presenter is blocked gracefully when pop-ups are disabled.
10. Timer starts, pauses, resumes, resets and shows overrun.
11. `M` drawer shows notes and the correct fallback messages.
12. `B`/`.` blanks and unblanks; `F` toggles fullscreen.
13. Resizing keeps a centred 16:9 letterbox.
14. Slides without notes or without `data-min` do not error.
15. Keyboard works while the presenter window is focused.
16. No network requests in the devtools network panel.
17. No `on*=` attributes are generated.

## 12. Migration of the three decks

The rewrite should replace only the engine, not the course content.

1. Add a `deck.config.js` per course containing its chapters, noun and accent
   colours.
2. Keep the existing slide markup and `data-*` attributes.
3. Replace `deck.js` and `deck.css` with the new engine and theme.
4. Regenerate `docs/deck/` from `deck/` using the existing build script.
5. Add the provenance note and licence to the engine repo; the course repos
   link to it rather than claiming the engine as their own.

## 13. Provenance and licence

The implementation is written from this specification. The implementer owns the
new code and may license it MIT. No code, comments, identifier names or CSS from
the prior engine or from Dylan Davis's decks may be included. Behavioural
compatibility is not a licence to copy expression.

If the prior engine's author grants permission before the rewrite is finished,
record it in `NOTICE` and stop the rewrite if the team prefers to keep the
existing engine.

## 14. Open questions

- Should the config be a separate `deck.config.js` file or an inline script?
  (Recommendation: separate file, one per deck.)
- Should legacy `window.DECK_CH` support ship in v1 or be a temporary shim?
- Should the presenter popup inherit theme colours or stay neutral?
- Is the timer per slide (current behaviour) or per chapter?
- What page size should `@media print` assume: A4 landscape or 16:9?
