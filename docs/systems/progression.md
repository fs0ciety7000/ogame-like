# Progression et rétention

## Échelles
| Système | Rythme | Chiffres |
|:--|:--|:--|
| XP et rangs | continu | 28 rangs, de Fer III (100) à Élite (420 000) ; paliers d'XP par source (plein tarif, demi, quart) ; jeu actif ×1,25 à ×1,5 |
| Saisons | mensuel | champion 200 Ambre + 50 jetons ; podium ; participation 35 Ambre |
| Divisions (ligues) | hebdo | 6 divisions Bronze → Mythique, 20 % montent, 20 % descendent |
| Passe de saison | mensuel | 30 paliers × 40 points ; catalogue de 36 saisons |
| Chroniques | mensuel | 4 épisodes, boss de saison |
| Défis hebdo | hebdo | objectif serveur ; récompenses à 100 % et 150 % |
| Contrats du jour | quotidien | 3 ; série +10 %/jour (max +50 %) ; coffre tous les 7 |
| Missions du jour | quotidien | 3 tâches, 1 jeton chacune, +2 si toutes |
| Série de connexion | quotidien | 1 à 5 h de production, 2 jetons/jour, 35 Ambre au 6e jour, coffre au 7e |
| Succès | continu | 76 (dont dérivés des catalogues), indices payants pour les secrets |
| Ascension | ≥ 7 jours | 5 au plus ; +10 % de production, −5 % de temps de construction chacune ; 3 points de talent |
| Codex, titres, bannières | collection | procéduraux |

## Code et admin
`seasons.ts`, `leagues.ts`, `seasonPass.ts`, `passSeasons.ts`, `chronicles.ts`, `challenges.ts`, `contracts.ts`, `dailyMissions.ts`,
`streak.ts`, `achievements.ts`, `ascension.ts`, `talents.ts`, `xpTiers.ts`, `codex.ts`.

## État (audit 2026-10-06)
- Corvées quotidiennes réunies depuis la 5.30 dans **Ordres du jour** (`/game/ordres`, `dailyOrders.ts`) : liste de contrôle, « Tout réclamer » (série, missions, contrats, passe, Chroniques, prise en main), pastille unique, rendez-vous de la semaine. Fusion contrats et missions : en attente de décision (`proposals/journal-de-bord.md`).
- Nommage unifié (5.31) : « Saison » = le mois (XP, divisions) ; « Passe » = les 30 paliers ; « Chroniques » = l'histoire du mois. Glossaire dans le Portefeuille ; un test interdit « passe de saison » dans les écrans joueurs.
