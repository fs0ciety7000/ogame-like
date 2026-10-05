# 5.22 : prompts Midjourney des unités d'élite

Les trois illustrations sont en place, en 512 × 512. Les prompts restent ici pour les régénérer.

Rappels de style (voir `docs/DESIGN.md`) :

- espace sombre, silhouettes nettes, **aucun texte dans l'image** ;
- sujet centré sur un fond sombre et neutre, comme les autres fiches d'unités ;
- export en WebP qualité 85, puis 512 × 512 dans `public/assets/units/`.

Chaque unité porte un détail rouge braise commun (insigne de chasseur de seigneurs). Il les distingue des unités ordinaires.

| Fichier | Unité | Contre | État |
|:--|:--|:--|:--|
| `chasse_fantome.webp` | Chasse-Fantôme | Opportunistes : empêche l'esquive et la retraite | en place |
| `brise_rempart.webp` | Brise-Rempart | Bâtisseurs : ignore le bouclier et le bonus des défenses | en place |
| `lame_ecarlate.webp` | Lame Écarlate | Agressifs : annule leur avantage de classe | en place |

### Chasse-Fantôme (classe Faible, furtif)

```
/imagine prompt: sci-fi strategy game elite unit card, a sleek stealth hunter starship with matte black angular hull, wake-scrambler fins trailing faint distortion ripples, a single ember-red hunter insignia on the prow, half dissolving into shadow, three-quarter view, centered on a dark neutral space background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Brise-Rempart (classe Fort, siège)

```
/imagine prompt: sci-fi strategy game elite unit card, a massive siege ram warship with a long antimatter lance glowing at its tip, heavy layered armor, shattered energy shield fragments around the bow, ember-red hunter insignia on the flank, three-quarter view, centered on a dark neutral space background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Lame Écarlate (classe Moyen, duelliste)

```
/imagine prompt: sci-fi strategy game elite unit card, an elegant duelist cruiser with a blade-shaped crimson hull, twin forward spinal cannons, polished scarlet armor plates with ember-red glowing seams, aggressive forward-swept silhouette, three-quarter view, centered on a dark neutral space background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```
