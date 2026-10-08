# Colonies

## Règles et chiffres
| Élément | Valeur |
|:--|:--|
| Nombre | 2 au plus |
| Condition | 120 puis 140 niveaux de bâtiments cumulés sur la planète mère |
| Fondation | 50 M par commune + 1 M par rare, 2 h de voyage ; stock de départ 5 M ; extracteurs à 50 % du niveau de la mère (max 8) |
| Bâtiments | extracteurs communs, entrepôt, hangar de défense ; niveau 18 max ; production +50 % (« terres neuves ») |
| Gisement rare | biome, 0,1 à 3/s (15 niveaux) |
| Spécialisations | dont Bastion (hangar de défense +50 %) ; changement tous les 7 jours |
| Défense | défenses seulement, hangar propre (tech « Extension des hangars » appliquée depuis la 5.28) ; depuis la 6.4, 1 lot en construction + 5 en file, payés d'avance, places réservées dès la commande ; un lot en attente annulé est remboursé en entier |
| Base avancée (6.10) | une flotte d'attaque stationne sur la colonie (14 jours au plus, 1 par colonie, un emplacement de flotte) ; les attaques partent des coordonnées de la colonie et y reviennent, le butin va à la planète mère ; ne défend pas la colonie par défaut ; depuis la 6.11, l'admin peut la faire combattre comme une garnison (50 %, Q9) ; « Lever la base » la rapatrie. Admin → Règles → Colonies |
| Route logistique (5.33) | convoi vers la planète mère toutes les 6, 12 ou 24 h ; réserve 0, 20 ou 50 % de l'entrepôt de la colonie (même part du gisement) ; 10 % perdus en route ; jamais au-delà de l'entrepôt de la planète mère ; un seul convoi au rattrapage. Depuis la 6.4, sens au choix : **Rapatrier** (colonie → mère) ou **Ravitailler** (mère → colonie, remplit l'entrepôt de la colonie à 25, 50 ou 80 %, communes seulement, la mère garde 30 % de son entrepôt) |

| Chaîne de contenu (6.14.115) | succès « Terres neuves » (1re colonie), « Empire des mondes » (toutes les colonies permises, nombre lu dans `colonies.maxColonies`), « Convoyeur » (100 convois arrivés, `stats.colonyConvoys`), « Avant-poste tenu » (base avancée restée jusqu'au bout, `stats.colonyBaseTours`) ; Codex « Colonies » : 4 biomes (ouverts par le relevé de la 1re colonie) et 4 spécialisations (ouvertes au 1er choix, gardées après un changement, `stats.colonySpecsUsed`), récompense 5 jetons + 25 Ambre (Admin → Chroniques) ; section Colonies des Formules |

## Code et admin
`colonies.ts`, `ColoniesPage.tsx` ; Codex : `codex.ts` (catégorie `colonies`, `biomeImage`, `colonySpecImage`, `COLONY_SPEC_LORE`) ;
succès : `achievements.ts` ; Formules : `FormulasGuide.tsx` (section `colonies`).

## État (audit 2026-10-06)
- Routes logistiques depuis la 5.33 (audit E6, `proposals/routes-logistiques.md`). Route inverse et file de défense depuis la 6.4 (`proposals/colonies-suite.md`). Base avancée depuis la 6.10 (`proposals/flotte-basee.md`). Reste : pas de chantier naval sur colonie.
- Seuil de fondation : seuls les bâtiments construits comptent (`effectiveBuildingLevel`) depuis la 5.28.1 (C3).

## 6.14.104 (revue AU27, lot AA3)
Multiplicateurs des 4 spécialisations dans `colonySpec.specs` (1,25 / 0,8 ; 0,9 / 1,6 ; 0,9 / 1,5 / 0,7 ; 1,6), entre 0,1 et 5 ; le résumé
affiché suit les chiffres. Seuils de niveaux par colonie (`colonies.levelsRequired`) et fondation (`foundationShare`, `foundationMax`)
ont leur champ dans Admin → Règles → Colonies.

## 6.14.115 (revue AU27, lot AJ27-5)
Les colonies entrent dans la chaîne de contenu (AJ-3) : quatre succès d'entrée et de maîtrise, catégorie « Colonies » du Codex, section
Colonies des Formules (chiffres lus dans `colonies`, `colonyRoutes`, `deposit`, `colonyBase`, `colonySpec`). Les biomes s'ouvrent tous au
relevé de la première colonie : avec deux colonies au plus, un biome tiré au hasard ne serait sinon jamais visible (Q proposée dans la fiche).
Images : spécialisations définitives (`/assets/colonies/<id>.webp`), biomes provisoires (icône de la ressource rare) en attendant les
lignes `colonie-biome-<id>` de `scripts/illustrations.json` (branchement : `BIOME_ART`).
