# 5.27 : prompts Midjourney du Comptoir de la Ruche

Illustrations des objets ajoutés au Comptoir en 5.26.3 et des offres de la semaine (5.27). En attendant les images, les cartes du Comptoir affichent une icône.

Rappels de style (voir `docs/DESIGN.md`) :

- univers kesh'vaar : insectoïde, chitine ambrée, résine dorée, alvéoles hexagonales, lueurs ambre et or ;
- objet seul, centré sur un fond sombre et neutre, **aucun texte dans l'image** ;
- export en WebP qualité 85, 256 × 256, dans `public/assets/bounties/items/<fichier>`.

Pour brancher une image : déposer le fichier, puis ajouter son identifiant dans `SHOP_ITEM_ART` (`src/pages/BountiesPage.tsx`). La carte affiche l'image à la place de l'icône.

| Fichier | Objet | Groupe |
|:--|:--|:--|
| `phantom.webp` | Sondes fantômes | Fournitures |
| `painkiller.webp` | Analgésique d'atelier | Fournitures |
| `reroll.webp` | Rappel de plan | Fournitures |
| `priority.webp` | Contrat prioritaire | Fournitures |
| `pheromone.webp` | Phéromone de recrutement | Fournitures |
| `vendettaToken.webp` | Jeton de vendetta | Fournitures |
| `nameColor.webp` | Couleur de pseudo | Prestige |
| `keshReaction.webp` | Réaction kesh'vaar | Prestige |
| `roomBanner.webp` | Bannière de salon | Prestige |
| `planetFx.webp` | Effet de planète | Prestige |
| `weekly-rareRelic.webp` | Relique de l'Essaim | Offre de la semaine |
| `weekly-rarePlan.webp` | Plan de module rare | Offre de la semaine |
| `weekly-epicPlan.webp` | Plan de module épique | Offre de la semaine |
| `weekly-tokens.webp` | Sac de jetons | Offre de la semaine |

Suffixe commun à tous les prompts :

```
, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Sondes fantômes

```
/imagine prompt: sci-fi game item icon, three small translucent spy probes shaped like ghostly beetles, half-transparent shells fading into the dark, faint distortion shimmer around them, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Analgésique d'atelier

```
/imagine prompt: sci-fi game item icon, a glass injector vial filled with glowing amber healing resin, chitin grip and brass needle, a few golden droplets, repair workshop mood, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Rappel de plan

```
/imagine prompt: sci-fi game item icon, a holographic starship module blueprint being rewritten by a swarm of tiny golden insects, the schematic lines shifting color from grey to violet, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Contrat prioritaire

```
/imagine prompt: sci-fi game item icon, a sealed trade contract scroll made of thin chitin plates, a glowing amber wax seal shaped like an upward arrow, gold ribbon, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Phéromone de recrutement

```
/imagine prompt: sci-fi game item icon, an ornate chitin censer releasing swirling golden pheromone smoke, small glowing motes rising, officers' insignia engraved on the base, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Jeton de vendetta

```
/imagine prompt: sci-fi game item icon, a heavy coin of dark chitin with two crossed blades embossed in ember red, cracked amber inlay, a faint red glow, warlord hunting token, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Couleur de pseudo

```
/imagine prompt: sci-fi game item icon, a chitin painter's palette with five glowing pigment cells in cyan, mint green, gold, ember orange and violet, a fine insect-leg brush, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Réaction kesh'vaar

```
/imagine prompt: sci-fi game item icon, a small amber badge in the shape of the kesh'vaar swarm emblem, a stylized winged insect with a crown, floating above a holographic chat bubble, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Bannière de salon

```
/imagine prompt: sci-fi game item icon, a tall hanging banner of woven chitin threads with an empty glowing emblem slot, violet and gold trims, held by an insect-shaped finial, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Effet de planète

```
/imagine prompt: sci-fi game item icon, a miniature ocean planet circled by a wide shimmering amber ring, a soft green aurora on its pole, presented on a chitin pedestal, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Relique de l'Essaim (offre de la semaine)

```
/imagine prompt: sci-fi game item icon, an ancient relic shard encased in a drop of polished amber, a tiny glowing artifact visible inside, sealed by golden filigree, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Plan de module rare (offre de la semaine)

```
/imagine prompt: sci-fi game item icon, a rolled starship module blueprint glowing cyan, held in a chitin tube with an amber cap, small hologram of an armor plate above it, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Plan de module épique (offre de la semaine)

```
/imagine prompt: sci-fi game item icon, a starship module blueprint unfolding in violet light, intricate engine schematics floating in layers, chitin frame with amber gems, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Sac de jetons (offre de la semaine)

```
/imagine prompt: sci-fi game item icon, a small chitin pouch overflowing with gold casino tokens engraved with a lucky seven, a few coins spilling out, insectoid kesh'vaar craftsmanship, amber chitin and golden resin, hexagonal honeycomb details, centered on a dark neutral background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```
