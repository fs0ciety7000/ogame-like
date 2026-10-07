# Revue AU27 : chaîne des actions (de l'intention du joueur à l'effet visible)

Date : 2026-10-07. Audit de lecture, sans changement de code ni intégration PocketBase lancée.

Sources lues :
- moteur : `src/game/actions.ts` (`performPlayerAction`, `actionNeedsAway`, `actionNeedsCodex`), `src/game/claimAll.ts`, `src/game/flush.ts` ;
- serveur : `pocketbase/pb_hooks/cosmic.pb.js` (1 071 lignes), `cosmic_db.js` (10 004 lignes), `cosmic_updater.pb.js`, `pb_schema.json` (règles d'accès) ;
- entrée des hooks : `src/server/hooksEntry.ts` ;
- client : `src/services/*`, `src/store/*`, `src/hooks/useGameSync.ts`, pages et composants qui appellent les services ;
- tests : `src/services/pocketbase.integration.test.ts` (3 029 lignes) et `src/**/*.test.ts`.

Hors périmètre : l'interface lune et phalange en cours d'écriture (routes `moon/phalanx`, `moon/scan`, `fleet/jump` lues côté serveur seulement).

Légende des gravités : 🔴 perte ou duplication de données des joueurs · 🟠 règle contournable ou information perdue · 🟡 incohérence, dette, risque de charge · ℹ️ constat sans suite urgente.

---

## 1. La chaîne type

```
bouton (page ou composant)
  → service client (src/services/*.ts : act() ou callGame("route"))
  → POST /api/cosmic/<route>            (cosmic.pb.js : maintenanceGuard, banGuard, requireAuth)
  → fonction de cosmic_db.js            (lecture, $app.runInTransaction)
  → moteur pur (cosmic_game.js, exports de hooksEntry.ts)
       flushState : production, files terminées, succès, notifications de rattrapage
       puis l'action : vérifications, paiement (pay), stats, contrats, passe
  → écritures : players + queues (savePlayer), notifications (notify), autres collections
  → retour JSON → toast de la page
  → abonnements temps réel (players, queues, notifications, fleets) → stores zustand → écrans, cloche, Journal
```

Points solides constatés :
- le client n'applique aucune règle seul : les stores (`playerStore`, `fleetStore`…) ne sont remplis que par les abonnements ; les règles d'accès de `players` interdisent l'écriture des champs de jeu (`updateRule` et `guardPlayerUpdate`, liste blanche `PLAYER_WRITABLE`) ;
- les 41 fonctions `admin*` de `cosmic_db.js` et les routes admin de `cosmic.pb.js` vérifient `isGameAdmin` (garde `adminRoutes.test.ts`) ;
- les 586 fonctions du moteur appelées par `cosmic_db.js`, `cosmic.pb.js` et `cosmic_sync.js` sont toutes exportées par `hooksEntry.ts` (balayage des noms) ;
- les flottes sont traitées une par une dans leur propre transaction, statut relu dans la transaction : la tâche minute et l'appel `processDueFleets(uid)` de `/action` ne peuvent pas résoudre deux fois la même arrivée ;
- l'annulation automatique du SDK est coupée (`pb.autoCancellation(false)`) : une requête en double n'est pas avortée côté client alors que le serveur l'a appliquée ;
- les écritures PocketBase passent par une seule connexion d'écriture : deux transactions ne se chevauchent pas. Le risque de perte d'écriture vient donc seulement des lectures faites **hors** transaction puis réécrites (AC-1, AC-2, AC-9).

---

## 2. Inventaire : actions de `POST /api/cosmic/action`

Commun à toutes les lignes :
- service `act()` de `playerService.ts`, puis `callGame("action")` ;
- côté serveur (`cosmic.pb.js:71-125`) : `processDueFleets(uid)` hors transaction, puis dans une transaction `applyContent`, `loadPlayer`, `performPlayerAction`, `savePlayer` (players et queues, progression du défi hebdomadaire) et `notify` des notifications du rattrapage ;
- succès : vérifiés dans `flushState` **avant** l'action (`flush.ts:257`), donc débloqués au rattrapage suivant (heartbeat de 20 s) ;
- retour : `{ result }`, toast de la page, puis mise à jour par les abonnements ;
- pendant les vacances, seules 8 actions passent (`VACATION_ACTIONS`, `actions.ts:196`).

Colonnes :
- **Annexes** : statistiques (`bumpStat`), contrats du jour (`recordContract`), points de passe, XP d'officier ;
- **Journal** : notification écrite par l'action elle-même (hors rattrapage) ;
- **Intégr.** : couverte par `pocketbase.integration.test.ts` (✓), seulement par un test unitaire du moteur (u), ou par aucun test passant par `performPlayerAction` (✗).

| Action | Écran (déclencheur) | Service | Moteur | Annexes | Journal | Retour | Intégr. |
|:--|:--|:--|:--|:--|:--|:--|:--|
| `sync` | heartbeat 20 s, retour sur l'onglet, Paramètres | `syncPlayer` | `passDailyLogin`, `recordActiveDay` | temps de jeu, présence | rattrapage seul | fenêtre « Pendant ton absence » | ✓ |
| `unlockBuilding` | Bâtiments | `unlockBuilding` | `unlockBlocker`, `pay` | dépense, contrat `spend` | — | toast | ✓ |
| `upgradeBuilding` | Bâtiments, Ctrl+K | `startBuildingUpgrade` | `buildSlotBlocker`, `pay` | dépense, contrat `upgrade_building` | — | toast | ✓ |
| `planBuilding` / `unplanBuilding` | Bâtiments, Planificateur, carte Plan | `planBuilding`, `unplanBuilding` | `addPlanned`, `removePlanned` (lancement au rattrapage : `buildPlan.ts:134`) | au lancement : dépense, contrat | — | toast | ✓ |
| `buildUnits` | Unités, Ctrl+K | `enqueueUnitBuild` | `hangarLoad` (flottes lues : `actionNeedsAway`), `pay` | dépense, contrat `build_units` | — | toast | ✓ |
| `sellUnits` | Unités | `sellUnit` | remboursement 50 % | **aucune** | — | toast | u |
| `research` | Labo, Ctrl+K | `startResearch` | `checkPrereqs`, `pay`, Ambre | `researchStarted`, contrat, `nightResearch` | — | toast | ✓ |
| `mission` | Missions | `startMission` | `hasPrerequisites` (unités non bloquées) | à la fin : XP, contrat, passe | à la fin (rattrapage) | toast | u |
| `trade` | Ressources (comptoir) | `tradeResources` | `tradeQuote` | `traded`, XP intendant ; taxe au pot commun (serveur) | — | toast | ✓ |
| `claimContract` / `rerollContract` | carte Contrats | `claimContract`, `rerollContract` | `claimContract`, `rerollContract` | `contracts`, passe, XP | — | toast | ✓ / ✗ |
| `setTitle` | Profil | `setActiveTitle` | `setActiveTitle` | — | — | toast | ✓ |
| `claimOnboarding` / `hideOnboarding` | liste de prise en main, Paramètres | `claimOnboarding`, `hideOnboarding` | `claimOnboarding` | — | — | toast | ✓ |
| `claimGuide` / `hideGuide` | Carnet du commandant, Paramètres | `claimGuide`, `hideGuide` | `claimGuideStep` | — | — | toast | u / ✗ |
| `codexClaim` | « Tout réclamer » seulement | (via `claimAll`) | `claimCodexCategoryLocal` (contexte serveur `actionNeedsCodex`) | jetons, Ambre | — | — | u |
| `claimAll` | Ordres du jour, pastille, Ctrl+K | `claimAllRewards` | `pendingClaims` puis chaque action ; échecs avalés (`actions.ts:380-391`) | ceux des actions | — | toast récapitulatif | u |
| `setPosture` | carte Posture | `setBasePosture` | `setPosture` | — | — | toast | ✓ |
| `seenAnnouncements` | Annonces, modale | `markAnnouncementsSeen` | `addSeenAnnouncements` | — | — | — | ✓ |
| `ascend` | carte Ascension | `ascendEmpire` | `ascend` | `ascensions` | — | toast | ✓ |
| `colonize` | Colonies | `startColonization` | `startColonization` (paie **hors** `pay`) | **pas de dépense comptée** | à la fondation (rattrapage) | toast | ✓ |
| `colonyUpgrade` / `colonyDefense` | Colonies | `upgradeColonyBuilding`, `buildColonyDefense` | ressources de la colonie | — | — | toast | ✓ / ✗ |
| `colonyRename` / `colonySpec` / `colonyRoute` | Colonies | `renameColony`, `setColonySpec`, `setColonyRoute` | `colonies.ts` | — | — | toast | ✗ |
| `empireClass` | Classe d'empire | `chooseEmpireClass` | `chooseEmpireClass` (Ambre) | — | — | toast | ✗ |
| `moonUpgrade` | ligne Lune | `upgradeMoon` | `upgradeMoon` (paie **hors** `pay`) | **pas de dépense comptée** | — | toast | ✓ |
| `locateLair` | Menaces | `locateFactionLair` | `locateLair` (paie **hors** `pay`) | **pas de dépense comptée** | — | toast | ✗ |
| `commanderRecruit` / `Assign` / `Train` | Commandement | `recruitCommander`, `assignCommanders`, `trainCommander` | `commanders.ts` (`pay` si production) | dépense si production | — | toast | ✓ |
| `synthCraft` / `synthActivate` | Commandement | `craftCapsule`, `activateCapsule` | `synthesis.ts` (paie **hors** `pay`) | **pas de dépense comptée** | à la fin (rattrapage) | toast | ✓ |
| `relicEquip` / `relicFuse` / `relicRecycle` | Commandement | `equipRelic`, `fuseRelics`, `recycleRelic` | `relics.ts` | Ambre | — | toast | ✓ |
| `achievementHint` | Succès | `buyAchievementHint` | `checkHintPurchase` (Ambre) | `hintsBought` | — | indice affiché | u |
| `moduleBuild` / `Mount` / `Unmount` / `Recycle` / `Fuse` | onglet Modules | `buildShipModule`… `fuseShipModules` | `modules.ts` (`pay` pour la fabrication) | `modulesBuilt` | — | toast | u / ✗ |
| `modulePresetSave` / `Apply` / `Delete` | onglet Modules | `…PresetAction` | `modules.ts` | — | — | toast | ✗ |
| `chatArchive` | Messages | `archiveConversation` | `setConversationArchived` | — | — | — | ✗ |
| `setProfileStyle` | carte Style du profil | `saveProfileStyle` | `setProfileStyle` | — | — | toast | ✓ |
| `talentLearn` / `talentReset` | arbre des talents | `learnTalent`, `resetTalents` | `talents.ts` | — | — | toast | ✗ |
| `streakClaim` | badge de série, Ctrl+K | `claimStreak` | `claimStreak` | ressources, Ambre, jetons | — | toast, coffre | ✓ |
| `passClaim` | Passe de saison | `claimPassTier` | `claimPassTier` | récompenses du palier | — | toast | ✓ |
| `chronicleClaim` | Chroniques | `claimChronicleEpisode` | `claimChronicle` | passe | — | toast | ✓ |
| `dailyClaim` | Missions du jour | `claimDailyMissionAction` | `claimDailyMission` | jetons | — | toast | ✗ |
| `cancel` | bouton Annuler (chantiers) | `cancelJob` | `performCancel` (prorata) | remboursement | — | toast | ✓ |
| `workshopRush` | Atelier | `rushWorkshop` | `rushWorkshop` (Ambre) | — | — | toast | ✓ |
| `dockCommission` / `dockScrap` / `dockSettings` | Cale sèche | `dockCommission`, `dockScrap`, `dockSettings` | `workshop.ts`, `hangar.ts` | `unitsDismantled` | — | toast | ✓ |
| `vacationEnd` | Paramètres | `endVacation` | `endVacation` | — | — | toast | ✓ |

Chaînes particulières de `/action` :
- tutoriel : si le rattrapage met `onboarding.tutorialRaid` à `due`, la route crée le raid de Varan (`cosmic.pb.js:106-112`) ;
- `trade` : la taxe part au pot commun dans la même transaction (`cosmic.pb.js:116-118`) ;
- 5.28 : Cale sèche au palier 10, remise en service automatique quand le serveur a lu les flottes (`actionNeedsAway`).

---

## 3. Inventaire : routes dédiées du joueur

Toutes ont `requireAuth("users")`. « Vac. » = vacances refusées dans la route. « Tx » = écritures dans une transaction.

| Route | Écran | Service | Fonction serveur | Tx | Écrit | Journal / notif. | Vac. | Intégr. |
|:--|:--|:--|:--|:--|:--|:--|:--|:--|
| `init` | connexion, inscription | `ensurePlayerDoc` | `cosmic.pb.js:22` | ✓ | players, queues | — | — | ✓ |
| `account/pseudo` | choix du pseudo (Google, Apple) | `callGame` | `accountPseudo` | ✓ | users | — | — | ✓ |
| `rename` | carte Changer de pseudo | `renamePlayer` | `renameRequest` | ✓ | players, users, alliance | **rattrapage perdu** (AC-4) | — | ✓ |
| `gift` | fenêtre d'envoi (Joueurs) | `sendResourceGift` | `performGift` | ✓ | 2 joueurs, resource_gifts, pot | expéditeur et destinataire | ✓ (moteur) | ✓ |
| `gift/claim` | automatique (`useGameSync`) | `claimResourceGift` | `applyLegacyGift` | ✓ | players, resource_gifts | destinataire | — | ✓ |
| `report/seen` | automatique (`useGameSync`) | `processBattleReportForDefender` | `applyLegacyBattleReport` | ✓ | battle_reports (+ joueur si ancien) | si ancien | — | ✓ |
| `fleet/send` (+ alias `attack`) | Attaque, Espionnage, Expédition, Menaces, Primes, Boss, Colonies, Base avancée | `sendFleet`, `launchFleet`, `sendTransport`… | `launchFleetRequest` | ✓ | fleets, players | lanceur, cible | ✓ | ✓ |
| `fleet/recall` | Flottes, Base avancée | `recallFleet` | `recallFleet` (propriétaire vérifié) | ✓ | fleets, primes, contrats | **aucune** (AC-12) | — | ✓ |
| `fleet/jump` | Flottes (porte de saut) | `jumpFleet` | `fleetJumpRequest` | ✓ | fleets, players | lanceur, hôte d'une garnison | **non** | ✓ |
| `moon/phalanx` | phalange (interface en cours) | `fetchPhalanx` | `phalanxRequest` (lecture) | — | — | — | — | ✓ |
| `moon/scan` | panneau Phalange | `scanAggressor` | `phalanxScanRequest` | ✓ | players | rapport (`spy`) | **non** | ✓ |
| `expedition/choose` | carte Expédition | `callGame` | `expeditionDecide` | ✓ | fleets, players | oui | — | ✓ |
| `pirates` (`answer`, `treaty`) | ultimatum, Menaces | `answerPirateUltimatum`, `signFactionTreaty` | `answerUltimatum`, `signTreaty` | ✓ | players, fleets (raid) | oui / rattrapage | — | ✓ / ✗ |
| `market/create` · `accept` · `cancel` | Commerce → Marché | `marketService` | `createOffer`, `acceptOffer`, `fillBuyOrder`, `refundOffer` | ✓ | market_offers, 2 joueurs, pot | vendeur | ✓ | ✓ |
| `auction` | Commerce → Enchères | `auctionService` | `auctionRequest` | ✓ | auctions, joueurs | oui | ✓ | ✗ |
| `trade-contract` | Commerce → Contrats | `tradeContractService` | `tradeContractRequest` | ✓ | trade_contracts, joueurs | partenaire ; **rattrapage perdu** (AC-4) | ✓ | ✓ |
| `bounty` | Primes, Flottes, Dons | `bountyService` | `bountyRequest` | ✓ | players | oui | **non** | ✓ |
| `casino` (`daily`, `spin`) | Casino, bannière | `casinoService` | `casinoRequest` | ✓ | players, game_config | gros lot à tous | **non** | ✓ |
| `challenge/claim` | carte Défi | `challengeService` | `claimChallengeReward` | ✓ | players, game_config | **oui** (`read: true`) | **non** | ✓ |
| `codex/claim` | Codex | `claimCodexTitle`, `claimCodexCategoryReward` | `claimCodexCategory`, `grantCodexTitle` | ✓ | players | **aucune** | **non** (l'action le refuse) | ✓ |
| `referral` (GET, POST) | carte Parrainage, connexion | `referralService` | `referralRequest`, `referralInfo` | ✓ | players | parrain | — | ✓ |
| `vacation` | Paramètres | `warlordService` | `vacationRequest` | ✓ | players | oui | — | ✓ |
| `warlords` (GET, POST) | Seigneurs, fiche joueur | `warlordService` | `warlordsList`, `warlordsRequest` | ✓ | players | oui | ✓ | ✓ |
| `alliance` · `alliance/intel` · `alliance/daily` · `alliance/typing` · `alliance/saga/live` | Alliance (onglets) | `allianceService` | `performAllianceAction`… | ✓ | alliances, joueurs | membres | **non** | ✓ (sauf `daily`) |
| `allianceboss` · `boss/react` | Boss d'alliance, scène du boss | `allianceService`, `bossReactService` | `allianceBossRequest`, `bossReact` | ✓ | game_config, joueurs | oui | — | ✓ |
| `war` · `diplomacy` | Alliance → Guerre, Diplomatie | `warService`, `diplomacyService` | `warRequest`, `diplomacyRequest` | ✓ | alliance_wars, pactes | oui | — | ✓ |
| `season-war` (GET) | Alliance | `seasonWarRequest` | lecture | — | — | — | — | ✓ |
| `messages/send` · `read` · `typing` | Messages | `messageService` | `messageSend`, `messageRead` | **non** | private_messages, `stats` du joueur | destinataire | — | ✓ (sauf `typing`) |
| `global/send` · `react` · `room` · `report` | Canal global | `globalChatService` | `global*` | ✓ | global_messages | oui | — | ✗ |
| `poll` (GET, POST) | carte Sondage | `pollService` | `pollRequest` | ✓ | poll_votes | — | — | ✗ |
| `reports/error` · `comment` · `share` · `seen` | Signalements, Combats, page d'erreur | `reportService`, `sharedReportService`, `errorReporter` | `report*` | partiel | reports, shared_reports | équipe | — | ✓ (sauf `seen`) |
| `passkey/*` | Paramètres, connexion | `passkeyService` | `passkey*` | partiel | passkeys | — | — | partiel |
| `vitals` · `status` · `version` · `achievements` · `ban/me` | démarrage, Santé | divers | lecture ou mesure | — | server_metrics | — | — | partiel |
| `carte/{id}` · `mail/o` · `mail/c` · `unsubscribe` · `referral/sponsor` | liens publics | — | — | — | players (désinscription) | — | — | partiel |

## 4. Inventaire : routes d'administration

52 routes `/api/cosmic/admin/…` (plus `update-hooks` dans `cosmic_updater.pb.js`). Toutes vérifient `isGameAdmin`. Celles qui écrivent passent par une transaction et `writeAdminLog`, sauf les déclencheurs de tâches (`leagues`, `catchup`, `challenge`, `referrals`, `alliance-daily`, `elite`, `territories`, `alliance-saga`, `balance/snapshot`), qui rejouent la tâche planifiée sans trace au journal d'administration.

| Groupe | Routes | Écran (Admin) | Remarque |
|:--|:--|:--|:--|
| Joueurs | `player-action`, `player/delete`, `reset`, `ban`, `admins`, `activity`, `player-audit` | Joueurs, Modération, Activité | motif exigé, journal ; **l'éditeur de fiche n'utilise pas ces routes** (AC-2) |
| Contenu | `content/rollback`, `procedural`, `deploy`, `update-hooks` | Contenu, Générateur, Santé | instantané avant chaque écriture de `game_config` |
| Calendrier et tâches | `close-season`, `leagues`, `catchup`, `challenge`, `referrals`, `alliance-daily`, `alliance-saga`, `territories`, `territory-war`, `elite`, `pirates`, `warlords`, `seasonboss`, `leviathan`, `bossrewards`, `gazette`, `casino`, `contests` | panneaux du domaine | `catchup`, `alliance-daily` et `challenge` n'ont pas de bouton (tests seulement) |
| Économie | `serverpot`, `balance`, `balance/snapshot`, `whatif`, `stats`, `anomalies` | Équilibrage, Pot commun | lecture, sauf le pot |
| Exploitation | `maintenance`, `metrics`, `stuck-fleets`, `backups*`, `reports*`, `mail`, `broadcast`, `global` | Santé, Signalements, E-mails | `mail` envoie en direct (bloquant, AC-1, AC-7) |

## 5. Écritures directes du client (sans route de jeu)

| Écriture | Service | Garde serveur | Remarque |
|:--|:--|:--|:--|
| `players.update` (pseudo à l'inscription, `allianceLastReadMs`, `emailOptOut`, `notifPrefs`) | `playerService`, `allianceService`, `mailService` | `updateRule`, `guardPlayerUpdate` | correct |
| `players.update` par un admin (ressources, bâtiments, unités, technos, XP) | `adminUpdatePlayer` (`adminService.ts:71`) | `requireAdminReason`, journal | **instantané périmé réécrit** (AC-2) |
| `players.update` × N (remise à zéro de l'XP) | `adminResetAllXp` | idem | boucle client, non atomique (AC-2) |
| `queues.update` (vider les files) | `adminClearQueues` | admins | sans remboursement (voulu) |
| `players.delete`, `queues.delete`, `notifications.delete` | `deletePlayerAccountData` (`playerService.ts:739`) | `deleteRule` : **le joueur lui-même** | suppression orchestrée par le client (AC-3) |
| `notifications.update` (lu) | `markNotificationRead` | propriétaire | correct |
| `alliance_messages.create` | `sendAllianceMessage` | règle + hook `allianceMessageCreate` | correct |
| `game_config.*` (contenu, emojis, bannières, annonces) | `contentService`… | `guardRulesConfig`, instantané | correct |
| `message_blocks`, `victory_cards`, `reports`, `profiles` (avatar), `blog_*`, `decision_answers`, `illustration_uploads` | services dédiés | règles par collection | correct |

---

## 6. Tâches planifiées

PocketBase lance chaque tâche due dans sa propre goroutine : rien n'empêche une cadence de démarrer pendant que la précédente tourne encore (à confirmer par une mesure sur la pré-prod). `timedCron` chronomètre et isole les erreurs, mais ne pose aucun verrou.

### Cadences (`CADENCES`, `cosmic_db.js:9040`)

| Cadence | Étape | Ce qu'elle fait | Transactions | Maintenance | Risques |
|:--|:--|:--|:--|:--|:--|
| minute | `cosmic_fleets` | arrivées, retours, fins de garnison, décisions d'expédition expirées (50 au plus par passage), purge des débris, recherches d'alliance | une par flotte, `applyContent` à chaque fois | **continue** | file de 50 par minute : après une panne d'1 h avec 3 000 flottes dues, 1 h de rattrapage (AC-8) ; débris supprimés hors transaction |
| minute | `cosmic_maintenance` | fin automatique de la maintenance | ✓ | — | — |
| minute | `cosmic_auctions` | clôture des enchères | ✓ | vérifiée | — |
| 5 min | `cosmic_wars` | début et fin des guerres d'alliance | ✓ | **continue** | échéances pendant la maintenance (AC-10) |
| 5 min | `cosmic_leviathan` | apparition, échéance, récompenses | ✓ | **continue** | idem |
| 5 min | `cosmic_market` | offres expirées, marchandise rendue | ✓ | continue | vendeur supprimé : marchandise perdue (AC-3) |
| 5 min | `cosmic_tradecontracts` | échéances des contrats | ✓ | continue | — |
| 5 min | `cosmic_mail_schedule` | campagnes programmées | retrait de la file en transaction, envoi hors transaction | continue | `sleep(600)` par destinataire : 1 000 joueurs = 10 min de blocage de la cadence ; perte d'écriture (AC-1) ; au plus une fois (envoi perdu si arrêt) |
| 5 min | `cosmic_allianceboss` | boss d'alliance | ✓ | **continue** | retardé derrière les e-mails (AC-7) |
| 5 min | `cosmic_seasonboss` | boss de saison | ✓ | **continue** | idem |
| 10 min | `cosmic_shop_reminders` | rappels du Comptoir | **une seule** transaction sur tous les joueurs actifs | continue | verrou d'écriture tenu le temps du balayage |
| 10 min | `cosmic_pirates` | ultimatums, raids des factions | une par joueur, `applyContent` par joueur, lecture de **tous** les joueurs | vérifiée | O(joueurs) lectures de `game_config` toutes les 10 min (AC-8) |
| 10 min | `cosmic_challenge` | défi hebdomadaire | ✓ | continue | — |
| 10 min | `cosmic_territory_war` | ouverture et clôture | ✓ | continue | — |
| 10 min | `cosmic_elite` | proie d'élite | ✓ | continue | — |
| 10 min | `cosmic_alliancedaily` | objectifs du jour d'alliance | ✓ | continue | — |

### Tâches horaires et quotidiennes (`cronAdd` séparés, tous dans `timedCron`)

| Tâche | Heure | Ce qu'elle fait | Reprise après panne |
|:--|:--|:--|:--|
| `cosmic_seasons` | h:07 | clôture de la saison passée | idempotente (rien si déjà close) |
| `cosmic_leagues` | h:09 | divisions | idempotente |
| `cosmic_pass_seasons`, `cosmic_anomalies` | h:13 (les deux) | passes, stocks anormaux | même minute : deux tâches en parallèle |
| `cosmic_contests` | */15 | concours, défi d'alliance, casino | coïncide avec minute, 5 et 10 min à h:00 et h:30 |
| `cosmic_territories` | h:17 | territoires | idempotente |
| `cosmic_referrals` | h:23 | récompenses de parrainage | idempotente |
| `cosmic_warlords` | h:37 | seigneurs de guerre | sautée en maintenance ; **rattrapage des PNJ sans notification** (sans effet : PNJ) |
| `cosmic_gazette` | h:41 | gazette | sautée en maintenance |
| `cosmic_alliance_saga` | h:53 | saga d'alliance | idempotente |
| `cosmic_balance_history` | 03:11 | photo d'équilibrage | **jour perdu si le serveur est arrêté à 03:11** |
| `cosmic_catchup` | 03:27 | rattrapage des petits empires | une seule transaction sur tous les joueurs ; bonus valable 26 h : une nuit manquée le coupe 22 h ; **notifications du rattrapage perdues** (AC-4) |
| `cosmic_procedural` | 04:29 | chapitres et succès générés | jour suivant |
| `cosmic_backup_check` | 05:20 | alerte de sauvegarde | jour suivant |

Cohérence avec les actions :
- une flotte due est traitée par la première des deux voies (tâche minute ou `/action` du joueur), sans double effet ;
- les files (bâtiments, recherches, unités, missions) ne finissent qu'au rattrapage d'un joueur (action, heartbeat, combat subi, tâche nocturne) : c'est voulu, mais toute route qui rattrape sans écrire les notifications les perd (AC-4).

---

## 7. Constats

| # | Gravité | Constat | Preuve | Scénario de défaillance | Correction proposée | Taille |
|:--|:--|:--|:--|:--|:--|:--|
| AC-1 | 🔴 | **Campagne e-mail : la fiche du joueur est réécrite depuis une lecture périmée.** `mailRecipients` lit tous les joueurs, puis `sendCampaign` envoie un e-mail toutes les 600 ms. `mailToken(player)` fait `$app.save(player)` sur l'enregistrement lu au départ quand le jeton manque (joueur jamais écrit ou nouveau). PocketBase réécrit toute la ligne | `cosmic_db.js:6545-6556`, `6564-6571`, `6601-6627` | campagne à 1 000 joueurs (10 min). Un joueur sans jeton lance une flotte de 500 chasseurs à t+2 min ; à t+8 min, son tour d'envoi réécrit `units` et `resources` d'avant : les 500 chasseurs sont **dupliqués** au retour de la flotte, les dépenses annulées, les niveaux finis perdus | créer les jetons manquants dans une transaction **avant** la boucle (`rec` relu, seul `mailToken` posé) ; dans la boucle, ne jamais sauver le joueur | S |
| AC-2 | 🔴 | **Éditeur de fiche joueur (Admin) : réécrit 6 champs depuis la liste chargée à l'ouverture.** `adminUpdatePlayer` envoie `resources`, `buildings`, `units`, `techLevels`, `xp`, `seasonXp` du brouillon, construit sur `adminListPlayers()` ; aucun rattrapage, `resourcesUpdatedAtMs` non touché, hangar non vérifié | `panels.tsx:966-977`, `adminService.ts:71-75` | l'admin ouvre la fiche, corrige 1 relique en 10 min. Entre-temps le joueur a dépensé 50 000 ferraille et lancé sa flotte : la sauvegarde rend la ferraille et les unités parties (doublées au retour), et efface la production des 10 min | n'envoyer que les champs modifiés (diff champ à champ, puis clé à clé dans `units`, `resources`) ; mieux : action `edit` de `admin/player-action` (rattrapage, delta appliqué sur l'état frais, plafonds vérifiés, journal). `adminResetAllXp` : route serveur en une transaction | M |
| AC-3 | 🟠 | **Suppression de compte orchestrée par le client, et `deleteRule` de `players` et `queues` ouverte au joueur.** `deleteAccount` supprime notifications, files, joueur puis compte, erreurs avalées (`.catch(() => {})`). Restent : appartenance à l'alliance, flottes en vol, offres du marché (marchandise en dépôt), enchères (mise du meilleur enchérisseur), contrats. `adminDeletePlayer` fait déjà tout ce ménage dans une transaction | `authService.ts:135-144`, `playerService.ts:739-747`, `pb_schema.json` (`players.deleteRule`, `queues.deleteRule`), `cosmic_db.js:9317-9389` | **contournement** : le joueur envoie sa flotte en expédition, fait `DELETE /api/collections/players/records/<uid>` (permis), puis `init` recrée un profil neuf (`createdAtMs` = maintenant, donc 72 h de protection des débutants, `pvp.ts:147`). La flotte rentre et crédite ses vaisseaux au nouveau profil, protégé. L'alliance garde un membre fantôme ; l'enchérisseur d'une vente du joueur supprimé n'est jamais remboursé | route `POST /api/cosmic/account/delete` (mot de passe revérifié côté client, puis ménage commun avec `adminDeletePlayer` extrait en `purgePlayer(txApp, uid)`) ; `deleteRule` de `players` et `queues` réservés aux admins | M |
| AC-4 | 🟠 | **Notifications du rattrapage perdues** dans 4 chemins : `flushPlayer` est appelé, son résultat sauvé, mais `notifications` n'est pas écrit | `cosmic_db.js:5769-5772` (`catchupTick`), `1112` (`tradeContractRequest`), `6507` (`renameRequest`), `9361` (`adminDeletePlayer`, enchérisseur remboursé) | chaque nuit à 03:27, tous les joueurs aidés par le rattrapage sont rattrapés : une mission, une recherche, un bâtiment ou un **succès** fini à ce moment est crédité sans toast ni ligne au Journal. Même chose quand le joueur accepte un contrat ou change de pseudo. L'enchérisseur remboursé n'est pas prévenu | `notify(txApp, uid, flushed.notifications)` dans les 4 chemins ; test de garde qui balaie `cosmic_db.js` (tout `flushPlayer` / `loadFlushed` suivi d'un `notify` de ses notifications dans la même fonction) | S |
| AC-5 | 🟠 | **Dépenses hors `pay()`** : 6 chemins retirent des ressources sans compter la statistique `spent` ni le contrat « dépenser » | `colonies.ts:421` (fondation), `moonUpgrade.ts:16`, `synthesis.ts:143`, `pirates.ts:421` (repaire), `pirates.ts:389` (traité), `buildPlan.ts:136-142` (copie de `pay`) | le contrat du jour « Dépenser 50 000 » ne bouge pas quand le joueur fonde une colonie (le plus gros achat du milieu de partie) ou améliore sa lune ; les succès liés à `spent` sont en retard | `spendResources(player, cost, now)` dans le moteur (vérifie, débite, compte), appelée par `pay` et ces 6 chemins ; test : toute soustraction de `player.resources` hors de ce fichier fait échouer une garde | S |
| AC-6 | 🟡 | **Réclamations sans Journal** : `applyAction` n'a aucun canal de notification. Série, passe, contrats, Chroniques, missions du jour, prise en main, Carnet, Codex et « Tout réclamer » ne laissent aucune trace, alors que le défi hebdomadaire en laisse une (`read: true`) et le Codex par la route aucune | `actions.ts:183-194` (`ActionState` sans notifications), `cosmic_db.js:4812` | le joueur réclame 8 récompenses en un clic, recharge, et ne retrouve rien au Journal : impossible de vérifier ce qu'il a reçu ou de signaler une erreur | `ActionState.notes` rendu par `performPlayerAction` et écrit par la route ; une ligne `read: true` par réclamation, une seule pour « Tout réclamer » (Q-AC1) | M |
| AC-7 | 🟡 | **Envoi des e-mails dans la cadence de 5 min** : `sendCampaign` dort 600 ms par destinataire dans `cosmic_mail_schedule`, avant les boss d'alliance et de saison. La route `admin/mail` envoie aussi en direct | `cosmic_db.js:9068-9073`, `6627` | campagne programmée à 1 000 joueurs : la cadence est bloquée 10 min ; les boss sont résolus 10 min en retard et la cadence suivante tourne en parallèle | file d'envoi par lots (50 destinataires par passage, curseur dans `game_config`), dans sa propre tâche ; la route d'admin met en file au lieu d'envoyer | M |
| AC-8 | 🟡 | **Tâches en O(joueurs) et file de flottes plafonnée** : `processPirates` lit tous les joueurs (fiches entières), ouvre une transaction et relit tout `game_config` par joueur, toutes les 10 min ; `processDueFleets` en traite 50 par minute avec un `applyContent` par flotte ; `catchupTick` et `shopRemindersTick` tiennent une seule transaction sur tous les joueurs | `cosmic_db.js:1361-1391`, `1611-1648`, `5751-5777`, `5110-5127` | à 2 000 joueurs, la cadence de 10 min dépasse 10 min et se chevauche ; après une panne, les flottes en retard s'accumulent (alerte « flottes bloquées » à 10 min) ; pendant la tâche de 03:27 toutes les actions attendent le verrou d'écriture | `applyContent` une fois par passage ; lecture des seuls identifiants (`fields`) ; 200 flottes par passage, boucle tant qu'il en reste et que 40 s ne sont pas écoulées ; transactions par paquets de 100 joueurs. Mesurer d'abord sur la pré-prod (`admin/metrics`) | M |
| AC-9 | 🟡 | **Écritures hors transaction sur la fiche joueur** : `messageSend` appelle `bumpPlayerStat($app, …)` (lecture puis `save` de toute la fiche hors transaction) ; `unsubscribe` lit puis réécrit le joueur | `cosmic_db.js:4568`, `9711-9722`, `6779-6790` | un message privé envoyé pendant qu'un heartbeat sauve le joueur : la fiche réécrite peut effacer la production ou un achat de ce heartbeat (fenêtre courte mais quotidienne pour les joueurs bavards) | envelopper dans `$app.runInTransaction` (relire dans la transaction) | S |
| AC-10 | 🟡 | **Maintenance incohérente** : les routes du joueur sont fermées (503), la tâche des factions et les seigneurs attendent, mais les flottes, les guerres, le Léviathan et les boss d'alliance et de saison continuent leurs échéances | `cosmic_db.js:9044-9074` (aucune vérification), `9080-9083` (factions) | une maintenance d'1 h le soir d'un boss d'alliance : l'échéance tombe, l'alliance perd ses assauts sans pouvoir jouer ; une attaque reçue ne peut pas être évitée (rappel impossible) | Q-AC2 : sauter les étapes à échéance pendant la maintenance et décaler ces échéances de la durée de la maintenance à sa fin (`autoEndMaintenance`) ; flottes inchangées | M |
| AC-11 | 🟡 | **Règle des vacances appliquée route par route** : l'action refuse 54 actions sur 62, mais `moon/scan`, `fleet/jump`, `bounty`, `casino`, `challenge/claim`, `codex/claim`, `alliance`, `pirates` ne vérifient rien. Le Codex est refusé par `/action` (`codexClaim`) et permis par sa route | `actions.ts:196-201`, `cosmic_db.js:6851` (aucun `onVacation`), routes listées au §3 | le joueur en vacances (production gelée, protégé) touche son défi, son Codex, joue au casino et balaie un agresseur | garde commune `assertNotOnVacation(game, player, now, routeName)` avec une liste blanche unique dans le moteur (`VACATION_RULES.allowedRoutes`), réglable dans l'admin (Q-AC4) | S |
| AC-12 | 🟡 | **Rappel de flotte sans trace** : `fleet/recall` n'écrit aucune notification, ni pour le joueur ni pour l'hôte d'une garnison, alors que la porte de saut prévient l'hôte (Q39) | `cosmic.pb.js:264-299`, `cosmic_db.js:2118-2121` | une garnison rappelée par la route normale quitte l'allié sans prévenir : il croit être défendu | notification à l'hôte (même texte que la porte) et ligne `read: true` pour le joueur | S |
| AC-13 | 🟡 | **Raid du tutoriel sans date de départ** : `createPirateRaid` est appelé avec 4 arguments ; `departAtMs` vaut `now`, absent | `cosmic.pb.js:110`, `cosmic_db.js:1236-1248`, `fleets.ts:210-213` | la barre de progression du premier raid de Varan (`fleetProgress`) s'affiche pleine dès le départ : le nouveau joueur croit l'impact immédiat | passer `now` ; test d'intégration sur `departAtMs` du raid du tutoriel | S |
| AC-14 | 🟡 | **« Tout réclamer » avale toute erreur** (`catch {}`), y compris une erreur de programmation, et garde l'état partiel d'une sous-action qui aurait modifié le joueur avant d'échouer | `actions.ts:380-391` | une régression dans `claimPassTier` lève une `TypeError` après avoir crédité une partie du palier : la route réussit, le palier n'est pas marqué, le bouton le propose encore, nouveau crédit partiel à chaque clic | copie du joueur avant chaque sous-action, restaurée sur échec ; seules les `GameActionError` sont tues, les autres remontent | S |
| AC-15 | 🟡 | **Récompenses hors `pendingClaims`** : jeton quotidien du casino (`casino` `daily`), défi hebdomadaire (`challenge/claim`), titre du Codex (`codex/claim` sans catégorie). Les deux dernières dépendent de données du serveur, que `/action` sait maintenant lire (modèle `actionNeedsCodex`) | `casino.ts:582-591`, `cosmic_db.js:4793-4816`, `6851-6881`, `claimAll.ts` | le joueur clique « Tout réclamer » chaque jour et oublie son jeton de casino ; la pastille d'Ordres du jour ne le compte pas | les 3 dans `ClaimAllAction` ; contexte serveur `actionNeedsChallenge` (comme le Codex) ; réglages du casino lus par `pendingClaims` | M |
| AC-16 | 🟡 | **Messages d'erreur perdus** : `callGame` ne traduit que 400 et 404. Une 403 (« Le pseudo se change depuis ton profil », « Parole retirée »…), une 503 (maintenance) ou une 500 remonte brute ; 73 appels des écrans affichent alors « Action impossible. » | `playerService.ts:75-88` ; 49 `ForbiddenError` dans `cosmic_db.js` | pendant une maintenance, le joueur qui clique « Améliorer » lit « Action impossible. » sans savoir pourquoi | traduire 403, 409, 429 et 503 avec le message du serveur ; 500 : « Erreur du serveur, réessaie » et envoi à `reports/error` | S |
| AC-17 | ℹ️ | **Heartbeat coûteux** : un `sync` toutes les 20 s par onglet ouvert = requête des flottes dues, relecture de tout `game_config`, écriture de `players` et `queues`, mise à jour de la fiche publique, diffusion temps réel de la fiche entière | `useGameSync.ts:33`, `cosmic.pb.js:71-125`, `cosmic_db.js:59-73` | 300 joueurs connectés = 900 transactions d'écriture par minute, avant toute action | mesurer sur la pré-prod (Z6) ; puis heartbeat à 60 s et `sync` sans écriture si rien n'a changé hors production (la production se calcule à la lecture) | M |
| AC-18 | ℹ️ | **Chemins morts ou anciens** : alias `POST /api/cosmic/attack` (aucun appel) ; `gift/claim` et la partie « ancien rapport » de `report/seen` ne servent qu'aux données d'avant l'économie serveur, mais `useGameSync` s'y abonne à chaque session ; `admin/catchup`, `admin/challenge`, `admin/referrals`, `admin/alliance-daily`, `admin/leagues` n'ont pas de bouton | `cosmic.pb.js:258`, `useGameSync.ts:181-203` | abonnements et code à maintenir pour des données qui n'existent peut-être plus | compter en lecture seule sur la pré-prod les `resource_gifts` non réclamés et les rapports sans `defenderApplied` ; à zéro, retirer l'alias, la route et l'abonnement. Boutons : une ligne « Lancer maintenant » dans la page Santé pour chaque tâche | S |
| AC-19 | ℹ️ | **Deux chemins pour la même récompense du Codex** : action `codexClaim` (via « Tout réclamer », vacances refusées, rattrapage fait) et route `codex/claim` (page Codex, sans rattrapage, toute erreur devient 400) | `actions.ts:377`, `cosmic_db.js:6851-6881` | règles divergentes à la prochaine évolution (vacances déjà différentes : AC-11) | la page Codex appelle l'action `codexClaim` ; la route ne garde que le titre (ou devient une action `codexTitle`) | S |
| AC-20 | ℹ️ | **Succès différés** : `checkNewAchievements` tourne au début du rattrapage, avant l'action. Un succès gagné par l'action (1re recherche, 1er module, 1er saut de porte) s'affiche au heartbeat suivant (0 à 20 s), ou plus tard pour les routes sans rattrapage (`codex/claim`, `fleet/jump`) | `flush.ts:257`, `actions.ts:614-632` | le joueur ne voit pas le lien entre son geste et le succès | `checkNewAchievements` aussi après l'action dans `performPlayerAction` (et dans les routes qui sauvent sans rattraper) | S |
| AC-21 | ℹ️ | **Vente d'unités sans compteur** : `sellUnits` ne compte ni statistique ni contrat, alors que le démantèlement de la Cale sèche compte `unitsDismantled` ; pas de plafond de quantité (`MAX_QTY` absent, contrairement à `buildUnits`) | `actions.ts:291-302` | aucune donnée pour suivre la revente dans l'équilibrage | `bumpStat("unitsSold", qty)` ; borne `MAX_QTY` | S |
| AC-22 | ℹ️ | **Couverture d'intégration** : 26 actions de `/action` sur 62 ne sont jamais jouées contre le serveur (liste au §9) ; 14 routes du joueur non plus (`auction`, `global/*`, `poll`, `alliance/daily`, `messages/typing`, `reports/seen`, `ban/me`, `vitals`, `passkey/rename`…) | balayage du fichier de test | une erreur de branchement (champ non sauvé, garde oubliée) passe les tests unitaires | un test d'intégration « tour des actions » qui joue chaque action une fois sur un joueur préparé (`admin/player-action` pour les prérequis), avec relecture de la fiche | M |

Ce qui a été vérifié et tient :
- aucune action du joueur appliquée par le client seul ;
- toutes les routes `admin` gardées ; toute route qui touche une flotte vérifie son propriétaire (`recallFleet`, `checkJump`, `expeditionChoose`) ;
- les réclamations sont idempotentes par leur état (`claimed`, `dailyDay`…), et le double clic est bloqué par les écrans (`submitting`, `pending`). Les envois non idempotents (cadeau, flotte, offre, enchère) n'ont pas de clé de requête : un double envoi réseau resterait possible (Q-AC5) ;
- toutes les fonctions du moteur appelées par les hooks sont exportées.

---

## 8. Lots proposés

| Lot | Contenu | Constats | Taille | Priorité |
|:--|:--|:--|:--|:--|
| **AC-A : écritures sûres** | jetons d'e-mail créés avant l'envoi ; `bumpPlayerStat` et `unsubscribe` en transaction ; notifications du rattrapage dans les 4 chemins et garde de balayage ; `now` du raid du tutoriel | AC-1, AC-4, AC-9, AC-13 | S | 1 (données des joueurs) |
| **AC-B : édition admin d'un joueur** | action `edit` de `admin/player-action` (delta sur l'état rattrapé, plafonds, journal) ; l'éditeur de `panels.tsx` n'envoie que les différences ; remise à zéro de l'XP côté serveur | AC-2 | M | 2 |
| **AC-C : suppression de compte serveur** | `purgePlayer(txApp, uid)` partagé avec `adminDeletePlayer` ; route `account/delete` ; `deleteRule` de `players` et `queues` réservés aux admins ; test d'intégration (flotte en vol, offre, enchère, alliance) | AC-3 | M | 2 |
| **AC-D : dépenses et traces** | `spendResources` unique ; `notes` dans `performPlayerAction` et Journal des réclamations ; rappel de flotte notifié ; succès vérifiés après l'action ; `unitsSold` | AC-5, AC-6, AC-12, AC-20, AC-21 | M | 3 |
| **AC-E : tâches planifiées** | verrou par cadence (`$app.store`, durée de vie 2 × la cadence, métrique « tâche sautée ») ; e-mails par lots dans leur tâche ; `processPirates` et flottes allégés ; règle de maintenance pour les échéances | AC-7, AC-8, AC-10 | M | 3 (mesure pré-prod d'abord) |
| **AC-F : erreurs et vacances** | `callGame` traduit 403, 409, 429, 503 ; garde de vacances unique et réglable | AC-11, AC-16 | S | 4 |
| **AC-G : réclamations groupées** | casino du jour, défi et titre du Codex dans `pendingClaims` ; un seul chemin pour le Codex ; « Tout réclamer » transactionnel par sous-action | AC-14, AC-15, AC-19 | M | 4 |
| **AC-H : ménage et tests** | comptage pré-prod puis retrait des chemins anciens ; boutons « Lancer maintenant » ; test d'intégration « tour des actions » et des routes manquantes | AC-18, AC-22 | M | 5 |
| **AC-I : heartbeat** | mesure Z6 sur la pré-prod, puis heartbeat 60 s et `sync` sans écriture inutile | AC-17 | M | après Z6 |

Chaque lot suit la règle n° 1 (fiche `docs/changes/`, report dans le GDD et la fiche système). AC-A, AC-B, AC-C touchent les données des joueurs : proposition courte dans `docs/proposals/chaine-actions.md` avant le code.

## 9. Questions (à reporter dans `docs/QUESTIONS.md` et `docs/decisions-a-valider.md`)

| # | Question | Options | Recommandation |
|:--|:--|:--|:--|
| Q-AC1 | Quelle trace au Journal pour les réclamations ? | A : une ligne par réclamation ; B : une ligne par réclamation, et une seule ligne récapitulative pour « Tout réclamer » ; C : rien (état actuel) | **B**, en `read: true` (pas de toast ni de pastille en plus, comme le défi hebdomadaire) |
| Q-AC2 | Que deviennent les échéances pendant une maintenance ? | A : tout continue (actuel) ; B : boss, Léviathan, guerres et guerre de territoire suspendus, puis décalés de la durée de la maintenance ; C : tout suspendu, flottes comprises | **B** : les flottes continuent (sinon un afflux à la réouverture), les rendez-vous collectifs sont décalés |
| Q-AC3 | Suppression de compte par le joueur | A : immédiate, côté serveur, même ménage que l'admin ; B : différée de 7 jours (annulable) ; C : actuel | **A** maintenant (ferme le contournement d'AC-3) ; B plus tard si des joueurs le demandent |
| Q-AC4 | Que permet-on en vacances ? | A : rien qui rapporte ou dépense (liste blanche commune, réglable) ; B : statu quo route par route | **A**, liste blanche = les 8 actions actuelles + lecture (phalange sans balayage, Codex consultable) |
| Q-AC5 | Clé d'idempotence pour les envois non répétables ? | A : `requestId` du client gardé 10 min (`$app.store`) pour `gift`, `fleet/send`, `market/create`, `auction` ; B : rien, les écrans suffisent | **B** pour l'instant (aucun incident relevé), à rouvrir si un double envoi est signalé |
| Q-AC6 | Rythme du heartbeat | A : 20 s (actuel) ; B : 60 s, présence toutes les 2 min ; C : 60 s et `sync` sans écriture si rien n'a changé | mesurer d'abord (Z6), puis **C** si l'écriture domine |

## 10. Couverture des tests

Actions de `/action` jamais jouées contre le serveur (26) :
- `sellUnits`, `mission`, `rerollContract`, `claimGuide`, `hideGuide`, `claimAll`, `codexClaim` ;
- `colonyDefense`, `colonyRename`, `colonySpec`, `colonyRoute`, `empireClass`, `locateLair` ;
- `achievementHint`, `moduleBuild`, `moduleMount`, `moduleUnmount`, `moduleRecycle`, `moduleFuse`, `modulePresetSave`, `modulePresetApply`, `modulePresetDelete` ;
- `chatArchive`, `talentLearn`, `talentReset`, `dailyClaim`.

Parmi elles, sans test unitaire passant par `performPlayerAction` (les fonctions du moteur peuvent être testées seules) :
- `rerollContract`, `hideGuide`, `colonyDefense`, `colonyRename`, `colonySpec`, `colonyRoute`, `empireClass`, `locateLair` ;
- `moduleMount`, `moduleUnmount`, `moduleRecycle`, `moduleFuse`, les trois préréglages ;
- `chatArchive`, `talentLearn`, `talentReset`, `dailyClaim`.

Routes du joueur sans test d'intégration : `auction`, `global/send`, `global/react`, `global/room`, `global/report`, `poll`, `alliance/daily`, `messages/typing`, `reports/seen`, `ban/me`, `vitals`, `passkey/rename`, `passkey/register/verify`, `pirates` (`treaty`).

Routes d'administration sans test d'intégration : `backups/*`, `ban`, `bossrewards`, `broadcast`, `casino`, `catchup`, `content/rollback`, `contests`, `deploy`, `global`, `metrics`, `player/delete`, `reports/config`, `reports/github`, `stuck-fleets`, `territories`, `whatif`.

Tâches planifiées : jouées par leurs routes d'administration (`leagues`, `challenge`, `alliance-daily`, `elite`, `referrals`…) ; aucune ne vérifie le chevauchement de deux passages ni la reprise après un arrêt.
