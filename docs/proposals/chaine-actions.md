# Proposition : chaîne des actions, écritures sûres de la fiche joueur

Statut : **lot AC-A livré** (6.14.52, `docs/changes/6.14.52-ecritures-sures.md`) ; AC-B et AC-C à faire
(`feuille-de-route-2030-automne.md`, lots 8 et 9). Source : revue AU27, `docs/audit/2026-10-07-au27-chaine-actions.md`
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

## 6. Invariants

- **I24** (nouveau) : une fiche joueur n'est réécrite que dans une transaction qui l'a relue ; tout rattrapage sauvé écrit ses
  notifications dans la même fonction (hors PNJ). Garde : `src/server/ecrituresSures.test.ts` ; intégration « 6.14.52 (AC-1) ».

## 7. Plan de lots

| Lot | Contenu | Constats | État |
|:--|:--|:--|:--|
| **AC-A : écritures sûres** | jetons d'e-mail avant l'envoi ; `bumpPlayerStat` et `unsubscribe` en transaction ; notifications des 4 rattrapages et garde de balayage ; `now` du raid du tutoriel | AC-1, AC-4, AC-9, AC-13 | livré (6.14.52) |
| **AC-B : édition admin d'un joueur** | action `edit` de `admin/player-action` (différences appliquées sur l'état rattrapé, plafonds, journal) ; l'éditeur de `panels.tsx` n'envoie que les différences ; remise à zéro de l'XP côté serveur | AC-2 | à faire (lot 8) |
| **AC-C : suppression de compte serveur** | `purgePlayer(txApp, uid)` partagé avec `adminDeletePlayer` ; route `account/delete` ; `deleteRule` de `players` et `queues` réservés aux admins ; intégration (flotte en vol, offre, enchère, alliance) | AC-3 | à faire (lot 9) |

Les lots AC-D à AC-I (dépenses et traces, tâches planifiées, erreurs et vacances, réclamations groupées, ménage, heartbeat) suivent la
feuille de route d'automne 2030.

## 8. Questions ouvertes

Aucune nouvelle pour AC-A. Les questions Q-AC1 à Q-AC6 du rapport concernent les lots suivants.
