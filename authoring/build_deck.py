#!/usr/bin/env python3
"""Build a deck HTML file from Markdown.

    python3 authoring/build_deck.py examples/keynote/deck.md
    python3 authoring/build_deck.py deck.md -o dist/deck.html --public

The Markdown is parsed by pandoc, so the source stays standard Markdown with
YAML front matter, fenced divs and raw HTML for designed slides. The output is
the same HTML contract the engine consumes: one <section class="slide"> per
slide, data-* attributes, and speaker notes in <aside class="notes">.

Requires: pandoc and PyYAML.
"""
from __future__ import annotations

import argparse
import html
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    sys.exit("build_deck.py needs PyYAML: python3 -m pip install pyyaml")

ROOT = Path(__file__).resolve().parent.parent

META_ATTRS = {
    "ch": "data-ch",
    "title": "data-title",
    "steps": "data-steps",
    "min": "data-min",
    "mode": "data-mode",
    "orientation": "data-orientation",
    "print-step": "data-print-step",
    "private": "data-private",
}

PANDOC_FROM = "markdown+fenced_divs+pipe_tables+footnotes+task_lists"

def fail(msg: str) -> None:
    sys.exit(f"build_deck: {msg}")

def split_front_matter(text: str) -> tuple[dict, str]:
    if text.startswith("---"):
        m = re.match(r"^---[ \t]*\n(.*?)\n---[ \t]*\n", text, re.S)
        if m:
            try:
                meta = yaml.safe_load(m.group(1)) or {}
            except yaml.YAMLError as exc:
                fail(f"bad YAML front matter: {exc}")
            if not isinstance(meta, dict):
                fail("front matter must be a YAML mapping")
            return meta, text[m.end():]
    return {}, text

def split_slides(body: str) -> list[str]:
    parts = re.split(r"(?m)^---[ \t]*$\n?", body)
    return [p for p in parts if p.strip()]

def parse_meta(chunk: str) -> tuple[dict, str]:
    """Read a leading <!-- key=value | key=value --> comment, if present."""
    m = re.match(r"^\s*<!--(.*?)-->\s*", chunk, re.S)
    if not m:
        return {}, chunk
    meta: dict[str, str] = {}
    for part in re.split(r"[|\n]", m.group(1)):
        part = part.strip()
        if not part or part.lower() == "slide":
            continue
        if "=" in part:
            key, value = part.split("=", 1)
        elif ":" in part:
            key, value = part.split(":", 1)
        else:
            continue
        key = key.strip().lower()
        if key:
            meta[key] = value.strip()
    if not meta:
        return {}, chunk
    return meta, chunk[m.end():]

def first_heading_is_title(out: str) -> str:
    """Mark the first h1/h2 as .t, and the paragraph after it as .sub."""
    m = re.search(r"<h([12])([^>]*)>(.*?)</h\1>", out, re.S)
    if not m:
        return out
    attrs = m.group(2)
    if 'class="' in attrs:
        attrs = attrs.replace('class="', 'class="t ', 1)
    else:
        attrs += ' class="t"'
    head = f"<h{m.group(1)}{attrs}>{m.group(3)}</h{m.group(1)}>"
    rest = out[m.end():]
    p = re.match(r'(\s*)<p([^>]*)>', rest)
    if p and "class=" not in p.group(2):
        rest = rest[: p.start(2)] + p.group(2) + ' class="sub"' + rest[p.end(2):]
    return out[: m.start()] + head + rest

def wrap_body(out: str) -> str:
    """Wrap the content after the title/subtitle in .b, leaving notes outside."""
    notes_at = out.find('<aside class="notes">')
    main = out if notes_at < 0 else out[:notes_at]
    notes = "" if notes_at < 0 else out[notes_at:]

    sub = re.search(r'<p class="sub">.*?</p>', main, re.S)
    if sub:
        start = sub.end()
    else:
        head = re.search(r"</h[12]>", main)
        if not head:
            return out
        start = head.end()

    body = main[start:].strip()
    if not body or body.startswith('<div class="b">'):
        return out
    return main[:start] + '\n<div class="b">\n' + body + '\n</div>\n' + notes

def md_to_html(md: str) -> str:
    proc = subprocess.run(
        ["pandoc", "-f", PANDOC_FROM, "-t", "html5", "--wrap=none", "--no-highlight"],
        input=md,
        text=True,
        capture_output=True,
    )
    if proc.returncode:
        fail(proc.stderr.strip() or "pandoc failed")
    out = proc.stdout
    out = re.sub(r'\s+(?:data-)?reveal="(\d+)"', r' data-s="\1"', out)
    out = re.sub(r'\s+(?:data-)?step="(\d+)"', r' data-s="\1"', out)
    out = re.sub(r'<div class="notes">(.*?)</div>', r'<aside class="notes">\1</aside>', out, flags=re.S)
    return wrap_body(first_heading_is_title(out.strip()))

def esc(value: str) -> str:
    return html.escape(str(value), quote=True)

def section_html(index: int, meta: dict, content: str) -> tuple[str, int]:
    classes = "slide"
    if meta.get("class"):
        classes += " " + meta["class"].strip()
    attrs = []
    for key, value in meta.items():
        if key == "class":
            continue
        if key == "id":
            attrs.append(f'id="{esc(value)}"')
            continue
        name = META_ATTRS.get(key)
        if not name and key.startswith("data-"):
            name = key
        if name:
            attrs.append(f'{name}="{esc(value)}"')
    attr_text = (" " + " ".join(attrs)) if attrs else ""
    return f'<section class="{esc(classes)}"{attr_text}>\n{content}\n</section>', index

def build(source: Path, out: Path, public: bool) -> None:
    if not shutil.which("pandoc"):
        fail("pandoc is not installed (or not on PATH)")

    text = source.read_text(encoding="utf-8")
    front, body = split_front_matter(text)
    lang = front.pop("lang", "en")
    title = front.pop("title", source.stem)
    noindex = bool(front.pop("noindex", False) or front.get("private") is True)
    extra_css = front.pop("css", [])
    if isinstance(extra_css, str):
        extra_css = [extra_css]

    chunks = split_slides(body)
    if not chunks:
        fail("no slides found (separate slides with a line containing ---)")

    sections = []
    ids: list[str] = []
    warnings: list[str] = []
    for n, chunk in enumerate(chunks, 1):
        meta, md = parse_meta(chunk)
        content = md_to_html(md)
        if not content:
            warnings.append(f"slide {n} is empty")
        section, _ = section_html(n, meta, content)
        sections.append(section)
        if "id" in meta:
            ids.append(meta["id"])
        if "ch" in meta and front.get("chapters"):
            try:
                ch = int(meta["ch"])
                if ch < 0 or ch >= len(front["chapters"]):
                    warnings.append(f"slide {n}: data-ch={ch} has no matching chapter")
            except ValueError:
                warnings.append(f"slide {n}: data-ch is not a number")

    dupes = {x for x in ids if ids.count(x) > 1}
    for d in dupes:
        warnings.append(f"duplicate slide id: {d}")

    base = os.path.relpath(ROOT, out.parent).replace(os.sep, "/")
    base = "" if base == "." else base + "/"

    css = [f"{base}engine.css", f"{base}theme/tokens.css", f"{base}theme/components.css"]
    for name in extra_css:
        css.append(str(name))
    for name in ("fonts.css", "custom.css"):
        if (source.parent / name).exists():
            css.append(name)
    css_links = "\n".join(f'<link rel="stylesheet" href="{esc(href)}">' for href in css)

    robots = '\n<meta name="robots" content="noindex, nofollow">' if noindex else ""
    config = {
        key: value
        for key, value in front.items()
        if key in ("chapters", "chapterNoun", "navNumbers", "stage", "presenter")
    }

    document = f"""<!DOCTYPE html>
<html lang="{esc(lang)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">{robots}
<title>{esc(title)}</title>
{css_links}
</head>
<body>
<div id="viewport"><div id="stage">
<div id="halo"></div>
<div id="counter"><b id="cn">1</b> / <span id="ct"></span></div>
<div id="timer"></div>
<div id="nav"></div>
<div id="blank"></div>

{chr(10).join(sections)}
</div></div>
<script>window.DECK_CONFIG = {json.dumps(config, ensure_ascii=False)};</script>
<script src="{esc(base)}engine.js"></script>
</body>
</html>
"""

    if public:
        document = re.sub(r'\s*<aside class="notes">.*?</aside>', "", document, flags=re.S)
        document = re.sub(
            r'\s*<section[^>]*data-private="true"[^>]*>.*?</section>', "", document, flags=re.S
        )

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(document, encoding="utf-8")

    print(f"built {out} ({len(sections)} slides)")
    if public:
        print("  public copy: speaker notes and data-private slides removed")
    for warning in warnings:
        print(f"  warning: {warning}", file=sys.stderr)

def main() -> None:
    parser = argparse.ArgumentParser(description="Build a deck HTML file from Markdown.")
    parser.add_argument("source", type=Path, help="Markdown deck (deck.md)")
    parser.add_argument("-o", "--out", type=Path, help="output HTML (default: next to source)")
    parser.add_argument("--public", action="store_true", help="remove speaker notes and private slides")
    args = parser.parse_args()

    source = args.source.resolve()
    if not source.exists():
        fail(f"no such file: {source}")
    out = args.out or source.with_suffix(".html")
    build(source, out.resolve(), args.public)

if __name__ == "__main__":
    main()
