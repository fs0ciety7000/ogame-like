# Proposition : chaîne des actions, écritures sûres de la fiche joueur

Statut : **lots AC-A à AC-H livrés** (6.14.52, `docs/changes/6.14.52-ecritures-sures.md` ; 6.14.65,
`docs/changes/6.14.65-edition-admin-serveur.md` ; 6.14.66, `docs/changes/6.14.66-suppression-compte-serveur.md` ; 6.14.110 à 6.14.113,
`docs/changes/6.14.110-depenses-et-traces.md`, `6.14.111-taches-planifiees.md`, `6.14.112-erreurs-et-vacances.md`,
`6.14.113-reclamations-groupees.md` ; 6.14.135, `6.14.135-menage-tour-actions.md`) ; `feuille-de-route-2030-automne.md`, lots 1, 8, 9, 29 à 32 et 60. Reste AC-I. Source : revue AU27, `docs/audit/2026-10-07-au27-chaine-actions.md`
(constats AC-1 à AC-22, §8 lots). Version brève du plan de `docs/WORKFLOW.md` §2 : ces corrections touchent les données des joueurs.

## 1. Constat (vu par le joueur)

- « J'ai lancé ma flotte, et en revenant j'avais deux fois plus de chasseurs » ou « ma ferraille est revenue » : la campagne d'e-mails
  peut réécrire une fiche d'avant (AC-1). Même risque, plus court, à l'envoi d'un message privé et au clic sur « se désinscrire » (AC-9).
- « Ma recherche est finie, mais rien au Journal » : un chantier, une recherche, une mission ou un succès qui se termine pendant le
  rattrapage de la nuit (03:27), un changement de pseudo ou un contrat de commerce ne laisse aucune trace (AC-4). L'enchérisseur
  remboursé quand l'admin supprime le vendeur n'est pas prévenu.
- « Le raid de Varan arrive déjà ! » : la barre du premier raid du tutoriel s'affiche pleine dès le départ (AC-13).

## 2. Diagnostic (preuves)

| # | Cause | Preuve |
|:--|:--|:--|
| AC-1 | `sendCampaign` lit tous les destinataires au départ, puis envoie un e-mail toutes les 600 ms ; `mailToken(player)` fait `$app.save(player)` sur l'enregistrement lu au départ quand le jeton manque. PocketBase réécrit toute la ligne (ressources, unités, files, stats) | `cosmic_db.js` (`mailRecipients`, `mailToken`, `sendCampaign`, avant 6.14.52) |
| AC-9 | `messageSend` appelle `bumpPlayerStat($app, …)` (lecture puis `save` hors transaction) ; `unsubscribe` lit puis réécrit le joueur hors transaction | `cosmic_db.js` (`messageSend`, `unsubscribe`) |
| AC-4 | `catchupTick`, `tradeContractRequest`, `renameRequest` et le remboursement de l'enchérisseur dans `adminDeletePlayer` sauvent un `flushPlayer` sans écrire ses `notifications` | balayage : seules ces 4 fonctions rattrapent sans `notify(…notifications)` (hors PNJ) |
| AC-13 | `createPirateRaid` est appelé avec 4 arguments par la route `/action` : `departAtMs` vaut `undefined` | `cosmic.pb.js` (tutoriel), `fleets.ts` (`fleetProgress`) |

Les écritures PocketBase passent par une seule connexion : deux transactions ne se chevauchent pas. Le risque vient seulement des
lectures faites **hors** transaction puis réécrites.

## 3. Benchmark

Sans objet pour un correctif de sûreté : la règle commune (OGame, jeux de gestion mobiles) est qu'aucune tâche annexe (e-mail,
statistique) ne réécrit l'état de jeu, et que tout ce qui se termine hors connexion est consigné.

## 4. Options

| Option | Ce que ça règle | Ce que ça coûte | Risque |
|:--|:--|:--|:--|
| A : jetons créés **avant** l'envoi, chacun dans une transaction qui relit la fiche et ne pose que `mailToken` ; la boucle d'envoi ne sauve plus rien | AC-1 en entier | une transaction par destinataire sans jeton (une seule fois par joueur) | aucun |
| B : écriture ciblée du seul champ dans la boucle (transaction de relecture à chaque envoi) | AC-1 | une transaction par envoi, mêlée aux `sleep(600)` | jeton créé après un envoi échoué |
| C : jeton créé à l'inscription et migration de tous les joueurs | AC-1 à terme | migration ponctuelle sur la prod | joueurs créés par d'autres chemins (PNJ, imports) sans jeton |

Pour AC-9 : transaction autour de `bumpPlayerStat` et de `unsubscribe` (relecture et écriture atomiques). Pour AC-4 : `notify` des
notifications du rattrapage dans les 4 chemins, comme le chemin normal. Pour AC-13 : passer `now`, et départ par défaut à l'instant.

## 5. Recommandation (appliquée, 6.14.52)

- **Option A** pour AC-1 (`ensureMailTokens`). L'envoi « à blanc » de l'admin déroule la même préparation (jetons créés, rien
  d'envoyé) ; `holdMs` (5 s au plus) simule la durée d'envoi pour le test d'intégration.
- AC-9 : `messageSend` et `unsubscribe` en transaction. Les autres appels de `bumpPlayerStat` étaient déjà dans une transaction.
- AC-4 : notifications écrites dans les 4 chemins ; l'enchérisseur remboursé reçoit « Enchère annulée » (même modèle que « Enchère dépassée »).
- AC-13 : `now` passé, et `createPirateRaid` prend l'instant présent si l'appelant l'oublie.
- Choix pris seul (le plus prudent pour les données des joueurs) : aucune migration ; un joueur sans jeton en reçoit un à la prochaine
  campagne ou au prochain envoi à blanc. Pas de nouvelle question : ces choix restent des correctifs sans effet d'équilibre.

## 5 bis. AC-B et AC-C (appliqués, 6.14.65 et 6.14.66)

- **AC-B** : l'éditeur calcule les différences (`adminEditDiff`, `src/game/adminEdit.ts`) et les envoie à `admin/player-action`
  (`action: "edit"`, motif obligatoire) ; le serveur rattrape la fiche relue dans la transaction, applique les écarts (`applyAdminEdit`),
  vérifie les plafonds (niveaux maximaux, entrepôt pour les ressources communes, hangars par `hangarLoad` avec les vaisseaux en vol),
  journalise champ par champ et prévient le joueur. La remise à zéro de l'XP de tous les joueurs devient `action: "resetAllXp"` (une
  transaction). La règle d'API `players.updateRule` ne donne plus l'écriture aux admins du jeu : seul le serveur (et le superutilisateur
  PocketBase, journalisé avec motif) écrit l'état de jeu d'un autre joueur.
- **AC-C** (Q-AC3 = Q78, option A, validée) : `POST /api/cosmic/account/delete` revérifie le mot de passe côté serveur, puis
  `purgePlayer` (partagé avec `adminDeletePlayer`) fait tout le ménage dans une transaction. `players.deleteRule` et `queues.deleteRule`
  réservés aux admins ; la suppression d'un compte `users` par l'API des collections est refusée (403) hors admin. `ensureSchema` recopie
  désormais ces règles sur une base existante (`SCHEMA_RULE_SYNC`, liste fermée).

## 5 ter. AC-D à AC-G (appliqués, 6.14.110 à 6.14.113)

- **AC-D** (AC-5, AC-6, AC-12, AC-20, AC-21 ; Q76 = Q-AC1, option B) : `spendResources` et `spendAmber` (`spending.ts`) seuls chemins
  de dépense, garde de balayage ; ligne lue au Journal par réclamation, une seule pour « Tout réclamer » ; rappel de flotte tracé et
  hôte de garnison prévenu ; succès vérifiés après l'action ; revente comptée (`unitsSold`).
- **AC-E** (AC-7, AC-8, AC-10 ; Q77 = Q-AC2, option B) : verrou par cadence dans `$app.store()` ; campagnes d'e-mails en file
  (`server_metrics`), envoyées par lots dans la cadence minute ; factions, flottes, rattrapage de la nuit et rappels du Comptoir
  allégés ; échéances collectives suspendues pendant la maintenance puis décalées. Réglages `serverTasks`.
- **AC-F** (AC-11, AC-16 ; Q79 = Q-AC4, option A) : `gameErrorText` côté client (message du jeu gardé, texte clair sinon, 500
  signalée) ; garde de vacances unique (`vacation.allowed`, `vacationBlock`, `vacationGuard`).
- **AC-G** (AC-14, AC-15, AC-19) : jeton du casino, défi et titre du Codex dans `pendingClaims` par le contexte du serveur ; pastille
  sans faux positif ; routes historiques par l'action (`claimByAction`) ; sous-actions de « Tout réclamer » isolées.

## 6. Invariants

- **I24** (nouveau) : une fiche joueur n'est réécrite que dans une transaction qui l'a relue ; tout rattrapage sauvé écrit ses
  notifications dans la même fonction (hors PNJ). Garde : `src/server/ecrituresSures.test.ts` ; intégration « 6.14.52 (AC-1) ».
- **I28** (6.14.65, 6.14.66) : l'état de jeu d'un joueur ne s'écrit et ne s'efface que par le serveur. L'admin envoie des différences
  appliquées sur la fiche relue et rattrapée, sous les plafonds ; la suppression d'un compte (admin ou joueur) passe par `purgePlayer`,
  qui rend aux autres joueurs ce qui leur revient. Garde : `src/server/compteServeur.test.ts`, `src/game/adminEdit.test.ts` ;
  intégration « 6.14.65 (AC-B) », « 6.14.66 (AC-C) ».
- **I34** à **I37** (6.14.110 à 6.14.113) : un seul chemin de dépense et réclamations tracées ; tâches planifiées (verrou, e-mails par
  lots, maintenance) ; garde de vacances unique ; « Tout réclamer » complet et isolé. Voir le GDD §4.

## 7. Plan de lots

| Lot | Contenu | Constats | État |
|:--|:--|:--|:--|
| **AC-A : écritures sûres** | jetons d'e-mail avant l'envoi ; `bumpPlayerStat` et `unsubscribe` en transaction ; notifications des 4 rattrapages et garde de balayage ; `now` du raid du tutoriel | AC-1, AC-4, AC-9, AC-13 | livré (6.14.52) |
| **AC-B : édition admin d'un joueur** | action `edit` de `admin/player-action` (différences appliquées sur l'état rattrapé, plafonds, journal) ; l'éditeur de `panels.tsx` n'envoie que les différences ; remise à zéro de l'XP côté serveur | AC-2 | livré (6.14.65) |
| **AC-C : suppression de compte serveur** | `purgePlayer(txApp, game, uid, now)` partagé avec `adminDeletePlayer` ; route `account/delete` ; `deleteRule` de `players` et `queues` réservés aux admins ; intégration (flotte en vol, offre, enchère, alliance) | AC-3 | livré (6.14.66) |
| **AC-D : dépenses et traces** | `spendResources`, `spendAmber` ; Journal des réclamations ; rappel notifié ; succès après l'action ; `unitsSold` | AC-5, AC-6, AC-12, AC-20, AC-21 | livré (6.14.110) |
| **AC-E : tâches planifiées** | verrou par cadence ; e-mails par lots ; tâches allégées ; échéances et maintenance | AC-7, AC-8, AC-10 | livré (6.14.111) |
| **AC-F : erreurs et vacances** | erreurs traduites ; garde de vacances unique | AC-11, AC-16 | livré (6.14.112) |
| **AC-G : réclamations groupées** | casino, défi, titre du Codex dans « Tout réclamer » ; un seul chemin ; sous-actions isolées | AC-14, AC-15, AC-19 | livré (6.14.113) |
| **AC-H : ménage et tests** | comptage sur la pré-prod puis retrait de `gift/claim` et de l'alias `attack` (rapports anciens gardés : 4 non vus) ; « Lancer maintenant » des étapes de cadence ; tour des actions (moteur, 66 actions ; serveur, 21 actions) | AC-18, AC-22 | livré (6.14.135) |

Le lot AC-I (heartbeat, après la mesure Z6) suit la feuille de route d'automne 2030.

## 8. Questions ouvertes

Aucune nouvelle pour AC-A. Les questions Q-AC1 à Q-AC6 du rapport concernent les lots suivants.
