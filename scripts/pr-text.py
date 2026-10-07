#!/usr/bin/env python3
"""6.14.34 : régénère docs/release/pr-5.27-6.14.md (texte de la PR de mise en production) depuis l'index docs/changes/README.md.

    python3 scripts/pr-text.py

À relancer après chaque lot tant que la PR n'est pas ouverte (P30-2)."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PR = ROOT / "docs" / "release" / "pr-5.27-6.14.md"


def key(v):
    try:
        return tuple(int(x) for x in v.split("."))
    except ValueError:
        return None


rows = []
for line in (ROOT / "docs" / "changes" / "README.md").read_text(encoding="utf-8").splitlines():
    if not line.startswith("| "):
        continue
    c = [x.strip() for x in line.strip("|").split("|")]
    k = key(c[0])
    m = re.search(r"\[(.*?)\]\((.*?)\)", c[1]) if len(c) > 1 else None
    if k and k > (5, 27, 0) and m:
        rows.append((k, c[0], m.group(1), m.group(2)))
rows.sort()
last = rows[-1][1]
text = PR.read_text(encoding="utf-8")
head, rest = text.split("## Fiches portées", 1)
footer = rest[rest.index("🤖"):]
head = re.sub(r"`5\.27\.1 → [0-9.]+ :", f"`5.27.1 → {last} :", head)
head = re.sub(r"soit \d+ fiches", f"soit {len(rows)} fiches", head)
fiches = "\n".join(f"- {v} : {t} (`docs/changes/{f}`)" for _, v, t, f in rows)
PR.write_text(f"{head}## Fiches portées\n\n{fiches}\n\n{footer}", encoding="utf-8")
print(f"{len(rows)} fiches, jusqu'à {last}")
