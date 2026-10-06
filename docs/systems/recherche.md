# Recherche (Labo)

## Rôle
Débloque unités et bâtiments, donne des bonus permanents (couche « tech » des effets).

## Règles et chiffres
- 30 technologies, jusqu'à 4 recherches en parallèle (`MAX_CONCURRENT_RESEARCH`).
- Coût : `baseCost × costGrowth^(niv−1)` (croissance 1,9 à 2,4 pour les récentes) ; durée `baseTime × 2^(niv−1)` environ.
- Fin de partie (tech21 à tech26) : coûts en centaines de milliers de communes + rares, 600 s de base.
- Effets notables : Extension des hangars (+5 %/niv.), Nanoréparation (+10 % de cadence/niv.), Espionnage, déblocages d'unités (`unlock_next_level`).

## Code et admin
`technologies.ts`, `LabPage.tsx` (200 Ko de bundle). Admin : Contenu → Technologies (éditeur d'effets composables).

## État (audit 2026-10-06)
- 4 recherches parallèles dès le début : peu d'arbitrage (OGame : 1 recherche à la fois, Clash of Clans : 1 laboratoire).
- La page Labo pèse 200 Ko : à alléger (audit P2).
