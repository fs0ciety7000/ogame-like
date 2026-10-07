#!/usr/bin/env python3
"""6.14.43 : reporte des validations de /decisions (« valide » sans note) dans QUESTIONS.md et decisions-a-valider.md.

    python3 scripts/decisions-apply-valid.py Q35 Q37

Statut « validée (date, /decisions) » ; la ligne de conseil est retirée. Un « changer » ne passe jamais par ce script (lot de
changement, CLAUDE.md règle n° 3). Puis : node scripts/live-docs.mjs push.
"""
import sys, datetime

ids = set(sys.argv[1:])
today = datetime.date.today().isoformat()
p = "docs/QUESTIONS.md"
lines = open(p, encoding="utf8").read().split("\n")
done = []
for i, l in enumerate(lines):
    if l.startswith("| Q") and l.split(" | ")[0][2:] in ids and "| ouverte" in l:
        c = l.split(" | ")
        c[-1] = f"validée ({today}, /decisions) |"
        lines[i] = " | ".join(c)
        done.append(c[0][2:])
open(p, "w", encoding="utf8").write("\n".join(lines))
p = "docs/decisions-a-valider.md"
s = open(p, encoding="utf8").read()
s = "\n".join(l for l in s.split("\n") if not any(l.startswith(f"| {q} |") for q in done))
open(p, "w", encoding="utf8").write(s)
print("validées :", ", ".join(done) or "aucune")
