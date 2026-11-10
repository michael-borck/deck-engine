#!/usr/bin/env python3
"""Smoke-test the Markdown build. No browser, no pytest.

    python3 tests/smoke.py
"""
from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "authoring" / "build_deck.py"


def build(source: Path, out: Path, public: bool = False) -> str:
    cmd = [sys.executable, str(BUILD), str(source), "-o", str(out)]
    if public:
        cmd.append("--public")
    proc = subprocess.run(cmd, text=True, capture_output=True)
    if proc.returncode:
        raise AssertionError(proc.stderr or proc.stdout)
    return out.read_text(encoding="utf-8")


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for example in ("keynote", "workshop", "client-course", "portrait"):
            src = ROOT / "examples" / example / "deck.md"
            out = tmp_path / f"{example}.html"
            html = build(src, out)
            assert '<section class="slide' in html, example
            assert "data-reveal=" not in html, f"{example}: reveal not mapped"
            assert "<aside class=\"notes\">" in html, f"{example}: notes not mapped"
            assert "window.DECK_CONFIG" in html, f"{example}: no config"

        keynote = (tmp_path / "keynote.html").read_text(encoding="utf-8")
        assert 'data-orientation="portrait"' in keynote, "keynote: no portrait slide"

        public = build(ROOT / "examples" / "keynote" / "deck.md", tmp_path / "public.html", public=True)
        assert "<aside class=\"notes\">" not in public, "public: notes left in"
        assert public.count('<section class="slide') == keynote.count('<section class="slide')

    print("smoke: ok")


if __name__ == "__main__":
    main()
