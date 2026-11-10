# Implementer prompt

> **Superseded 2026-11-01.** Dylan Davis gave permission to keep using and
> adapting the original engine, so the clean-room rewrite is no longer needed.
> See `NOTICE.md` and `README.md`. This prompt is kept for reference.

Copy the block below into a **fresh** coding session. Do not run it in the
session that wrote `SPEC.md` — that session has seen the prior engine.

---

You are implementing a small, dependency-free HTML slide engine clean-room.

## Read only

- `SPEC.md` in this repository.
- `IMPLEMENTER-PROMPT.md` (this file).
- The slide markup in these files, for the HTML contract and content structure:
  - `/Volumes/Crucial X9/Projects/curtin/exec-ed/the-human-edge/deck/deck.html`
  - `/Volumes/Crucial X9/Projects/curtin/exec-ed/ers/deck/deck.html`
  - `/Volumes/Crucial X9/Projects/curtin/exec-ed/copilot-in-practice/deck/deck.html`

  Read only HTML, SVG and text. Ignore `<style>` blocks, `style="..."` attributes
  and linked CSS. Do not copy styling.

- Public web-platform documentation if needed.

## Do not read, open, search or copy

- Any `deck.js` or `docs/deck/deck.js` in the three course repositories.
- Any `deck.css` in those repositories.
- Dylan Davis's `AI-Foundations` or `AI-Foundations-Workshop` source.
- Any prior or derived version of this engine.
- Web search results for the prior engine.

If you have memory of the prior engine from another session, do not use it.
Implement only from `SPEC.md` and the markup contract.

## Task

Work in this repository. Create:

- `deck.js`
- `engine.css`
- `deck.config.example.js`
- `theme.example.css`
- `demo/deck.html` — covers every feature: chapters, normal reveals, spotlight
  mode, notes, timer, print step, blank, fullscreen.
- `USAGE.md` — the HTML and config contract.
- `IMPLEMENTATION-LOG.md`.

Rules:

- No dependencies, no build step, no npm, no TypeScript, no bundler.
- Plain ES2018+ in one file. An IIFE or ES module is fine.
- No network requests. Must work from `file://`.
- No inline `on*=` handlers.
- No code, comments, identifier names or CSS copied from the prior engine.
- If the spec is ambiguous, choose the simplest behaviour consistent with it and
  record the decision in the log.

## Verify

Run every acceptance test in section 11 of `SPEC.md`. Record pass/fail and how
you tested. Fix failures before reporting.

Also verify:

- the demo opens from `file://` with no console errors
- no network requests appear in devtools
- a read-only pass through each of the three course decks (markup only) does not
  error and matches the expected slide count and chapter starts

## Log and sign-off

`IMPLEMENTATION-LOG.md` must contain a table:

```
Date | Read | Decision / note
```

and end with:

```
I wrote this implementation from SPEC.md and the deck markup only.
I did not read or copy the prior engine source.
Name / date:
```

## Report

Reply with: files created, test results, decisions made, anything unresolved.
