# Générateur de chapitres (v5.4) — prompts Midjourney

Le générateur écrit chaque mois un chapitre autour d'un des sept antagonistes ci-dessous. Chacun a besoin de deux images : le boss (21:9, bannière des Chroniques, de la page du boss et du Codex) et son sceau (1:1, emblème de profil gagné à sa chute).

Envoie-moi les grilles : je découpe, je place les fichiers dans `public/assets/chronicles/auto/` puis j'ajoute l'antagoniste à `AUTO_ART` (`src/game/procedural.ts`). D'ici là, les chapitres générés reprennent les illustrations des Chroniques d'octobre à mars, ce qui suffit pour jouer.

| Antagoniste | Faction | Fichiers |
|---|---|---|
| Varan | Confrérie du Vide | `confrerie-boss.webp`, `confrerie-sceau.webp` |
| Madame Kor | Cartel Néon | `cartel-boss.webp`, `cartel-sceau.webp` |
| L'Archonte Vesper | Chœur Silencieux | `choeur-boss.webp`, `choeur-sceau.webp` |
| Kragmor | Syndicat Gravhorn | `gravhorn-boss.webp`, `gravhorn-sceau.webp` |
| Le Prophète Maru | Culte du Léviathan | `culte-boss.webp`, `culte-sceau.webp` |
| Haut-Juge Séraphin Vol | Inquisition de l'Aube Blanche | `inquisition-boss.webp`, `inquisition-sceau.webp` |
| Ysgrim Crocs-de-Fer | Meute d'Ysgrim | `meute-boss.webp`, `meute-sceau.webp` |

Les boss de chaque faction changent de nom d'un mois à l'autre (« le Croiseur-Dette », « la Forge du Silencieux »…), mais une seule image par faction suffit. Les prompts décrivent donc le vaisseau amiral de la faction, pas un boss précis.

## Boss (21:9)

Confrérie du Vide
```
/imagine prompt: sci-fi strategy game key art, massive patched-together pirate dreadnought built from the wrecks of other ships, its hull covered in thousands of engraved names like a ledger, a silent masked figure standing on the prow, rust red and ember orange palette with deep black space, cinematic wide shot, dramatic volumetric lighting, painterly digital illustration, highly detailed --ar 21:9 --v 7 --style raw
```

Cartel Néon
```
/imagine prompt: sci-fi strategy game key art, flying casino fortress warship in space, roulette wheels turned into rotating gun turrets, gaudy neon signs and holographic chips, glamorous and menacing, magenta and hot pink neon palette against dark space, cinematic wide shot, dramatic volumetric lighting, painterly digital illustration, highly detailed --ar 21:9 --v 7 --style raw
```

Chœur Silencieux
```
/imagine prompt: sci-fi strategy game key art, colossal black crystal cathedral warship frozen in ice, organ pipes like cannons, visible sound waves freezing into frost in the vacuum, eerie silent hooded choir figures inside glowing windows, ice blue and pale white palette, cinematic wide shot, dramatic volumetric lighting, painterly digital illustration, highly detailed --ar 21:9 --v 7 --style raw
```

Syndicat Gravhorn
```
/imagine prompt: sci-fi strategy game key art, gigantic mining platform warship swallowing an asteroid whole, huge drills and crushers, amber ore glowing in its furnaces, horned mercenary insignia on armored plates, steel blue and amber palette, cinematic wide shot, dramatic volumetric lighting, painterly digital illustration, highly detailed --ar 21:9 --v 7 --style raw
```

Culte du Léviathan
```
/imagine prompt: sci-fi strategy game key art, colossal tree-like creature of flesh and roots growing out of shipwrecks in space, bioluminescent green veins, robed cultists praying on floating debris, spores drifting like stars, emerald green and dark teal palette, eerie volumetric lighting, cinematic wide shot, painterly digital illustration, highly detailed --ar 21:9 --v 7 --style raw
```

Inquisition de l'Aube Blanche
```
/imagine prompt: sci-fi strategy game key art, immense white and gold tribunal warship shaped like a cathedral nave, giant judge's seat on the bridge, orbital pyre beams burning a planet below, cold liturgical light, ivory white and pale gold palette with deep blue space, cinematic wide shot, dramatic volumetric lighting, painterly digital illustration, highly detailed --ar 21:9 --v 7 --style raw
```

Meute d'Ysgrim
```
/imagine prompt: sci-fi strategy game key art, predatory den-ship shaped like a wolf skull bristling with boarding fangs, a pack of small raider ships circling a lone convoy, red running lights like eyes, rust orange and blood red palette against dark space, cinematic wide shot, dramatic volumetric lighting, painterly digital illustration, highly detailed --ar 21:9 --v 7 --style raw
```

## Sceaux (1:1)

Confrérie du Vide
```
/imagine prompt: game emblem icon, burning ledger page with a name crossed out by a blade, ember sparks, rusted iron ring, centered on dark background, clean silhouette, highly detailed --ar 1:1 --v 7 --no text, letters, numbers, frame, border
```

Cartel Néon
```
/imagine prompt: game emblem icon, cracked neon casino chip split in two, magenta glow, small sparks, centered on dark background, clean silhouette, highly detailed --ar 1:1 --v 7 --no text, letters, numbers, frame, border
```

Chœur Silencieux
```
/imagine prompt: game emblem icon, frozen tuning fork snapped in half inside a crystal of ice, pale blue glow, frost particles, centered on dark background, clean silhouette, highly detailed --ar 1:1 --v 7 --no text, letters, numbers, frame, border
```

Syndicat Gravhorn
```
/imagine prompt: game emblem icon, shattered drill head with an amber crystal core, broken horned insignia, steel blue metal, centered on dark background, clean silhouette, highly detailed --ar 1:1 --v 7 --no text, letters, numbers, frame, border
```

Culte du Léviathan
```
/imagine prompt: game emblem icon, severed glowing green root curled like a sea serpent, cut by a bright blade, spores drifting, centered on dark background, clean silhouette, highly detailed --ar 1:1 --v 7 --no text, letters, numbers, frame, border
```

Inquisition de l'Aube Blanche
```
/imagine prompt: game emblem icon, broken golden judge's gavel over a cracked white sunburst, cold light rays, centered on dark background, clean silhouette, highly detailed --ar 1:1 --v 7 --no text, letters, numbers, frame, border
```

Meute d'Ysgrim
```
/imagine prompt: game emblem icon, iron wolf fang snapped at the root, red glow, scratch marks, centered on dark background, clean silhouette, highly detailed --ar 1:1 --v 7 --no text, letters, numbers, frame, border
```

## Passe de saison (facultatif)

En-tête de la page Passe (21:9) : `public/assets/pass/pass-header.webp`
```
/imagine prompt: sci-fi strategy game key art, a long ascending path of glowing holographic reward platforms leading toward a radiant relic floating above a space station, each platform holding a crate, a capsule or a medal, cyan to violet to gold gradient light, sense of progression, cinematic wide shot, painterly digital illustration, highly detailed --ar 21:9 --v 7 --style raw
```

Sceau « chapitre terminé » (1:1) : `public/assets/pass/chapter-complete.webp`
```
/imagine prompt: game emblem icon, an open ancient star-chart book with four glowing bookmarks, a laurel of light around it, cyan and gold glow, centered on dark background, clean silhouette, highly detailed --ar 1:1 --v 7 --no text, letters, numbers, frame, border
```
