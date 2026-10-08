#!/usr/bin/env python3
# 6.14.148 (revue AU28) : compare deux relevés de `scripts/theme-audit.mjs` (WORKFLOW §5 : « toute hausse devient un constat »).
#
#   python3 scripts/theme-audit-compare.py <avant> <après>          # dossiers <thème>/measures.json, ou résumés .json
#   python3 scripts/theme-audit-compare.py --resume <dossier> <sortie.json>   # résumé compact à garder dans docs/audit/
#
# Par thème : part des textes sous 4,5:1 (toutes vues, et hors admin), textes sous 11 px hors admin, défilement horizontal, éléments
# coupés, textes tronqués, libellés rognés ; puis chaque vue où une de ces mesures monte. Le séparateur « // » de l'en-tête est du
# décor (DESIGN.md) : il est compté, comme dans le relevé de 6.14.90.
import json
import os
import sys

FIELDS = ("total", "low", "small", "cutN", "trunc", "textCut")


def load(path):
    """Mesures par thème : {thème: {vue: {champ: valeur}}}, depuis un dossier de relevé ou un résumé."""
    if path.endswith(".json"):
        return json.load(open(path, encoding="utf-8"))
    out = {}
    for theme in sorted(os.listdir(path)):
        f = os.path.join(path, theme, "measures.json")
        if not os.path.exists(f):
            continue
        views = json.load(open(f, encoding="utf-8"))
        out[theme] = {
            k: ({"error": True} if "error" in v else {**{x: v.get(x, 0) for x in FIELDS}, "hscroll": int(bool(v.get("hscroll")))})
            for k, v in views.items()
        }
    return out


def agg(views, admin=True):
    r = {x: 0 for x in FIELDS + ("hscroll", "errors")}
    for k, v in views.items():
        if v.get("error"):
            r["errors"] += 1
            continue
        if not admin and k.startswith("admin"):
            continue
        for x in FIELDS + ("hscroll",):
            r[x] += v.get(x, 0)
    return r


def pct(r):
    return 100 * r["low"] / r["total"] if r["total"] else 0.0


def main():
    args = sys.argv[1:]
    if args[:1] == ["--resume"]:
        json.dump(load(args[1]), open(args[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"Résumé écrit : {args[2]}")
        return
    before, after = load(args[0]), load(args[1])
    print(f"{'thème':14s} {'avant':>7s} {'après':>7s} | hors admin (sous 4,5:1 / textes) | sous 11 px hors admin | défil. coupés tronqués rognés")
    rises = []
    for theme in sorted(after):
        if theme not in before:
            print(f"{theme:14s} absent du relevé d'avant")
            continue
        a, b = agg(before[theme]), agg(after[theme])
        a2, b2 = agg(before[theme], False), agg(after[theme], False)
        print(
            f"{theme:14s} {pct(a):6.2f}% {pct(b):6.2f}% | {a2['low']}/{a2['total']} → {b2['low']}/{b2['total']} | {a2['small']} → {b2['small']} | "
            f"{a['hscroll']}→{b['hscroll']} {a['cutN']}→{b['cutN']} {a['trunc']}→{b['trunc']} {a['textCut']}→{b['textCut']}"
            + (f" | {b['errors']} vue(s) en erreur" if b["errors"] else "")
        )
        for view, v in after[theme].items():
            o = before[theme].get(view)
            if not o or v.get("error") or o.get("error"):
                continue
            for x in ("low", "small", "cutN", "trunc", "textCut", "hscroll"):
                if x == "small" and view.startswith("admin"):
                    continue  # textes sous 11 px permis dans l'admin
                if v.get(x, 0) > o.get(x, 0):
                    rises.append(f"{theme} {view} {x} : {o.get(x, 0)} → {v.get(x, 0)}")
    print("\nHausses (une hausse = un constat) :" if rises else "\nAucune hausse.")
    for r in rises:
        print("  " + r)


if __name__ == "__main__":
    main()
