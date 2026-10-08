# Constats ouverts (inventaire tenu à jour)

Lot A29-1 (6.14.18), qui ferme ET29-3 (AU23 : « pas de liste à jour des constats ouverts »). Réécrit à chaque revue AU ; dernière
réécriture : revue AU28 (6.14.148, 2026-10-08, rapport `docs/audit/2026-10-08-au28-revue.md`), qui clôt la feuille d'automne 2030 et
ouvre celle d'hiver 2031. Sources : les rapports de `docs/audit/`, croisés avec `docs/changes/`, `docs/proposals/` et `docs/QUESTIONS.md`.

**Règle** : chaque revue AU, et chaque lot qui ferme un constat, met cette page à jour dans le même commit (`docs/WORKFLOW.md` §5). Un
constat fermé sort du tableau et passe dans « Fermés depuis le dernier inventaire ». Un constat « faisable seul » ne reste pas ouvert
plus d'une feuille de route : ceux de l'automne sont en tête de la feuille d'hiver 2031 (§0, lots R1 à R9).

## Fait qui pèse sur tout le reste

La production (`main`, PR #143 du 2026-10-06) est en **5.27.0**. Les versions suivantes (5.27.1 → 6.14.148, index
`docs/changes/README.md`) n'existent que sur la branche de travail et sur la pré-prod (6.14.146 le 2026-10-08). Un constat « livré »
ne l'est donc que sur la branche : plafond de PNJ-1, correctifs de la Cale sèche (5.28), entrepôt et pillage (E1, E2), rythme sur des
mois (bascule datée au 1er novembre 2026 sur la pré-prod). Z0 (mise en production) est écartée pour l'instant (Q12, 2026-10-07).

## Ouverts

### Faisable seul (feuille d'hiver 2031, §0)

| Id | Origine | Constat | Lot |
|:--|:--|:--|:--|
| RV-6 (IT-délais) | 6.14.135, 6.14.145, revue AU28 | Intégration : une écriture de section de contenu coûte 0,7 à 2,2 s (garde serveur), d'où les délais portés à 20 et 30 s ; « legacy battle reports » intermittent diagnostiqué et corrigé (rattrapage avant la mesure, 6.14.148) ; règles rapides de la suite supprimées en route par un test (404 en fin de suite, rendu sans effet en 6.14.148, test fautif à trouver) ; 14 routes du joueur sans intégration (reste d'AC-22) | R3 (IT-L1) |
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
| Q ouvertes | `QUESTIONS.md` | choix provisoires appliqués : liste à jour sur `/decisions` et dans `docs/decisions-a-valider.md` ; questions proposées par la revue AU28 dans sa fiche (6.14.148) : Q361 à Q364 | validation ou changement |

## Images provisoires (règle n° 4 de CLAUDE.md)

Suivi : page « Atelier d'illustrations » et `python3 scripts/illustrations.py --missing` (`docs/illustrations.md`). Relevé du
2026-10-08 : les 89 emplacements relevés par la revue AU28 sont générés (6.14.147) ; reste la ligne ci-dessous.

| Contenu | Lot | Image en place | Attendus |
|:--|:--|:--|:--|
| Classes d'empire (3), modules (7), spécialisations de colonie (4) | 6.14.93 | fichiers intégrés, pas encore affichés (emoji ou icône) : aucun champ d'image (Q240) | `scripts/illustrations.json` (fait) |

## Fermés depuis le dernier inventaire

| Id | Comment |
|:--|:--|
| AP-11 (AU27, revue AU28) | 6.14.150 (R2, AP-L15, `docs/proposals/rythme-du-passe.md`) : 10 paliers de prestige cosmétiques après le palier 30 (4 paliers du passe chacun, sans ressources ; bannière de prestige et succès « Au-delà du passe »), invariant I48. Le plus actif atteint toujours le palier 30 au jour 10 (réel) ou 13 (typique) : la contrainte « médian au jour 27, plus actif pas avant 15 » est impossible à tenir sur une seule piste (rapport 2,2 à 2,7) ; il a désormais une piste visible jusqu'au jour 23 (réel) ou 29 (typique), `procedural-sim.mjs`, champ `topPrestigeDay` |
| AP-12, AP-13, AP-15, AP-16 (AU27) | 6.14.149 (R1, AP-L13) : plus de `month.pass` dès novembre 2026 (1,4 Ko par mois), mois de plus de 12 mois allégés (≈ 0,9 Ko de moins chacun) et copiés dans `chronicles_archive`, ni relu par requête ni téléchargé par le jeu ; boss mondial au rang du catalogue entier (un boss désactivé ne réécrit plus le calendrier ; défaut inchangé) ; `contracts.seededRandom` → `dailyRandom` (mêmes tirages) ; reste du budget du passe sur les 3 derniers paliers ordinaires, jamais plus de 12 h par récompense ; chapitre, succès et passe en trois transactions ; bibliothèque : saison et confirmation, récompenses rebudgétées, titres comptés. Le mutateur était déjà au mois de Paris (6.14.136). Reste, hors constat : un chapitre garde ses épisodes et son Codex (≈ 2,8 Ko par mois), les passes de saison ne sont pas allégés (question proposée dans la fiche) |
| TH-danger (6.14.96) | 6.14.148 : `--th-danger` éclairci dans 7 thèmes (Netrunner, Aurora, Signal, Voyageur, Spartan, Constellation, Atlas) : 4,12 à 4,45:1 → 4,55 à 4,57:1 sur `space-600` ; écarts avec les autres couleurs de sens tous ≥ 15 ; garde `themeTokens.test.ts` mesurée sur `space-600` |
| RV-1, RV-2 (revue AU28) | 6.14.148 : paliers lointains de la ligne « Paliers » grisés par l'opacité (« niv. 10/15/20 » à 4,0 à 4,2:1, hausse de 1 à 4 textes sous le seuil sur Bâtiments dans 7 thèmes) ; jours passés de l'agenda, ordres faits, épisodes verrouillés, seigneur absent, objet possédé, sélecteur de couleur de pseudo : bordure et couleur du texte à la place de l'opacité ; garde `verrousSansOpacite.test.ts` étendue à 10 fichiers |
| AP-6 (AU27) | 6.14.148 (AP-L6) : la saga d'alliance suit la faction, le boss et l'image du chapitre du mois, titre non repris avant 3 mois (`allianceSaga.followChapter`, `noRepeatMonths`) : même faction que le chapitre 2/48 → 48/48 mois, titres répétés d'un mois sur l'autre 10/48 → 0 |
| IT-délais, « legacy battle reports » | 6.14.148 : écart de +25 XP expliqué (rattrapage de la fiche par `report/seen`, en course avec la tâche « à la minute ») ; le test rattrape B avant de mesurer et nomme les succès débloqués s'il échoue ; reste RV-6 (R3) |
| AJ-1 à AJ-17, AA (sauf ci-dessus), AC-1 à AC-22 (sauf AC-17 et le reste d'AC-22), AP-1 à AP-10, AP-14, AE (sauf AE-4, AE-10 à AE-12, AE-14), AD-1 à AD-29, AI-1 à AI-17 (AU27) | lots de la feuille d'automne 2030, 6.14.52 à 6.14.146 (bilan dans le rapport de la revue AU28) ; images restantes dans le tableau ci-dessus |
| AU28 thèmes (TH-1 à TH-16) | 6.14.90 et 6.14.96 à 6.14.101 ; mesure de la revue AU28 : textes sous 4,5:1 hors admin 0,78 à 1,99 % → 0,57 à 0,65 % (13 thèmes), aucun défilement horizontal ni élément coupé |
| AJ-12 (AU27) | 6.14.141 à 6.14.146 (PB-L0 à PB-L5) : paliers des bâtiments de système ; restent les 21 icônes sur `/img` |
| AC-18, AC-22 en grande partie (AU27) ; AD-coût ; IT-seul | 6.14.135 (AC-H) |
| AP-7, AP-8, AP-9, AP-10, AP-14 (AU27) | 6.14.109, 6.14.121, 6.14.122, 6.14.136 à 6.14.140 |
| É30-5 (AU27, 6.14.39), en grande partie | 6.14.116 : décalages mobile 0,22 → 0,04 à 0,08, Codex −5 Mo, page préchargée |
| C2 à C4 (chaîne de contenu) | `contentChain.test.ts` sans manque connu (`KNOWN_GAPS` vide, revue AU28) |
| Images provisoires (saisons, paliers, doctrines) | 6.14.119 : Clé de soudure et Essaim de nanites détourées ; 6.14.147 : 24 thèmes d'année du passe, 33 portraits de saison, 7 seconds boss des Chroniques, 21 icônes de paliers, 3 doctrines, module signature (images générées par API) |
| AC-5, AC-6, AC-12, AC-20, AC-21 (AU27) | 6.14.110 (AC-D) : un seul chemin de dépense (`spendResources`, `spendAmber`, garde de balayage), réclamations au Journal (Q76), rappel tracé et hôte prévenu, succès après l'action, `unitsSold` (I34) |
| AC-7, AC-10 (AU27) ; AC-8 en grande partie | 6.14.111 (AC-E) : verrou par cadence, e-mails en file et par lots, tâches allégées (factions, flottes, rattrapage, rappels), échéances suspendues puis décalées après une maintenance (Q77, I35) ; mesure d'AC-8 sur la pré-prod au push |
| AC-11, AC-16 (AU27) | 6.14.112 (AC-F) : erreurs traduites côté client, garde de vacances unique et réglable (Q79, I36) |
| AC-14, AC-15, AC-19 (AU27) | 6.14.113 (AC-G) : jeton du casino, défi et titre du Codex dans « Tout réclamer », un seul chemin, sous-actions isolées (I37) |
| AP-5 (AU27) | 6.14.108 (AP-L4) : paliers de succès générés bridés (3 détenteurs et 10 % des actifs, 1 par mesure tous les 30 jours, 3 par mesure, titre au dernier), réglables (`achievementGen`) ; rien retiré |
| AP-9 (AU27) | 6.14.109 (AP-L5) : objectifs du jour pondérés (`dailyContracts.weights`, défense 0,5 et raids de faction comptés), quantités réglables |
| AP-10 (AU27), en grande partie | 6.14.121 (AP-L7) : registre des actions suivies (`trackedActions.ts`) lu par les Chroniques, les défis du passe, la saga et les objectifs du jour ; lune, phalange, porte de saut, colonies et une action par contenu comptées ; action « mesurée » tirée seulement quand le serveur la pratique (I38). 6.14.122 (AP-L8) : épisode « nouveauté » pour un contenu daté (`addedOn`). Restent : mutateurs en contenu (AP-L9), défi hebdomadaire (types en dur), objectifs paramétrés tirés d'office (AJ27-7, poids des familles à 0) ; 6.14.136 (AP-L9) : mutateurs sans répétition (I44), défi hebdomadaire laissé hors du registre (compteurs de volume, calendrier) |
| AP-7, AP-8, AP-14 (AU27) | 6.14.137 à 6.14.139 (AP-L10 à AP-L12) : banques de textes réglables (`narrative`, I45), répliques distinctes sur 12 mois 56 % → 100 %, faction par thème et par année, répliques des jalons par année ; 64 lignes d'illustration (thèmes d'année, portraits, seconds boss) avec images provisoires dans le code ; saisons générées au-delà du cycle écrit (`seasonGen`). 6.14.140 (AP-L14) : `scripts/procedural-sim.mjs` |
| AA-16, AA-17, AA-18 (AU27) | 6.14.123 (AA5) : rôles d'unités (`UnitDef.roles` : sonde, recycleur, transport, soutien, faiblesse de boss, contre-espionnage) lus à la place des identifiants, garde des identifiants en dur (I39) ; coût d'unité en toutes ressources ; préréglages d'effets générés pour une unité ajoutée ; migration `unit-roles-6.14.123` |
| AA-15 (AU27) | 6.14.124 (AA6) : recherches et projets d'alliance par effets composés (couche « alliance » pour leurs calculs, couche empire pour le reste, I40), éditeur dédié, migration `alliance-effects-6.14.124` (valeurs identiques) |
| AJ-15 (AU27), en partie | 6.14.118 (É30-7) : 28 reliques à image propre (vérifié par empreinte, garde `illustrations.test.ts`), 14 lignes de reliques ajoutées à `scripts/illustrations.json` (14 → 28 reliques suivies), prompts des classes et des biomes déjà faits ; restent modules, talents et mutateurs sans image (emoji) |
| AU28 thèmes | 6.14.90 et 6.14.96 à 6.14.101 : TH-1 à TH-16 corrigés (lots TH-L1 à TH-L7) ; reste le rouge « danger » sur `space-600` (7 thèmes entre 4,1 et 4,5:1), noté pour la revue AU28 |
| Images provisoires (lot 2) | 6.14.93 : bannières et emblèmes de 5 factions, 3 boss d'alliance, 12 thèmes du passe, 3 portraits de saison, couvertures des billets 50 à 52, 8 en-têtes ; les 129 emplacements de `/img` sont faits |
| AJ-7 | 6.14.94 : chiffres des fiches et du GDD remis au code (sauvetage 85 %, 24 unités, 147 succès, 7 modèles de modules, 17 tâches), journal §8 trié ; garde `docsCounts.test.ts` |
| Images provisoires (lot 1) | 6.14.92 : Cale sèche, lune, phalange, porte de saut, 4 technos (plus d'image commune), annonce 5.7, 14 reliques (plus d'image empruntée ni cassée), 9 objets du Comptoir, monument de prestige ; images générées par API |
| AE-6 | 6.14.72 : vaisseaux à quai 75 %, défense à domicile +25 % ; seuil JcJ ×0,75 → ×0,90 (simulation `pvpBudget.ts`) ; l'effet en production se suit avec Z1-c |
| AE-8 | 6.14.72 : `pvp.hardXpRatio` 12 → 10 (Q100), le premier quartile d'XP hors de portée de la médiane |
| AE-3 | 6.14.72 : coffre du 7e jour 2 M à 12 M (465 h → 20 h de production du joueur quotidien) ; 6.14.106 : indexé, 6 à 18 h de production dans la place libre de l'entrepôt, plancher 2 M |
| AE-7 | 6.14.72 : bouclier de 3 h après une défaite ; 6.14.106 : 4 défaites en défense par 24 h au plus (décollage et arrivée) |
| AE-2, AE-15 | 6.14.106 : comptoir plafonné à 30 M de rares par semaine (compteur serveur) ; rattrapage +50 % sous 20 % de la médiane |
| AE-L4 (mesures) | 6.14.107 : santé de l'équilibre complétée (Ambre par source et par semaine, heures avant la mort des boss, 1re Ascension, production perdue, quartiles de production, suivi de Q267 à Q269) ; les constats AE-5, AE-10, AE-11 restent ouverts jusqu'à AE-L7 (8 semaines de mesures) |
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

Tous les autres constats des rapports AU1 à AU27 et de l'audit global sont fermés, avec leur preuve dans `docs/changes/` ou la
proposition liée (relevé du 2026-10-08).
