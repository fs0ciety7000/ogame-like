# 5.10 : prompts Midjourney (article « Titres, pot commun et Hall of fame »)

Illustrations pour l'article du devblog `content/blog/11-titres-pot-commun-hall-of-fame.md`.

- **Couverture** : format 16:9, exportée en 1600 × 900, WebP qualité 85, à placer dans `public/assets/blog/articles/5-10/couverture.webp`.
- **Visuels de section** : format 3:2, dans le même dossier (noms suggérés à chaque section).

Même ambiance que le reste du jeu : espace sombre, néons cyan `#4be8ff` et or `#ffd86b`, interfaces holographiques. Aucun texte dans l'image : Midjourney écrit mal, et les titres sont ajoutés par l'article.

## Couverture : le Hall of fame des colosses

Une immense galerie orbitale où flottent les trophées des boss vaincus (crâne du Léviathan, sceaux des boss de saison), éclairés comme dans un musée. Au centre, un commandant contemple un mur holographique gravé de noms lumineux.

```
/imagine prompt: epic cinematic sci-fi illustration, a vast orbital hall of fame inside a space station, colossal trophies of defeated space monsters hang in the air like museum pieces, a giant bioluminescent leviathan skull with jagged teeth, glowing alien seals and broken war banners, each trophy lit by a cyan #4be8ff spotlight beam, in the center a lone starship commander in dark armor looks up at a towering holographic wall of glowing golden #ffd86b name plates, polished black floor reflecting the lights, deep navy and black palette, volumetric light, awe and scale, highly detailed painterly concept art, no text, no letters --ar 16:9 --v 7 --s 250
```

Variante plus graphique (bannière, carte Discord) :

```
/imagine prompt: sci-fi key art, a monumental golden #ffd86b laurel crest framing the silhouette of a giant space leviathan skull, cyan #4be8ff holographic rings orbiting around it, a single starship flying past for scale, dark starfield with soft nebula, centered symmetrical composition, dramatic rim lighting, minimal, no text, no letters --ar 16:9 --v 7 --style raw --s 200
```

## Le coup de grâce

Section « Le Hall of fame des boss ». Fichier suggéré : `coup-de-grace.webp`.

```
/imagine prompt: cinematic sci-fi battle illustration, a single small attack frigate fires a blinding cyan #4be8ff lance of energy into the cracked glowing heart of a colossal space leviathan, the monster's armored body shatters into fragments of light, a whole fleet of tiny ships watches from a distance, explosion of gold #ffd86b sparks, dark nebula background, dramatic motion, painterly concept art, highly detailed, no text, no letters --ar 3:2 --v 7 --s 250
```

## Le catalogue des titres

Section « Des titres qui ont enfin du caractère ». Cinq insignes alignés, de la couleur de chaque rareté du jeu : gris-blanc, cyan, violet, or, magenta. Fichier suggéré : `titres.webp`.

```
/imagine prompt: game UI concept art, five ornate sci-fi honor badges floating in a row above a dark command console, each badge a different metal and glow, silver-white, cyan #4be8ff, violet #a78bfa, gold #ffd86b and magenta #ff5df0, increasing in size and ornamentation from left to right, the last one crowned with a radiant halo, engraved emblems of a gift box, a coin, a satellite, a recycling cog and a crown, soft holographic reflections, deep navy background, product shot lighting, highly detailed, no text, no letters --ar 3:2 --v 7 --style raw --s 200
```

## Le pot commun du serveur

Section « Un pot commun pour tout le serveur ». Une salle des coffres où convergent des flux de ressources venus du marché et des cargos. Fichier suggéré : `pot-commun.webp`.

```
/imagine prompt: sci-fi illustration, a circular vault chamber at the heart of a space station, a giant transparent reactor-like reservoir in the center slowly filling with glowing resources, golden #ffd86b ore fragments, cyan #4be8ff energy crystals and violet shards, thin streams of light flow into it from dozens of trade ships docking around the station, holographic counters and market charts floating around the reservoir, warm and hopeful mood, deep navy palette, volumetric light, painterly concept art, highly detailed, no text, no numbers, no letters --ar 3:2 --v 7 --s 200
```

## Les cadeaux entre alliés

Section « Des cadeaux mieux encadrés ». Deux vaisseaux de la même alliance s'échangent une cargaison sous un bouclier commun. Un troisième, hors du bouclier, perd une partie de sa charge en route. Fichier suggéré : `cadeaux.webp`.

```
/imagine prompt: sci-fi illustration, two allied cargo ships flying side by side inside a shared shimmering cyan #4be8ff energy shield, one passes a glowing crate of resources to the other through a beam of light, outside the shield a lone cargo ship travels through an asteroid field and trails a small cloud of golden #ffd86b particles leaking from its hold toward a distant glowing station, dark space background, clear storytelling composition, painterly concept art, highly detailed, no text, no letters --ar 3:2 --v 7 --s 200
```

## La récompense à récupérer

Section « Des récompenses qu'on prend le temps de récupérer ». Un coffre de récompense s'ouvre sur une console de commandement, et des pastilles lumineuses en jaillissent. Fichier suggéré : `coffre.webp`.

```
/imagine prompt: sci-fi illustration, a sleek armored reward chest resting on a holographic command table, its lid opening and releasing floating glowing tokens of light, gold #ffd86b resource coins, cyan #4be8ff crystals, a violet relic gem and a small winged insignia, a gloved commander's hand reaching toward them, dim bridge interior with bokeh console lights, warm magical glow, shallow depth of field, painterly concept art, highly detailed, no text, no letters --ar 3:2 --v 7 --s 200
```

## Astuces

- Pour garder le même commandant que la couverture de la 5.9, ajoute-la en référence de personnage : `--oref <url de l'image> --ow 100`.
- Pour que les cinq insignes aient vraiment les couleurs des raretés, régénère avec `--style raw` et des valeurs `--s` basses (100 à 150) : Midjourney respecte alors mieux les couleurs demandées.
- Exporte la couverture en 1600 × 900. C'est le format des aperçus sur Discord. Ensuite, remplace `cover:` dans l'en-tête de l'article par `/assets/blog/articles/5-10/couverture.webp`.
