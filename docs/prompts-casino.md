# 5.14.2 : prompts Midjourney (gros lot du casino, « Main d'or »)

Même ambiance que le reste du jeu : espace sombre, néons cyan `#4be8ff` et or `#ffd86b`, interfaces holographiques,
coins coupés (voir `docs/DESIGN.md`). Aucun texte dans l'image. Exports WebP qualité 85.

5.14.4 : les quatre images sont livrées (planches Midjourney découpées ; sceau et médaille détourés). Pour une
meilleure définition, refaire un « Upscale » de la vignette choisie et remplacer le fichier au même chemin, puis
augmenter `ASSET_VERSION` dans `src/lib/assets.ts`.

## Médaille du palier Mythique (`public/assets/achievements/mythique.webp`, 512 × 512, fond transparent)

```
/imagine prompt: game achievement medal icon, a circular mythic-tier medal, iridescent magenta and gold alloy rim with seven engraved stars, a faint holographic halo, empty dark centre for an emoji, centered, top-down front view, crisp edges, high contrast, transparent background, sci-fi strategy game UI asset, no text --ar 1:1 --v 7 --style raw --s 150
```

## Bannière de profil « Main d'or » (`public/assets/casino/banniere-777.webp`, 1600 × 400)

```
/imagine prompt: wide sci-fi banner, the interior of an orbital casino aboard a space station, a giant slot machine with three glowing golden sevens aligned, a cascade of golden tokens and resource crystals pouring out, cyan #4be8ff neon lines on dark metal, gold #ffd86b light rays, deep space visible through a panoramic window, cinematic, painterly digital illustration, composition weighted to the right so the left stays dark for text, no text --ar 4:1 --v 7 --style raw --s 250
```

## Sceau « Main d'or » (`public/assets/casino/sceau-777.webp`, 512 × 512, fond transparent)

```
/imagine prompt: game emblem icon, an open armored gauntlet made of gold catching three spinning golden sevens, engraved hexagonal seal behind it, cyan #4be8ff rim light, dark metal accents, symmetrical, centered, flat front view, crisp edges, transparent background, sci-fi strategy game UI asset, no text --ar 1:1 --v 7 --style raw --s 150
```

## Codex, « La Main d'or » (`public/assets/casino/main-or.webp`, 1280 × 720)

```
/imagine prompt: sci-fi illustration, a brass plaque above the reels of an ancient orbital slot machine, engraved with a single glowing golden handprint, kesh'vaar alien croupiers in hooded robes watching from the shadows, haze of smoke and neon, cyan #4be8ff and gold #ffd86b lights, moody and legendary atmosphere, painterly digital illustration, highly detailed, no text --ar 16:9 --v 7 --style raw --s 250
```
