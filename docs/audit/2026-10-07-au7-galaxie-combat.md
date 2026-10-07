# Revue AU7 : galaxie et combat (carte, joueurs et classement, espionnage, rapports, journal, simulateur, flottes)

Date : 2026-10-07. Lot AU7 de `docs/proposals/feuille-de-route-2026-hiver.md`.
Sources : code (`fleets.ts`, `espionage.ts`, `combat.ts`, `FleetsPanel.tsx`, `ThreatsPage.tsx`) ; interface (Galaxie, Classement,
Simulateur, Journal) à 375 px et 1 400 px, Constellation ; données de production non relues (Q3).

## Constats

| # | Gravité | Constat | Preuve | Suite |
|:--|:--|:--|:--|:--|
| GAL-1 | 🟡 | **Rappel de flotte sans confirmation** : la mission (attaque, transport, recyclage…) est abandonnée d'un clic | `FleetsPanel.tsx` (`recall`) | **corrigé en 6.9.4** |
| GAL-2 | 🟡 | Règle n° 2 : distance d'un repaire (`LAIR_DISTANCE` = 60) et délai de départ maximal (`FLEET_DELAY_MAX_MINUTES` = 720) en dur | `fleets.ts` | **corrigé en 6.9.4** (`fleets.lairDistance`, `fleets.delayMaxMinutes`) |
| GAL-3 | ℹ️ | Combat, protections, espionnage, débris et patrouille réglables (groupes `combat`, `pvp`, `spy`, `debris`, `patrol`, `fleets`) | `content.ts` | rien |
| GAL-4 | ℹ️ | 4 pages sans défilement horizontal ni erreur | captures | rien |

## Décisions
Aucune.
