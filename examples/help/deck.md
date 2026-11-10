---
title: This Deck Is the Manual
lang: en-AU
chapterNoun: PART
navNumbers: true
stage:
  orientation: landscape
chapters:
  - { label: START, time: "0:00", accent: "#E8B54D" }
  - { label: KEYS, time: "0:30", accent: "#4FC9A8" }
  - { label: EXTRAS, time: "1:30", accent: "#7FA8F0" }
---

<!-- ch=0 | title=Title | class=title -->
# This deck is the manual.

Press the keys as you read. Nothing here is a screenshot.

::: {.foot}
**Start here:** <kbd>→</kbd> to move. <kbd>N</kbd> opens the presenter.
<kbd>M</kbd> shows notes on this screen.
:::

::: notes
Welcome. This deck teaches itself. Press N now and you will see these notes in
the presenter window. Press M to show them on this screen instead.
:::

---

<!-- ch=0 | title=Move | steps=2 -->
::: {.k}
Move
:::

## Four ways through.

::: {.row .c2}
::: {.card .st reveal=1}
::: {.lab}
Next and back
:::

<kbd>→</kbd> <kbd>Space</kbd> <kbd>PageDown</kbd> forward.
<kbd>←</kbd> <kbd>PageUp</kbd> back.
:::

::: {.card .hi .st reveal=2}
::: {.lab .a}
Jump
:::

<kbd>Home</kbd> first. <kbd>End</kbd> last. <kbd>1</kbd>–<kbd>3</kbd> chapter.
:::
:::

::: {.foot}
**Try it now.** Press <kbd>→</kbd> to reveal the second card, then <kbd>→</kbd>
again to move on.
:::

::: notes
Every reveal is a step. Forward reveals the next element; forward again moves to
the next slide. Back does the reverse. The URL hash tracks the slide, so you can
share a link to slide 6 with #6.
:::

---

<!-- ch=1 | title=The second window | mode=spot | steps=3 -->
::: {.k}
Presenter
:::

## The second window.

Press <kbd>N</kbd> to open it.

::: {.row .c3}
::: {.card .st reveal=1}
::: {.lab}
Notes
:::

The full speaker notes, not the slide.
:::

::: {.card .st reveal=2}
::: {.lab}
Next
:::

The next slide title, so you can look ahead.
:::

::: {.card .hi .st reveal=3}
::: {.lab .a}
Clock
:::

Elapsed time, wall clock, and the exercise timer.
:::
:::

::: {.foot}
Press <kbd>N</kbd> now. If pop-ups are blocked, press <kbd>M</kbd> instead.
:::

::: notes
This is the slide to try it on. Press N. The presenter window forwards the arrow
keys, so you can keep navigating while it is focused. Press M to show the same
notes on this screen.
:::

---

<!-- ch=1 | title=Start the clock | class=ex | min=5 | steps=3 -->
::: {.exbar}
<span class="pill">Try it</span><span class="mins">5 MIN · ON THIS SLIDE</span>
:::

## Start the clock.

Press <kbd>T</kbd> to start, pause and resume.

::: {.row .c3}
::: {.card .st reveal=1}
::: {.lab}
Start
:::

<kbd>T</kbd> starts the countdown from the slide's <code>data-min</code>.
:::

::: {.card .st reveal=2}
::: {.lab}
Pause and reset
:::

<kbd>T</kbd> again pauses. <kbd>R</kbd> clears it.
:::

::: {.card .hi .st reveal=3}
::: {.lab .a}
Overrun
:::

At zero it keeps counting with a <b>+</b> and turns red.
:::
:::

::: {.foot}
**Try it.** Press <kbd>T</kbd>. The number appears top right.
:::

::: notes
Five minutes is short on purpose. Press T, then T again to pause, then R to clear.
The timer belongs to the slide that started it, so you can navigate away and
come back.
:::

---

<!-- ch=1 | title=The rehearsal view -->
::: {.k}
Notes
:::

## The rehearsal view.

Press <kbd>M</kbd> to show the notes here.

::: {.card}
The same notes, in a drawer across the bottom of the main screen. Useful when
the presenter window is blocked, or when you are rehearsing alone.
:::

::: {.foot}
Press <kbd>M</kbd> now. Press it again to hide.
:::

::: notes
This copy has notes. A public copy strips them; on that copy M explains why there
are none. That is deliberate.
:::

---

<!-- ch=2 | title=Three more keys | steps=3 -->
::: {.k}
Extras
:::

## Three more keys.

::: {.row .c3}
::: {.card .st reveal=1}
::: {.lab}
B
:::

Blank the screen. <kbd>B</kbd> or <kbd>.</kbd> again to return.
:::

::: {.card .st reveal=2}
::: {.lab}
F
:::

Fullscreen the deck. <kbd>F</kbd> again to leave.
:::

::: {.card .hi .st reveal=3}
::: {.lab .a}
?print
:::

Add <code>?print</code> to the URL for one slide per page, every step revealed.
:::
:::

::: {.foot}
**On the site:** every deck has the same keys. Nothing to install.
:::

::: notes
B is for a blank screen when you want the room to talk. F is fullscreen. ?print
is the PDF path: one slide per page, with all reveals visible.
:::

---

<!-- ch=2 | title=The whole keyboard -->
::: {.k}
Reference
:::

## The whole keyboard.

| Keys | Action |
|:--|:--|
| <kbd>→</kbd> <kbd>Space</kbd> <kbd>PageDown</kbd> <kbd>↓</kbd> | Next |
| <kbd>←</kbd> <kbd>PageUp</kbd> <kbd>↑</kbd> | Back |
| <kbd>Home</kbd> / <kbd>End</kbd> | First / last slide |
| <kbd>1</kbd>–<kbd>9</kbd> | Jump to a chapter |
| <kbd>N</kbd> | Presenter window |
| <kbd>M</kbd> | Notes on this screen |
| <kbd>T</kbd> | Start, pause, resume the timer |
| <kbd>R</kbd> | Reset the timer |
| <kbd>B</kbd> or <kbd>.</kbd> | Blank the screen |
| <kbd>F</kbd> | Fullscreen |
| <kbd>o</kbd> | Rotate this slide |
| <kbd>O</kbd> | Rotate the deck default |

::: notes
The same keys work while the presenter window is focused. The chapter number is
that chapter's position, not the slide number.
:::

---

<!-- ch=2 | title=Landscape or portrait -->
::: {.k}
Format
:::

## Landscape or portrait. *One source.*

::: {.row .c2}
::: {.card}
::: {.lab}
Set it once
:::

<code>stage.orientation</code> in the front matter sets the deck default.
:::

::: {.card .hi}
::: {.lab .a}
Override one slide
:::

<code>orientation=portrait</code> in that slide's metadata.
:::
:::

::: {.foot}
**Try it.** <kbd>o</kbd> rotates this slide; <kbd>O</kbd> flips the deck default.
This deck is pure landscape. The portrait example is on the site.
:::

::: notes
Portrait moves the chapter rail to the bottom and re-fits the type. The engine is
the same; only the canvas changes. Lowercase o is a live override for the current
slide. Uppercase O flips the deck default but keeps any orientation a slide was
authored with. On a phone, rotating the device is usually the better answer; the
key is for testing a layout or flipping one dense slide.
:::

---

<!-- ch=2 | title=Close | class=title -->
# That is the whole engine.

A chapter rail, notes, a presenter, a timer, print, and a canvas that scales.

::: {.foot}
Read <code>authoring/schema.md</code>, or open the other examples.
:::

::: notes
Close by opening the keynote and the portrait deck. Point out that both come from
the same Markdown and the same engine.
:::
