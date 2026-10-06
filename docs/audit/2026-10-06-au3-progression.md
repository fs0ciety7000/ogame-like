# Revue AU3 : progression (passe, Chroniques, Codex, succès et titres, défis, série, objectifs du jour, saisons)

Date : 2026-10-06. Lot AU3 de `docs/proposals/feuille-de-route-2026-hiver.md` §7.
Sources :
- code : `seasonPass.ts`, `chronicles.ts`, `dailyMissions.ts`, `claimAll.ts`, `achievements.ts`, `onboarding.ts`, `streak.ts` ;
- données de production : extrait en lecture seule du 2026-10-06 (16 comptes, 14 actifs sur 7 jours), agrégats anonymes ;
- interface : pages Passe, Chroniques, Codex, Succès, Ordres du jour, Statistiques à 375 px et 1 400 px, thème Constellation.

Le jeton d'accès à la production a expiré : la configuration du passe et le journal admin de production n'ont pas pu être relus.

## Chiffres (14 joueurs actifs, au 6e jour d'octobre)

| Mesure | Valeurs triées |
|:--|:--|
| Points de passe | 5, 10, 10, 75, 100, 133, 427, 629, 1 008, 1 056, **1 200 × 4** |
| Paliers réclamés (sur 30) | 0, 0, 0, 1, 1, 2, 10, 15, 25, 26, 30, 30, 30, 30 |
| Succès débloqués (sur 131) | 0, 1, 2, 18, 40, 46, 65, 69, 69, 70, 73, 78, 82, 89 (médiane 67) |
| Titres possédés | 0, 0, 0, 2, 9, 11, 17, 21, 22, 22, 24, 26, 29, 30 ; 9 joueurs en affichent un |
| Série de connexion (jours) | 0 à 4 ; meilleure série 4 |
| Chroniques d'octobre | épisode 1 réclamé par 7 joueurs ; 6 joueurs actifs n'ont jamais ouvert la page (état vide) ; épisodes 2 à 4 pas encore ouverts (jeudis 8, 15, 22) |

## Constats

| # | Gravité | Constat | Preuve | Suite |
|:--|:--|:--|:--|:--|
| PRG-1 | 🔴 | **Passe d'octobre terminé en 6 jours** par 4 joueurs sur 14 (1 200 points, 30 paliers), 2 autres au-delà de 1 000. La page annonce « ≈ 40 points par jour d'activité », soit un mois pour finir. **Le barème du code n'explique pas ces points** : recalculés depuis l'activité suivie, les 4 joueurs ont entre 220 et 330 points (missions à 0 depuis la 5.13, objectifs du jour en jetons) | `seasonPass.activity` × `PASS_POINTS` ; `passMax` = 1 200 | proposition `progression.md` §A (vérifier la source, puis régler le rythme) |
| PRG-2 | 🟠 | **Rien à gagner sur le passe pendant 24 jours** une fois terminé : seuls les gros gains (≥ 40 points : épisode, vendetta, boss) deviennent de l'Ambre (`PASS_OVERFLOW`) | `addPassPoints` | §B |
| PRG-3 | 🟡 | **Points de passe non tracés par source** : `activity` compte des actions, pas des points ; impossible de dire d'où viennent les 1 200 points sans relire le code et la configuration | `PassState` | §A |
| PRG-4 | 🟡 | **Titres en série** : chaque palier d'une famille de succès donne son titre (« Magnat II », « Magnat III », « Magnat IV »…) ; jusqu'à 30 titres par joueur, la liste de choix du profil s'allonge sans intérêt | `titles` | §C |
| PRG-5 | 🟡 | **Succès débloqués vite** : la moitié des joueurs actifs a plus de 50 % des 131 succès en 9 jours de jeu ; il reste peu d'objectifs longs pour les mois suivants | `unlockedAchievements` | §D (suivi) |
| PRG-6 | ℹ️ | Chroniques : 6 joueurs actifs n'ont jamais ouvert la page ; l'épisode prêt est bien couvert par « Tout réclamer » et la pastille d'Ordres du jour | `claimAll.ts` | rien |
| PRG-7 | ℹ️ | Prise en main : proposée seulement sous un niveau d'XP ; les comptes plus anciens ne la voient pas (13 joueurs sur 14), c'est voulu | `onboardingEligible` | rien |
| PRG-8 | ℹ️ | Interface : 6 pages sans défilement horizontal ni erreur ; la page Statistiques mesure 6 750 px de haut sur mobile | captures | revue AU13 (transverse) |

## Ce qui va bien
- « Tout réclamer » couvre passe, Chroniques, objectifs du jour, série, prise en main et carnet (`pendingClaims`).
- Les épisodes s'ouvrent chaque jeudi, avec la date affichée ; la carte Chroniques du passe montre l'objectif et sa progression.
- Succès : filtres par catégorie et palier, part des joueurs qui l'ont, recherche.

## Décisions à prendre
`docs/proposals/progression.md`.
