# Constats ouverts (inventaire tenu à jour)

Lot A29-1 (6.14.18), qui ferme ET29-3 (AU23 : « pas de liste à jour des constats ouverts »). Source : les 24 rapports de `docs/audit/`,
croisés avec `docs/changes/`, `docs/proposals/` et `docs/QUESTIONS.md`.

**Règle** : chaque revue AU, et chaque lot qui ferme un constat, met cette page à jour dans le même commit (`docs/WORKFLOW.md`). Un
constat fermé sort du tableau et passe dans « Fermés depuis le dernier inventaire ».

## Fait qui pèse sur tout le reste

La production (`main`, PR #143 du 2026-10-06) est en **5.27.0**. Les 57 commits suivants (5.27.1 → 6.14.17) n'existent que sur la branche
de travail et sur la pré-prod. Un constat « livré » ne l'est donc que sur la branche. Exemples :
- le plafond de PNJ-1 : en production, l'attaque des PNJ monte toujours jusqu'à +140 % ;
- les correctifs de la Cale sèche (5.28) ;
- l'entrepôt et le pillage (E1, E2).

C'est l'argument principal pour Z0 (mise en production, Q12).

## Ouverts

### Faisable seul

Aucun (6.14.19). Le prochain inventaire (AU24) reprend cette section.


### Attend des mesures (après la mise en production, puis une nouvelle copie sur la pré-prod)

| Id | Origine | Constat | Ce qu'il faut |
|:--|:--|:--|:--|
| PRG-1 (suite) | AU3, Z1 | Rythme du passe avec le barème actuel (missions à 0) | un mois complet en production, `bySource` (6.8.0) |
| BOSS-2, ET29-2 | AU2, AU23, Q21 | Cible de taux de boss abattus | 8 semaines en production (3 combats dans la copie) |
| Z1-c | Z1 | 86 % des joueurs pillables, l'attaquant gagne 74 % des combats JcJ | E1 et E2 (5.32, 6.2), lune et bunker en production |
| PNJ-4 | AU1 | Raids repoussés à 96 % | 3 raids par jour (PNJ-3, 6.6.0) en production |
| PRG-5, Z1-a | AU3, Z1 | Succès débloqués vite (médiane 70 sur 178 en une semaine) | rythme hebdomadaire (relevé A29-2) |
| AU28-4, HV28-6, PR29-5, ET29-4 | AU20 à AU23 | Chiffres provisoires : lunes (Q18), paliers bonus du passe, base avancée | ces systèmes en production |

### Attend l'utilisateur

| Id | Origine | Constat | Décision attendue |
|:--|:--|:--|:--|
| SP-1, ET-1, AT-1, HV-1, PR-1, ET28-1, AU28-1, HV28-1, PR29-1, ET29-1 | AU14 à AU23 | Z0 (mise en production) et Z6 (performance) sautés à chaque saison | feu vert pour la PR vers `main` (Q12) |
| P1, PERF-1 | audit global, AU13 | Moteur dans le bloc de démarrage (276 Ko compressés) | Z6 après Z0 ; chargement à la demande (Q8) |
| AT-6 | AU16, Q15 | Orientation des feuilles de route (choix pris seul : lunes, chaîne de contenu) | revue des choix avec toi |
| Q ouvertes | `QUESTIONS.md` | Q1, Q2, Q4 à Q6, Q9 à Q11, Q15, Q16, Q18 à Q27 : choix provisoires appliqués | validation ou changement |

## Images provisoires (règle n° 4 de CLAUDE.md)

| Contenu | Lot | Image en place | Prompt |
|:--|:--|:--|:--|
| Cale sèche | 5.28.0 | copie de `atelier_reparation.webp` (même fichier) | `docs/prompts-5.28.md` |
| Lune (Codex, Légendes) | 6.14.1 | `public/assets/moon/lune.webp` générée par script | `docs/prompts-6.14.md` |
| 30 technologies (Codex) | 6.14.12 | image commune `TECH_CODEX_IMAGE` | `docs/prompts-6.14.md` |
| Objets du Comptoir | 5.26.3, 5.27 | icônes, `SHOP_ITEM_ART` vide (`BountiesPage.tsx`) | `docs/prompts-5.27.md` |
| Annonce 5.7 | 5.7 | copie de `choeur-banner.webp` | `docs/prompts-annonce-5.7.md` |
| Reliques `sceau_sentinelle`, `plaque_bastion` et deux autres paires | — | deux reliques par image (`relics.ts`) | à écrire si l'image doit être propre à chaque relique |

## Fermés depuis le dernier inventaire

| Id | Comment |
|:--|:--|
| PRG-1 (octobre) | Z1, 6.14.16 : missions à +2 au lancement du passe (Q3 close) |
| Z1-b | 6.14.17 : Codex dans « Tout réclamer » (Q27) |
| Z1-d | Pas de route logistique en prod, car les routes (5.33) ne sont pas sur `main` (5.27.0) : ce n'est pas un signal |
| ET-2 | La base avancée (6.10.0) n'est pas sur `main` : aucune attaque de colonie bloquée en production, rien à dédommager |
| ET29-3 | Cette page (6.14.18) |
| COM-3 (reste) | 6.14.19 : casino de la semaine et pot commun (solde, entrées par source) dans la santé |
| PNJ-5 | 6.14.19 : unités d'élite débloquées dans la santé (jugement avec les mesures) |
| PNJ-4 (relevé), PRG-5 (relevé) | 6.14.19 : raids repoussés et repaires pris (7 j), points de succès gagnés en 7 jours ; le jugement reste dans « Attend des mesures » |
| C2 à C4 (chaîne de contenu) | 6.14.12 à 6.14.14 : garde `contentChain.test.ts` sans manque connu |

Tous les autres constats des rapports AU1 à AU23 et de l'audit global sont fermés, avec leur preuve dans `docs/changes/` ou la
proposition liée (relevé du 2026-10-07).
