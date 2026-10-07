# Revue AU5 : alliances (membres et rôles, trésor, recherches, guerres, territoires, projets, saga, diplomatie, calendrier)

Date : 2026-10-07. Lot AU5 de `docs/proposals/feuille-de-route-2026-hiver.md`.
Sources : code (`alliances.ts`, `allianceProfile.ts`, `allianceDaily.ts`, `allianceChallenge.ts`, `allianceSaga.ts`, `diplomacy.ts`,
`territories.ts`, `wars.ts`, `seasonWars.ts`, `AlliancePage.tsx`, `WarTab.tsx`) ; interface à 375 px et 1 400 px (Constellation) ; données
de production non relues (`docs/QUESTIONS.md` Q3).

## Constats

| # | Gravité | Constat | Preuve | Suite |
|:--|:--|:--|:--|:--|
| ALL-1 | 🟡 | Règle n° 2 : nombre de diplomates (`MAX_DIPLOMATS` = 2) et heures du podium du défi d'alliance (`ALLIANCE_CHALLENGE_REWARDS` = 6, 4, 2) en dur ; les autres règles du domaine sont réglables depuis la 6.9.1 (registre) | `alliances.ts`, `allianceChallenge.ts` | **corrigé en 6.9.2** |
| ALL-2 | 🟠 | **Quitter l'alliance sans confirmation** ; le dernier membre dissout l'alliance et perd trésor, recherches et projets sans avertissement | `AlliancePage.tsx` (`handleLeave`), `removeMember` | **corrigé en 6.9.2** (confirmation, texte selon le cas) |
| ALL-3 | 🟠 | Exclure un membre, déclarer une guerre (coût prélevé) et se rendre : actions sans confirmation (règle du front : `askConfirm`) | `AlliancePage.tsx`, `WarTab.tsx` | **corrigé en 6.9.2** |
| ALL-4 | 🟡 | Délai avant les hostilités écrit en dur dans le message (« 12 h ») alors qu'il est réglable | `WarTab.tsx` | **corrigé en 6.9.2** |
| ALL-5 | ℹ️ | Garde-fous du moteur en place : droits fins (exclusion, trésor, recherches, projets, recrutement), fondateur non exclu, versements plafonnés (20 % du stock, 10 par jour), une recherche à la fois, passation au départ du fondateur | `alliances.ts` | rien |
| ALL-6 | ℹ️ | Grille des territoires (6 × 4) : changer ses dimensions casserait les secteurs en cours ; la validation des règles la fige depuis la 6.9.1 | `territories.ts` (`SECTOR_COUNT`) | rien |

## Ce qui va bien
- Rôles personnalisés et droits fins, candidatures, fiche publique.
- Garnisons plafonnées par hôte, rapports partagés limités dans le temps.

## Décisions
Aucune décision d'équilibre ouverte.
