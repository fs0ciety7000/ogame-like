# Bonus d'empire (circuit d'effets)

## Rôle
Un seul vocabulaire (`EffectStat`) et un seul résolveur pour tous les bonus : technologies (couche « tech »), officiers, reliques, talents,
territoires, modules, capsules, mutateurs de saison (couche « empire »). Plafonds par stat et par couche.

## Sources
| Source | Chiffres |
|:--|:--|
| Officiers (commandants) | 12 rôles, 2 postes (+1 à Platine), niveau 20 ; recrutement 150 Ambre ; officiers rares (boss) |
| Reliques | 26 modèles, 3 emplacements (+1 à la 1re Ascension), 30 au plus, fusion par 3 ; mythiques ; les 8 composées (5.23) rejoignent une liste personnalisée par la migration `relics-5.23` (6.14.60, I27) |
| Modules | 2 emplacements par classe, 7 modèles (inventaire de 30 modules), fusion par 3, 5 préréglages |
| Capsules (Labo de synthèse) | 5 %/niv., 3 en stock, 12 h actives |
| Talents | 3 points par Ascension, rang 3 max |
| Mutateurs | un par mois (ou aucun) |
| Classe d'empire (6.0) | une au choix : Industriel, Seigneur de guerre, Explorateur ; 3 effets + 1 avantage propre (chantier, emplacements de flotte, expédition) ; changement 100 Ambre / 7 jours |

## Code et admin
`effects.ts`, `modifiers.ts`, `effectTargets.ts`, `effectCatalog.ts`, `commanders.ts`, `relics.ts`, `modules.ts`, `synthesis.ts`, `talents.ts`, `mutators.ts`, `empireClass.ts`.
Admin : éditeur d'effets composables, rapport d'impact.

## État (audit 2026-10-06)
- Règle « une stat déclarée est lue » : `hangarCapacity` corrigée en 5.28 ; `fleetUpkeep` et `buildingDiscount` lus dans la couche empire depuis la 5.28.1 (plafond `EMPIRE_COST_CAP` = 50 %, C5). Test de garde `effectsRead.test.ts` : une nouvelle stat sans lecteur empire le fait échouer.
- Empilement de sources : la page « Fiche d'effets » existe, mais le joueur voit difficilement d'où vient un bonus en situation (combat, chantier).

## Revue AU8 (2026-10-07)
Plafonds par grandeur et couche réglables (`effectCaps`, 6.9.5), lus par `effectCap()` ; attaque et défense des technos : `combat.techCombatCap`. Gelée : `economy.keshBoostPct` ; Phéromone et second rôle des commandants de saison : `officerTuning`.

## 6.14.104 (revue AU27, lot AA3)
Modules : poids du tirage (60 / 28 / 10 / 2), Ambre de recyclage (1 / 3 / 8 / 20) et valeurs par famille et rareté (+3 % à +18 % ;
voile 1 à 4) dans `modules.rarityWeights`, `recycleAmber`, `familyValues`. Barèmes des préréglages d'effets (aide à l'édition) :
groupe `effectPresets.budgets`. Les plafonds d'effets restent en vigueur.
