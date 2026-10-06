# Docs : revue AU2, boss (et correctif d'affichage)

Type : docs, correctif
Statut : livré (branche `claude/hiver-k-s`)
Proposition : `docs/proposals/menaces-pnj.md` (décisions A et D)

## Demande
> « Audit et review de tout ce qui a été fait »

## Ce qui change
- Rapport `docs/audit/2026-10-06-au2-boss.md` : constats BOSS-1 à BOSS-5.
- Correctif : à 375 px, le décompte d'un boss passe sous son nom (`BossStage.tsx`) ; le nom ne se coupe plus sur 4 lignes.
- Fiche `docs/systems/pnj-boss.md`, feuille de route, GDD (journal).

## Design (DESIGN.md)
Mise en page seulement ; vérifié à 375 px, thème Constellation.

## Validation
`tsc -b`, `eslint src`, `vitest run`, `npm run build`.
