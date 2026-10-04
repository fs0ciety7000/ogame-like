# 5.15 : prompt Midjourney, insigne d'Ascension

L'Ascension, c'est le prestige de la page Ascension : l'empire repart de zéro avec un bonus permanent, 5 fois au
maximum. Ce n'est pas la montée dans les divisions du classement.

L'insigne est affiché en petit (16 à 24 px) à côté du pseudo : classement, podium, fiche joueur, profil, barre latérale.
Les étoiles (1 à 5) sont dessinées par le jeu à côté de l'insigne, donc **l'image ne contient pas d'étoiles comptées**.
Même charte que le reste (`docs/DESIGN.md`) : or `#ffd86b`, cyan `#4be8ff`, métal sombre, formes nettes et lisibles
en tout petit. Aucun texte.

## Insigne (`public/assets/ascension/insigne.webp`, 256 × 256, fond transparent)

```
/imagine prompt: game rank insignia icon, a stylized golden chevron rising out of a ring of light, symbol of rebirth and ascension, engraved dark metal core with a single cyan #4be8ff crystal at the centre, gold #ffd86b edges, strong silhouette readable at 16 pixels, symmetrical, centered, flat front view, crisp edges, high contrast, transparent background, sci-fi strategy game UI asset, no text, no stars --ar 1:1 --v 7 --style raw --s 120
```

Variante plus « céleste » si la première est trop militaire :

```
/imagine prompt: game prestige emblem icon, a golden phoenix wing folded into an upward arrow above a planet horizon, glowing cyan #4be8ff core, dark metal frame with gold #ffd86b rim light, minimal shapes, readable at very small size, symmetrical, centered, flat front view, transparent background, sci-fi strategy game UI asset, no text, no stars --ar 1:1 --v 7 --style raw --s 120
```

## Mise en place

1. Choisir une vignette, faire un « Upscale », détourer si le fond n'est pas transparent, exporter en WebP 256 × 256.
2. Déposer le fichier à `public/assets/ascension/insigne.webp`.
3. Dans `src/game/ascension.ts`, remplacer `ASCENSION_INSIGNIA = null` par `"/assets/ascension/insigne.webp"`.

5.15 : insigne livré (V ailé, détouré, 256 × 256). Pour le remplacer : même chemin, puis augmenter `ASSET_VERSION`.
