# Constats ouverts (inventaire tenu à jour)

Lot A29-1 (6.14.18), qui ferme ET29-3 (AU23 : « pas de liste à jour des constats ouverts »). Réécrit à chaque revue AU ; dernière
réécriture : revue AU28 (6.14.147, 2026-10-08, rapport `docs/audit/2026-10-08-au28-revue.md`), qui clôt la feuille d'automne 2030 et
ouvre celle d'hiver 2031. Sources : les rapports de `docs/audit/`, croisés avec `docs/changes/`, `docs/proposals/` et `docs/QUESTIONS.md`.

**Règle** : chaque revue AU, et chaque lot qui ferme un constat, met cette page à jour dans le même commit (`docs/WORKFLOW.md` §5). Un
constat fermé sort du tableau et passe dans « Fermés depuis le dernier inventaire ». Un constat « faisable seul » ne reste pas ouvert
plus d'une feuille de route : ceux de l'automne sont en tête de la feuille d'hiver 2031 (§0, lots R1 à R9).

## Fait qui pèse sur tout le reste

La production (`main`, PR #143 du 2026-10-06) est en **5.27.0**. Les versions suivantes (5.27.1 → 6.14.147, index
`docs/changes/README.md`) n'existent que sur la branche de travail et sur la pré-prod (6.14.146 le 2026-10-08). Un constat « livré »
ne l'est donc que sur la branche : plafond de PNJ-1, correctifs de la Cale sèche (5.28), entrepôt et pillage (E1, E2), rythme sur des
mois (bascule datée au 1er novembre 2026 sur la pré-prod). Z0 (mise en production) est écartée pour l'instant (Q12, 2026-10-07).

## Ouverts

### Faisable seul (feuille d'hiver 2031, §0)

| Id | Origine | Constat | Lot |
|:--|:--|:--|:--|
| AP-11 | AU27 procédural, revue AU28 | Passe : le plus actif atteint le dernier palier au jour 10 (profil réel) ou 13 (typique), 24 mois sur 24 avant la cible du jour 15 (`procedural-sim.mjs`, 2026-10-08) ; le médian reste au jour 27 à 28 | R2 (AP-L15) |
| AP-12, AP-13, AP-15, AP-16 | AU27 procédural | Configuration qui grossit (`month.pass` généré mais plus lu), rotation des boss par indice, deux `seededRandom` homonymes, bibliothèque hors anti-répétition, chapitre, succès et passe dans une seule transaction | R1 (AP-L13) |
| RV-6 (IT-délais) | 6.14.135, 6.14.145, revue AU28 | Intégration : une écriture de section de contenu coûte 0,7 à 2,2 s (garde serveur), d'où les délais portés à 20 et 30 s ; « legacy battle reports » intermittent diagnostiqué et corrigé (rattrapage avant la mesure, 6.14.147) ; règles rapides de la suite supprimées en route par un test (404 en fin de suite, rendu sans effet en 6.14.147, test fautif à trouver) ; 14 routes du joueur sans intégration (reste d'AC-22) | R3 (IT-L1) |
| RV-7 (É30-5) | 6.14.39, 6.14.116, revue AU28 | Performance (pré-prod, 2026-10-08) : LCP mobile Galaxie 7,7 s, Commerce 8,1 s, Alliance 9,7 s, élément peint au rendu de la page (démarrage ≈ 8 s) ; bureau : accueil 4,8 s, Galaxie 5,8 s, Alliance 6,4 s ; pic de décalage du menu au bureau en local | R4 (É30-5b) |
| AJ-14 | AU27 jeu et chaîne | Exports morts du moteur ; retrait des missions du jour noté pour Z0 + 30 jours | R5 (AJ27-11) |
| AA-12, AA-20 (reste), AA-23 (reste), AA-28, AA-31 | AU27 admin | Temps de recherche sans surcharge par techno ; origine d'un seigneur fermée ; défis d'alliance, réserve des missions du jour et archétypes des Chroniques hors sections ; pas d'aperçu avant / après d'un coût ; exclusion des statistiques d'équilibre en dur | R6 (AA-L10) |
| AA-14 | AU27 admin | Bornes des effets de techno (`EFFECT_MAX_PER_LEVEL`) au code : garde-fou d'équilibre (question AA-Q4) | R6, ou laissé au code |
| AD (reste d'UX-10) | AU27 design | Admin : arrondis, emoji et dates ; exceptions de l'accueil public, du cockpit et des Succès dans `designSystem.test.ts` | R7 (UX-13) |
| AE-14 | AU27 équilibrage | Coffre, missions et série versés au-delà de l'entrepôt sans le dire (la production s'arrête ensuite) | R8 (AE-L8) |
| AD-30 | AU27 design | Chargement de Commerce et d'Alliance : mesuré par la revue AU28 (LCP mobile 8,1 et 9,7 s), même cause que RV-7 | R9 (UX-12), avec R4 |
| RV-8 | revue AU28 | Opacités d'état laissées volontairement sur du texte : message d'un joueur masqué au salon (`opacity-50`), carte « Ta flotte » du simulateur en mode raid, filtre de l'arbre des technos, pages d'admin ; à revoir si un audit les mesure sous 3:1 | revue suivante |

### Attend des mesures

| Id | Origine | Constat | Ce qu'il faut |
|:--|:--|:--|:--|
| RL-4, RL-5, AE-4 | 6.14.78 à 6.14.89, AU27 | Rythme sur des mois (second palier ×4, recherche tardive, Ascension espacée, missions ×0,75) : bascule datée au 1er novembre 2026 | mesures après la bascule (R10), réglage fin après 8 semaines (R11) |
| PRG-1 (suite) | AU3, Z1 | Rythme du passe avec le barème actuel (missions à 0) | un mois complet en production, `bySource` (6.8.0) |
| BOSS-2, ET29-2, AE-10, AE-11 | AU2, AU23, AU27, Q21 | Cible de taux de boss abattus, Ambre des primes | 8 semaines en production (R12, AE-L7) |
| Z1-c | Z1 | 86 % des joueurs pillables, l'attaquant gagne 74 % des combats JcJ | E1 et E2, lune, défense à domicile (AE-L1), Casemates (6.14.145) en production, 30 jours de mesure |
| PRG-5, Z1-a, AE-12 | AU3, Z1, AU27 | Succès débloqués vite ; rythme appliqué en 6.14.117 (28 % à J7 en rétro-simulation) | relevé « succès par semaine » après la mise en production ; réglage dans Admin → Règles → « Succès : rythme » |
| AC-17 | AU27 chaîne d'actions | Écritures de présence trop fréquentes | mesure Z6, puis AC-I (R13) |
| AU28-4, HV28-6, PR29-5, ET29-4 | AU20 à AU23 | Chiffres provisoires : lunes (Q18), paliers bonus du passe, base avancée | ces systèmes en production |
| RV-5 | revue AU28 | Chroniques, profil réel : 30 épisodes sur 192 (48 mois) portent une action de médiane nulle sur la pré-prod (sondes, marché ; actions à la main du joueur, I19) | profil mesuré sur une nouvelle copie de la production |

### Attend l'utilisateur

| Id | Origine | Constat | Décision attendue |
|:--|:--|:--|:--|
| SP-1, ET-1, AT-1, HV-1, PR-1, ET28-1, AU28-1, HV28-1, PR29-1, ET29-1 | AU14 à AU23 | Z0 (mise en production) et Z6 (performance) sautés à chaque saison | feu vert pour la PR vers `main` (Q12) |
| P1, PERF-1 | audit global, AU13 | Moteur dans le bloc de démarrage | Z6 après Z0 ; chargement à la demande (Q8) |
| AT-6 | AU16, Q15 | Orientation des feuilles de route (choix pris seul) | revue des choix avec toi |
| Q ouvertes | `QUESTIONS.md` | choix provisoires appliqués : liste à jour sur `/decisions` et dans `docs/decisions-a-valider.md` ; questions proposées par la revue AU28 dans sa fiche (6.14.147) | validation ou changement |

## Images provisoires (règle n° 4 de CLAUDE.md)

Suivi : page « Atelier d'illustrations » et `python3 scripts/illustrations.py --missing` (`docs/illustrations.md`). Relevé du
2026-10-08 : **89 emplacements attendus** sur `/img`, chacun avec son image provisoire en place et son prompt.

| Contenu | Lot | Image en place | Attendus |
|:--|:--|:--|:--|
| Portraits des officiers de saison (`officier-s-*`) | 6.14.138 | portrait du rôle | 33 |
| Thèmes du passe, années 2 et 3 (`passe-theme-*-2`, `-3`) | 6.14.138 | image du thème de l'année 1 | 24 |
| Icônes des paliers de bâtiment (`palier-*`) | 6.14.146 | image du bâtiment (`TIER_ART`) | 21 |
| Seconds boss des Chroniques (`chroniques-boss2-*`) | 6.14.138 | image unique du boss de l'archétype (`AUTO_ART_2`) | 7 |
| Talents (3) et module « signature » (1) | 6.14.127, 6.14.133 | emoji ou image de la famille | 4 |

## Fermés depuis le dernier inventaire

| Id | Comment |
|:--|:--|
| TH-danger (6.14.96) | 6.14.147 : `--th-danger` éclairci dans 7 thèmes (Netrunner, Aurora, Signal, Voyageur, Spartan, Constellation, Atlas) : 4,12 à 4,45:1 → 4,55 à 4,57:1 sur `space-600` ; écarts avec les autres couleurs de sens tous ≥ 15 ; garde `themeTokens.test.ts` mesurée sur `space-600` |
| RV-1, RV-2 (revue AU28) | 6.14.147 : paliers lointains de la ligne « Paliers » grisés par l'opacité (« niv. 10/15/20 » à 4,0 à 4,2:1, hausse de 1 à 4 textes sous le seuil sur Bâtiments dans 7 thèmes) ; jours passés de l'agenda, ordres faits, épisodes verrouillés, seigneur absent, objet possédé, sélecteur de couleur de pseudo : bordure et couleur du texte à la place de l'opacité ; garde `verrousSansOpacite.test.ts` étendue à 10 fichiers |
| AP-6 (AU27) | 6.14.147 (AP-L6) : la saga d'alliance suit la faction, le boss et l'image du chapitre du mois, titre non repris avant 3 mois (`allianceSaga.followChapter`, `noRepeatMonths`) : même faction que le chapitre 2/48 → 48/48 mois, titres répétés d'un mois sur l'autre 10/48 → 0 |
| IT-délais, « legacy battle reports » | 6.14.147 : écart de +25 XP expliqué (rattrapage de la fiche par `report/seen`, en course avec la tâche « à la minute ») ; le test rattrape B avant de mesurer et nomme les succès débloqués s'il échoue ; reste RV-6 (R3) |
| AJ-1 à AJ-17, AA (sauf ci-dessus), AC-1 à AC-22 (sauf AC-17 et le reste d'AC-22), AP-1 à AP-10, AP-14, AE (sauf AE-4, AE-10 à AE-12, AE-14), AD-1 à AD-29, AI-1 à AI-17 (AU27) | lots de la feuille d'automne 2030, 6.14.52 à 6.14.146 (bilan dans le rapport de la revue AU28) ; images restantes dans le tableau ci-dessus |
| AU28 thèmes (TH-1 à TH-16) | 6.14.90 et 6.14.96 à 6.14.101 ; mesure de la revue AU28 : textes sous 4,5:1 hors admin 0,78 à 1,99 % → 0,57 à 0,65 % (13 thèmes), aucun défilement horizontal ni élément coupé |
| AJ-12 (AU27) | 6.14.141 à 6.14.146 (PB-L0 à PB-L5) : paliers des bâtiments de système ; restent les 21 icônes sur `/img` |
| AC-18, AC-22 en grande partie (AU27) ; AD-coût ; IT-seul | 6.14.135 (AC-H) |
| AP-7, AP-8, AP-9, AP-10, AP-14 (AU27) | 6.14.109, 6.14.121, 6.14.122, 6.14.136 à 6.14.140 |
| É30-5 (AU27, 6.14.39), en grande partie | 6.14.116 : décalages mobile 0,22 → 0,04 à 0,08, Codex −5 Mo, page préchargée |
| C2 à C4 (chaîne de contenu) | `contentChain.test.ts` sans manque connu (`KNOWN_GAPS` vide, revue AU28) |

Tous les autres constats des rapports AU1 à AU27 et de l'audit global sont fermés, avec leur preuve dans `docs/changes/` ou la
proposition liée (relevé du 2026-10-08).
