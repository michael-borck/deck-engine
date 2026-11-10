#!/usr/bin/env bash
# Build every example deck. Output is examples/<name>/deck.html.
set -euo pipefail
cd "$(dirname "$0")/.."
for src in examples/*/deck.md; do
  python3 authoring/build_deck.py "$src"
done
