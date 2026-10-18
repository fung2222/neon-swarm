#!/usr/bin/env python3
from pathlib import Path
root = Path(__file__).resolve().parents[1]
need = ["index.html", "js/main.js", "js/strings.js", "js/config.js", "css/game.css",
        "privacy.html", "vendor/cyber-kit/kit.js", "vendor/cyber-kit/VERSION", "docs/HANDOFF.md", "README.md"]
missing = [p for p in need if not (root / p).exists()]
assert not missing, missing
ver = (root / "vendor/cyber-kit/VERSION").read_text().strip()
assert ver == "0.3.16", ver
print("OK scaffold files + kit", ver)
