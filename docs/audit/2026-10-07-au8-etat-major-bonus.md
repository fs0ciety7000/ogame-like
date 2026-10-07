# Revue AU8 : état-major et bonus (officiers, reliques, talents, Ascension, classes, circuit d'effets)

Date : 2026-10-07. Lot AU8 de `docs/proposals/feuille-de-route-2026-hiver.md`.
Sources : code (`effects.ts`, `technologies.ts`, `economy.ts`, `commanders.ts`, `bounties.ts`, `impact.ts`) ; interface (État-major,
Primes et Comptoir, Labo, Formules, Admin → Règles) à 375 px et 1 400 px, Constellation ; données de production non relues (Q3).

## Constats

| # | Gravité | Constat | Preuve | Suite |
|:--|:--|:--|:--|:--|
| BON-1 | 🟠 | **Plafonds des bonus en dur** (règle n° 2) : réductions des technos 75 %, couche empire 50 % (durées, coûts), bouclier, avantage de classe, unités ciblées… recopiés dans la table des effets au chargement | `effects.ts` (`EFFECT_STATS[].cap`) | **corrigé en 6.9.5** : groupe `effectCaps` (par grandeur et couche), lu par `clampEffect`, les descriptions de technos et l'éditeur d'effets |
| BON-2 | 🟠 | **Doublons entre le Comptoir et les règles** : bonus de la Gelée (`KESH_BOOST_PCT` et `BOUNTY_SHOP_RULES.boostPct`), Phéromone (`PHEROMONE_PCT` et `.pheromonePct`), contrat prioritaire (`.priorityHours` et `tradeContracts.priorityHours`) : régler l'un ne changeait pas l'autre | `bounties.ts`, `economy.ts`, `commanders.ts` | **corrigé en 6.9.5** : une source chacun (`economy.keshBoostPct`, `officerTuning.pheromonePct`, `tradeContracts.priorityHours`) |
| BON-3 | 🟡 | Part du second rôle d'un commandant de saison (50 %) en dur, et texte du rapport d'impact figé au chargement | `commanders.ts`, `impact.ts` | **corrigé en 6.9.5** (`officerTuning.seasonSecondaryShare`, texte calculé) |
| BON-4 | 🟡 | Textes du Comptoir écrits en dur (« +25 % », « 24 h ») alors que les valeurs sont réglables | `bounties.ts` | **corrigé en 6.9.5** (textes calculés) |
| BON-5 | ℹ️ | Bonus du Traqueur contre les PNJ : la valeur lue au combat est `combat.keshPveBonus` (réglable) ; `KESH_PVE_BONUS` ne sert plus qu'aux tests | `combat.ts` | rien |
| BON-6 | ℹ️ | Officiers, reliques, talents, Ascension, classes : règles réglables (onglets dédiés, registre 6.9.1) ; I14 et I15 tenus (`derived.test.ts`, `menaces66.test.ts`) | tests | rien |

## Décisions
Aucune décision d'équilibre : valeurs par défaut inchangées.
