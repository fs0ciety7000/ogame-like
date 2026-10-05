# 5.21 : prompts Midjourney des nouvelles illustrations

Les trois unités et la relique ajoutées en 5.21 utilisent pour l'instant une **image provisoire** (copie d'une illustration existante). Il suffit de remplacer le fichier : le chemin ne change pas.

Rappels de style (voir `docs/DESIGN.md`) :

- espace sombre, silhouettes nettes, **aucun texte dans l'image** ;
- sujet centré sur fond sombre et neutre, comme les autres fiches d'unités (la carte est recadrée en `object-contain`) ;
- export en WebP qualité 85, 1024 × 1024.

## Unités (`public/assets/units/<id>.webp`)

| Fichier | Provisoire actuel |
|:--|:--|
| `bastion.webp` | copie du Croiseur Nova |
| `batterie_essaim.webp` | copie de la Batterie anti-aérienne |
| `vaisseau_atelier.webp` | copie du Cargo |

### Bastion (forteresse volante, classe Fort)

```
/imagine prompt: sci-fi strategy game unit card, a colossal flying fortress warship, slab-like layered armor plates, very few small turrets, massive shield emitters on the flanks, battle-scarred hull with welded patches, three-quarter view, centered on a dark neutral space background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Batterie anti-essaim (défense, double avantage contre la classe Faible)

```
/imagine prompt: sci-fi strategy game defense unit card, an orbital flak battery with six rotating barrels and fragmentation shells, tracer bursts shredding a swarm of tiny drones, compact armored base anchored to an asteroid, three-quarter view, centered on a dark neutral space background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

### Vaisseau-atelier (réparation, +15 PV/s à l'Atelier)

```
/imagine prompt: sci-fi strategy game support ship card, a mobile repair tender with an open cradle bay, robotic welding arms and drones repairing a docked fighter, warm welding sparks, sturdy industrial hull with cranes, three-quarter view, centered on a dark neutral space background, soft rim light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```

## Relique (`public/assets/relics/cle_soudure.webp`)

Provisoire : copie de la Matrice de réparation.

```
/imagine prompt: sci-fi game relic icon, an ornate antique welding key tool made of brass and dark alloy, glowing filament tip with tiny sparks, engraved runes along the handle, floating on a dark neutral background, soft studio light, painterly concept art, high detail, no text --ar 1:1 --v 7 --style raw --s 250
```
