# Bâtiments

## Rôle
Colonne vertébrale de la progression : production, capacités (entrepôt, hangars, Cale sèche), soutien (Atelier), fin de partie.

## Liste (13)
| Bâtiment | Max | Déblocage | Effet |
|:--|--:|:--|:--|
| Extracteur de ferraille | 20 | départ | production ferraille |
| Réacteur instable | 20 | 500 ferraille | production énergie |
| Extracteur de nanocomposants | 20 | 500 énergie | production nano |
| Archives fracturées | 20 | coût | production données |
| Atelier de réparation | 20 | rares | sauvetage 5 %/niv. (70 % au 20) + cadence de réparation |
| Hangar d'attaque / de défense | 20 | Labo tech6 | 2 000 places/niv. |
| Cale sèche (5.28) | 20 | Atelier niv. 5 + rares | 1 000 postes/niv., paliers 5/10/15/20 |
| Entrepôt | 20 | départ | 2 M × 1,6^niv. |
| Fonderie quantique, Synthétiseur neuronal | 10 | tech21 / tech22 | rares (1 à 10/s) |
| Générateur de bouclier | 10 | tech23 | +0,5 %/niv. de bouclier (max 5 %) |
| Labo de synthèse | 10 | coût | capsules (5 %/niv.) |

Coûts : géométriques de `baseCost` à `maxCost`, palier 2 à partir du niv. 11 (3 h puis +1 h/niv. ; dès la bascule du rythme, 1er novembre 2026, 6.14.88 : coûts ×4 et, pour les 8 bâtiments exigés par l'Ascension, 36 h puis +27 h/niv., 6.14.89 ; la Cale sèche garde ses durées). File planifiée : 1 à 3 emplacements
(Fonderie niv. 5 et 10, `buildPlan.slotLevels`). Annulation : 100 % pendant 60 s, puis 80 % du temps restant.

## Familles et paliers (6.14.141 à 6.14.144, `docs/proposals/paliers-batiments.md`)
Règle n° 4 du GDD réécrite : deux familles.

| Famille | Bâtiments | Paliers |
|:--|:--|:--|
| **Système** (capacité ou service) | Entrepôt, Atelier de réparation, Cale sèche, Fonderie quantique (chantiers), hangars d'attaque et de défense (6.14.145) | un effet nouveau à chaque palier : choix (5), confort (10), spécialisation (15), signature (20) ; 5 et 10 pour un bâtiment à 10 niveaux |
| **Courbe** | 4 extracteurs, Fonderie et Synthétiseur (production), Générateur de bouclier, Labo de synthèse | jalons seulement : image du palier (`tierImages`), succès (« Maître » au 20), Codex ; jamais un bond de production (I29) |

| Bâtiment | 5 · Choix | 10 · Confort | 15 · Spécialisation | 20 · Signature |
|:--|:--|:--|:--|:--|
| Entrepôt (6.14.143) | ressource prioritaire : abri 8 h → 12 h | tampon : 2 h de production en trop gardées, versées dès que la place se libère | Négoce (taxe du comptoir −2 points) ou Convoi (soute des flottes +10 %) | entrepôt orbital : abri de 12 h pour les 4 ressources (16 h pour la prioritaire) |
| Atelier (6.14.144) | Cale sèche ouverte (prérequis de la Cale, affiché comme palier) | premiers soins : un lot de 15 min ou moins rentre aussitôt | atelier spécialisé : une classe réparée 50 % plus vite | réparation d'urgence : 2 h de réparation offertes une fois par jour |
| Hangar d'attaque (6.14.145) | baies modulaires : prêter 10 % de ses places au hangar de défense | file d'attente : 5 commandes payées attendent une place | Pont d'envol (vaisseaux −10 % de temps) ou Réacteurs (vol −5 %) | Pont de lancement : +1 emplacement de flotte |
| Hangar de défense (6.14.145) | baies modulaires : prêter 10 % de ses places au hangar d'attaque | file d'attente : 5 commandes payées attendent une place | Tourelles en série (défenses −10 % de temps) ou Entretien réduit (énergie des défenses −20 %) | Casemates : défenses reconstruites 60 → 70 % |
| Cale sèche (5.28) | Triage | remise automatique, Atelier +10 % | priorités | Cale orbitale |
| Fonderie quantique | +1 chantier | +1 chantier | — | — |

- Niveaux et chiffres : Admin → Règles → « Bâtiments : paliers » (groupe `buildingTiers` : `storageLevels`, `repairLevels`,
  `foundrySlotLevels`, `hangarAttackLevels`, `hangarDefenseLevels`, `choiceCooldownHours`, chiffres de chaque effet). La Cale sèche garde `dockTiers`.
- Palier atteint au **niveau effectif** (bâtiment débloqué). Choix sur la carte du bâtiment (ligne « Paliers », bouton « Choisir » /
  « Changer »), premier choix libre, puis un changement par 24 h ; enregistrés dans `buildingChoices` (action serveur `buildingChoice`).
- L'entrepôt et l'Atelier repartent au niveau 1 à l'Ascension : leurs paliers se rejouent, les choix restent enregistrés. Les
  hangars sont gardés : leurs paliers sont acquis une fois (6.14.145, fiche `unites-hangars.md`).
- Aucune migration : un joueur au-dessus d'un palier le reçoit au déploiement ; choix vides au départ.
- Chaîne de contenu (6.14.146) : succès « Première signature », « Architecte » (titre « Grand architecte »), « Premier plan »,
  « Bâtisseur avisé » ; paliers sur la fiche Codex du bâtiment ; Formules → Paliers ; Ctrl+K (type « Palier de bâtiment ») ; icônes
  `public/assets/tiers/<famille>-<rôle>.webp` (lignes `palier-*` de `scripts/illustrations.json`, `TIER_ART` une fois intégrées ;
  image du bâtiment en attendant).

## Code et admin
`buildings.ts`, `buildingTiers.ts` (paliers, choix, source « bâtiment »), `buildPlan.ts`, `cancel.ts`, `BuildingTiers.tsx` (ligne
« Paliers »). Admin : Contenu → Bâtiments (effets, coûts, prérequis `requires`) ; Règles → « Bâtiments : paliers ».

## État (audit 2026-10-06)
- Chantiers : un par bâtiment, en parallèle. Depuis la 5.32, au plus 6 en même temps (+1 à la Fonderie quantique 5 et 10, réglable : `buildingTiers.foundrySlotLevels` depuis 6.14.142, ancienne constante `BUILD_SLOT_BONUS_LEVELS`) ; un chantier lancé avant la limite va à son terme, la file planifiée attend un chantier libre sans expirer. Compteur « Chantiers n / m » sur la page Bâtiments.
- ~~`homeLevels` compte les bâtiments verrouillés~~ : corrigé en 5.28.1 (C3).
- Rabais de coût : technologies × couche empire (`playerBuildingDiscount`, plafond empire 50 %) depuis la 5.28.1.
