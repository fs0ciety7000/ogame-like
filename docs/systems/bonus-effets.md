# Bonus d'empire (circuit d'effets)

## Rôle
Un seul vocabulaire (`EffectStat`) et un seul résolveur pour tous les bonus : technologies (couche « tech »), officiers, reliques, talents,
territoires, modules, capsules, mutateurs de saison (couche « empire »), recherches et projets d'alliance (couche « alliance » pour leurs
calculs propres, couche « empire » pour le reste, 6.14.124). Plafonds par stat et par couche.

## Sources
| Source | Chiffres |
|:--|:--|
| Officiers (commandants) | 12 rôles, 2 postes (+1 à Platine), niveau 20 ; recrutement 150 Ambre ; officiers rares (boss) |
| Reliques | 26 modèles, 3 emplacements (+1 à la 1re Ascension), 30 au plus, fusion par 3 ; mythiques ; les 8 composées (5.23) rejoignent une liste personnalisée par la migration `relics-5.23` (6.14.60, I27) ; 6.14.133 : sources favorites (× 3) et poids de tirage par relique |
| Modules | 2 emplacements par classe, 7 modèles (inventaire de 30 modules), fusion par 3, 5 préréglages ; 6.14.133 : un plan « signature » par unité (23), 15 % des plans rares ou mieux |
| Capsules (Labo de synthèse) | 5 %/niv., 3 en stock, 12 h actives |
| Talents | 3 points par Ascension, rang 3 max |
| Mutateurs | un par mois (ou aucun) ; 6.14.125 : liste éditable (`mutators.defs` : nom, émoji, accroche, effets composés chiffrés), description construite depuis les effets ; l'ancien `mutators.values` (6.14.105) est repris par la migration `mutators-defs-6.14.125` |
| Alliance (6.14.124) | 5 recherches, 3 projets, effets composés ; couche « alliance » (temps de vol, production, contre-espionnage, bouclier, durées, abri, attaque contre les PNJ ; plafonds 0,5, bouclier 0,15, abri 0,25) ou couche empire |
| Classe d'empire (6.0) | une au choix : Industriel, Seigneur de guerre, Explorateur ; 3 effets + 1 avantage propre (chantier, emplacements de flotte, expédition) ; changement 100 Ambre / 7 jours ; 6.14.125 : liste éditable (`classes.defs`, effets composés chiffrés et avantages), une classe ajoutée agit, une classe livrée ne se retire pas |

## Code et admin
`effects.ts`, `modifiers.ts`, `effectTargets.ts`, `effectCatalog.ts`, `commanders.ts`, `relics.ts`, `modules.ts`, `synthesis.ts`, `talents.ts`, `mutators.ts`, `empireClass.ts`.
Admin : éditeur d'effets composables, rapport d'impact.

## État (audit 2026-10-06)
- Règle « une stat déclarée est lue » : `hangarCapacity` corrigée en 5.28 ; `fleetUpkeep` et `buildingDiscount` lus dans la couche empire depuis la 5.28.1 (plafond `EMPIRE_COST_CAP` = 50 %, C5). Test de garde `effectsRead.test.ts` : une nouvelle stat sans lecteur empire le fait échouer.
- Empilement de sources : la page « Fiche d'effets » existe, mais le joueur voit difficilement d'où vient un bonus en situation (combat, chantier).

## Revue AU8 (2026-10-07)
Plafonds par grandeur et couche réglables (`effectCaps`, 6.9.5), lus par `effectCap()` ; attaque et défense des technos : `combat.techCombatCap`. Gelée : `economy.keshBoostPct` ; Phéromone et second rôle des commandants de saison : `officerTuning`.

## 6.14.104 (revue AU27, lot AA3)
Modules : poids du tirage (60 / 28 / 10 / 2) et Ambre de recyclage (1 / 3 / 8 / 20) dans `modules.rarityWeights` et `recycleAmber` ;
les valeurs par famille et rareté (+3 % à +18 % ; voile 1 à 4) sont passées dans la section `moduleFamilies` en 6.14.127. Barèmes
des préréglages d'effets (aide à l'édition) : groupe `effectPresets.budgets`. Les plafonds d'effets restent en vigueur.

## 6.14.123 et 6.14.124 (revue AU27, lots AA5 et AA6)
- Préréglages d'effets : une unité ajoutée dans l'admin a ses préréglages générés (`generatedUnitPresets` : « Armement » si elle
  tire, « Blindage »), barème « unit » (« elite » pour une élite) ; le catalogue complet est `allEffectPresets()`.
- Couche « alliance » (`EffectLayer`) et source « Alliance » (`EffectSourceKind`) : la fiche d'effets du joueur et le rapport d'impact
  montrent les recherches et projets d'alliance ; leurs plafonds sont dans `effectCaps` (clé `alliance`). Les effets d'alliance de
  couche empire entrent par `empireEffects` (I9, I40).

## 6.14.125 (revue AU27, lot AA7)
- Effet chiffré (`ValuedEffect` : grandeur × cible × portée + valeur, `effects.ts`) porté par une classe d'empire ou un mutateur ; bornes
  `valuedEffectMax` (part 2, réduction 0,9, niveaux 5, points 20), validation `validateValuedEffects`.
- Classes (`classes.defs`, Règles → Classes d'empire) et mutateurs (`mutators.defs`, Règles → Événements et saisons) : éditeur commun
  `SystemListsEditors.tsx` ; la couche empire, les plafonds et le rapport d'impact les lisent comme avant (I9, I41).
- À contenu par défaut, effets, avantages, tirages et textes identiques à ceux d'avant (`listesSysteme.test.ts`).

## 6.14.127 (revue AU27, lot AA9)
- **Talents** : section de contenu `talents` (Admin → Talents) ; chaque talent porte ses effets composés (grandeur × cible × portée),
  valeur **par rang** (part 0,25, niveaux 2, points 5 au plus) ; source « talent », couche empire, plafonds inchangés. Un talent
  ajouté s'apprend et agit (serveur compris) ; un talent enregistré ne se supprime pas : « Retiré », il ne s'apprend plus et ses rangs
  gardent leur effet (I43). Texte : « {value} » = valeur par rang du premier effet.
- **Modules** : sections `moduleFamilies` (grandeur, classes où elle se monte, valeur par rareté, tournure du texte ; une grandeur
  qui vise des unités vise la classe où le module est monté) et `moduleTemplates` (famille, texte, « Retiré du tirage »), Admin →
  Modules. Raretés, poids et recyclage restent dans les règles (`modules`). 5 familles et 7 modèles livrés.
- Anciens réglages (`talents.perRank`, `modules.familyValues`) : lus en repli, puis repris dans les sections par les migrations
  `talents-section-6.14.127` et `module-families-6.14.127`. Valeurs identiques à contenu par défaut. Fiche :
  `docs/changes/6.14.127-talents-modules.md`.

## 6.14.133 (revue AU27, lot AJ27-10)
- **Plans de module « signature »** (AJ-1, Q65) : un modèle généré par unité (`sig_<unité>`, `signatureTemplate`), hors unités
  exclues et hors celles qu'une relique active vise déjà (le Sceau des Sentinelles) : 23 à contenu par défaut, une unité ajoutée dans
  l'admin a le sien. Il vise l'unité seule (`unit:<id>`), vaut sa famille × 1,25 (armement pour une unité qui tire, blindage sinon :
  +20 % d'attaque ou +22,5 % de points de vie en légendaire) et se monte sur la classe de l'unité (`moduleMountClasses`). 15 % des
  plans rares ou mieux sortent signature (unité tirée au hasard), jamais un commun. Rapport d'impact : deux légendaires montés, 40 %
  et 45 %, sous le plafond de 50 %. Un plan trouvé ne disparaît jamais (unité retirée : il reste, sans effet, I43). Règles
  `signatureModules` (Admin → Règles → « Porteurs signature et sources des reliques »).
- **Reliques par source** (AJ-11, Q67) : `sources` et `weight` par relique (Admin → Reliques, fiche) ; un tirage depuis l'une de ses
  sources (`relicSourceOf` : `loot:<source>`, `expedition`, `leviathan`, `boss:<mois>`, `vendetta:`, `coalition:`, `elite`, `weekly`,
  `pass`) multiplie son poids par `relicSources.sourceBoost` (3). Sources livrées : Trophée de seigneur (seigneurs), Écaille de
  Léviathan (boss mondiaux), Lame du duelliste (JcJ), Balise de traque (primes, menaces), Engrenage de Varan, Œil de Vesper et Sceau des
  Sentinelles (menaces), Soute pliée et Cristal mémoriel (expéditions), Couronne de l'Essaim et Égide de la Reine (primes). Une liste
  enregistrée avant 6.14.133 reprend les sources livrées (champ absent) ; sans source favorite, le tirage est celui d'avant (même graine).
  Fiche : `docs/changes/6.14.133-porteurs-signature.md`.

