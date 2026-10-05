# 5.16 : inventaire des illustrations et prompts Midjourney

Cet inventaire a été dressé en scannant le code. Il recense toutes les images que le jeu référence (chaînes `/assets/…` du moteur et des pages, chemins construits à partir des identifiants), puis celles qui manquent dans `public/assets`.

Rappels de style (voir `docs/DESIGN.md`) :

- espace sombre, interfaces holographiques, silhouettes nettes, **aucun texte dans l'image** ;
- depuis la 5.16, le jeu a **10 thèmes** (cyan, orange, vert acide, ivoire…). Pour tout ce qui sert de **fond** (en-têtes, cartes, scènes), préférer une lumière **neutre et peu saturée** : le thème du joueur colore l'interface autour, et une image très teintée jurerait avec la moitié des thèmes. Les portraits et les boss peuvent garder leurs couleurs propres ;
- export en WebP qualité 85.

## 1. Ce qui manque aujourd'hui

Les 5 boss mondiaux, les 7 officiers rares, l'en-tête du passe et le sceau « chapitre terminé » sont en place. Il reste des images pour les chroniques générées : le jeu les remplace par un repli tant qu'elles manquent.

| Fichiers manquants | Nombre | Repli actuel | Prompts |
|:--|--:|:--|:--|
| `public/assets/chronicles/auto/inquisition-boss.webp` | 1 | images des chapitres faits main | `docs/prompts-generateur-5.4.md`, « Boss » |

Les 7 sceaux et 6 boss sur 7 sont faits.

Une fois une image déposée, ajouter l'identifiant de l'archétype dans `AUTO_ART` (boss) ou `AUTO_SEALS` (sceau), dans `src/game/procedural.ts`. Un test vérifie que chaque identifiant déclaré a bien son fichier.

Tout le reste est présent : les 195 images des données du moteur, les rangs, les capsules, les succès, les catégories du blog et les 40 avatars prédéfinis.

## 2. Nouvelles illustrations proposées (5.16)

Le jeu tourne sans ces images. Chaque section indique l'endroit où brancher l'image une fois créée.

### 2.1 Mutateurs du mois (10 cartes, 16:9, 1280 × 720)

Fichiers : `public/assets/mutators/<id>.webp`.

Emplacement : derrière le `MutatorCallout`, sur l'accueil et dans les Chroniques. L'image passe en fond, très atténuée, à droite du texte.

Gabarit commun, à compléter par la scène de chaque mutateur :

```
/imagine prompt: sci-fi strategy game event card illustration, wide establishing shot, <SCENE>, deep space, cinematic volumetric light, muted neutral color grading with a single restrained accent, painterly digital matte painting, clean composition with empty negative space on the left third for UI text, no text, no letters, no logo --ar 16:9 --v 7 --style raw --s 250
```

| id | Mutateur | `<SCENE>` |
|:--|:--|:--|
| `ruee` | Ruée industrielle | a planet covered in roaring mining rigs and smelters, sparks and molten streams seen from low orbit, cargo haulers queueing |
| `chantiers` | Chantiers fiévreux | a colossal orbital construction yard at night, hundreds of welding lights on half-built megastructures, worker drones swarming |
| `savoir` | Âge du savoir | an orbital research station with rings of glowing data cores, holographic equations floating between the modules |
| `vents` | Vents solaires | a fleet riding a luminous solar wind stream, ion trails stretching past a bright star, sails of energy |
| `guerre` | Saison de guerre | two fleets clashing above a burning moon, beam weapons crossing, debris fields and distant explosions |
| `rempart` | Saison des remparts | a fortress planet wrapped in layered energy shields and defense platforms, repair drones patching armor plates |
| `marchands` | Foire des marchands | a bustling trade station with hundreds of docked merchant ships, lantern-lit market rings, cargo containers |
| `chantiers_navals` | Cadence des arsenaux | a shipyard assembly line launching identical warships one after another from drydocks, rhythmic lights |
| `soutes` | Grandes soutes | giant cargo freighters opening enormous holds in orbit, stacked containers, tugboats guiding loads |
| `chasse` | Grande chasse | hunters' fleet tracking a colossal space creature through a nebula, harpoon beams, scale contrast |

### 2.2 Traités avec les factions (3 cartes, 16:9, 1280 × 720)

Fichiers : `public/assets/treaties/{pact,escort,embargo}.webp`.

Emplacement : la ligne de traité de chaque faction, page Menaces (`TreatyRow`), en vignette à gauche.

```
/imagine prompt: sci-fi strategy game illustration, a tense negotiation in a dim pirate station hall, a holographic contract glowing between two gloved hands, credits chips stacked on a metal table, pirate banners in the shadows, muted neutral grading with warm rim light, painterly digital illustration, no text --ar 16:9 --v 7 --style raw --s 200
```

```
/imagine prompt: sci-fi strategy game illustration, a small convoy of cargo ships flanked by two battered pirate escort gunships flying in formation through an asteroid field, protective posture, muted neutral grading, cinematic lighting, painterly digital illustration, no text --ar 16:9 --v 7 --style raw --s 200
```

```
/imagine prompt: sci-fi strategy game illustration, a blockade line of military frigates with red warning beacons sealing a jump gate, a pirate raider fleet gathering in the distance, high tension, muted neutral grading with red accents, painterly digital illustration, no text --ar 16:9 --v 7 --style raw --s 200
```

### 2.3 Expéditions en profondeur (3 scènes, 21:9, 1680 × 720)

Fichiers : `public/assets/expeditions/depth-{1,2,3}.webp`.

Emplacement : la carte d'expédition, au moment du choix « Pousser plus loin » (`ExpeditionCard`). La scène change selon la profondeur visée.

```
/imagine prompt: sci-fi strategy game panoramic scene, a lone scouting fleet crossing into an uncharted sector, faint unknown stars, a thin nebula veil, sense of first discovery, muted neutral grading, cinematic, painterly matte painting, no text --ar 21:9 --v 7 --style raw --s 250
```

```
/imagine prompt: sci-fi strategy game panoramic scene, a fleet navigating a dense storm nebula with lightning between gas clouds, derelict alien wrecks drifting, growing danger, muted neutral grading, cinematic, painterly matte painting, no text --ar 21:9 --v 7 --style raw --s 250
```

```
/imagine prompt: sci-fi strategy game panoramic scene, a tiny fleet at the edge of a vast dark void with an ancient colossal structure barely visible, ominous silence, treasures glinting in debris, muted neutral grading, cinematic, painterly matte painting, no text --ar 21:9 --v 7 --style raw --s 250
```

### 2.4 Fonds d'en-tête des pages (16:9, 1600 × 900)

`PageHeader` accepte déjà une prop `backdrop`. Six pages en ont une : Commandement, Casino, Chroniques, Palmarès, Hall of fame des boss et Passe. Les plus visitées des autres pages, par ordre de priorité :

| Page | Fichier | Sujet |
|:--|:--|:--|
| Bâtiments | `public/assets/headers/batiments.webp` | an industrial planet surface with mining towers and reactors under a dark sky |
| Unités | `public/assets/headers/unites.webp` | a cavernous starship hangar with rows of fighters on launch rails |
| Galaxie | `public/assets/headers/galaxie.webp` | a wide spiral galaxy seen from its edge, faint sector grid overlay |
| Menaces | `public/assets/headers/menaces.webp` | pirate raiders emerging from a dark asteroid belt, warning beacons |
| Gazette | `public/assets/headers/gazette.webp` | a space station newsroom with floating holographic headlines (no readable text) |
| Ascension | `public/assets/headers/ascension.webp` | a radiant star collapsing into a new birth of light, transcendence |
| Alliance | `public/assets/headers/alliance.webp` | a council chamber with banners of many fleets around a holo-table |
| Missions | `public/assets/headers/missions.webp` | a mission briefing room with a tactical holo-map of a sector |

Gabarit :

```
/imagine prompt: sci-fi strategy game page header background, <SUJET>, wide cinematic composition, the subject on the right two thirds and calm dark space on the left third, low contrast, muted neutral grading, painterly matte painting, no text --ar 16:9 --v 7 --style raw --s 200
```

### 2.5 Mode photo de la planète (3 fonds, 1:1, 1200 × 1200)

Fichiers : `public/assets/photo/{nebuleuse,amas,aube}.webp`.

Emplacement : un sélecteur « Décor » dans `PlanetPhotoMode`, à la place du fond étoilé dessiné. La planète est posée au centre, il faut donc garder le centre vide.

```
/imagine prompt: deep space backdrop for a centered planet portrait, soft <VARIANTE>, the center of the frame left empty and dark, subtle stars, gentle vignette, muted neutral colors, high resolution, no planet, no text --ar 1:1 --v 7 --style raw --s 150
```

Valeurs de `<VARIANTE>` :

- `wispy blue-grey nebula clouds framing the edges` ;
- `a distant glittering star cluster in one corner` ;
- `the glow of a rising sun just below the bottom edge`.

### 2.6 Plans des unités (15 planches, 1:1, 1024 × 1024)

Fichiers : `public/assets/units/blueprint/<id>.webp`.

Emplacement : la fiche technique (`UnitSpecSheet`), à la place de l'image de l'unité sur la trame. On garde l'image habituelle si la planche manque.

Gabarit :

```
/imagine prompt: technical blueprint drawing of a sci-fi <UNITÉ>, orthographic side view with small top view inset, thin white and pale cyan line art on a dark navy grid paper, dimension lines and callout circles without readable text, engineering schematic style, clean vector look, centered, no shading, no letters --ar 1:1 --v 7 --style raw --s 100
```

| id | `<UNITÉ>` |
|:--|:--|
| `drone_recuperateur` | small salvage drone with four articulated grabber legs and a cargo pod |
| `sonde_espionnage` | tiny spherical spy probe with long sensor antennas |
| `fregate` | sleek light frigate with twin engines and a forward cannon |
| `cargo` | boxy cargo hauler with modular container racks |
| `sentinelle` | heavily armored slow gunboat with a large turret |
| `chasseur` | agile fighter with swept wings and twin blasters |
| `croiseur_nova` | large battlecruiser with layered armor and a long spinal gun |
| `etoile_noire` | colossal spherical battle station with a recessed superweapon dish |
| `roquette` | ground-based missile launcher pod |
| `canon_impulsion` | planetary pulse cannon on a rotating mount |
| `canon_plasma` | plasma artillery with coolant fins |
| `batterie_aa` | anti-aircraft battery with quad barrels |
| `intercepteur` | fast defensive interceptor craft with forward canards |
| `lance_gravitationnelle` | gigantic gravitational lance tower anchored to bedrock |
| `traqueur_kesh` | organic insectoid hunter ship with chitin plates |

### 2.7 Couvertures du devblog 5.16 (16:9, 1600 × 900)

Les trois billets de la 5.16 utilisent pour l'instant une image d'unité. On peut leur donner une vraie couverture, à remplacer dans l'en-tête `cover:` du fichier `content/blog/2x-….md` :

- `24-grand-lot-5-16.md` (« 5.16 : expéditions en chaîne, traités… ») :

  ```
  /imagine prompt: sci-fi strategy game key art, a fleet pushing deeper into a glowing unknown nebula while pirate ships watch from the shadows, a stylized planet with rings in the foreground, epic scale, cinematic lighting, painterly digital illustration, no text --ar 16:9 --v 7 --style raw --s 250
  ```

- `25-calculs-de-la-5-16.md` (« Les calculs de la 5.16 ») :

  ```
  /imagine prompt: sci-fi command console covered in holographic charts, curves and resource gauges, a commander's gloved hand adjusting a slider, moody blue-grey lighting, shallow depth of field, painterly digital illustration, no readable text --ar 16:9 --v 7 --style raw --s 200
  ```

- `26-guide-du-commandant.md` (« Le guide du commandant ») :

  ```
  /imagine prompt: sci-fi strategy game illustration, a young commander standing at a large window overlooking their first small colony planet with four glowing extractors, a holographic tutorial map beside them, hopeful mood, warm rim light, painterly digital illustration, no text --ar 16:9 --v 7 --style raw --s 200
  ```

## 3. Pour plus tard

- **Aperçu des thèmes** (10 vignettes, 4:3) : `public/assets/themes/<id>.webp`, une capture stylisée de l'accueil dans chaque thème, pour la page Réglages. Le plus simple est de les générer par capture d'écran plutôt qu'avec Midjourney.
- **Gazette** : une vignette par rubrique (boss, guerre, marché, entraide…), en 1:1 et 512 × 512 :

  ```
  /imagine prompt: minimalist sci-fi editorial icon illustration, <RUBRIQUE>, single strong silhouette, flat muted colors with one accent, dark background, no text --ar 1:1 --v 7 --s 150
  ```

- **Planète** : textures de surface par palette (océan, dunes, glacier, canopée, magma, cristal) en bandes 2:1 qui défilent. Elles ne sont utiles que si la planète passe du dessin vectoriel à une texture.
