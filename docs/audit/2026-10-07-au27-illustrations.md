# Revue AU27 : illustrations manquantes ou provisoires

Date : 2026-10-07. Audit de la chaîne de contenu, maillon 13 (`docs/WORKFLOW.md` §7, règle n° 4 de `CLAUDE.md`).
Sources : contenu par défaut du moteur relu par script (`DEFAULT_BUILDINGS`, `DEFAULT_UNITS`, `DEFAULT_TECHNOLOGIES`, `DEFAULT_RELICS`,
`DEFAULT_FACTIONS`, `DEFAULT_WORLD_BOSSES`, `DEFAULT_ALLIANCE_BOSSES`, `DEFAULT_WARLORDS`, `COMMANDERS`, `DEFAULT_TITLES`,
`MODULE_TEMPLATES`, `EFFECT_PRESETS`, `SHOP_ITEMS`, `EMPIRE_CLASSES`, `COLONY_SPECS`, `PASS_THEMES`, `SEASON_CATALOG`, `ANNOUNCEMENTS_ALL`) ;
toutes les chaînes `/assets/…` de `src/`, `content/` et `changelog/` comparées à `public/assets` (399 fichiers) ; empreintes MD5 des
images (copies) ; `scripts/illustrations.json` (48 emplacements, 30 intégrés) ; `docs/prompts-*.md` ; `docs/audit/constats-ouverts.md` ;
`docs/proposals/phalange-porte-de-saut.md` §É30-1d.

Nouveaux emplacements proposés : `docs/audit/2026-10-07-au27-illustrations-nouvelles.json` (79 lignes, format des `slots` de
`scripts/illustrations.json`, à fusionner). La reconnaissance des rendus (`scripts/illustrations-match.mjs`) a été simulée sur les
127 prompts réunis (48 + 79) avec un nom de fichier Midjourney de 9 mots : chaque image est reconnue, aucune confusion.

États : **définitive** (rendu propre au contenu) ; **provisoire** (copie d'une autre image ou image générée par script, en attente du
rendu) ; **partagée** (l'image d'un autre contenu, sans emplacement prévu) ; **absente** (pas d'image : icône, emoji ou section masquée) ;
**404** (chemin référencé, fichier absent : image cassée).

## Bilan

| État | Contenus | Détail |
|:--|--:|:--|
| Définitive | 147 | 24 unités, 16 bâtiments, 16 technos, 14 reliques, 6 boss mondiaux, 10 seigneurs (portrait et sceau), 12 officiers, 6 mois de Chroniques, 7 archétypes générés, 13 objets du Comptoir, 4 offres de la semaine, 4 capsules, 13 annonces, Chœur (art, bannière, emblème), légende « Main d'or » |
| Provisoire | 17 | 14 technos (`TECH_CODEX_IMAGE`), Cale sèche, Lune, annonce 5.7 |
| Partagée | 23 + passe | 8 reliques, 3 boss d'alliance, 12 thèmes du passe ; commandant de saison (portrait du rôle) chaque mois |
| Absente | 56 | 9 objets du Comptoir, 5 factions (bannière et emblème), 3 classes d'empire, 7 modules, 4 spécialisations, phalange, porte de saut et 2 reliques à venir, 16 billets sans couverture, 8 pages sans en-tête |
| 404 | 4 | les 4 reliques mythiques ; plus `story/v6-14-grande-maj.webp`, référencée mais masquée par `pendingArt` (pas d'image cassée) |
| Sans objet | — | titres (13, emoji voulu), préréglages d'effets (66, texte), talents, succès (5 images de palier pour 135 succès, voulu), icônes (28), rangs (29), avatars (40), emojis, catégories du blog (6) : tous présents |

Les chemins absents trouvés hors de ces cas viennent des tests (`/assets/a.webp`, `/assets/x.webp`, `/assets/email/x.jpg`…) : sans objet.

## Constats

| # | Gravité | Constat | Preuve | Suite |
|:--|:--|:--|:--|:--|
| AI-1 | haute | **4 reliques mythiques sans fichier** : Cœur du Léviathan, Couronne d'ambre, Œil du Néant, Égide stellaire. Image cassée au Codex (vignette et fiche) et sur la fiche joueur ; l'État-major retombe sur une icône (`onError`). Ce sont les reliques les plus rares : celles qu'un joueur montre | `relics.ts` (pas d'`image`, défaut `/assets/relics/<id>.webp`), `CodexPage.tsx`, `PlayerSheetDialog.tsx` sans repli | 4 emplacements `relic-*` ; en attendant, un repli `onError` au Codex et sur la fiche joueur (lot front) |
| AI-2 | haute | **14 technos sur 30 gardent l'image commune** (`TECH_CODEX_IMAGE` = l'illustration des Archives fracturées) : la moitié de l'onglet Technologies du Codex montre le même bâtiment | `technologies.ts` (`TECH_ART`), emplacements `tech-tech14` à `tech-tech30` `done: null` | emplacements existants : rien à créer |
| AI-3 | haute | **Annonce 6.14 bloquée** : sa modale et la page `/game/annonces` attendent l'image (`pendingArt: true`) ; c'est l'annonce de la mise en production | `Announcement.tsx`, emplacement `annonce-6.14` | emplacement existant ; à produire en premier |
| AI-4 | moyenne | **Cale sèche** : copie exacte de l'Atelier de réparation (même MD5) sur la page Bâtiments, vue par tous | `buildings/cale_seche.webp` = `atelier_reparation.webp` | emplacement existant |
| AI-5 | moyenne | **9 objets du Comptoir sans image** (icône lucide) : Accélérateur, Gelée de la Reine, Brouilleur, Balise de repli, Voile de chitine, Dossier d'entraînement, Planificateur, Titre, Cadre de chitine. Ils côtoient 13 objets illustrés | `BountiesPage.tsx` (`SHOP_ITEM_ART`) | 9 emplacements `comptoir-*`, branchement dans `SHOP_ITEM_ART` |
| AI-6 | moyenne | **8 reliques partagent 4 images** : Sceau des Sentinelles et Plaque de rempart (écaille), Lame du duelliste et Trophée de seigneur (engrenage), Enclume des colosses et Navette-mère (noyau de forge), Balise de traque (œil de Vesper), Compas du tacticien (cristal mémoriel) | `relics.ts` l. 81-88 (`image` explicite) | 8 emplacements ; à l'intégration, retirer le champ `image` (défaut par identifiant). Un contenu personnalisé qui a gardé l'ancien chemin le garde : vérifier `CONTENT_MIGRATIONS` |
| AI-7 | moyenne | **Lune provisoire** (disque gris dessiné par script) au Codex (Légendes) et dans l'annonce 6.14 | `moon/lune.webp`, emplacement `lune` | emplacement existant ; le produire avant l'annonce 6.14 qui le montre |
| AI-8 | moyenne | **5 factions sans bannière de repaire ni emblème** : seule le Chœur les a. La page Menaces n'affiche pas l'en-tête du repaire, et le Codex prend l'art à la place de l'emblème | `pirates.ts` (`banner`, `emblem`), `ThreatsPage.tsx` l. 138 et 151 | 10 emplacements `faction-*` ; renseigner `banner` et `emblem` dans `DEFAULT_FACTIONS` (et le contenu personnalisé) |
| AI-9 | moyenne | **3 boss d'alliance sans image propre** : Cuirassé Gravhorn (art de faction), Nid-mère Kesh'Vaar (`bounties/hunters.webp`), Croiseur de la Confrérie (art de Varan) | `allianceBoss.ts` | 3 emplacements `boss-alliance-*` ; image réglable dans l'admin (`allianceBoss.bosses`) |
| AI-10 | moyenne | **Passe de saison** : les 12 thèmes reprennent des images du blog ou des Chroniques (`PASS_THEMES.image`) ; le commandant de saison sort avec `portrait: ""`, donc le portrait de son rôle (deux officiers ont alors le même visage). Le prompt est écrit par le générateur, mais aucun emplacement `/img` ne le porte | `passSeasons.ts` l. 236-402 et 472, `commanders.ts` l. 190 | 12 emplacements `passe-theme-*` et 3 `officier-s-*` (novembre 2026 à janvier 2027) ; ensuite, un emplacement par mois au brouillon du passe |
| AI-11 | moyenne | **Phalange et porte de saut** (É30-1) : 5 prompts écrits dans la proposition mais aucune ligne dans `illustrations.json` ; les deux reliques prévues y sont en 512 × 512 sans détourage alors que toutes les reliques sont en 256 × 256 détourées | `phalange-porte-de-saut.md` §É30-1d, `relics/*.webp` (RGBA 256) | 5 emplacements aux identifiants de la proposition (`phalanx`, `jumpgate`, `relic-lentille-selene`, `relic-cle-seuil`, `announce-phalange`), reliques ramenées au format relique |
| AI-12 | basse | **Classes d'empire, modules, spécialisations de colonie** : emoji ou icône seulement, alors que la page Classe est montrée à chaque nouveau joueur | `empireClass.ts`, `modules.ts`, `colonies.ts` (pas de champ image) | 14 emplacements ; le branchement demande un champ `image` et son éditeur admin (règle n° 2) |
| AI-13 | basse | **Annonce 5.7 provisoire** : copie de `choeur-banner.webp` (même MD5). Son prompt demande « lines and numbers » : risque de chiffres dans l'image | emplacement `annonce-5.7` | remplacer « and numbers » par « without text » à la fusion |
| AI-14 | basse | **16 billets du devblog sans couverture** (repli : logo dans l'aperçu Discord), dont les 4 billets de la mise en production 6.14 (49 à 52) | `content/blog/22, 23, 39-52` sans `cover:` | 3 emplacements `blog-50` à `blog-52` ; le 49 prend l'image de l'annonce 6.14, les 47-48 celle de la lune ou de la phalange |
| AI-15 | basse | **En-têtes de pages** : 6 pages ont un fond (`PageHeader backdrop`), tous empruntés au blog ou au casino ; les 8 en-têtes proposés en 5.16 (`docs/prompts-5.16.md` §2.4) n'ont jamais eu d'emplacement. Les mutateurs, le mode photo et les plans d'unités de la même proposition demandent du code : non repris | `docs/prompts-5.16.md` | 8 emplacements `entete-*` |
| AI-16 | info | **Reconnaissance** : 10 prompts du Comptoir commencent par « sci-fi game item icon » et les 2 annonces par « sci-fi strategy game key art ». La simulation reconnaît chaque image, mais un nom de fichier court (moins de 7 mots) serait ambigu. Les 79 nouveaux prompts commencent par leur sujet (`docs/illustrations.md`) | `illustrations-match.mjs` | rien ; garder la règle du sujet en tête |
| AI-17 | info | **Ce qui est complet** : 24 unités (classe et élite comprises), 12 bâtiments et 4 gisements, 6 boss mondiaux, 10 seigneurs, 12 officiers, 6 mois de Chroniques et 7 archétypes générés (boss et sceau), capsules, icônes, rangs, avatars, emojis, catégories du blog, offres de la semaine. Le Labo n'affiche aucune image de techno : seul le Codex les montre | `public/assets` | rien |

## Tableaux par catégorie

### Technologies (Codex)

| Contenu | Image actuelle | État | Emplacement /img |
|:--|:--|:--|:--|
| tech1 à tech13, tech18, tech19, tech28 (16) | `technologies/<id>.webp` | définitive | existant, intégré |
| tech14 Roquette, tech15 Canon à impulsion, tech16 Canon plasma, tech17 Batterie AA, tech20 Espionnage, tech21 Métallurgie quantique, tech22 Cortex neuronal, tech23 Champs de confinement, tech24 Propulsion à antimatière, tech25 Lance gravitationnelle, tech26 Extension des hangars, tech27 Nanoréparation, tech29 Batterie anti-essaim, tech30 Vaisseau-atelier (14) | `buildings/archives_fracturees.webp` (`TECH_CODEX_IMAGE`) | provisoire (partagée) | existant (`tech-<id>`) |

### Reliques

| Contenu | Image actuelle | État | Emplacement /img |
|:--|:--|:--|:--|
| 14 reliques de base (Engrenage de Varan… Égide de la Reine) | `relics/<id>.webp` | définitive | sans objet |
| Cœur du Léviathan, Couronne d'ambre, Œil du Néant, Égide stellaire (mythiques) | `relics/<id>.webp` absent | **404** | à créer `relic-<id>` |
| Sceau des Sentinelles, Plaque de rempart | `relics/ecaille_leviathan.webp` | partagée | à créer |
| Lame du duelliste, Trophée de seigneur | `relics/engrenage_varan.webp` | partagée | à créer |
| Enclume des colosses, Navette-mère | `relics/noyau_forge.webp` | partagée | à créer |
| Balise de traque | `relics/oeil_vesper.webp` | partagée | à créer |
| Compas du tacticien | `relics/cristal_memoriel.webp` | partagée | à créer |
| Lentille de Séléné, Clé du seuil (É30-1d, pas encore au contenu) | — | absente | à créer (`relic-lentille-selene`, `relic-cle-seuil`) |

### Bâtiments, unités, défenses

| Contenu | Image actuelle | État | Emplacement /img |
|:--|:--|:--|:--|
| 12 bâtiments, 4 gisements de colonie | `buildings/*.webp` | définitive | sans objet |
| Cale sèche | copie de `atelier_reparation.webp` | provisoire | existant (`cale_seche`) |
| 24 unités : 17 de base (défenses comprises), Traqueur Kesh, 3 élites, 3 de classe | `units/*.webp` | définitive | sans objet |

### Boss, seigneurs, factions, officiers

| Contenu | Image actuelle | État | Emplacement /img |
|:--|:--|:--|:--|
| 6 boss mondiaux | `leviathan/*`, `bosses/*` | définitive | sans objet |
| Cuirassé Gravhorn | `story/gravhorn.webp` | partagée (faction) | à créer `boss-alliance-gravhorn` |
| Nid-mère Kesh'Vaar | `bounties/hunters.webp` | partagée | à créer `boss-alliance-kesh` |
| Croiseur de la Confrérie | `story/varan.webp` | partagée (faction) | à créer `boss-alliance-confrerie` |
| 6 mois de Chroniques, 7 archétypes générés | `chronicles/*`, `chronicles/auto/*` | définitive | sans objet |
| 10 seigneurs (portrait, sceau) | `warlords/*` | définitive | sans objet |
| 6 factions : art | `story/<id>.webp` | définitive | sans objet |
| Chœur : bannière, emblème | `story/choeur-banner.webp`, `choeur-emblem.webp` | définitive | sans objet |
| Confrérie, Gravhorn, Inquisition, Cartel, Meute : bannière du repaire et emblème | — (section masquée, art au Codex) | absente | à créer `faction-<id>-banner`, `faction-<id>-emblem` |
| 12 officiers | `commanders/<rôle>.webp` | définitive | sans objet |
| Commandant de saison (un par mois) | portrait du rôle | partagée | à créer `officier-s-2026-11`, `-2026-12`, `-2027-01` |
| 28 fugitifs des primes | art de leur faction | partagée (voulu) | sans objet (pas d'identifiant ; à décider si les 6 proies d'élite méritent un portrait) |

### Comptoir, offres, boutique

| Contenu | Image actuelle | État | Emplacement /img |
|:--|:--|:--|:--|
| 10 objets illustrés (Sondes fantômes… Effet de planète), 4 offres de la semaine | `bounties/items/*.webp` | définitive | existant, intégré |
| Plan du Traqueur, Emblème, Emojis | image de l'unité, emblème kesh, emojis | définitive | sans objet |
| Accélérateur, Gelée de la Reine, Brouilleur d'essaim, Balise de repli, Voile de chitine, Dossier d'entraînement, Planificateur, Titre « Chasseur de l'Essaim », Cadre de chitine | icône lucide | absente | à créer `comptoir-<id>` |

### Systèmes sans image

| Contenu | Image actuelle | État | Emplacement /img |
|:--|:--|:--|:--|
| Classes d'empire (Industriel, Seigneur de guerre, Explorateur) | emoji | absente | à créer `classe-<id>` (champ image à coder) |
| 7 modules (plans) | icône | absente | à créer `module-<id>` (champ image à coder) |
| 4 spécialisations de colonie | emoji | absente | à créer `colonie-<id>` (champ image à coder) |
| 13 titres, 66 préréglages d'effets, talents d'Ascension | emoji ou texte | sans objet (voulu) | — |
| 135 succès | 5 images de palier (`achievements/<palier>.webp`) | partagée (voulu) | — |

### Lune, phalange, porte de saut

| Contenu | Image actuelle | État | Emplacement /img |
|:--|:--|:--|:--|
| Lune (Codex, Légendes ; annonce 6.14) | `moon/lune.webp` dessinée par script | provisoire | existant (`lune`) |
| Phalange, porte de saut (Codex, panneau Lune, É30-1d) | — | absente | à créer `phalanx`, `jumpgate` |
| Annonce « Ta lune veille » | — | absente | à créer `announce-phalange` |

### Annonces, passe, devblog, pages

| Contenu | Image actuelle | État | Emplacement /img |
|:--|:--|:--|:--|
| Annonce 6.14 | `story/v6-14-grande-maj.webp` absent, annonce masquée | absente (404 masqué) | existant (`annonce-6.14`) |
| Annonce 5.7 | copie de `choeur-banner.webp` | provisoire | existant (`annonce-5.7`) |
| 13 annonces plus anciennes | images du jeu | définitive | sans objet |
| 12 thèmes du passe | images du blog ou des Chroniques | partagée | à créer `passe-theme-<id>` |
| Billets 50 à 52 | logo (aperçu) | absente | à créer `blog-50` à `blog-52` |
| Billets 22, 23, 39 à 48, 49 | logo (aperçu) | absente | 49 : image de l'annonce 6.14 ; 47-48 : lune ou phalange ; autres : sans priorité |
| Pages Bâtiments, Unités, Galaxie, Menaces, Alliance, Missions, Gazette, Ascension | pas de fond d'en-tête | absente | à créer `entete-<page>` |
| Commandement, Hall of fame des boss, Palmarès, Passe, Chroniques, Casino | fonds empruntés au blog, au casino, aux Chroniques | partagée (voulu) | sans objet |

## Priorités (ce que le joueur voit le plus d'abord)

1. **Annonce 6.14** (`annonce-6.14`) et **Lune** (`lune`) : la modale de la mise en production les montre à chaque joueur ; l'annonce reste cachée sans son image (AI-3, AI-7).
2. **Reliques mythiques** (4, `relic-*`) : seules images cassées du jeu (AI-1).
3. **Cale sèche** (`cale_seche`) : page Bâtiments, visible par tous (AI-4).
4. **Comptoir** (9 objets) : page visitée chaque jour pour l'Ambre (AI-5).
5. **14 technos du Codex** : emplacements prêts (AI-2).
6. **Reliques partagées** (8) : inventaire de l'État-major et Codex (AI-6).
7. **Bannières et emblèmes des factions** (10) : page Menaces (AI-8).
8. **Passe** : thème et commandant de novembre 2026 d'abord (`passe-theme-vide`, `officier-s-2026-11`), puis les mois suivants (AI-10).
9. **Phalange et porte de saut** (5), avec le lot É30-1d (AI-11).
10. **Boss d'alliance** (3), classes d'empire (3), billets 50 à 52, en-têtes de pages (8), modules (7), spécialisations (4).

## Branchement à l'intégration

| Groupe | Ce qu'il faut faire |
|:--|:--|
| Reliques mythiques | rien : le chemin par défaut est déjà le bon |
| Reliques partagées | retirer `image` dans `DEFAULT_RELICS` ; vérifier le contenu personnalisé (admin) |
| Comptoir | identifiant ajouté à `SHOP_ITEM_ART` (`BountiesPage.tsx`) |
| Factions | `banner` et `emblem` dans `DEFAULT_FACTIONS` (et l'onglet Factions de l'admin pour un contenu personnalisé) |
| Boss d'alliance | `image` dans `DEFAULT_ALLIANCE_BOSSES` (réglable dans l'admin) |
| Passe | `PASS_THEMES.image` ; portrait du commandant de saison dans le brouillon du mois (admin), ou chemin `commanders/s-<mois>.webp` lu par le générateur |
| Lune, phalange, porte | même nom de fichier ; `ASSET_VERSION` augmentée pour la lune |
| Classes, modules, spécialisations | champ `image` à ajouter au contenu et à son éditeur (règle n° 2), puis affichage |
| Devblog | `cover:` dans le frontmatter du billet |
| En-têtes | `PageHeader backdrop` sur chaque page |
