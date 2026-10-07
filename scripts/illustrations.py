#!/usr/bin/env python3
"""6.14.22 : intègre les rendus Midjourney (docs/WORKFLOW.md §7, maillon 13 « Illustrations »).

    python3 scripts/illustrations.py <dossier>            # traite <dossier>/<id>.(png|jpg|jpeg|webp)
    python3 scripts/illustrations.py <dossier> --dry-run  # dit ce qui serait fait, n'écrit rien
    python3 scripts/illustrations.py --missing            # images encore attendues (champ `done` vide)
    python3 scripts/illustrations.py --page <fichier.html> # page de dépôt mobile à publier (artifact)

Les identifiants, tailles, détourage et chemins cibles viennent de scripts/illustrations.json (même source que la page de
dépôt mobile). Pour chaque image :
- détourage si `cutout` : rembg s'il est installé, sinon fond sombre retiré par remplissage depuis les bords (les prompts
  demandent un fond sombre et neutre) ; recadrage sur l'objet avec une marge ;
- sinon recadrage au centre au format cible ;
- redimensionnement (Lanczos), WebP à la qualité indiquée, écrit dans `target`.
Le dossier des originaux reste hors du dépôt (scratchpad).
"""
import json
import sys
from collections import deque
from datetime import date
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
JSON = ROOT / "scripts" / "illustrations.json"
SLOTS = json.loads(JSON.read_text(encoding="utf-8"))["slots"]
EXTS = (".png", ".jpg", ".jpeg", ".webp")


def remove_dark_background(im: Image.Image, tolerance: int = 38) -> Image.Image:
    """Fond retiré par remplissage depuis les bords : un pixel proche de la couleur du fond et relié au bord devient transparent."""
    im = im.convert("RGBA")
    small = im.copy()
    small.thumbnail((512, 512))
    w, h = small.size
    px = small.load()
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    bg = tuple(sorted(c[i] for c in corners)[1] for i in range(3))

    def near(c):
        return abs(c[0] - bg[0]) + abs(c[1] - bg[1]) + abs(c[2] - bg[2]) <= tolerance * 3

    mask = Image.new("L", (w, h), 255)
    m = mask.load()
    seen = bytearray(w * h)
    q = deque([(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)])
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        if not near(px[x, y]):
            continue
        m[x, y] = 0
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                q.append((nx, ny))
    # Bords adoucis, puis masque remis à la taille de l'original.
    mask = mask.filter(ImageFilter.GaussianBlur(1.2)).resize(im.size, Image.LANCZOS)
    im.putalpha(mask)
    return im


def cutout(im: Image.Image) -> tuple[Image.Image, str]:
    try:
        from rembg import remove  # type: ignore

        return remove(im.convert("RGBA")), "rembg"
    except Exception:
        return remove_dark_background(im), "fond sombre retiré"


def fit(im: Image.Image, width: int, height: int, transparent: bool) -> Image.Image:
    if transparent:
        box = im.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox() or (0, 0, *im.size)
        obj = im.crop(box)
        side = int(max(obj.size) * 1.12)
        canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        canvas.paste(obj, ((side - obj.width) // 2, (side - obj.height) // 2), obj)
        return canvas.resize((width, height or width), Image.LANCZOS)
    im = im.convert("RGB")
    if not height:
        return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    target = width / height
    if im.width / im.height > target:
        nw = round(im.height * target)
        im = im.crop(((im.width - nw) // 2, 0, (im.width - nw) // 2 + nw, im.height))
    else:
        nh = round(im.width / target)
        im = im.crop((0, (im.height - nh) // 2, im.width, (im.height - nh) // 2 + nh))
    return im.resize((width, height), Image.LANCZOS)


def missing() -> None:
    for s in SLOTS:
        if not s.get("done"):
            print(f"{s['id']:<28} {s['target']}")


def main() -> None:
    args = sys.argv[1:]
    if args == ["--missing"]:
        missing()
        return
    if args and args[0] == "--page":
        # Page de dépôt mobile (artifact « Atelier d'illustrations ») : gabarit + liste des images.
        tpl = (ROOT / "scripts" / "illustrations-page.html").read_text(encoding="utf-8")
        data = json.dumps(SLOTS, ensure_ascii=False).replace("</", "<\\/")
        Path(args[1]).write_text(tpl.replace("__SLOTS__", data), encoding="utf-8")
        print(f"Page écrite : {args[1]} ({len(SLOTS)} images)")
        return
    if not args:
        print(__doc__)
        sys.exit(1)
    src, dry = Path(args[0]), "--dry-run" in args
    files = {p.stem: p for p in src.iterdir() if p.suffix.lower() in EXTS}
    done = 0
    for s in SLOTS:
        f = files.pop(s["id"], None)
        if not f:
            continue
        im = Image.open(f)
        how = "opaque"
        if s["cutout"]:
            im, how = cutout(im)
        out = fit(im, s["width"], s["height"], s["cutout"])
        target = ROOT / s["target"]
        print(f"{s['id']:<28} {f.name} -> {s['target']} ({out.width}×{out.height}, {how})")
        if not dry:
            target.parent.mkdir(parents=True, exist_ok=True)
            out.save(target, "WEBP", quality=s["quality"], method=6)
            s["done"] = date.today().isoformat()
        done += 1
    if done and not dry:
        data = json.loads(JSON.read_text(encoding="utf-8"))
        data["slots"] = SLOTS
        JSON.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    for stem in files:
        print(f"ignoré : {stem} (identifiant inconnu, voir scripts/illustrations.json)")
    print(f"{done} image(s) {'à traiter' if dry else 'intégrée(s)'}.")


if __name__ == "__main__":
    main()
