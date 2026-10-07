# Revue AU27 : audit du jeu et de la chaîne de contenu

Date : 2026-10-07, branche de travail au commit `13096f1` (6.14.45 suite, puis 6.14.48 côté moteur et serveur). Lecture seule du code.
Grille du GDD §6, reprise d'AU26 ; constats numérotés `AJ-n`.

Périmètre : systèmes de jeu, cohérence entre docs et code, invariants, chaîne de contenu contenu par contenu (règle n° 4), dette.
Trois audits parallèles couvrent le reste ; ce rapport n'en donne qu'un résumé et y renvoie :
- règle n° 2 (tout réglable, évolutif) : `docs/audit/2026-10-07-au27-admin-evolutif.md` ;
- contenu procédural (passe, Chroniques, générateurs) : `docs/audit/2026-10-07-au27-procedural.md` ;
- équilibrage et difficulté : `docs/audit/2026-10-07-au27-equilibrage.md`.

Sources et mesures :
- `npx vitest run` : 224 fichiers, **1 185 tests verts**, 85 sautés (intégration) ;
- `contentChainReport()` lancé hors du dépôt (scratchpad) : **0 manque** (`contentChainGaps() = []`) ;
- registres par défaut : 24 unités, 13 bâtiments, 30 technos, 26 reliques, 6 boss mondiaux, 3 boss d'alliance, 12 officiers,
  15 talents, 7 modèles de modules, 4 spécialisations de colonie, 10 mutateurs, 66 préréglages d'effet, 135 succès (76 écrits + 59 dérivés) ;
- `python3 scripts/illustrations.py --missing` : 18 images manquantes ;
- recherche d'exports du moteur jamais lus (script du scratchpad) ;
- `grep TODO|FIXME|HACK` sur `src/` et les hooks écrits à la main : **0**.

## Grille

| Question | Réponse |
|:--|:--|
| Stat d'effet lue ? | oui (`effectsRead.test.ts`, I9) ; `phalanxRange` et `jumpGateCooldown` lues depuis 6.14.44 |
| Plafonds vérifiés partout ? | oui pour hangars, entrepôt, flottes ; défaut de migration pour les reliques composées (AJ-5) |
| Client, serveur, Statistiques d'accord ? | oui pour les chiffres calculés ; la page Formules écrit des valeurs d'officiers en dur (AJ-8) |
| Le joueur sait ce qui s'est passé ? | oui ; mais rien ne lui dit qu'une colonie, un talent ou un module « compte » (AJ-3, AJ-4) |
| PNJ, colonies : même règle ou écart documenté ? | oui (I20 à I23) |
| Invariant testé ? | 22 sur 23 ; **I6 sans test** (AJ-6) |

## Constats

Gravité : 🔴 haute, 🟠 moyenne, 🟡 basse, ℹ️ information. Taille : S (≤ ½ journée), M (1 à 2 jours), L (plus).

### AJ-1 🔴 La garde de la chaîne de contenu est verte, mais aucun contenu n'a de succès ni de porteur à lui

- **Preuve.**
  - Succès comptés par type, pas par contenu : `src/game/contentChain.ts:49-57`. `unitTypesPct` et `maxUnitLevel` couvrent les
    24 unités d'un coup ; `relicsOwned` couvre les 26 reliques. Aucun des 135 succès ne vise une unité, un bâtiment, une techno ou une
    relique précise (relevé des mesures de `METRICS`, `src/game/achievements.ts:84-212`).
  - « Porteur d'effet » rempli par les modules de classe : `contentChain.ts:76-82`. Tout vaisseau léger, moyen ou lourd a un porteur
    d'office (Armement, Blindage).
  - Porteur propre réel : le Sceau des Sentinelles (`unit:sentinelle`, `relics.ts:81`). Viennent ensuite trois porteurs de groupe :
    la Plaque de rempart (`cat:defense`), l'Enclume (`class:heavy`), la Navette-mère (`class:light`).
  - Aucune techno ne porte un effet de stat sur une unité : 30 technos, dont 15 de déblocage (`unlock_next_level`), aucune `type: "stat"`.
  - L'exemple de la règle n° 4 (CLAUDE.md, WORKFLOW §7) demande « succès 100 corvettes », « corvette niveau 10 », une relique
    « Moteur de corvette » : la garde ne sait pas le vérifier.
- **Effet joueur.** Construire sa première Étoile noire ou maximiser son Canon plasma ne déclenche rien. Le Codex est le seul retour
  propre au contenu. La collection paraît générique.
- **Piste.** Ajouter deux maillons à `contentChainReport` :
  - `achievementOwn` : un succès dont `extra.unit` (ou `building`, `tech`, `relic`) vise le contenu ;
  - `carrierOwn` : un porteur dont la cible est `unit:<id>`, pas une classe.

  Mettre les manques actuels dans `KNOWN_GAPS`, environ 23 unités et 13 bâtiments, puis les combler par vagues :
  - succès dérivés par unité (« 100 × », « niveau max »), sur le modèle de `derivedAchievements`, réglables comme les autres ;
  - un préréglage existe déjà par unité (C3, 6.14.13) : il suffit d'en faire porter un par une relique ou un plan de module « signature ».
- **Taille.** M pour la garde et les succès dérivés, L pour les porteurs.

### AJ-2 🔴 Aucun défi, objectif ou mission ne fait jouer un contenu précis

- **Preuve.** Toutes les listes d'objectifs sont génériques :
  - Chroniques et passe : 9 objectifs (`src/game/chronicles.ts:21`) ;
  - défis du passe : 6 clés (`src/game/passSeasons.ts:32`) ;
  - défi de la semaine : 6 types (`src/game/challenges.ts:18-25`), dont « construire des unités », sans unité désignée ;
  - ancien tirage du jour : 5 tâches (`src/game/dailyMissions.ts:19-25`).

  Il n'y a pas d'objectif « construire X », « rechercher Y », « expédition », « recyclage », « route de colonie », « lune ». Les thèmes
  du passe « colonies » et « chantiers » ne changent que la faction (`src/game/chronicleGen.ts:44-57`).
- **Effet joueur.** Le maillon 9 de la chaîne (défi, mission, prime) ne peut être coché pour aucun contenu. Les nouveautés (Bastion,
  Vaisseau-atelier, lune) ne sont jamais mises en avant par la boucle saisonnière.
- **Piste.**
  - Objectifs paramétrés `build:<unitId>`, `research:<techId>`, `expedition`, `recycle`, `colonyRoute`, avec un poids par défaut de 0
    dans `chronicleGen.objectiveWeights` et `passGen.challengeWeights`, pour ne rien changer tant que l'admin ne les active pas.
  - Une ligne « objectif » dans la fiche de chaque contenu nouveau.
  - Le générateur est détaillé dans `au27-procedural.md`.
- **Taille.** L.

### AJ-3 🔴 Les colonies, système « méta », n'ont aucun maillon de chaîne

- **Preuve.**
  - Aucun succès : pas une mesure de `METRICS` ne lit `colonies` (`achievements.ts:84-212`).
  - Pas de Codex : ni les 4 biomes, dont le lore est pourtant écrit (`src/game/colonies.ts:297-302`), ni les spécialisations
    (`colonies.ts:242-247`) ; voir `codex.ts:90-264`.
  - Pas d'objectif (AJ-2), pas de section dans Formules (`src/components/game/FormulasGuide.tsx:56-66`).
  - Hors du rapport `contentChainReport`.
- **Effet joueur.** Fonder une colonie (50 M par ressource commune), la spécialiser, faire tourner 100 convois : rien ne le reconnaît.
  La boucle méta (GDD §2) n'a pas de jalon visible.
- **Piste.**
  - Succès : « Terres neuves » (1re colonie), « Deux mondes » (2), « Convoyeur » (100 convois, `stats.colonyConvoys`), « Bastion
    avancé » (base avancée 14 j).
  - Codex : 4 biomes et 4 spécialisations (Légendes ou catégorie « Colonies »).
  - Section « Colonies » dans Formules : production +50 %, gisement, réserve des routes, perte de 10 % en route.
  - Type `colony` dans `contentChainReport`.
- **Taille.** M.

### AJ-4 🟠 Talents, modules, classes d'empire, mutateurs : hors de la chaîne et figés dans le code

- **Preuve.** Ces tables vivent dans le code. Aucune n'a de section de contenu ni d'entrée de Codex, et `contentChainReport` ne les
  connaît pas :

  | Contenu | Table | Où |
  |:--|:--|:--|
  | Talents | `TALENTS`, 15 talents, `perRank` | `src/game/talents.ts:39-57` |
  | Modules | `MODULE_FAMILIES` (valeurs par rareté), `MODULE_TEMPLATES`, `MODULE_RARITIES` (poids, Ambre de recyclage) | `src/game/modules.ts:55-78` |
  | Classes d'empire | `EMPIRE_CLASSES` (+10 % de production…) | `src/game/empireClass.ts:34-70` |
  | Mutateurs | `MUTATORS` (`grants`) | `src/game/mutators.ts:21-32` |
  | Spécialisations de colonie | `COLONY_SPECS` | `colonies.ts:242` |
  | Divisions | `LEAGUE_TIERS` (jetons, part placée) | `src/game/leagues.ts:31` |
  | Défi de la semaine | `CHALLENGE_TYPES` (`perActive`) | `challenges.ts:18` |

  Seules leurs règles annexes sont dans le registre (`talents`, `modules`, `moduleCost`).
- **Effet joueur.** Aucun en l'état. Un réglage d'équilibre sur ces tables exige un déploiement, et ces systèmes restent sans
  collection ni succès propre, hors `modulesBuilt` et `modulesMounted`.
- **Piste.** Côté admin, voir `au27-admin-evolutif.md` (sections de contenu `talents`, `modules`, `empireClasses`, `mutators`, sur le
  modèle des reliques). Côté chaîne :
  - Codex « Doctrines » (talents, classes) et « Arsenal » (modules) ;
  - succès « Spécialiste » (une branche de talents complète) et « Arsenal légendaire » (un module légendaire monté) ;
  - types `talent`, `module`, `class` dans `contentChainReport`.
- **Taille.** M (chaîne) ; admin : voir le rapport dédié.

### AJ-5 🟠 Les 8 reliques composées (5.23) disparaissent sur un serveur dont l'admin a enregistré la liste des reliques avant 5.23

- **Preuve.**
  - `setRelics` garde les reliques par défaut absentes de la liste de l'admin, mais `disabled: true` (`src/game/relics.ts:131`) : elles
    sortent alors des tirages (`relics.ts:400`) et du rapport de chaîne.
  - `CONTENT_MIGRATIONS` n'ajoute qu'une relique par `appendFromDefaults` : `cle_soudure` (`pocketbase/pb_hooks/cosmic_db.js:5418-5422`).
    Rien pour `sceau_sentinelle` … `navette_mere` (`relics.ts:81-88`).
  - Aucun test ne vérifie qu'un identifiant par défaut ajouté après coup a sa migration (la règle est dans CLAUDE.md, pas dans un test).
- **Effet joueur.** Si la production a une liste de reliques personnalisée d'avant 5.23, ces 8 reliques ne tombent jamais. Ce sont
  justement les seuls porteurs propres à une unité ou une classe (AJ-1).
- **Piste.**
  1. Lire `content.relics` sur la pré-prod, copie de la prod : lecture seule, permise.
  2. Si le cas se confirme, migration `relics-5.23` (`appendFromDefaults` des 8 identifiants).
  3. Test de garde : chaque identifiant par défaut de `units`, `buildings`, `technologies` et `relics` absent de la liste « d'origine »
     figée dans le test apparaît dans une entrée `appendFromDefaults`.
- **Taille.** S.

### AJ-6 🟠 Invariant I6 sans test

- **Preuve.** GDD §4, I6 (« butin et livraisons arrivent même entrepôt plein ») renvoie à `fleets.test.ts`, qui n'a aucun cas
  d'entrepôt plein (`src/game/fleets.test.ts:28-140`). Le seul « entrepôt plein » des tests est l'ultimatum du Cartel
  (`pirates.test.ts:211-216`), sans rapport.
- **Effet joueur.** Aucun aujourd'hui. Une régression qui plafonnerait le butin au retour passerait les tests : le joueur perdrait son
  pillage sans le savoir, contre le pilier « perdre sans choix, non ».
- **Piste.** Deux cas dans `fleets.test.ts` : retour d'attaque avec un butin plus gros que la place libre, et livraison vers un
  entrepôt plein. Le stock final dépasse alors la capacité (choix assumé). Corriger la colonne « Test » du GDD.
- **Taille.** S.

### AJ-7 🟠 Documents de référence en désaccord avec le code

| Document | Écrit | Code ou réalité |
|:--|:--|:--|
| GDD §7.2, `docs/systems/atelier-cale-seche.md` | sauvetage « plafond global 95 % avec les bonus » | `combat.repairCap` = **0,85** depuis 6.2 (`combat-jcj.md` dit juste) |
| `docs/systems/unites-hangars.md` | « 21 unités » | **24** (17 de base, Traqueur, 3 élites, 3 de classe) |
| `docs/systems/progression.md` | « Succès : 76 (dont dérivés) » | **135** par défaut (76 écrits + 59 dérivés) ; 178 sur la copie de la prod (Z1) |
| `docs/systems/bonus-effets.md` | « Modules : 30 plans » | **7 modèles** ; 30 est la taille de l'inventaire |
| `docs/systems/recherche.md` | `MAX_CONCURRENT_RESEARCH` | n'existe plus : `research.maxConcurrent` (6.9.7) |
| `docs/systems/qol-outils.md` | « 30 tâches planifiées », « README affirme encore… client », « Bundle 904 Ko » | 17 `cronAdd` (cadences 5.29) ; README corrigé (`README.md:239`) ; mesures à jour en 6.14.39 |
| `docs/audit/constats-ouverts.md` | « Q ouvertes Q1, Q2, Q4… » ; « 57 commits … 6.14.17 » | `decisions-a-valider.md` vide : tout validé (6.14.45) ; la branche est en 6.14.48 |
| `docs/proposals/feuille-de-route-2026-hiver.md` | statut « en cours » | tous ses lots sont livrés |
| GDD §8 (journal) | 6.14.38 et 6.14.20 après 6.14.48 | ordre chronologique cassé ; 6.14.39 à 6.14.47 absents |

- **Effet joueur.** Indirect : un agent qui lit la fiche avant de coder repart d'un chiffre faux (règle n° 1, point 5).
- **Piste.** Un lot de docs. Plus, pour qu'aucun nombre ne dérive, une garde `docsCounts.test.ts` qui compare les compteurs écrits
  dans les fiches (« N unités », « N technologies », « N succès ») aux registres.
- **Taille.** S.

### AJ-8 🟠 Formules : des chiffres écrits en dur, des sources de bonus absentes

- **Preuve.** Bloc « Bonus » de `src/components/game/FormulasGuide.tsx:433-446` :
  - effets des officiers écrits en dur (« +1 % d'attaque par niveau »…), alors que `ROLE_EFFECTS` (`commanders.ts:364`) se règle dans
    Admin → Officiers ;
  - « réductions de durée plafonnées à 50 % » en dur, alors que `effectCaps` est réglable (6.9.5) ;
  - sources absentes : classe d'empire, modules, lune, mutateur du mois, capsules (toutes dans `EFFECT_SOURCE_LABELS`, `effects.ts:177-188`) ;
  - pas de section Colonies, Expéditions, Casino ni Classe (`FormulasGuide.tsx:56-66`).
- **Effet joueur.** Pilier « chaque nombre s'explique » : un réglage de l'admin rend la page fausse sans que rien ne le signale.
- **Piste.** Générer le tableau depuis `allCommanders()` et `roleBonusText`, lire `effectCap()`, une ligne par `EFFECT_SOURCE_LABELS` ;
  ajouter les sections manquantes (AJ-3). Lot d'interface, à placer après le travail de l'agent d'interface en cours.
- **Taille.** S à M.

### AJ-9 🟠 Ctrl+K ne connaît que trois registres

- **Preuve.** `src/components/layout/CommandPalette.tsx:103-155` cherche dans `UNITS`, `BUILDINGS` et `TECHNOLOGIES` (plus les
  onglets). Elle ignore les reliques, officiers, boss, fiches de Codex, factions et seigneurs.
- **Effet joueur.** « Égide », « Léviathan », « Sable » ne donnent rien. Le maillon 12 de la chaîne n'est rempli que pour trois types.
- **Piste.** Une source par registre (reliques → Inventaire, officiers → État-major, boss → Boss, Codex → fiche). Ajouter la
  vérification à `contentChainReport` (maillon `palette`).
- **Taille.** S.

### AJ-10 🟠 Le bilan de la chaîne n'existe que dans un test

- **Preuve.** `contentChainReport` n'est importé que par `contentChain.test.ts`. `CHAIN_KIND_LABELS` et `CHAIN_LINK_LABELS` ne sont
  lus nulle part.
- **Effet joueur.** Un contenu ajouté par l'admin en production (unité, relique, boss) n'est jamais vérifié : pas de préréglage, pas de
  porteur, pas de prime. La règle n° 4 ne protège que le code du dépôt.
- **Piste.** Panneau Admin → Équilibrage → « Chaîne de contenu » : tableau des maillons, liens vers l'éditeur de chaque manque. Les
  libellés existent déjà.
- **Taille.** S.

### AJ-11 🟠 Le butin des reliques ignore la source

- **Preuve.** `rollRelic` (`src/game/relics.ts:384-403`) tire le modèle parmi tout le registre, quelle que soit la source.
  - Le « Trophée de seigneur », « arraché à la cuirasse d'un seigneur tombé », tombe aussi en expédition ou en JcJ.
  - Chaque nouvelle relique dilue les autres : 22 modèles tirables, soit 4,5 % chacun.
  - Pas de table par source dans `LOOT_TABLES` (`loot.ts:50-62`), qui ne règle que la chance et la rareté.
- **Effet joueur.** Pas de « chasse » ciblée possible (« je fais des vendettas pour le Trophée »). L'ajout de reliques rend chacune plus rare.
- **Piste.** Champ optionnel `sources?: LootSource[]` sur `RelicTemplate`, avec un poids × 3 (réglable) pour un modèle tiré depuis sa
  source, éditable dans `RelicForm`. Rien ne change sans le champ. Chiffrage dans `au27-equilibrage.md`.
- **Taille.** M.

### AJ-12 🟡 Règle de conception n° 4 (« paliers lisibles ») appliquée à 2 bâtiments sur 13

- **Preuve.** GDD §5.4 : un bâtiment gagne un effet nouveau aux niveaux 5, 10, 15 et 20.
  - Seules la Cale sèche (`DOCK_TIERS`, `buildings.ts:71`) et la Fonderie (`BUILD_SLOT_BONUS_LEVELS`, `buildPlan.ts:30`) le font.
  - `VISUAL_TIERS` (`buildings.ts:38`) ne change que l'image.
- **Effet joueur.** Les extracteurs, l'entrepôt, l'Atelier et les hangars n'offrent que du « +x % » sur 20 niveaux : la boucle
  « session » manque de jalons.
- **Piste.** Proposition `docs/proposals/paliers-batiments.md` : un effet par palier pour l'entrepôt, l'Atelier et les hangars, chiffré
  sous les plafonds. Sinon, réécrire la règle n° 4 (« corriger plutôt qu'empiler »).
- **Taille.** L.

### AJ-13 🟡 Lune : des compteurs sans succès ni Journal

- **Preuve.**
  - `phalanxScans` (`phalanx.ts:279`) et `gateSaves` (`jumpGate.ts:152`) sont comptés, mais aucune mesure de succès ne les lit.
  - Le commentaire de `jumpGate.ts:37` annonce un « succès secret » qui n'existe pas encore.
  - `timeline.ts` n'affiche ni la recharge du balayage ni celle de la porte.
- **Effet joueur.** Rien tant que l'interface (É30-1c) n'est pas livrée.
- **Piste.** Couvert par É30-1d : succès « Œil de la lune », « Vigie », « Saut de l'ange », « Maître du seuil », « Retour fracassant »,
  et Codex. Ajouter au lot la recharge dans le Journal.
- **Taille.** S, dans É30-1d.

### AJ-14 🟡 Code mort et reliquats

- **Preuve.** Exports du moteur lus nulle part, définition seule :
  - `guideCurrent` (`advancedGuide`) ; `exchangeLeft`, `bountyBoostEnd`, `pheromoneActive` (`bounties`) ;
  - `chronicleReadyCount`, `codexClaimableCount`, `dailyReadyCount` : remplacés par `pendingClaims` en 5.30 et 6.14.17 ;
  - `currentAchievements` (`procedural`), `PRODUCTION_EFFECT` (`relics`), `resourceEmoji`, `realFleetUnits` (`synthesis`),
    `vacationLabel`, `MAX_RANK` (`warlordRanks`) ; `CHAIN_*_LABELS` (AJ-10).

  Neuf autres ne sont lus que par des tests, par exemple `canJump`, `canScan`, `takeModulePlan`, `computeElapsedProduction`.

  Missions du jour : `DAILY_RULES.tasks = 0` (`dailyMissions.ts:16`). Il reste `settleLegacyDaily` (`flush.ts:105`) et la carte
  `DailyMissionsCard`. C'est nécessaire tant que la production est en 5.27, qui a encore ces missions.
- **Effet joueur.** Aucun. Bruit dans le bundle et pour les agents.
- **Piste.** Retirer les 15 exports morts. Noter dans `constats-ouverts.md` le retrait des missions du jour, 30 jours après Z0.
- **Taille.** S.

### AJ-15 🟡 Illustrations

- **Preuve.**
  - 18 images manquantes : 14 technos, lune, Cale sèche, annonces 5.7 et 6.14.
  - Les 8 reliques composées se partagent 4 images, sans ligne dans `scripts/illustrations.json` (48 lignes, aucune relique).
  - Les 4 reliques mythiques (`coeur_leviathan`, `couronne_ambre`, `oeil_neant`, `egide_stellaire`) pointent vers
    `/assets/relics/<id>.webp` (`relics.ts:147-149`), et ce fichier n'existe pas. L'inventaire affiche alors son icône de secours
    (`CommandPage.tsx:379`, `onError`), et `illustrations.py --missing` ne les signale pas : elles n'ont pas de ligne.
  - Les modules, talents, classes, mutateurs et biomes n'ont aucune image ; ils s'affichent en emoji.
- **Effet joueur.** Le Codex mélange des fiches illustrées et des fiches génériques ; deux reliques différentes ont la même image.
- **Piste.**
  - É30-7, déjà prévu : 8 prompts de reliques, plus 4 pour les mythiques.
  - Faire signaler par `illustrations.py --missing` tout contenu dont l'image résolue n'existe pas, même sans ligne dans le JSON.
  - Ajouter les biomes de colonie (4) et les classes d'empire (3), qui ont déjà un lore.
- **Taille.** S, plus les rendus de l'utilisateur.

### AJ-16 🟡 Officiers de saison absents du Codex

- **Preuve.** La boucle des officiers du Codex lit `COMMANDERS`, les 12 de base (`codex.ts:202`), pas `SEASON_COMMANDERS`. Le succès
  `seasonCommanders` (3 paliers) existe pourtant.
- **Effet joueur.** Le commandant gagné au dernier palier du passe n'a pas de fiche.
- **Piste.** Fiches « Officiers de saison » datées par mois, débloquées à l'obtention (`allCommanders()`).
- **Taille.** S.

### AJ-17 ℹ️ Équilibre, procédural, admin : renvois

- Équilibre (`au27-equilibrage.md`) :
  - 4 recherches en parallèle dès le début (`research.maxConcurrent`), peu d'arbitrage ;
  - charge mentale des rendez-vous PNJ (audit Q1) ;
  - rythme des succès (PRG-5, lot É30-6).
- Procédural (`au27-procedural.md`) : thèmes du passe sans objectif lié (AJ-2).
- Admin (`au27-admin-evolutif.md`) : tables en dur d'AJ-4. Le registre couvre tous les `*_RULES` des fichiers à la racine de `src/game`,
  mais pas les tables sans suffixe `_RULES` ni le sous-dossier `src/game/balance/` (le glob de `ruleRegistry.test.ts:9` ne lit que `./*.ts`).

## Chaîne de contenu, contenu par contenu

Légende :
- ✅ propre au contenu ; ◐ générique (un maillon commun à tout le type) ; ❌ absent ; — sans objet ; ⏳ prévu (lot cité).
- Succès « entrée » et « maîtrise » : ◐ veut dire qu'une mesure de type couvre le contenu (AJ-1).
- Défi : objectif du passe, des Chroniques, de la semaine ou prime.
- Porteur : relique, plan de module, techno, talent ou officier qui le vise.

### Unités (24)

| Unité | Codex | Succès entrée / maîtrise | Préréglage | Porteur propre | Porteur de groupe | Défi | Butin | Ctrl+K | Image |
|:--|:--|:--|:--|:--|:--|:--|:--|:--|:--|
| Sentinelle | ✅ | ◐ / ◐ | ✅ | ✅ Sceau des Sentinelles | modules (moyen) | ◐ « unités » | épave | ✅ | ✅ |
| Drone récupérateur, Frégate, Cargo, Récolteur | ✅ | ◐ / ◐ | ✅ | ❌ | Navette-mère, modules (léger) | ◐ | épave | ✅ | ✅ |
| Chasseur, Traqueur Kesh, Éclaireur lointain | ✅ | ◐ / ◐ | ✅ | ❌ (Traqueur : bonus PNJ intégré) | modules (moyen) | ◐ ; Traqueur : primes | épave ; Traqueur : Comptoir | ✅ | ✅ |
| Étoile noire, Croiseur Nova, Bastion, Croiseur de raid | ✅ | ◐ / ◐ | ✅ | ❌ | Enclume, modules (lourd) | ◐ | épave | ✅ | ✅ |
| Sonde, Vaisseau-atelier | ✅ | ◐ / ◐ (sonde : `spies`) | ✅ | ❌ | modules de soutien (soute, propulsion, voile) | ◐ « espionnage » (sonde) | épave | ✅ | ✅ |
| Roquette, Canon à impulsion | ✅ | ◐ / ◐ | ✅ | ❌ | Plaque de rempart (défenses) | ◐ | — | ✅ | ✅ |
| Canon plasma, Batterie AA, Batterie anti-essaim | ✅ | ◐ / ◐ | ✅ | ❌ | Plaque de rempart | ◐ | — | ✅ | ✅ |
| Lance gravitationnelle, Intercepteur | ✅ | ◐ / ◐ | ✅ | ❌ | Plaque de rempart | ◐ | — | ✅ | ✅ |
| Chasse-Fantôme, Brise-Rempart, Lame Écarlate (élites) | ✅ | ◐ / ◐ (`vendettaWins`) | ✅ | ❌ | modules de leur classe | vendetta | — | ✅ | ✅ |

Manques : 23 unités sans succès propre ni porteur propre (AJ-1), aucun défi désigné (AJ-2).

### Bâtiments (13)

| Bâtiment | Codex | Succès | Préréglage ou porteur | Paliers 5/10/15/20 | Défi | Formules | Image |
|:--|:--|:--|:--|:--|:--|:--|:--|
| 4 extracteurs | ✅ | ◐ (`buildingLevels`, `maxBuildingLevel`) | ◐ reliques de production par ressource, talents | ❌ (AJ-12) | ❌ | ✅ Production | ✅ |
| Entrepôt | ✅ | ◐ | ◐ talent « Entrepôts étendus », Intendant | ❌ | ❌ | ✅ Stockage | ✅ |
| Atelier de réparation | ✅ | ◐ + `unitsRepaired` | ✅ Clé de soudure, Matrice, Mécanicien | ❌ | ❌ | ◐ | ✅ |
| Cale sèche | ✅ | ✅ Cale pleine, Ferrailleur, Démolisseur | ◐ `dockCapacity` | ✅ | ❌ | ◐ | ⏳ image provisoire |
| Hangars d'attaque et de défense | ✅ | ◐ | ✅ tech26 (`hangarCapacity`) | ❌ | ❌ | ✅ | ✅ |
| Fonderie, Synthétiseur | ✅ | ◐ | ❌ | ◐ Fonderie (chantiers) | ❌ | ❌ | ✅ |
| Générateur de bouclier, Labo de synthèse | ✅ | ◐ | ❌ | ❌ | ❌ | ◐ bouclier | ✅ |

### Technologies (30)

- Codex : ✅ (30).
- Succès : ◐ (`techCount`, `techLevels`, `techsMaxedPct`, `maxTechLevel`).
- Porteur de stat sur une unité : aucun (15 technos de déblocage, 2 de combat global).
- Défi : ❌.
- Image : 14 manquantes (tech14 à tech17, tech20 à tech27, tech29, tech30 ; AJ-15).
- Ctrl+K : ✅.

### Reliques (26)

| Groupe | Codex | Succès | Butin | Admin | Image |
|:--|:--|:--|:--|:--|:--|
| 14 classiques | ✅ | ◐ `relicsOwned` ; pas de maîtrise | tirage commun (AJ-11) | ✅ `RelicForm` | ✅ |
| 4 mythiques | ✅ | ◐ | boss (une par saison) | ✅ | ❌ fichier absent, icône de secours (AJ-15) |
| 8 composées (5.23) | ✅ | ◐ | tirage commun ; absentes si contenu personnalisé (AJ-5) | ✅ | ❌ 4 images partagées (É30-7) |

Pas de succès de maîtrise des reliques : par exemple « une relique légendaire », « 10 fusions ».

### Boss

| Boss | Codex | Succès entrée / maîtrise | Butin | Admin | Image |
|:--|:--|:--|:--|:--|:--|
| 6 boss mondiaux | ✅ | ◐ `worldBossTypes`, `leviathanKills` / ❌ | `LOOT_TABLES.worldBoss`, mythique | ✅ Boss mondiaux | ✅ |
| 3 boss d'alliance | ✅ | ✅ `allianceBossTypes` / ✅ `allianceBossAll` | `allianceBoss` | ✅ Règles → Boss d'alliance | ✅ (images de l'histoire réemployées) |
| Boss des Chroniques (mensuels) | ✅ | ◐ `bossSeals` / ❌ | `seasonBoss` | ✅ Chroniques (générés) | ✅ par chapitre |

### Autres contenus

| Contenu | Codex | Succès | Porteur ou effet reçu | Défi | Admin | Ctrl+K | Image |
|:--|:--|:--|:--|:--|:--|:--|:--|
| Officiers de base (12) | ✅ | ◐ `rareOfficers` | ✅ `ROLE_EFFECTS` | ❌ | ✅ Officiers | ❌ | ✅ |
| Officiers de saison | ❌ (AJ-16) | ✅ `seasonCommanders` | ✅ | passe (dernier palier) | ✅ Passe | ❌ | ◐ |
| Talents (15) | ❌ | ◐ `ascensionsDone` seulement | ✅ effets | ❌ | ◐ règles seules (AJ-4) | ❌ | ❌ |
| Modules (7 modèles, 5 familles) | ❌ | ✅ `modulesBuilt`, `modulesMounted` | ✅ par classe | ❌ | ◐ coût et règles | ❌ | ❌ |
| Classes d'empire (3) | ❌ | ❌ | ✅ 3 effets + avantage | ❌ | ◐ règles, pas les effets | ❌ | ❌ |
| Mutateurs (10) | ❌ | ❌ | ✅ | ❌ | ◐ mois forcé seulement | ❌ | ❌ |
| Factions (6) | ✅ | ✅ `factionsThreatened`, `lairFactions`, `maxNotoriety` | — | ◐ raids | ✅ Factions | ❌ | ✅ |
| Seigneurs | ✅ | ✅ `warlordsBeaten`, `vendettaWins` | ✅ Trophée (portée seigneur) | ◐ `warlordWin` | ✅ Seigneurs | ❌ | ✅ |
| Colonies (biomes, spécialisations) | ❌ (AJ-3) | ❌ | ✅ effets de portée colonie | ❌ | ◐ règles ; `COLONY_SPECS` en dur | ❌ | ❌ |
| Lune | ✅ Légendes | ✅ Clair de lune, Lune pleine | ✅ (couche empire) | — (Q40) | ✅ | ❌ | ⏳ provisoire |
| Phalange, porte de saut | ⏳ É30-1d | ⏳ É30-1d (compteurs déjà là, AJ-13) | ✅ stats `phalanxRange`, `jumpGateCooldown` | — (Q40) | ✅ registre | ❌ | ⏳ É30-1d |
| Comptoir de la Ruche (14 objets) | — | ✅ `amberEarned`, `bountiesDone` | — | — | ✅ `bountyShop` | ❌ | ✅ lignes `comptoir-*` |

## Lots proposés

| Id | Contenu | Constats | Taille | Priorité |
|:--|:--|:--|:--|:--|
| AJ27-1 | Docs : fiches et GDD remis au code, journal §8 trié, `constats-ouverts.md` et feuille d'hiver mis à jour ; garde `docsCounts.test.ts` | AJ-7 | S | 1 |
| AJ27-2 | Test I6 (butin et livraison entrepôt plein) | AJ-6 | S | 1 |
| AJ27-3 | Reliques 5.23 : lecture de la pré-prod, migration `relics-5.23` si besoin, garde des `appendFromDefaults` | AJ-5 | S | 1 |
| AJ27-4 | Garde de chaîne renforcée : maillons `achievementOwn`, `carrierOwn`, `palette` ; types `colony`, `talent`, `module`, `class` ; `KNOWN_GAPS` à jour ; panneau admin « Chaîne de contenu » | AJ-1, AJ-10 | M | 2 |
| AJ27-5 | Colonies dans la chaîne : 4 succès, Codex des biomes et spécialisations, section Formules | AJ-3 | M | 2 |
| AJ27-6 | Succès dérivés par unité (« 100 × », « niveau max ») et par bâtiment (« niveau 20 »), réglables, sans retrait d'un succès gagné ; à caler avec É30-6 (rythme des succès) | AJ-1 | M | 2 |
| AJ27-7 | Objectifs paramétrés (`build:<unit>`, `research:<tech>`, expédition, recyclage, route de colonie), poids 0 par défaut, puis activés par thème | AJ-2 | L | 3 |
| AJ27-8 | Formules générées depuis les registres (officiers, plafonds, sources) et Ctrl+K étendu (reliques, officiers, boss, Codex) | AJ-8, AJ-9 | M | 3, après l'agent d'interface |
| AJ27-9 | Codex : officiers de saison, Doctrines (talents, classes), Arsenal (modules) ; succès « Spécialiste », « Arsenal légendaire » | AJ-4, AJ-16 | M | 3 |
| AJ27-10 | Reliques par source (`sources?`, poids réglable) et porteurs « signature » par unité, en plans de module ou reliques | AJ-11, AJ-1 | M | 4 |
| AJ27-11 | Ménage du moteur : 15 exports morts ; retrait des missions du jour noté pour Z0 + 30 j | AJ-14 | S | 4 |
| AJ27-12 | Proposition « paliers des bâtiments » (entrepôt, Atelier, hangars), ou réécriture de la règle §5.4 | AJ-12 | L | 5 |
| É30-1d (ajout) | Recharge du balayage et de la porte dans le Journal | AJ-13 | S | dans le lot |
| É30-7 (ajout) | Prompts des biomes et des classes avec ceux des 8 reliques | AJ-15 | S | dans le lot |

## Questions de conception

| # | Question | Option recommandée | Autres options |
|:--|:--|:--|:--|
| QJ1 | La règle n° 4 exige-t-elle un succès **propre** à chaque unité et bâtiment, ou une mesure de type suffit-elle ? | Propre : succès dérivés générés (comme `derivedAchievements`), activables par contenu dans l'admin ; la garde exige « propre ou dérogation notée » | Réécrire la règle n° 4 : la mesure de type suffit (aucun travail, collection générique) |
| QJ2 | Un porteur d'effet par unité : relique ou plan de module ? | Plan de module « signature » (une famille par unité, rare et plus) : le système de modules vise déjà les classes, et un plan dilue moins que 24 reliques de plus | 24 reliques (dilue le tirage, AJ-11) ; techno de spécialisation (alourdit le Labo) |
| QJ3 | Objectifs liés à un contenu dans le passe et les Chroniques ? | Oui, poids 0 par défaut, activés par le thème du mois (« chantiers » → `build:*`, « colonies » → route) et pour le contenu nouveau du mois | Rester générique (plus simple, nouveautés jamais mises en avant) |
| QJ4 | Reliques liées à une source ? | Oui, × 3 de chance depuis la source, champ optionnel (rien ne change sans lui) | Tables par source exclusives (plus fort, moins lisible) ; statu quo |
| QJ5 | Colonies : catégorie de Codex propre, ou fiches dans « Légendes » ? | Catégorie « Colonies » (biomes et spécialisations), récompense de catégorie comme Unités, Bâtiments et Technologies | Légendes (pas de récompense de catégorie) |
| QJ6 | Paliers lisibles (§5.4) : les appliquer aux 11 autres bâtiments, ou limiter la règle aux bâtiments « de capacité » ? | Limiter, puis l'appliquer à l'entrepôt, l'Atelier et aux hangars ; réécrire la règle (« corriger plutôt qu'empiler ») | Les 13 (L, beaucoup d'équilibrage) ; abandonner la règle |

Choix pris seul, à noter dans `docs/QUESTIONS.md` au premier lot qui en dépend : QJ1 à QJ6, avec l'option recommandée.
