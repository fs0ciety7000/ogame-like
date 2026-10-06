# Revue AU1 : menaces PNJ (pirates et factions, seigneurs de guerre, primes et Comptoir)

Date : 2026-10-06. Lot AU1 de `docs/proposals/feuille-de-route-2026-hiver.md` §7.
Sources :
- code : `pirates.ts`, `warlords.ts`, `warlordRanks.ts`, `bounties.ts`, `eliteUnits.ts`, `attack.ts`, `combat.ts` ;
- données de production : extrait en lecture seule du 2026-10-06 (16 comptes, 14 actifs sur 7 jours), agrégats anonymes ;
- interface : pages Menaces, Seigneurs, Primes à 375 px, thème Constellation.

Le jeton d'accès à la production a expiré pendant la revue : les chiffres viennent de l'extrait du matin, sans nouvelle lecture.

## Constats

| # | Gravité | Constat | Preuve | Suite |
|:--|:--|:--|:--|:--|
| PNJ-1 | 🔴 | **Attaque des unités non plafonnée par la techno `tech19_2`** (ajoutée par l'admin) : `unit_attack` 0,07 par niveau × 20 niveaux = **+140 %** d'attaque de toutes les unités. Puissance d'attaque (tech5) donne déjà +100 % au niveau 10 (correction du 2026-10-06 : la version précédente disait « aucune techno ne dépasse +50 % », c'était faux). La validation du contenu accepte jusqu'à 5 (500 %) par niveau | 3 joueurs : niveaux 20, 15, 13 → +140 %, +105 %, +91 % | proposition `menaces-pnj.md` §A |
| PNJ-2 | 🟠 | **Traqueur Kesh au-delà de son niveau maximal** : la techno le monte jusqu'à 20, sa fiche dit `maxLevel: 1` ; le moteur ne borne pas le niveau (`flush.ts`, `unlock_next_level`). Avec le bonus par défaut (+5 par niveau), le niveau 20 vaut 515 d'attaque contre 420 : la description « +1 700 attaque par niveau » ne tient que si l'admin a aussi changé `levelBonus` | Traqueurs aux niveaux 20, 15, 13 chez 3 joueurs | §B |
| PNJ-3 | 🟠 | **Aucun repaire ouvert** sur les 6 factions : il faut 4 à 5 raids repoussés par faction, les joueurs en ont 1 ou 2. Les ultimatums d'une faction arrivent au mieux tous les 3 à 4 jours (déclencheur « richesse », 72 à 96 h) | `lairOpen` : 0 partout ; `repelled` max 2 | §C |
| PNJ-4 | 🟡 | Raids repoussés à **96 %** (66 sur 69), cible 70 % ; adaptation moyenne 1,01 : trop peu de raids pour que l'adaptation joue | `raidsWon`, `raidsLost`, `adapt` | suit PNJ-3 |
| PNJ-5 | 🟡 | **Unités d'élite : 0 débloquée.** 2 joueurs ont le Labo complet ; il leur manque une vendetta gagnée contre la bonne personnalité | `missingTechs` = 0 pour 2 joueurs | à suivre (santé) |
| PNJ-6 | 🟡 | Effet du lot M (pillage 30 %) sur les seigneurs : leurs attaques restent plafonnées à 6 h de production, mais **le butin pris sur un seigneur a triplé** (stock de 6 à 12 h × 30 %, surcharge ×2) | `attack.ts`, `combat.ts` | accepté (JcE plus payant), documenté |
| PNJ-7 | 🟡 | « Relancer » (6.3) sur une prime déjà remplie : le serveur refuse (message clair), le bouton reste proposé | `launchFleet` garde `bountyId` | §D |
| PNJ-8 | ℹ️ | Ambre : médiane 85 ; un compte à 9 485 avec 534 gagnés (dons admin) ; 104 primes remplies par 11 joueurs ; plan du Traqueur acheté par 6 joueurs | `bounties` | rien |
| PNJ-9 | ℹ️ | Interface : pages lisibles à 375 px, sans défilement horizontal ; le bandeau de ressources occupe environ 300 px en haut de chaque page mobile | captures | revue AU13 (transverse) |

## Ce qui va bien
- Raids, repaires, primes et seigneurs ont chacun leurs tests (`pirates.test.ts`, `bounties.test.ts`, `warlords522/523.test.ts`) ; tous passent.
- Les raids pirates ne pillent pas par le combat (`defenderResources` vide) : le lot M ne les a pas touchés.
- Les attaques de seigneurs respectent l'abri (`protectedAmount`) et le plafond de 6 h.

## Décisions à prendre
Regroupées dans `docs/proposals/menaces-pnj.md` (§A à §D).

## Suite (6.6.0)
Décisions A à D livrées : `docs/changes/6.6.0-menaces-pnj.md`. Le plafond retenu est +150 % au total et +100 % par techno, pour ne pas
retirer le +100 % de Puissance d'attaque.
