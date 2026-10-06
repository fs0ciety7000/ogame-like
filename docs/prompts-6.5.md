# 6.5 : prompts Midjourney des vaisseaux de classe (lot P, J.2)

Trois illustrations à produire, une par classe d'empire. Elles conditionnent le code du lot P (`docs/proposals/unites-classe.md`).

Rappels de style (voir `docs/DESIGN.md`) :

- espace sombre, silhouettes nettes, **aucun texte dans l'image** ;
- sujet centré sur un fond sombre et neutre, comme les autres fiches d'unités ;
- export en WebP qualité 85, puis 512 × 512 dans `public/assets/units/`.

Chaque vaisseau porte la couleur de sa classe sur un liseré (comme l'insigne braise des unités d'élite) : or pour l'Industriel, rouge
braise pour le Seigneur de guerre, cyan pour l'Explorateur.

| Fichier | Unité | Classe | État |
|:--|:--|:--|:--|
| `recolteur.webp` | Récolteur | Industriel | à produire |
| `croiseur_raid.webp` | Croiseur de raid | Seigneur de guerre | à produire |
| `eclaireur_lointain.webp` | Éclaireur lointain | Explorateur | à produire |

### Récolteur (Industriel, soute)

```
/imagine prompt: sci-fi strategy game unit card, a bulky industrial harvester starship with wide modular cargo pods, folded mining arms and tractor-beam emitters under the hull, scuffed yellow-gold hazard stripes along its flank, sturdy and practical silhouette, three-quarter view, centered on a dark neutral space background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Croiseur de raid (Seigneur de guerre, pillage)

```
/imagine prompt: sci-fi strategy game unit card, a fast predatory raiding cruiser with a narrow armored prow, twin broadside cannons, an oversized rear cargo hold with grappling clamps, ember-red war markings on dark gunmetal plates, aggressive low silhouette, three-quarter view, centered on a dark neutral space background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Éclaireur lointain (Explorateur, vitesse)

```
/imagine prompt: sci-fi strategy game unit card, a slender long-range scout starship with an elongated needle hull, large sensor dish and swept solar sails, cyan glowing engine trails, light white and teal panels, elegant fast silhouette, three-quarter view, centered on a dark neutral space background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```
