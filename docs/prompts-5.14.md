# 5.14 : prompts Midjourney (officiers rares, saisons, boss mondiaux)

Même ambiance que le reste du jeu : espace sombre, néons cyan `#4be8ff` et or `#ffd86b`, interfaces holographiques,
coins coupés (voir `docs/DESIGN.md`). Aucun texte dans l'image.

Portraits : format 4:5, exportés en 640 × 800, WebP qualité 85, dans `public/assets/commanders/<id>.webp`. Tant qu'un
portrait manque, la page affiche l'icône du rôle sur un dégradé à sa couleur.

## Les sept officiers rares

Ils ne se recrutent pas : un commandant de saison de leur rôle au dernier palier d'un passe, ou une trouvaille très rare
sur un boss (0,2 % par participant, 0,5 % sur le podium).

### Tamsin Okoro, Logisticienne (`logistician.webp`)

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a focused woman in her thirties, close-cropped hair, dark skin, a fleet logistics officer in a utilitarian grey flight jacket with cyan #4be8ff route lines glowing on a holographic wrist display, star chart reflections in her eyes, centered, facing the viewer, dramatic rim light, dark deep-space background with faint cargo convoy lights, painterly digital illustration, highly detailed face, clean silhouette, no text --ar 4:5 --v 7 --style raw --s 200
```

### Brann Kessel, Mécanicien (`mechanic.webp`)

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a broad-shouldered bearded man in his fifties, starship mechanic with grease-streaked face, welding goggles pushed up on his forehead, heavy orange-ember work harness, a glowing ember #ff8a3d spark reflected on his cheek, centered, facing the viewer, dramatic rim light, dark shipyard hangar background with a half-built hull, painterly digital illustration, highly detailed face, clean silhouette, no text --ar 4:5 --v 7 --style raw --s 200
```

### Livia Marchetti, Gouverneure (`governor.webp`)

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, an elegant woman in her forties with dark hair in a tight braid, colonial governor in a high-collared mint green and white coat with a small planet-shaped brooch, calm confident gaze, a terraformed colony planet glowing softly behind her, centered, facing the viewer, dramatic rim light, painterly digital illustration, highly detailed face, clean silhouette, no text --ar 4:5 --v 7 --style raw --s 200
```

### Dax Morrow, Corsaire (`corsair.webp`)

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a roguish man in his thirties with a scar across one eyebrow and a short beard, space corsair in a worn crimson long coat with brass buckles, a gold #ffd86b coin glinting between his fingers, red danger lights from a boarding corridor behind him, centered, facing the viewer, dramatic rim light, painterly digital illustration, highly detailed face, clean silhouette, no text --ar 4:5 --v 7 --style raw --s 200
```

### Ysolde Grey, Gardienne (`warden.webp`)

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a stern woman in her fifties with silver hair tied back, vault warden in heavy gold #ffd86b and gunmetal armor with a large shield emblem on the chest, a sealed blast door with glowing locks behind her, centered, facing the viewer, dramatic rim light, painterly digital illustration, highly detailed face, clean silhouette, no text --ar 4:5 --v 7 --style raw --s 200
```

### Auren Sol, Diplomate (`diplomat.webp`)

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, an androgynous diplomat in their thirties with shaved sides and a long top knot, flowing violet #a78bfa and white robes with a translucent holographic sash, a faint smile, two allied fleet banners as holograms behind them, centered, facing the viewer, dramatic rim light, dark space station hall background, painterly digital illustration, highly detailed face, clean silhouette, no text --ar 4:5 --v 7 --style raw --s 200
```

### Kaelen Voss, Chasseur de colosses (`hunter.webp`)

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a weathered man in his forties with a cybernetic targeting eye glowing red, colossus hunter wearing a trophy tooth of a giant space beast on a cord, dark armored coat with harpoon cannon straps, the silhouette of an enormous creature in the dark behind him, centered, facing the viewer, dramatic rim light, painterly digital illustration, highly detailed face, clean silhouette, no text --ar 4:5 --v 7 --style raw --s 200
```

## Les six boss mondiaux

Un par semaine, en rotation, jamais le même jour que le précédent. Illustration 16:9, 1600 × 900, WebP qualité 85,
au chemin indiqué (tant qu'elle manque, la page affiche le Léviathan). Le Léviathan garde ses images actuelles.

### Le Léviathan, le dévoreur des abysses (`/assets/leviathan/leviathan.webp`)

Né dans les profondeurs d'une géante gazeuse morte, le Léviathan remonte à la surface du secteur quand la faim le prend. Sa carapace a avalé des flottes entières ; ses écailles en gardent les épaves.

Phases : Assaut, Riposte, Carapace fissurée. Titre du premier : « Fléau du Léviathan ».

```
/imagine prompt: sci-fi strategy game key art, a colossal armored space leviathan rising from the clouds of a dead gas giant, wrecked warships embedded in its scales, tiny battle fleets swarming around it, cyan #4be8ff and gold #ffd86b light, cinematic wide shot, painterly concept art, high detail, no text --ar 16:9 --v 7 --style raw --s 250
```

### La Matriarche, mère de l'Essaim (`/assets/bosses/matriarche.webp`)

Quand la Reine des Kesh'Vaar a disparu, sa sœur a pris le trône de chitine. La Matriarche ne combat pas seule : chaque blessure libère une nuée de rejetons qui harcèlent les flottes.

Phases : Nuée, Frénésie, Couvée exposée. Titre du premier : « Fléau de la Matriarche ».

```
/imagine prompt: sci-fi strategy game key art, a gigantic insectoid hive queen floating in space, translucent amber carapace, swarms of smaller bio-ships pouring from her abdomen, hive structures glowing gold #ffd86b, cinematic wide shot, painterly concept art, high detail, no text --ar 16:9 --v 7 --style raw --s 250
```

### Le Titan de rouille, la forge qui marche (`/assets/bosses/titan.webp`)

Une station-forge de l'ancien empire, devenue folle après trois siècles seule. Elle dévore les épaves pour grandir, et refait ses blindages à mesure qu'on les arrache.

Phases : Blindage, Refonte, Fournaise à nu. Titre du premier : « Briseur du Titan ».

```
/imagine prompt: sci-fi strategy game key art, a colossal rusted war machine made from fused station modules and wrecked hulls, glowing ember #ff8a3d forge furnaces in its chest, mechanical arms tearing a cruiser apart, cinematic wide shot, painterly concept art, high detail, no text --ar 16:9 --v 7 --style raw --s 250
```

### Le Spectre du Chœur, la voix dans le silence (`/assets/bosses/spectre.webp`)

Le Chœur Silencieux a laissé derrière lui une conscience sans corps. Le Spectre brouille les capteurs, retourne les sondes et chante dans les canaux de communication jusqu'à ce que les équipages perdent la raison.

Phases : Brouillage, Chant, Silence. Titre du premier : « Exorciste du Chœur ».

```
/imagine prompt: sci-fi strategy game key art, an enormous ghostly entity made of violet #a78bfa light and static, a faceless choir of luminous figures forming its body, warships with flickering shields drifting in confusion, cinematic wide shot, painterly concept art, high detail, no text --ar 16:9 --v 7 --style raw --s 250
```

### Le Cométophage, le mangeur d'étoiles filantes (`/assets/bosses/cometophage.webp`)

Il suit les comètes depuis des millénaires et se nourrit de leur glace. Quand il approche, le ciel s'emplit de traînées de feu : chacune est un fragment qu'il a recraché.

Phases : Pluie de feu, Constriction, Gorge ouverte. Titre du premier : « Chasseur du Cométophage ».

```
/imagine prompt: sci-fi strategy game key art, a gigantic serpentine space creature wrapped around a blazing scarlet comet, its body shedding burning ice fragments like a meteor shower, hunter fleets diving between the fragments, red #ff5c7a and cyan light, cinematic wide shot, painterly concept art, high detail, no text --ar 16:9 --v 7 --style raw --s 250
```

### L'Abyssal, ce qui dort sous le Vide (`/assets/bosses/abyssal.webp`)

Personne ne l'a jamais vu en entier. Les éclaireurs parlent d'un œil grand comme une lune et d'une ombre qui éteint les étoiles. Quand l'Abyssal se réveille, même les seigneurs de guerre rentrent au port.

Phases : Éveil, Marée noire, L'Œil. Titre du premier : « Veilleur de l'Abîme ».

```
/imagine prompt: sci-fi strategy game key art, an unfathomably huge shadowy creature emerging from a black void, a single glowing magenta #ff5fd2 eye the size of a moon, stars going dark around its silhouette, a tiny fleet in the foreground for scale, cinematic wide shot, painterly concept art, high detail, no text --ar 16:9 --v 7 --style raw --s 250
```

## Les 36 saisons du passe

Douze thèmes en rotation (un par mois, à partir de novembre 2026), trois ans : chaque saison a son illustration
(16:9, en-tête de la page du passe, 1600 × 900, `public/assets/pass/<theme>-<année>.webp`) et le portrait de son commandant
(`public/assets/commanders/s-AAAA-MM.webp`). Les deux prompts sont aussi dans l'administration (onglet Passe), prêts à copier.

### 1. Novembre 2026 : L'Appel du Vide (`vide-1`)

Ilka Morrow, éclaireuse des franges : logisticienne et, à moitié, espionne.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a lone scout ship crossing a vast magenta nebula toward a faint signal beacon, tiny convoy lights following far behind, cinematic wide shot, dark deep-space palette with #ff5fd2 accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a lean deep-space scout woman with star-map tattoos glowing magenta, worn explorer gear, nebula behind, a character named Ilka Morrow, centered, facing the viewer, dramatic rim light in #ff5fd2, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 2. Décembre 2026 : Hiver galactique (`hiver-1`)

Brynja Solvei, gardienne du givre : gardienne et, à moitié, stratège.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a fortified ice-covered depot planet under a pale blue aurora, armored doors glowing, distant raider lights in the dark, cinematic wide shot, dark deep-space palette with #9fd8ff accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a stoic winter warden in white armored furs, frost on shoulders, sealed vault door glowing pale blue behind, a character named Brynja Solvei, centered, facing the viewer, dramatic rim light in #9fd8ff, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 3. Janvier 2027 : Forge Stellaire (`forge-1`)

Oriane Ferrand, maîtresse de forge : ingénieure et, à moitié, intendant.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a colossal star forge built around a red dwarf, molten rivers of metal and orange sparks, cyan scaffolding lights, cinematic wide shot, dark deep-space palette with #ffb347 accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a brilliant starship engineer woman, welding goggles on forehead, orange-lit forge sparks, mechanical arm, a character named Oriane Ferrand, centered, facing the viewer, dramatic rim light in #ffb347, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 4. Février 2027 : Le Grand Bazar (`bazar-1`)

Isidore Vantal, ambassadeur du bazar : diplomate et, à moitié, intendant.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a huge orbital bazaar ring full of colorful stalls and docked merchant ships, emerald and gold lanterns, crowds of aliens, cinematic wide shot, dark deep-space palette with #5ef2b0 accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a silver-tongued diplomat in emerald silk robes, holographic contracts, warm market lights behind, a character named Isidore Vantal, centered, facing the viewer, dramatic rim light in #5ef2b0, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 5. Mars 2027 : Marée d'Acier (`maree-1`)

Maren Kestrel, amirale des marées : amiral et, à moitié, stratège.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, two enormous battle fleets clashing like waves, cyan and red beams, a capital ship breaking through the line, cinematic wide shot, dark deep-space palette with #4be8ff accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a fierce naval fleet admiral woman, weathered face, long coat with cyan trim, holographic tactical map behind, a character named Maren Kestrel, centered, facing the viewer, dramatic rim light in #4be8ff, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 6. Avril 2027 : Nouveaux Mondes (`colonies-1`)

Célia Marchal, gouverneure des franges : gouverneure et, à moitié, intendant.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a freshly terraformed green planet at dawn, colony domes and landing ships, a mint-colored sunrise over new cities, cinematic wide shot, dark deep-space palette with #5ef2b0 accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a visionary colonial governor woman in a white and mint long coat, terraformed green planet glowing behind, a character named Célia Marchal, centered, facing the viewer, dramatic rim light in #5ef2b0, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 7. Mai 2027 : Saison des chasseurs (`primes-1`)

Jax Varro, corsaire de la ruche : corsaire et, à moitié, amiral.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a bounty board of glowing holographic wanted posters in a hive-like station, corsair ships docking under golden light, cinematic wide shot, dark deep-space palette with #ffd86b accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a lethal bounty hunter with golden trophy medallions, insect-like armor plates, predatory eyes, a character named Jax Varro, centered, facing the viewer, dramatic rim light in #ffd86b, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 8. Juin 2027 : Comète écarlate (`comete-1`)

Kira Valdane, chasseuse de comètes : chasseur de colosses et, à moitié, amiral.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a blazing scarlet comet crossing the sector, a colossal creature silhouette in its tail, hunter ships in pursuit, cinematic wide shot, dark deep-space palette with #ff5c7a accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a daring comet-chasing pilot woman, scarred flight jacket, red glowing comet tail reflected in her visor, a character named Kira Valdane, centered, facing the viewer, dramatic rim light in #ff5c7a, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 9. Juillet 2027 : La Grande Moisson (`moisson-1`)

Basile Granger, intendant des greniers : intendant et, à moitié, gouverneure.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, golden harvest fields on a planet seen from orbit, huge harvester ships and granary stations glowing gold, cinematic wide shot, dark deep-space palette with #ffd86b accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a prosperous imperial steward in gold-embroidered robes, glowing ledger hologram, golden harvest fields behind, a character named Basile Granger, centered, facing the viewer, dramatic rim light in #ffd86b, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 10. Août 2027 : L'Ombre des Archives (`archives-1`)

Selene Marrow, archiviste de l'ombre : espionne et, à moitié, stratège.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a vast dark archive station with endless violet data shelves, a hooded figure stealing a glowing data core, cinematic wide shot, dark deep-space palette with #a78bfa accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a mysterious spymaster woman in a dark hooded coat, violet holographic data streams, half of face in shadow, a character named Selene Marrow, centered, facing the viewer, dramatic rim light in #a78bfa, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 11. Septembre 2027 : L'Arsenal (`chantiers-1`)

Petra Varga, mécanicienne en chef : mécanicien et, à moitié, ingénieure.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, an enormous orbital shipyard with rows of warships under construction, ember sparks and scaffolding lights, cinematic wide shot, dark deep-space palette with #ff8a3d accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a gruff shipyard master mechanic woman, welding goggles, ember sparks, colossal hull under construction behind, a character named Petra Varga, centered, facing the viewer, dramatic rim light in #ff8a3d, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 12. Octobre 2027 : Le Rempart (`rempart-1`)

Hadrien Valcourt, stratège de siège : stratège et, à moitié, gardienne.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a fortress planet ringed with shield walls under siege, waves of raider ships breaking against blue energy barriers, cinematic wide shot, dark deep-space palette with #7fb2ff accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a stern siege strategist in heavy blue-grey armor, battle-worn cloak, fortress walls and shield generators behind, a character named Hadrien Valcourt, centered, facing the viewer, dramatic rim light in #7fb2ff, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 13. Novembre 2027 : Au-delà des franges (`vide-2`)

Corentin Vash, maître des routes : logisticienne et, à moitié, gouverneure.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a long convoy of colony ships threading a glowing corridor between two magenta nebulae, a green world on the horizon, cinematic wide shot, dark deep-space palette with #ff5fd2 accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a calm convoy master in a long travel coat, route holograms around his hands, colony ships glowing behind, a character named Corentin Vash, centered, facing the viewer, dramatic rim light in #ff5fd2, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 14. Décembre 2027 : La Longue Nuit (`hiver-2`)

Aldo Frostmere, intendant de la longue nuit : gardienne et, à moitié, intendant.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, endless night over a frozen colony, warm golden lights in armored granaries, a pale aurora overhead, cinematic wide shot, dark deep-space palette with #9fd8ff accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a meticulous quartermaster in thick grey furs, frost-rimmed spectacles, glowing inventory hologram, snow falling, a character named Aldo Frostmere, centered, facing the viewer, dramatic rim light in #9fd8ff, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 15. Janvier 2028 : Le Grand Chantier (`forge-2`)

Bastien Rivet, architecte des étoiles : ingénieure et, à moitié, mécanicien.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a gigantic space station under construction with thousands of welding sparks, cranes and drones, orange and cyan light, cinematic wide shot, dark deep-space palette with #ffb347 accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a bearded master architect with holographic blueprints floating around him, orange forge light, steel scaffolds, a character named Bastien Rivet, centered, facing the viewer, dramatic rim light in #ffb347, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 16. Février 2028 : Route de la soie stellaire (`bazar-2`)

Saskia Brel, émissaire corsaire : diplomate et, à moitié, corsaire.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a long trade route of glowing gates across space, merchant convoys escorted by corsair frigates, emerald and red lights, cinematic wide shot, dark deep-space palette with #5ef2b0 accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a charismatic former pirate turned envoy, red sash over a diplomatic coat, golden earrings, convoy lights behind, a character named Saskia Brel, centered, facing the viewer, dramatic rim light in #5ef2b0, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 17. Mars 2028 : Ressac de guerre (`maree-2`)

Corvin Drakmor, brise-ligne : amiral et, à moitié, chasseur de colosses.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a battle fleet charging through the wake of a colossal space beast, cyan beams, debris and a stormy nebula, cinematic wide shot, dark deep-space palette with #4be8ff accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a grim battle-scarred admiral with a cybernetic jaw, heavy navy coat, colossal beast silhouette behind the fleet, a character named Corvin Drakmor, centered, facing the viewer, dramatic rim light in #4be8ff, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 18. Avril 2028 : La Ruée vers les franges (`colonies-2`)

Ravi Lindqvist, bâtisseur de mondes : gouverneure et, à moitié, logisticienne.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a chain of young colony worlds linked by glowing supply lanes, cargo ships streaming between them, mint and cyan light, cinematic wide shot, dark deep-space palette with #5ef2b0 accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, an energetic colonial planner with rolled-up sleeves, holographic supply routes connecting planets around him, a character named Ravi Lindqvist, centered, facing the viewer, dramatic rim light in #5ef2b0, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 19. Mai 2028 : Tableau de chasse (`primes-2`)

Nell Sorrow, traqueuse de primes : corsaire et, à moitié, espionne.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a dark asteroid hideout lit by a single violet scanner beam, a corsair ship lurking in the shadows, golden bounty markers, cinematic wide shot, dark deep-space palette with #ffd86b accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a shadowy bounty tracker woman with a hood and violet scanning visor, golden bounty tokens on her belt, a character named Nell Sorrow, centered, facing the viewer, dramatic rim light in #ffd86b, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 20. Juin 2028 : La Pluie de feu (`comete-2`)

Orrin Blackthorn, armurier des chasses : chasseur de colosses et, à moitié, ingénieure.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a rain of fiery comet fragments falling across space, giant beasts hatching from them, hunter ships firing harpoons, cinematic wide shot, dark deep-space palette with #ff5c7a accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a burly weaponsmith with glowing red harpoon prototypes, soot-covered apron, comet fire in the sky behind, a character named Orrin Blackthorn, centered, facing the viewer, dramatic rim light in #ff5c7a, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 21. Juillet 2028 : Saison d'abondance (`moisson-2`)

Ines Hallberg, trésorière d'empire : intendant et, à moitié, gardienne.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, armored golden granary vaults on a fertile world, shield domes shimmering, a hive swarm gathering on the horizon, cinematic wide shot, dark deep-space palette with #ffd86b accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a stern imperial treasurer with golden keys at her belt, armored robes, sealed golden vaults behind, a character named Ines Hallberg, centered, facing the viewer, dramatic rim light in #ffd86b, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 22. Août 2028 : Les Fichiers noirs (`archives-2`)

Lucien Grave, négociateur des secrets : espionne et, à moitié, diplomate.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a shadowy embassy room with a single glowing black data file on a table, violet light, silhouettes listening behind glass, cinematic wide shot, dark deep-space palette with #a78bfa accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, an elegant spy in a dark violet suit, a black data folder glowing in his hand, quiet smile, shadowy embassy behind, a character named Lucien Grave, centered, facing the viewer, dramatic rim light in #a78bfa, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 23. Septembre 2028 : Cale sèche (`chantiers-2`)

Gunnar Holt, chef de cale : mécanicien et, à moitié, amiral.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a dry dock full of battle-damaged warships under repair, ember welding sparks, a fleet launching in the background, cinematic wide shot, dark deep-space palette with #ff8a3d accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a veteran dockmaster with a cybernetic hand, battle-scarred coat over work overalls, damaged warships in dry dock behind, a character named Gunnar Holt, centered, facing the viewer, dramatic rim light in #ff8a3d, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 24. Octobre 2028 : Les Murs de Vashka (`rempart-2`)

Irsa Stenn, gardienne de la ligne : stratège et, à moitié, mécanicien.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, repair crews welding a cracked fortress wall in orbit while defensive batteries fire at incoming rams, blue and ember light, cinematic wide shot, dark deep-space palette with #7fb2ff accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a tough defensive commander with a repair tool and shield emitter, scorched blue armor, cracked fortress wall behind, a character named Irsa Stenn, centered, facing the viewer, dramatic rim light in #7fb2ff, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 25. Novembre 2028 : Terra incognita (`vide-3`)

Sefa Arkwright, pisteuse du vide : logisticienne et, à moitié, chasseur de colosses.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, an immense dark creature silhouette drifting through a magenta void, a small tracker ship following its luminous trail, cinematic wide shot, dark deep-space palette with #ff5fd2 accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a scarred void tracker with a long-range targeting monocle, harpoon rig on her back, enormous shadow drifting behind, a character named Sefa Arkwright, centered, facing the viewer, dramatic rim light in #ff5fd2, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 26. Décembre 2028 : Givre éternel (`hiver-3`)

Halvard Rime, gardien des cales gelées : gardienne et, à moitié, mécanicien.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a frozen orbital hangar with ice crystals on the hulls, welders' blue sparks and a pale aurora through the hangar windows, cinematic wide shot, dark deep-space palette with #9fd8ff accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a towering armored warden with a frost-covered mechanical arm, blue ice crystals on armor, frozen hangar behind, a character named Halvard Rime, centered, facing the viewer, dramatic rim light in #9fd8ff, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 27. Janvier 2029 : Cœur de l'Enclume (`forge-3`)

Nyra Okonkwo, ingénieure en chef : ingénieure et, à moitié, amiral.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a massive anvil-shaped forge station cradling an unfinished capital warship, orange molten light and cyan tactical holograms, cinematic wide shot, dark deep-space palette with #ffb347 accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a confident chief engineer in an officer's coat with forge-scorched sleeves, warship blueprint hologram, orange glow, a character named Nyra Okonkwo, centered, facing the viewer, dramatic rim light in #ffb347, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 28. Février 2029 : Foire des mondes (`bazar-3`)

Auriel Kesh, diplomate de l'ombre : diplomate et, à moitié, espionne.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a grand festival of worlds inside a domed station, floating lanterns, envoys of many species, a hidden figure watching from a balcony, cinematic wide shot, dark deep-space palette with #5ef2b0 accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, an elegant masked diplomat in violet and emerald silks, whisper-thin holographic veil, festive fair lights behind, a character named Auriel Kesh, centered, facing the viewer, dramatic rim light in #5ef2b0, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 29. Mars 2029 : La Grande Houle (`maree-3`)

Thessa Haldane, capitaine de la houle : amiral et, à moitié, logisticienne.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a swarm of fast warships jumping in formation across a star map, cyan hyperspace trails like a rising swell, cinematic wide shot, dark deep-space palette with #4be8ff accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a swift fleet captain with windswept hair, flight jacket with cyan route lines, multiple fleet holograms around her, a character named Thessa Haldane, centered, facing the viewer, dramatic rim light in #4be8ff, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 30. Avril 2029 : Terres d'aube (`colonies-3`)

Anouk Ibarra, intendante coloniale : gouverneure et, à moitié, gardienne.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, fortified colony domes on a dawn-lit world, shield generators humming, raider ships turning away in the sky, cinematic wide shot, dark deep-space palette with #5ef2b0 accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a determined colonial administrator in mint and steel armor, shield emblem, fortified colony domes behind, a character named Anouk Ibarra, centered, facing the viewer, dramatic rim light in #5ef2b0, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 31. Mai 2029 : La Grande Traque (`primes-3`)

Garrick Fen, corsaire des colosses : corsaire et, à moitié, chasseur de colosses.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a pack of corsair ships with harpoon cannons circling an enormous space beast, golden bounty hologram above, cinematic wide shot, dark deep-space palette with #ffd86b accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a grizzled corsair with a giant beast tooth necklace, crimson coat, harpoon cannons on his ship behind, a character named Garrick Fen, centered, facing the viewer, dramatic rim light in #ffd86b, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 32. Juin 2029 : Sillage rouge (`comete-3`)

Vex Haldor, grand veneur : chasseur de colosses et, à moitié, corsaire.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a red glowing trail through space leading to a nest of colossal beasts, corsair and hunter ships side by side, cinematic wide shot, dark deep-space palette with #ff5c7a accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a charismatic master hunter with a red cloak, trophy-adorned armor, a colossal skull mounted behind, a character named Vex Haldor, centered, facing the viewer, dramatic rim light in #ff5c7a, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 33. Juillet 2029 : Les Greniers d'or (`moisson-3`)

Léopold Sato, maître des récoltes : intendant et, à moitié, diplomate.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a golden granary station trading with merchant ships of many empires, grain containers glowing gold and emerald, cinematic wide shot, dark deep-space palette with #ffd86b accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a wise harvest master in gold and emerald robes, trade agreement holograms, ships loading grain behind, a character named Léopold Sato, centered, facing the viewer, dramatic rim light in #ffd86b, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 34. Août 2029 : Silence radio (`archives-3`)

Nyx Varell, spectre : espionne et, à moitié, corsaire.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, a cloaked raider ship slipping past a sleeping fleet in total radio silence, faint violet static in the dark, cinematic wide shot, dark deep-space palette with #a78bfa accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a stealthy infiltrator with a dark visor reflecting violet static, sleek black armor, cloaked ship behind, a character named Nyx Varell, centered, facing the viewer, dramatic rim light in #a78bfa, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 35. Septembre 2029 : Rivets et canons (`chantiers-3`)

Silas Crane, maître armurier : mécanicien et, à moitié, logisticienne.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, cargo convoys delivering glowing parts to a busy shipyard, cranes moving cannon barrels, ember and cyan lights, cinematic wide shot, dark deep-space palette with #ff8a3d accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a methodical armorer with a tool harness, holographic parts inventory, cargo ships unloading behind, a character named Silas Crane, centered, facing the viewer, dramatic rim light in #ff8a3d, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```

### 36. Octobre 2029 : Ligne de fer (`rempart-3`)

Osric Keld, maître des remparts : stratège et, à moitié, chasseur de colosses.

Illustration :

```
/imagine prompt: sci-fi strategy game key art, an iron defensive line of battleships facing a colossal siege beast, blue shields and heavy cannon fire, cinematic wide shot, dark deep-space palette with #7fb2ff accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250
```

Portrait :

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, an imposing iron-clad strategist with a long war cloak, siege cannon behind, colossal siege beast on the horizon, a character named Osric Keld, centered, facing the viewer, dramatic rim light in #7fb2ff, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250
```
