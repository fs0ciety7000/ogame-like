# Fiches systèmes

Une fiche par domaine du jeu : à quoi il sert, ses règles et chiffres **en vigueur**, où il vit dans le code, ce qui est réglable dans
l'admin, et l'état constaté au dernier audit. C'est le détail du GDD (`docs/GAME_DESIGN.md` §7 renvoie ici).

Règles de tenue (voir `CLAUDE.md`, règle n° 1) :

- un lot qui change une règle ou un chiffre met à jour la fiche du domaine dans le même commit ;
- les chiffres viennent du code (`*_RULES`, contenu par défaut) ; l'admin peut les surcharger en production (Contenu, Règles) ;
- section « État (audit) » : constats datés, renvoyant au rapport `docs/audit/` qui les détaille.

| # | Domaine | Fiche | Modules principaux |
|--:|:--|:--|:--|
| 1 | Économie et ressources | [economie.md](economie.md) | `economy.ts`, `resources.ts`, `catchup.ts`, `flush.ts` |
| 2 | Bâtiments | [batiments.md](batiments.md) | `buildings.ts`, `buildPlan.ts`, `cancel.ts` |
| 3 | Recherche | [recherche.md](recherche.md) | `technologies.ts` |
| 4 | Unités, chantier et hangars | [unites-hangars.md](unites-hangars.md) | `units.ts`, `unitClasses.ts`, `hangar.ts`, `eliteUnits.ts` |
| 5 | Combat et JcJ | [combat-jcj.md](combat-jcj.md) | `combat.ts`, `attack.ts`, `pvp.ts`, `formations.ts`, `debris.ts` |
| 6 | Atelier et Cale sèche | [atelier-cale-seche.md](atelier-cale-seche.md) | `workshop.ts`, `hangar.ts` |
| 7 | Flottes, espionnage, expéditions | [flottes.md](flottes.md) | `fleets.ts`, `espionage.ts`, `expeditions.ts` |
| 8 | Menaces PNJ (pirates, seigneurs, primes, boss) | [pnj-boss.md](pnj-boss.md) | `pirates.ts`, `warlords*.ts`, `coalition.ts`, `bounties.ts`, `leviathan.ts`, `worldBosses.ts`, `allianceBoss.ts`, `chronicles.ts` |
| 9 | Progression et rétention | [progression.md](progression.md) | `seasons.ts`, `leagues.ts`, `seasonPass.ts`, `chronicles.ts`, `achievements.ts`, `contracts.ts`, `dailyMissions.ts`, `streak.ts`, `challenges.ts`, `ascension.ts`, `talents.ts`, `xpTiers.ts` |
| 10 | Bonus d'empire (effets) | [bonus-effets.md](bonus-effets.md) | `effects.ts`, `modifiers.ts`, `commanders.ts`, `relics.ts`, `modules.ts`, `synthesis.ts` |
| 11 | Alliances et social | [alliances-social.md](alliances-social.md) | `alliances.ts`, `wars.ts`, `territories.ts`, `territoryWar.ts`, `seasonWars.ts`, `diplomacy.ts`, `globalChat.ts`, `messages.ts` |
| 12 | Commerce et monnaies | [commerce-monnaies.md](commerce-monnaies.md) | `market.ts`, `auctions.ts`, `tradeContracts.ts`, `serverPot.ts`, `casino.ts`, `bounties.ts` (Comptoir), `weeklyStock.ts`, `patrons.ts` |
| 13 | Colonies | [colonies.md](colonies.md) | `colonies.ts` |
| 14 | Prise en main, QoL et outils | [qol-outils.md](qol-outils.md) | `onboarding.ts`, `advancedGuide.ts`, `goals.ts`, `actionTemplates.ts`, `claimAll.ts`, `notifications`, admin |
