# 5.12 : prompts Midjourney (Casino orbital et jetons)

Illustrations du Casino orbital : l'icône du jeton (pour l'interface) et des visuels pour l'article du devblog
`content/blog/15-casino-orbital.md`.

Même ambiance que le reste du jeu : espace sombre, néons cyan `#4be8ff` et or `#ffd86b`, interfaces holographiques.
Aucun texte dans l'image : Midjourney écrit mal, et les titres sont ajoutés par l'article.

**Images reçues** : jeton (trois-quarts → `jeton.webp`, détouré), jeton de face (→ `jeton-icone.webp`, icône), pile de jetons,
couverture (salle aux machines bleu nuit), salle de jeu (`salle-de-jeu.webp`), gros lot (`gros-lot.webp`, section
« Et quand quelqu'un gagne ») et grande salle aux trois 7 (`public/assets/casino/salle-777.webp`, fond de l'en-tête de la
page Casino via `PageHeader backdrop`).

Le jeton suit le design system (`docs/DESIGN.md`) : **coins coupés** (octogone ou carré biseauté, pas de pièce ronde),
**or = récompense**, liseré cyan discret pour le côté instrument. On évite les casinos « Las Vegas » (velours rouge,
dés en ivoire, néons roses) : c'est une salle de jeu à bord d'une station militaire.

## Le jeton (icône d'interface)

Format 1:1, exporté en 512 × 512 puis 128 × 128, WebP qualité 90, fond détouré (transparent) avec un outil de
suppression de fond. Fichier suggéré : `public/assets/casino/jeton.webp`. Il sert dans le solde de jetons, la récompense
quotidienne et le formulaire d'admin « Offrir des jetons ».

```
/imagine prompt: game icon, a single sci-fi casino token seen in three-quarter view, octagonal chip with beveled cut corners, dark gunmetal body with a gold #ffd86b engraved rim, in the center a raised emblem of a stylized number seven made of light merged with a small ringed planet, thin cyan #4be8ff circuit lines etched around the edge, subtle holographic sheen, crisp hard-surface rendering, centered, isolated on a plain pure black background, studio lighting, high detail, no text, no letters --ar 1:1 --v 7 --style raw --s 150
```

Variante « vue de face », plus lisible en petit (16 à 32 px) :

```
/imagine prompt: flat front view game UI icon, an octagonal sci-fi token with cut corners, gold #ffd86b metallic frame, dark navy center, a bold glowing seven-shaped emblem in the middle, a thin cyan #4be8ff inner ring, clean vector-like shading, high contrast, centered, isolated on plain black background, no text, no letters --ar 1:1 --v 7 --style raw --s 100
```

## La pile de jetons (récompense quotidienne)

Pour la carte « Jetons du jour » et les notifications de jetons offerts. Fichier suggéré : `public/assets/casino/jetons-pile.webp`.

```
/imagine prompt: game reward illustration, a small stack of octagonal sci-fi casino tokens with cut corners, gold #ffd86b rims and dark gunmetal faces, one token standing on its edge and glowing, faint cyan #4be8ff holographic light rising from the stack like a scan beam, sitting on a dark metal console panel, shallow depth of field, crisp hard-surface detail, isolated, dark background, no text, no letters --ar 1:1 --v 7 --style raw --s 150
```

## Couverture de l'article : le Casino orbital

Format 16:9, exporté en 1600 × 900, WebP qualité 85. Fichier suggéré :
`public/assets/blog/articles/5-12/couverture.webp` (remplace la couverture provisoire du pot commun dans le billet).

```
/imagine prompt: epic cinematic sci-fi illustration, a gaming lounge aboard an orbital military station, a tall angular slot machine cabinet with cut corners and gold #ffd86b trim stands in the center, three dark reel screens glowing with holographic symbols of a seven, a star and a ringed planet, a lone commander in dark armor about to pull the lever, octagonal tokens scattered on the console, huge window behind showing a gas giant and the station's trade ships, cyan #4be8ff interface lights, deep navy and black palette, volumetric light, painterly concept art, highly detailed, no text, no numbers, no letters --ar 16:9 --v 7 --s 250
```

## Le gros lot

Section « Trois 7 et tout le serveur le sait ». Fichier suggéré : `gros-lot.webp` (3:2).

```
/imagine prompt: cinematic sci-fi illustration, the moment of a jackpot in a space station casino, three glowing golden #ffd86b sevens aligned on dark reel screens, a cascade of octagonal tokens with cut corners bursting out of the machine, gold light flooding the room, crowds of officers turning their heads, holographic broadcast panels relaying the news across the station, cyan #4be8ff accents, dramatic motion, painterly concept art, highly detailed, no text, no numbers, no letters --ar 3:2 --v 7 --s 250
```

## Fonds d'en-tête des pages « lieu » (`PageHeader backdrop`)

Format 21:9 (une bande large), exporté en 1600 × 680, WebP qualité 82, dans `public/assets/headers/`. Le sujet
doit être **à droite** : le titre de la page s'affiche à gauche, sur la partie fondue de l'image. Déjà en place :
Casino (salle aux trois 7), État-major (poste de commandement), Palmarès (podium d'or), Hall of fame des boss.

### Marché (`public/assets/headers/marche.webp`)

```
/imagine prompt: wide cinematic sci-fi illustration, a bustling orbital trading hall seen from a high gallery, rows of cargo containers and holographic price boards on the right side of the frame, traders and drones moving between stalls, cyan #4be8ff price charts and gold #ffd86b crates of ore, a docked freighter visible through a huge window, left third of the image dark and empty for a title, deep navy palette, volumetric light, painterly concept art, highly detailed, no text, no numbers, no letters --ar 21:9 --v 7 --s 200
```

### Laboratoire (`public/assets/headers/labo.webp`)

```
/imagine prompt: wide cinematic sci-fi illustration, a quiet research laboratory aboard a starship, glowing containment cylinders and floating holographic molecules on the right side of the frame, a scientist silhouette examining a violet #a78bfa energy sample, cyan #4be8ff interface light, clean metal benches, left third of the image dark and empty for a title, deep navy palette, soft volumetric light, painterly concept art, highly detailed, no text, no letters --ar 21:9 --v 7 --s 200
```
