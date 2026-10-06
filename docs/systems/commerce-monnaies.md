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
| Comptoir de la Ruche | consommables, prestige, offre de la semaine |

## Code et admin
`market.ts`, `auctions.ts`, `tradeContracts.ts`, `serverPot.ts`, `casino.ts`, `contests.ts`, `bounties.ts`, `weeklyStock.ts`, `patrons.ts`.

## État (audit 2026-10-06)
- Depuis la 5.31, page **Portefeuille** (`wallet.ts`) : solde, origine et usage de chaque monnaie et jauge, plus le glossaire. Une monnaie nouvelle s'ajoute à `walletEntries`.
