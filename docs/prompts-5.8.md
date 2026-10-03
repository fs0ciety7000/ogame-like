# 5.8 : prompts Midjourney (icônes du devblog, avatars)

## Icônes des catégories du blog

Chaque catégorie affiche une icône carrée. Fichier attendu : `public/assets/blog/<id>.webp`, en 256 × 256, WebP qualité 85, fond transparent de préférence. Tant qu'une image manque, le blog et le jeu affichent l'emoji de la catégorie.

Toutes les icônes partagent le même style : emblème holographique, trait néon, fond sombre uni. Le fond uni se détoure facilement, par exemple avec remove.bg.

| Fichier | Catégorie | Couleur |
|---|---|---|
| `annonces.webp` | Annonces | or `#ffd86b` |
| `mises-a-jour.webp` | Mises à jour | cyan `#4be8ff` |
| `notes.webp` | Notes du staff | menthe `#5cf2b0` |
| `coulisses.webp` | Coulisses | violet `#b18cff` |
| `equilibrage.webp` | Équilibrage | orange `#ff8a4c` |
| `evenements.webp` | Événements | rose `#ff5c7a` |

**Annonces** : un émetteur ou une antenne qui diffuse.
```
/imagine prompt: game UI icon, sci-fi holographic emblem of a deep-space broadcast antenna emitting concentric signal waves, glowing gold neon lines #ffd86b, clean vector-like shapes, subtle inner glow, centered, symmetrical, solid pure black background, no text, minimal, high contrast, 3/4 front view --ar 1:1 --v 7 --style raw --s 150
```

**Mises à jour** : clé et engrenage sur un module de vaisseau.
```
/imagine prompt: game UI icon, sci-fi holographic emblem of a wrench crossed with a hexagonal gear over a spaceship circuit module, glowing cyan neon lines #4be8ff, clean vector-like shapes, subtle inner glow, centered, symmetrical, solid pure black background, no text, minimal, high contrast --ar 1:1 --v 7 --style raw --s 150
```

**Notes du staff** : tablette de données et stylet.
```
/imagine prompt: game UI icon, sci-fi holographic emblem of a floating data tablet with a light stylus writing glowing lines, mint green neon #5cf2b0, clean vector-like shapes, subtle inner glow, centered, solid pure black background, no text, minimal, high contrast --ar 1:1 --v 7 --style raw --s 150
```

**Coulisses** : télescope ou œil de sonde qui regarde l'envers du décor.
```
/imagine prompt: game UI icon, sci-fi holographic emblem of a space observatory telescope lens revealing a wireframe blueprint grid, glowing violet neon lines #b18cff, clean vector-like shapes, subtle inner glow, centered, solid pure black background, no text, minimal, high contrast --ar 1:1 --v 7 --style raw --s 150
```

**Équilibrage** : balance futuriste.
```
/imagine prompt: game UI icon, sci-fi holographic emblem of a futuristic balance scale with two hovering energy plates, one holding a tiny starship and the other a stack of resource crystals, glowing orange neon lines #ff8a4c, clean vector-like shapes, subtle inner glow, centered, symmetrical, solid pure black background, no text, minimal, high contrast --ar 1:1 --v 7 --style raw --s 150
```

**Événements** : feu d'artifice stellaire, nova festive.
```
/imagine prompt: game UI icon, sci-fi holographic emblem of a festive star nova burst with orbiting confetti particles and a small rocket trail, glowing pink-red neon lines #ff5c7a, clean vector-like shapes, subtle inner glow, centered, solid pure black background, no text, minimal, high contrast --ar 1:1 --v 7 --style raw --s 150
```

Pour un style plus illustré, proche des icônes de ressources du jeu, remplace `clean vector-like shapes ... minimal` par `painterly 3D rendered game icon, metallic beveled frame, soft rim light`.

Astuce de cohérence : génère la première icône qui te plaît, puis ajoute `--sref <url de cette image>` aux cinq autres.

## Avatars de joueurs

Les avatars s'affichent maintenant dans le classement : carrés, petits (44 à 48 px), avec l'icône de rang en bas à droite. Il faut donc un **visage ou un buste bien centré**, lisible en petit, sans détail important dans le coin inférieur droit.

Format : 1:1, recadré en 256 px WebP par le jeu au moment de l'envoi (Profil → Avatar). Pour l'avatar par défaut, remplace `public/assets/avatars/default.webp` et augmente `ASSET_VERSION`.

Style commun à ajouter à chaque prompt :
`sci-fi strategy game character portrait, head and shoulders, centered, facing camera, dramatic rim light, dark starfield background, painterly digital illustration, highly detailed face, clean silhouette readable at small size --ar 1:1 --v 7 --style raw`

**Commandante de flotte** (humaine, vétérane)
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a battle-scarred female fleet admiral with short silver hair, high-collared navy uniform with gold epaulettes, cyan holographic insignia glowing on her chest, centered, facing camera, dramatic rim light, dark starfield background, painterly digital illustration, highly detailed face, clean silhouette readable at small size --ar 1:1 --v 7 --style raw
```

**Pilote mercenaire** (casque relevé)
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a grinning mercenary pilot with a cracked flight helmet pushed up, orange visor reflections, worn leather and armor plates, scar across the cheek, centered, facing camera, dramatic warm rim light, dark starfield background, painterly digital illustration, highly detailed face, clean silhouette readable at small size --ar 1:1 --v 7 --style raw
```

**Ingénieure cybernétique**
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a young engineer with a glowing cybernetic eye and a half-metal jaw, tools and cables on her shoulders, mint green circuit light, centered, facing camera, dramatic rim light, dark starfield background, painterly digital illustration, highly detailed face, clean silhouette readable at small size --ar 1:1 --v 7 --style raw
```

**Seigneur kesh'vaar** (alien reptilien)
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a reptilian alien warlord with amber eyes, bone crest and ritual gold piercings, heavy dark armor with amber gems, centered, facing camera, dramatic rim light, dark starfield background, painterly digital illustration, highly detailed face, clean silhouette readable at small size --ar 1:1 --v 7 --style raw
```

**Androïde diplomate**
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, an elegant porcelain-white android diplomat with a serene face, thin violet light lines across the cheeks, ornate high collar, centered, facing camera, soft violet rim light, dark starfield background, painterly digital illustration, highly detailed face, clean silhouette readable at small size --ar 1:1 --v 7 --style raw
```

**Pirate de Varan**
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a ruthless space pirate captain with a red respirator mask and a long dark coat, chains and trophies, one glowing red cybernetic eye, centered, facing camera, dramatic red rim light, dark starfield background, painterly digital illustration, highly detailed face, clean silhouette readable at small size --ar 1:1 --v 7 --style raw
```

**Mystique du Chœur** (capuche, visage voilé de lumière)
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a hooded cosmic mystic whose face is half hidden by a veil of floating light particles, glowing runes on the hood, deep blue and gold palette, centered, facing camera, dramatic rim light, dark nebula background, painterly digital illustration, clean silhouette readable at small size --ar 1:1 --v 7 --style raw
```

**Négociante du marché** (marchande, lunettes holo)
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a sly interstellar trader with holographic monocle showing price charts, braided hair with brass beads, rich patterned coat, centered, facing camera, warm gold rim light, dark starfield background, painterly digital illustration, highly detailed face, clean silhouette readable at small size --ar 1:1 --v 7 --style raw
```

**Ouvrier des chantiers** (combinaison, visière)
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a bulky shipyard worker in a heavy pressurized work suit, welding visor flipped up, soot on the face, sparks in the background, centered, facing camera, dramatic orange rim light, dark starfield background, painterly digital illustration, highly detailed face, clean silhouette readable at small size --ar 1:1 --v 7 --style raw
```

**Robot éclaireur** (pas de visage humain)
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a compact scout robot with a single large round cyan optic, antenna and scratched white plating, centered, facing camera, dramatic rim light, dark starfield background, painterly digital illustration, clean silhouette readable at small size --ar 1:1 --v 7 --style raw
```

Pour décliner une série cohérente, garde l'avatar préféré et ajoute `--sref <url>` aux suivants. Pour faire varier un même personnage, utilise `--cref <url> --cw 60`.
