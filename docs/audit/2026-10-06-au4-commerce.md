# Revue AU4 : commerce (marché, ordres d'achat, contrats, enchères, PNJ marchand, pot commun, concours, casino et tournoi)

Date : 2026-10-06. Lot AU4 de `docs/proposals/feuille-de-route-2026-hiver.md`.
Sources :
- code : `market.ts`, `auctions.ts`, `tradeContracts.ts`, `serverPot.ts`, `contests.ts`, `casino.ts`, `weeklyStock.ts`, `patrons.ts`,
  `actions.ts` (cadeaux), `bounties.ts` (Comptoir) ;
- interface : Commerce (marché, enchères), Casino, Primes et Comptoir, Portefeuille, à 375 px et 1 400 px, thème Constellation ;
- données de production : **non relues** (jeton d'accès expiré, `docs/QUESTIONS.md` Q3).

## Constats

| # | Gravité | Constat | Preuve | Suite |
|:--|:--|:--|:--|:--|
| COM-1 | 🟠 | **Règle n° 2 non tenue** : 9 réglages du commerce codés en dur, absents de l'admin : enchères (`AUCTION_RULES` : surenchère, taxe, durées, mises à prix, ventes ouvertes ; alertes et historique), contrats (`TRADE_CONTRACT_RULES`, durée du contrat prioritaire), cadeaux (`GIFT_RULES` : ancienneté, taxe hors alliance), concours (`CONTEST_RULES`), points du tournoi (`OUTCOME_POINTS`), offre de la semaine (prix et exemplaires), mécènes (places) | `grep` des constantes, `content.ts` | **corrigé en 6.9.0** |
| COM-2 | ℹ️ | Garde-fous des actions en place : pas d'enchère sur sa propre vente, pas de contrat avec soi-même, relique mythique invendable, montants bornés, caution vérifiée, anti-dernière-seconde | `auctions.ts`, `tradeContracts.ts` | rien |
| COM-3 | ℹ️ | Volumes réels (offres publiées, ventes aux enchères, entrées du pot, tirages) non mesurés : pas d'accès à la production, et la santé de l'équilibre ne relève pas le commerce | Admin → Équilibrage → Santé | à reprendre dans la revue transverse AU13 (relevés commerce) |
| COM-4 | ℹ️ | Valeur des ressources rares dans le tableau de bord du pot (`RARE_WEIGHT` = 50) : sert à l'affichage d'un total, pas à une règle | `serverPot.ts` | rien |
| COM-5 | ℹ️ | Interface : 5 pages sans défilement horizontal ni erreur à 375 px ; Casino long (3 465 px) mais structuré en cartes | captures | AU13 (longueur des pages) |

## Ce qui va bien
- Toutes les taxes vont au pot commun, et le pot finance concours, casino et mécènes : la boucle est fermée et visible (bandeau du pot).
- Le Portefeuille explique chaque monnaie ; le casino affiche ses chances calculées sur les réglages.
- Les anti-abus de la 5.26 (enchères entre comptes liés) restent actifs.

## Décisions
Aucune décision d'équilibre ouverte : COM-1 est un correctif (mêmes valeurs par défaut). COM-3 est noté pour AU13.
