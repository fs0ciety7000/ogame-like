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
| Comptoir d'échange | taux fixe, taxe 5 % ; communes → rares : **30 M de rares par semaine** au plus, toutes réunies, après taxe (lundi 00 h UTC ; 6.14.106, Q98) |
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
Comptoir d'échange (6.9.7) : taux et taxe réglables (`exchange`). 6.14.106 (AE-L3) : plafond hebdomadaire `exchange.weeklyRareCap`
(30 M, 0 = sans plafond), compté par le serveur dans le profil (`exchangeWeek` : semaine et rares reçues), section Admin → Règles →
Comptoir d'échange ; la page Ressources et le Portefeuille affichent le plafond et le reste de la semaine (invariant I33).

## 6.14.104 (revue AU27, lot AA3)
Chiffres des listes fixes réglables, valeurs inchangées (fiche `docs/changes/6.14.104-chiffres-reglables.md`) :
- **Comptoir de la Ruche** : prix des 22 objets (30 à 600 Ambre) dans `bountyShop.prices` (Admin → Règles → « Comptoir de la Ruche : prix »).
  Les descriptions lisent les règles (accélérateur, Gelée `economy.keshBoostPct` et `boostHours`, Voile, dossier, analgésique, réserve `maxCharges`).
- **Offre de la semaine** : sac de jetons (25) dans `weeklyStock.tokensBag` ; **mécènes** : paliers du badge (25, 100, 500, 2 000 Ambre)
  dans `patrons.tiers` (croissants, contrôlés) ; **enchères** : `auctions.maxStart` (10¹²) a son champ (Admin → Règles → Commerce).

6.14.107 (AE-L4) : l'Ambre gagnée est comptée par source et par semaine (`stats.amberWeek`, semaine en cours et précédente :
primes, proie d'élite, série et coffre, passe, Chroniques, Codex, fin de saison, boss, parrainage, recyclage, guide, autres ; les
remboursements et les ventes aux enchères, simples transferts, ne comptent pas). Admin → Équilibrage → Santé : part de chaque source,
alerte si les primes dépassent 60 % (`balanceHealth.amberBountySharePct`) ; actifs au plafond du comptoir (Q268).

6.14.110 (AC-D) : l'Ambre se dépense par un seul chemin (`spendAmber`, `spending.ts`) : technos, recrutement, indices, Atelier,
Comptoir de la Ruche, échange, don au pot commun, offre de la semaine, pseudo, classe. Chaque sortie est comptée dans `stats.amberSpent`
(la mise d'enchère, rendue si dépassée, ne l'est pas). Invariant I34.
6.14.113 (AC-G) : le jeton du jour du casino et la récompense du défi de la semaine (jetons du palier compris) se prennent aussi par
« Tout réclamer » ; le bouton du casino et la carte du défi passent par la même action (ligne au Journal, vacances refusées).
