# Recherche (Labo)

## Rôle
Débloque unités et bâtiments, donne des bonus permanents (couche « tech » des effets).

## Règles et chiffres
- 30 technologies, jusqu'à 4 recherches en parallèle (`research.maxConcurrent`).
- Coût du niveau n : `baseCost × costGrowth^(n−1)` ; `costGrowth` = **2,7** (`research.costGrowth`), sauf croissance propre à la
  techno (1,9 à 2,4 pour les récentes, Contenu → Technologies).
- Durée du niveau n (avant réductions) : `baseTime × timeGrowth^(n−1)`, `timeGrowth` = **1,67** (`research.timeGrowth`) ; dès le niveau
  `research.lateFromLevel`, × `research.lateTimeFactor` ; au plus `research.maxLevelSeconds`. Défauts neutres depuis 6.14.84 (0, 1, 0 :
  ni recherche tardive ni plafond, mêmes coûts et durées qu'avant). **Bascule du rythme** (6.14.88, 1er novembre 2026, `rhythm.ts`) : un
  champ resté à ces valeurs neutres passe à **dès le niveau 6, ×30, 7 jours au plus** (réglages `rhythm.researchLate*`, Admin → Règles →
  Rythme sur des mois) ; une recherche lancée avant garde sa fin.
- Fin de partie (tech21 à tech26) : coûts en centaines de milliers de communes + rares, 600 s de base.
- Plafond des technos de combat (6.6, invariant I15) : attaque et défense des unités ≤ **+150 %** au total pour la couche techno
  (`TECH_COMBAT_CAP`) ; une techno ne dépasse pas **+100 %** à son niveau maximal, et ne monte pas une unité au-delà de son niveau
  maximal (refus à l'enregistrement du contenu).
- Effets notables : Extension des hangars (+5 %/niv.), Nanoréparation (+10 % de cadence/niv.), Espionnage, déblocages d'unités (`unlock_next_level`).

## Code et admin
`technologies.ts` (`RESEARCH_RULES`, `getTechCost`, `getTechTime`), `LabPage.tsx` (200 Ko de bundle). Admin : Contenu → Technologies
(éditeur d'effets composables) ; Règles → « Labo : coûts et durées des recherches » (6.14.84, `RhythmRulesFields.tsx`). Formules :
section Recherche. Garde : `rechercheReglable.test.ts`.

## État (audit 2026-10-06)
- 4 recherches parallèles dès le début : peu d'arbitrage (OGame : 1 recherche à la fois, Clash of Clans : 1 laboratoire).
- La page Labo pèse 200 Ko : à alléger (audit P2).
