# deck-engine

A small, dependency-free HTML slide engine for course decks.

**Status: specification stage.** The engine is being written clean-room from
[`SPEC.md`](SPEC.md). No implementation is published yet.

## Why

The Human Edge, ERS and Copilot in Practice decks need the same handful of
things: chapter navigation, incremental reveals, speaker notes, a presenter
window and an exercise timer, on a fixed 16:9 canvas. reveal.js does much more
than that. This engine is deliberately smaller and has no build step.

## Clean-room rewrite

The engine used by the course decks was adapted from Dylan Davis's
AI-Foundations deck, which has no licence file. Permission was requested on
2026-10-31. This repository contains a specification for an independent
implementation, not the prior code. See [`NOTICE.md`](NOTICE.md) and section 2
of [`SPEC.md`](SPEC.md).

## Use the spec

1. Read [`SPEC.md`](SPEC.md).
2. Run [`IMPLEMENTER-PROMPT.md`](IMPLEMENTER-PROMPT.md) in a **fresh** session
   that has not seen the prior engine.
3. Test against the acceptance criteria in section 11 of the spec.

## Licence

MIT for the original text and code in this repository. See [`LICENSE`](LICENSE).
