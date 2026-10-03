# Avatars prédéfinis : prompts Midjourney

La galerie de **Profil → Avatar → Galerie** propose des portraits prêts à l'emploi. Elle affiche chaque image dès que son fichier existe : il suffit de la déposer, sans toucher au code.

- **Fichier** : `public/assets/avatars/presets/<id>.webp`, carré, 512 × 512, WebP qualité 85.
- **Liste et noms affichés** : `src/lib/avatarPresets.ts`. Pour ajouter un avatar, ajoute une ligne `preset("id", "Nom")` et dépose l'image du même nom.
- **En attendant** : le groupe « Officiers » reprend les portraits des officiers du jeu, la galerie n'est donc jamais vide.
- **Cadrage** : l'avatar s'affiche en petit (44 à 96 px), avec l'icône de rang dans le coin inférieur droit au classement. Il faut un visage bien centré, dans la moitié haute, et rien d'important en bas à droite.

## Cohérence de la série

1. Génère d'abord **l'amirale**. Choisis la version qui te plaît, puis récupère son URL (clic droit → Copier le lien de l'image).
2. Ajoute `--sref <cette URL> --sw 300` à tous les autres prompts : même lumière, même touche, même palette.
3. Pour une variante d'un même personnage (autre expression, autre tenue), utilise `--cref <URL> --cw 60`.

Style commun déjà inclus dans chaque prompt :
```
sci-fi strategy game character portrait, head and shoulders, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

## Commandants

**Amirale vétérane** → `amirale.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a battle-scarred female fleet admiral in her fifties, short silver hair, high-collared navy uniform with gold epaulettes, cyan holographic rank insignia on her chest, calm commanding gaze, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Pilote mercenaire** → `pilote.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a cocky mercenary starfighter pilot, cracked flight helmet pushed up on the forehead, orange visor reflections, worn leather jacket over armor plates, small scar on the cheek, crooked grin, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Ingénieure cybernétique** → `ingenieure.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a young engineer woman with a glowing mint-green cybernetic eye and a half-metal jaw, coiled cables over her shoulders, goggles in her hair, grease on her cheek, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Ouvrier des chantiers** → `ouvrier.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a broad-shouldered shipyard worker in a heavy pressurized work suit, welding visor flipped up, soot-covered face, warm sparks floating behind him, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Négociante du marché** → `negociante.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a sly interstellar trader with a holographic monocle showing price charts, braided hair with brass beads, rich patterned coat with gold embroidery, knowing smile, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Éclaireuse des confins** → `eclaireuse.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a frontier scout with a weathered face, hood and long scarf blown by solar wind, compact rangefinder visor over one eye, frost on her eyelashes, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Médecin de bord** → `medecin.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a ship's doctor with kind tired eyes, white and teal medical coat, floating holographic vitals beside the face, short dark curly hair, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Vétéran à l'œil bionique** → `veteran.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, an old grizzled veteran soldier with a glowing red bionic eye, grey beard, battered officer cap, medals on a worn greatcoat, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

## Factions

**Chasseur kesh'vaar** → `keshvaar.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a reptilian alien bounty hunter with amber eyes, bone crest and ritual gold piercings, dark scaled armor set with amber gems, amber rim light, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Pirate de Varan** → `varan.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a ruthless space pirate captain with a red respirator mask and long dark coat, chains and trophies, one glowing red cybernetic eye, red rim light, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Mystique du Chœur** → `choeur.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a hooded cosmic mystic whose face is half hidden by a veil of floating light particles, glowing golden runes on the hood, deep blue and gold palette, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Courtier du Gravhorn** → `gravhorn.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a heavyset syndicate broker with slicked hair, gold teeth, high-collared emerald suit, holographic contracts floating around him, green rim light, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Inquisitrice** → `inquisition.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a stern inquisitor in white and crimson ceremonial armor, shaved head with glowing white tattoos, piercing pale eyes, halo-like light behind her, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Traqueur de la Meute** → `meute.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a feral pack hunter with wolf-like augmentations, fur-lined armor, glowing violet eyes, claw marks painted on the face, violet rim light, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

## Machines

**Androïde diplomate** → `androide.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, an elegant porcelain-white android diplomat with a serene face, thin violet light lines across the cheeks, ornate high collar, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Robot éclaireur** → `robot.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a compact scout robot with a single large round cyan optic, small antennas, scratched white plating with orange markings, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Conscience d'IA** → `ia.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, an abstract artificial intelligence face made of glowing cyan circuitry and floating data fragments, faint human features, symmetrical, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Drone de combat** → `drone.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a menacing combat drone head with a triangular red sensor array, matte black armor plates, heat haze from its vents, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed face, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

## Préparer les images

- Midjourney sort du 1024 × 1024 : réduis en 512 × 512 et exporte en WebP qualité 85 (Squoosh ou `cwebp -q 85 -resize 512 512`).
- Tu peux aussi me les envoyer : je les recadre, les convertis et les ajoute.

---

# Deuxième vague : 22 avatars de plus

Mêmes règles que plus haut : fichier `public/assets/avatars/presets/<id>.webp`, 512 × 512, visage dans la moitié haute. Les emplacements sont déjà déclarés dans `src/lib/avatarPresets.ts` : chaque image apparaît dans la galerie dès qu'elle est déposée.

> Pour rester dans le style de la première vague, ajoute `--sref <URL de ton amirale> --sw 300` à chaque prompt.

## Équipage

Les visages du quotidien à bord, du pont aux soutes.

**Navigatrice stellaire** → `navigatrice.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a young star navigator with constellation tattoos glowing faintly on her temples, headset with a holographic star chart over one eye, short braided hair, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Contrebandier** → `contrebandier.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a charming smuggler with a three-day beard, high-collared worn duster coat, a hidden blaster strap on the shoulder, smirk, warm amber rim light, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Canonnière** → `canonniere.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a tough female gunner with ear protectors around her neck, soot on her cheeks, heavy armored vest with ammunition belts, determined stare, orange muzzle-flash light, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Cuisinier de bord** → `cuisinier.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a jovial space station cook with a magnetic apron, cybernetic arm holding a steaming ladle, round friendly face, warm kitchen light, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Mécano des soutes** → `mecano.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a wiry teenage mechanic with oversized welding goggles on the forehead, grease-stained face, a small floating repair drone beside the head, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Aumônier du vide** → `aumonier.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a calm elderly chaplain of the void with a hooded grey robe, glowing pendant shaped like a ringed planet, gentle wrinkled face, soft silver light, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

## Légendes

Figures marquantes du secteur, pour les joueurs qui aiment le panache.

**Chasseuse de primes** → `chasseuse.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a legendary bounty huntress with a scarred face, long dark hair tied back, trophy necklace of alien teeth, targeting reticle glowing in her cybernetic eye, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Archiviste du Codex** → `archiviste.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, an ancient archivist with translucent skin revealing faint circuitry, floating holographic pages orbiting around the head, wise tired eyes, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Seigneur déchu** → `seigneur_dechu.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a fallen warlord with a cracked ornate crown, broken heavy armor, defiant proud expression, embers floating in the air, deep red rim light, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Héritière stellaire** → `heritiere.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a young noble heiress with an elaborate high collar of gold filigree, star-shaped jewels in her hair, cold confident gaze, regal violet light, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Maître de la Fonderie** → `forgeron.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a massive master smith of the quantum foundry with glowing molten veins on the forearms, leather apron, braided beard, intense furnace light, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Cultiste du Léviathan** → `cultiste.webp`
```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a mysterious Leviathan cultist with a hood made of iridescent scales, tentacle-shaped jewelry, eyes glowing deep teal, abyssal bioluminescent light, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

## Créatures

Pour ceux qui préfèrent un museau à un visage.

**Furet pilote** → `furet.webp`
```
/imagine prompt: sci-fi strategy game creature portrait, head and shoulders, a cute ferret wearing a tiny space pilot helmet and scarf, curious big eyes, playful expression, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Poulpe diplomate** → `poulpe.webp`
```
/imagine prompt: sci-fi strategy game creature portrait, head and shoulders, a small elegant octopus alien wearing a monocle and a tiny high collar, tentacles holding a holographic contract, intelligent eyes, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Chat de bord** → `chat.webp`
```
/imagine prompt: sci-fi strategy game creature portrait, head and shoulders, a scruffy ship cat with a cybernetic ear and a tiny mission patch on its collar, half-closed unimpressed eyes, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Insectoïde éclaireur** → `insectoide.webp`
```
/imagine prompt: sci-fi strategy game creature portrait, head and shoulders, an insectoid alien scout with iridescent green carapace, compound eyes reflecting stars, delicate antennae, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Golem de cristal** → `golem.webp`
```
/imagine prompt: sci-fi strategy game creature portrait, head and shoulders, a crystal golem head made of glowing violet amethyst shards, faint face carved in the crystal, inner light, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

**Wyverne du vide** → `dragon.webp`
```
/imagine prompt: sci-fi strategy game creature portrait, head and shoulders, a small void wyvern with obsidian scales, glowing cyan eyes and starlight shimmering along its horns, centered, facing the viewer, face in the upper half, dramatic rim light, dark deep-space background with faint nebula, painterly digital illustration, highly detailed, bold readable silhouette at small size, no text, no frame --ar 1:1 --v 7 --style raw --s 200
```

## Insignes

Sans visage : un emblème, pour rester anonyme avec style.

**Insigne de la flotte** → `insigne_flotte.webp`
```
/imagine prompt: sci-fi game emblem avatar, circular badge, a winged starship crest with crossed lances, polished gold metal on deep navy enamel, centered, symmetrical, metallic bevel, soft glow, dark deep-space background, highly detailed, readable at small size, no text --ar 1:1 --v 7 --style raw --s 200
```

**Crâne de pirate** → `insigne_crane.webp`
```
/imagine prompt: sci-fi game emblem avatar, circular badge, a stylized space pirate skull with a cracked visor and crossed plasma cutters, red and black enamel, centered, symmetrical, metallic bevel, soft glow, dark deep-space background, highly detailed, readable at small size, no text --ar 1:1 --v 7 --style raw --s 200
```

**Atome de recherche** → `insigne_atome.webp`
```
/imagine prompt: sci-fi game emblem avatar, circular badge, an atom symbol orbiting a glowing core, cyan holographic lines on dark steel, centered, symmetrical, metallic bevel, soft glow, dark deep-space background, highly detailed, readable at small size, no text --ar 1:1 --v 7 --style raw --s 200
```

**Couronne d'empire** → `insigne_couronne.webp`
```
/imagine prompt: sci-fi game emblem avatar, circular badge, an imperial crown above a ringed planet, gold filigree on violet enamel, centered, symmetrical, metallic bevel, soft glow, dark deep-space background, highly detailed, readable at small size, no text --ar 1:1 --v 7 --style raw --s 200
```

## Astuces

- **Créatures** : si Midjourney rend un animal trop réaliste, ajoute `stylized, expressive` après la description.
- **Insignes** : pour une série homogène, génère d'abord l'insigne de la flotte, puis utilise son URL en `--sref` pour les trois autres.
- **Variantes** : `--cref <URL> --cw 60` garde le même personnage avec une autre expression ou une autre tenue.
