# Commerce et monnaies

## Monnaies et jauges (14)
| Monnaie | Gagnée par | Dépensée pour |
|:--|:--|:--|
| 4 communes, 4 rares | production, missions, combats, expéditions | tout |
| Ambre de Ruche | primes, élite, boss, série j6, saisons, parrainage | Comptoir, accélérations, renommage, indices, enchères |
| Jetons de casino | objectifs du jour, série, combats (plafond 25/semaine), passe, défis | machine à sous du pot commun |
| Réputation Kesh | primes | rangs de chasseur |
| Notoriété pirate | combats contre les factions | traités, raids |
| XP | presque tout | rangs, divisions |
| Points de passe | activités | paliers du passe |
| Points de talent | Ascension | arbre de talents |

## Échanges
| Système | Règles |
|:--|:--|
| Comptoir d'échange | taux fixe, taxe 5 % |
| Marché | 5 offres, 20 achats/jour, 48 h, taxe 5 % (2 % en alliance), prix ±×3 du comptoir ; ordres d'achat ; PNJ marchand |
| Enchères | reliques et plans ; surenchère 5 %, anti-dernière-seconde 5 min, taxe 5 % |
| Contrats | 4 à 72 h, caution 10 %, 3 actifs |
| Cadeaux | 3 jours d'ancienneté ; taxe 20 % hors alliance |
| Pot commun | alimenté par les taxes et les dons ; concours, casino, mécènes |

Casino orbital : **ouvert en permanence** par défaut ; l'admin peut le fermer ou le programmer (créneaux à date précise, ouverture chaque
semaine, week-ends). **Tournoi de la semaine** : mercredi 18 h pour 30 h (6.7.1, `tournamentWeekly`, réglable ; décoché : un tournoi par
ouverture), compté seulement si le casino est ouvert.
| Comptoir de la Ruche | consommables, prestige, offre de la semaine |

## Code et admin
`market.ts`, `auctions.ts`, `tradeContracts.ts`, `serverPot.ts`, `casino.ts`, `contests.ts`, `bounties.ts`, `weeklyStock.ts`, `patrons.ts`.

## État (audit 2026-10-06)
- Depuis la 5.31, page **Portefeuille** (`wallet.ts`) : solde, origine et usage de chaque monnaie et jauge, plus le glossaire. Une monnaie nouvelle s'ajoute à `walletEntries`.

## Revue AU4 (2026-10-06)
Rapport `docs/audit/2026-10-06-au4-commerce.md`. Depuis la 6.9.0, tous les chiffres sont dans `GameRules` et dans Admin → Règles : enchères
(`auctions`), contrats (`tradeContracts`), cadeaux (`gifts`), concours (`contests`), points du tournoi (`tournamentPoints`), offre de la
semaine (`weeklyStock`, prix et exemplaires), mécènes (`patrons`) ; marché et PNJ marchand (`market`) ; casino dans Admin → Pot commun.
Comptoir d'échange (6.9.7) : taux et taxe réglables (`exchange`).

## 6.14.104 (revue AU27, lot AA3)
Chiffres des listes fixes réglables, valeurs inchangées (fiche `docs/changes/6.14.104-chiffres-reglables.md`) :
- **Comptoir de la Ruche** : prix des 22 objets (30 à 600 Ambre) dans `bountyShop.prices` (Admin → Règles → « Comptoir de la Ruche : prix »).
  Les descriptions lisent les règles (accélérateur, Gelée `economy.keshBoostPct` et `boostHours`, Voile, dossier, analgésique, réserve `maxCharges`).
- **Offre de la semaine** : sac de jetons (25) dans `weeklyStock.tokensBag` ; **mécènes** : paliers du badge (25, 100, 500, 2 000 Ambre)
  dans `patrons.tiers` (croissants, contrôlés) ; **enchères** : `auctions.maxStart` (10¹²) a son champ (Admin → Règles → Commerce).
