# Constats ouverts (inventaire tenu à jour)

Lot A29-1 (6.14.18), qui ferme ET29-3 (AU23 : « pas de liste à jour des constats ouverts »). Source : les 24 rapports de `docs/audit/`,
croisés avec `docs/changes/`, `docs/proposals/` et `docs/QUESTIONS.md`.

**Règle** : chaque revue AU, et chaque lot qui ferme un constat, met cette page à jour dans le même commit (`docs/WORKFLOW.md`). Un
constat fermé sort du tableau et passe dans « Fermés depuis le dernier inventaire ».

## Fait qui pèse sur tout le reste

La production (`main`, PR #143 du 2026-10-06) est en **5.27.0**. Les versions suivantes (5.27.1 → 6.14.x, index `docs/changes/README.md`)
n'existent que sur la branche de travail et sur la pré-prod. Un constat « livré » ne l'est donc que sur la branche. Exemples :
- le plafond de PNJ-1 : en production, l'attaque des PNJ monte toujours jusqu'à +140 % ;
- les correctifs de la Cale sèche (5.28) ;
- l'entrepôt et le pillage (E1, E2).

Z0 (mise en production) est écartée pour l'instant (Q12, 2026-10-07) : on enrichit le jeu sur la pré-prod.

## Ouverts

### Faisable seul

| Id | Origine | Constat | Lot |
|:--|:--|:--|:--|
| AU27 | sept audits du 2026-10-07 | AJ-1 à AJ-17, AA-1 à AA-32, AC-1 à AC-22, AP-1 à AP-16, AD-1 à AD-30, AE-1 à AE-17 sauf AE-6 et AE-8 (AE-3 et AE-7 : reste le moteur, lot AE-L3), AI-1 à AI-17 (`docs/audit/2026-10-07-au27-*.md`) | lots de `feuille-de-route-2030-automne.md` |
| AU28 thèmes | 6.14.90 (TH-10 et TH-16 fermés en 6.14.96) | TH-7 à TH-9, TH-11 à TH-15, danger sur `space-600` (`docs/audit/2026-10-07-au28-themes.md`) : verrous grisés par opacité, titres coupés, ember en décor, Netrunner, ember des thèmes orange | TH-L1 à TH-L7 |
| É30-5 | 6.14.39 | Galaxie (LCP 8,4 s mobile), images du Codex (6 à 8 Mo), stabilité mobile | É30-5 |


### Attend des mesures (après la mise en production, puis une nouvelle copie sur la pré-prod)

| Id | Origine | Constat | Ce qu'il faut |
|:--|:--|:--|:--|
| PRG-1 (suite) | AU3, Z1 | Rythme du passe avec le barème actuel (missions à 0) | un mois complet en production, `bySource` (6.8.0) |
| BOSS-2, ET29-2 | AU2, AU23, Q21 | Cible de taux de boss abattus | 8 semaines en production (3 combats dans la copie) |
| Z1-c | Z1 | 86 % des joueurs pillables, l'attaquant gagne 74 % des combats JcJ | E1 et E2 (5.32, 6.2), lune et bunker, défense à domicile d'AE-L1 (6.14.72 : seuil ×0,75 → ×0,90 en simulation) en production, 30 jours de mesure |
| PRG-5, Z1-a | AU3, Z1 | Succès débloqués vite (médiane 70 sur 178 en une semaine) | rythme hebdomadaire (relevé A29-2) |
| AU28-4, HV28-6, PR29-5, ET29-4 | AU20 à AU23 | Chiffres provisoires : lunes (Q18), paliers bonus du passe, base avancée | ces systèmes en production |

### Attend l'utilisateur

| Id | Origine | Constat | Décision attendue |
|:--|:--|:--|:--|
| SP-1, ET-1, AT-1, HV-1, PR-1, ET28-1, AU28-1, HV28-1, PR29-1, ET29-1 | AU14 à AU23 | Z0 (mise en production) et Z6 (performance) sautés à chaque saison | feu vert pour la PR vers `main` (Q12) |
| P1, PERF-1 | audit global, AU13 | Moteur dans le bloc de démarrage (276 Ko compressés) | Z6 après Z0 ; chargement à la demande (Q8) |
| AT-6 | AU16, Q15 | Orientation des feuilles de route (choix pris seul : lunes, chaîne de contenu) | revue des choix avec toi |
| Q ouvertes | `QUESTIONS.md` | choix provisoires appliqués : liste à jour sur `/decisions` et dans `docs/decisions-a-valider.md` | validation ou changement |

## Images provisoires (règle n° 4 de CLAUDE.md)

Suivi : page « Atelier d'illustrations » et `python3 scripts/illustrations.py --missing` (`docs/illustrations.md`).

| Contenu | Lot | Image en place | Prompt |
|:--|:--|:--|:--|
| Classes d'empire (3), modules (7), spécialisations de colonie (4) | 6.14.93 | fichiers intégrés, pas encore affichés (emoji ou icône) : aucun champ d'image (Q240) | `scripts/illustrations.json` (fait) |

## Fermés depuis le dernier inventaire

| Id | Comment |
|:--|:--|
| Images provisoires (lot 2) | 6.14.93 : bannières et emblèmes de 5 factions, 3 boss d'alliance, 12 thèmes du passe, 3 portraits de saison, couvertures des billets 50 à 52, 8 en-têtes ; les 129 emplacements de `/img` sont faits |
| AJ-7 | 6.14.94 : chiffres des fiches et du GDD remis au code (sauvetage 85 %, 24 unités, 147 succès, 7 modèles de modules, 17 tâches), journal §8 trié ; garde `docsCounts.test.ts` |
| Images provisoires (lot 1) | 6.14.92 : Cale sèche, lune, phalange, porte de saut, 4 technos (plus d'image commune), annonce 5.7, 14 reliques (plus d'image empruntée ni cassée), 9 objets du Comptoir, monument de prestige ; images générées par API |
| AE-6 | 6.14.72 : vaisseaux à quai 75 %, défense à domicile +25 % ; seuil JcJ ×0,75 → ×0,90 (simulation `pvpBudget.ts`) ; l'effet en production se suit avec Z1-c |
| AE-8 | 6.14.72 : `pvp.hardXpRatio` 12 → 10 (Q100), le premier quartile d'XP hors de portée de la médiane |
| AE-3 (bornes) | 6.14.72 : coffre du 7e jour 2 M à 12 M (465 h → 20 h de production du joueur quotidien) ; l'indexation reste au lot AE-L3 |
| AE-7 (bouclier) | 6.14.72 : bouclier de 3 h après une défaite ; le plafond de défaites par 24 h reste au lot AE-L3 |
| PRG-1 (octobre) | Z1, 6.14.16 : missions à +2 au lancement du passe (Q3 close) |
| Z1-b | 6.14.17 : Codex dans « Tout réclamer » (Q27) |
| Z1-d | Pas de route logistique en prod, car les routes (5.33) ne sont pas sur `main` (5.27.0) : ce n'est pas un signal |
| ET-2 | La base avancée (6.10.0) n'est pas sur `main` : aucune attaque de colonie bloquée en production, rien à dédommager |
| ET29-3 | Cette page (6.14.18) ; reprise par AU24 (6.14.20) |
| AU29-2 | 6.14.24 : dossier de mise en production prêt (`docs/release/5.27-a-6.14.md`) ; la PR attend le feu vert (Q12) |
| AU30-3 | 6.14.34 : arrivées forcées sans course avec la tâche « à la minute » (5 × 81/81) |
| AU30-4 | 6.14.30 : billet `content/blog/49-grande-mise-a-jour.md`, à publier au jour J |
| AU29-5 | 6.14.28 : synthèse `docs/decisions-a-valider.md` et page à cocher ; les réponses de l'utilisateur restent à reporter |
| AU29-4 | 6.14.25 : Seigneurs et Boss dans « Tout réclamer » côté serveur |
| AU29-3 | 6.14.21 : lectures triées ou filtrées ; échec isolé de « v3.9 bounties » à surveiller (AU25) |
| COM-3 (reste) | 6.14.19 : casino de la semaine et pot commun (solde, entrées par source) dans la santé |
| PNJ-5 | 6.14.19 : unités d'élite débloquées dans la santé (jugement avec les mesures) |
| PNJ-4 | 6.14.19 : 79 % de raids repoussés sur 81 en 7 jours dans la copie de la prod, dans la cible (60 à 80 %) |
| PRG-5 (relevé) | 6.14.19 : points de succès gagnés en 7 jours ; le jugement reste dans « Attend des mesures » |
| C2 à C4 (chaîne de contenu) | 6.14.12 à 6.14.14 : garde `contentChain.test.ts` sans manque connu |

Tous les autres constats des rapports AU1 à AU23 et de l'audit global sont fermés, avec leur preuve dans `docs/changes/` ou la
proposition liée (relevé du 2026-10-07).
