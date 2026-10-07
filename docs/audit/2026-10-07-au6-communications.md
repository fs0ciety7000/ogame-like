# Revue AU6 : communications (messages, canal global, salons, modération, annonces, sondages, gazette, notifications)

Date : 2026-10-07. Lot AU6 de `docs/proposals/feuille-de-route-2026-hiver.md`.
Sources : code (`globalChat.ts`, `messages.ts`, `polls.ts`, `gazette.ts`, `GlobalChannel.tsx`, `MessagesPage.tsx`, `PollCard.tsx`,
`ChatModerationPanel.tsx`) ; interface (Communications, Gazette, Annonces, Admin → Canal global) à 375 px et 1 400 px, Constellation ;
données de production non relues (Q3).

## Constats

| # | Gravité | Constat | Preuve | Suite |
|:--|:--|:--|:--|:--|
| COM6-1 | 🟡 | Deux actions sans confirmation : **bloquer** un joueur en messagerie, **supprimer** définitivement un message (modération) | `MessagesPage.tsx`, `ChatModerationPanel.tsx` | **corrigé en 6.9.3** |
| COM6-2 | 🟡 | Mobile (375 px) : l'indication du champ de saisie (« … (Entrée pour envoyer) ») est coupée sur deux lignes | capture | **corrigé en 6.9.3** (indication sous le champ) |
| COM6-3 | ℹ️ | Règles du domaine réglables depuis la 6.9.1 (canal global, salons, mentions, événements de salon, messagerie, sondages, gazette) ; les plafonds techniques (emojis personnalisés, bandeaux affichés, historique des e-mails) restent dans le code (Q7) | `ruleRegistry.ts` | rien |
| COM6-4 | ℹ️ | Canal global : fermeture de salon et signalement déjà confirmés ; modération à trois signalements, sourdines, mots filtrés | `GlobalChannel.tsx`, `globalChat.ts` | rien |
| COM6-5 | ℹ️ | 4 pages sans défilement horizontal ni erreur | captures | rien |

## Décisions
Aucune.
