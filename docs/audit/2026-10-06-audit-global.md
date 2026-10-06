# Audit global : 2026-10-06 (après la 5.28.0)

Périmètre :
- moteur `src/game` : 147 modules, 46 600 lignes ;
- serveur `pb_hooks` : 30 tâches planifiées ;
- interface : 50 pages joueur, 64 panneaux admin ;
- contenu : 13 bâtiments, 30 technologies, 21 unités, 6 factions, 6 boss mondiaux, 26 reliques, 28 rangs.

Méthode : `docs/WORKFLOW.md`.
- Lecture des règles (`*_RULES`) et du contenu par défaut.
- Vérification ciblée dans le code (fichier cité pour chaque constat).
- Benchmark OGame, Clash of Clans et Xterium.

Les fiches de chaque domaine sont dans `docs/systems/`.

Limite : pas d'accès aux données de production. Les constats d'équilibrage chiffrés viennent des formules. À confirmer dans l'admin
(Équilibrage, Rétention) avant tout lot d'équilibre.

## 1. Ce qui marche bien (à garder)

- **Serveur qui fait foi**, moteur pur et testé (981 tests), invariants écrits.
- **Contenu et règles éditables** en admin, avec validation, journal et retour arrière.
- **Rythmes variés** : boucles session, jour, semaine, mois, méta (Ascension).
- **Monde vivant** : PNJ adaptatifs (pirates, seigneurs), boss en rotation, gazette, chroniques.
- **QoL** déjà poussée : Ctrl+K, file planifiée, modèles d'actions, « Tout réclamer », page Formules, simulateur.
- **Design system** cohérent et protégé par des tests de garde.

## 2. Constats

Codes : **C** cohérence ou bug, **E** équilibrage, **Q** QoL et lisibilité, **P** performance, **D** documentation et dette.
Gravité : 🔴 bloque ou fausse le jeu, 🟠 gêne réelle, 🟡 amélioration. ✅ : corrigé (version).

### Cohérence et bugs

| # | Gravité | Constat | Preuve | Piste |
|:--|:--|:--|:--|:--|
| C1 | ✅ 5.28.1 | L'**épave d'expédition** ajoute 2 à 5 % de la flotte sans vérifier la place au hangar : l'invariant I3 est violé, et c'est une nouvelle source de surcharge | `expeditions.ts` (`kind === "wreck"`) | les vaisseaux trouvés vont en Cale sèche ou à l'Atelier comme « prêts » |
| C2 | ✅ 5.28.1 | La remise en service automatique (palier 10) n'a lieu qu'à la prochaine action du joueur | `actions.ts` (`awayKnown`) | l'exécuter aussi au retour des flottes (`processDueFleets`) |
| C3 | ✅ 5.28.1 | `homeLevels` compte les bâtiments verrouillés au niveau 1 : le seuil des colonies (120 / 140) est atteint plus tôt qu'annoncé | `colonies.ts` (`homeLevels`) | utiliser `effectiveBuildingLevel` (le seuil baisse de 0 à 3 selon le joueur ; décider s'il faut l'ajuster) |
| C4 | 🟡 | Catégories trompeuses : Bastion en « attaque » avec un profil défensif ; Intercepteur en « défense » mais mobile (vitesse 12, soute 5) | `units.ts` | trancher, puis migrer le contenu |
| C5 | ✅ 5.28.1 | Stats d'effet **sans effet sur la couche empire** : `fleetUpkeep` et `buildingDiscount` ne sont lus que pour les technologies. Le préréglage « Intendance de flotte » ne fait rien sur une relique, un officier ou un module | `economy.ts`, `flush.ts` | lire la couche empire, plus un test de garde générique « chaque stat déclarée est lue dans les deux couches » |

### Équilibrage

| # | Gravité | Constat | Chiffres | Piste |
|:--|:--|:--|:--|:--|
| E1 | 🔴 (confirmé en prod : 115 h à l'abri, stock 57 h ; `proposals/entrepot-pillage.md`) | **Entrepôt trop généreux, pillage symbolique**. La capacité vaut 2 M × 1,6^niveau, dont 10 % à l'abri. On ne remplit jamais l'entrepôt, et la part protégée couvre des dizaines d'heures de production | niv. 15 : 2,3 Md de capacité, 230 M à l'abri ≈ 42 h de production ; niv. 20 : 24 Md | protection exprimée en **heures de production** (ex. 8 h, réglable) plutôt qu'en part de capacité ; courbe de l'entrepôt recalée pour qu'il compte vraiment |
| E2 | 🟡 (revu : sauvetage max observé 80 %, plafond 95 % jamais atteint) | **Attrition faible en fin de partie** : jusqu'à 95 % des vaisseaux détruits reviennent (Atelier 70 % + bonus), plus 60 % des défenses reconstruites. Une défaite coûte peu, une victoire rapporte peu (E1) | plafond `withRepairBonus` 0,95 | plafond global à 80 % ; garder la Cale sèche comme réponse au blocage, pas à la perte |
| E3 | 🟡 | **Corrigé le 2026-10-06** : il n'y a pas une seule file de bâtiments, mais **un chantier par bâtiment, en parallèle**, limité seulement par les ressources (jusqu'à 12 en production). Recherches : 4 en parallèle. Peu d'arbitrage d'ordre de construction | `actions.ts` (`startBuildingUpgrade`), `MAX_CONCURRENT_RESEARCH = 4`, données `queues` | `proposals/constructeurs.md` |
| E4 | 🟡 | **Aucune limite de flottes simultanées** : rien ne rend précieux le choix d'une mission | `fleets.ts` | emplacements de flotte (OGame : technologie Ordinateur) généreux, plus un emplacement d'expédition à part |
| E5 | 🟠 | **Alliances de 6 membres** pour un contenu collectif massif (24 secteurs, guerres, boss d'alliance, sagas, coffre de guerre) | `ALLIANCE_RULES.maxMembers = 6` | 12 puis 20 membres débloqués par la recherche d'alliance, avec des coûts proportionnels à la taille |
| E6 | 🟡 | Les colonies restent des fermes : ni chantier naval, ni flotte basée, ni route de transport automatique | `colonies.ts` | routes logistiques automatiques (QoL), puis chantier de défense déjà là, puis, plus tard, flotte basée |

### QoL et lisibilité

| # | Gravité | Constat | Piste |
|:--|:--|:--|:--|
| Q1 | ✅ 5.30.0 (sans fusion) | **Trop de corvées quotidiennes**, réparties dans des écrans différents : contrats du jour (3), missions du jour (3), série, primes (4), expéditions (3), vote d'alliance, défis, passe, chroniques, boss (jusqu'à 4 en même temps) | un **Journal de bord** unique (ordres du jour, rendez-vous, « Tout réclamer ») ; fusionner contrats et missions du jour |
| Q2 | ✅ 5.31.0 | **14 monnaies et jauges** ; « saison » désigne trois choses (saison XP, passe, Chroniques) | portefeuille unique avec glossaire, nommage unifié (« Saison » = mois ; « Passe » ; « Chronique » = histoire du mois) |
| Q3 | ✅ 5.31.0 (durées ; production et combat à suivre) | Les bonus s'empilent (tech, officiers, reliques, modules, talents, territoires, capsules, mutateurs) sans être visibles au moment de décider | infobulle « d'où vient ce chiffre » sur chaque valeur clé (combat, coûts, temps), branchée sur `effectSheet` |
| Q4 | ✅ 5.30.0 (affichage ; lissage à décider) | Les rendez-vous tombent le même week-end (boss mondial, guerre de territoire, tournoi du casino, élite) | calendrier lissé par le planificateur, un « temps fort » par week-end |

### Performance

| # | Gravité | Constat | Piste |
|:--|:--|:--|:--|
| P1 | ✅ 5.29.0 (en partie) | Bundle principal de **904 Ko** (non compressé) ; changelog de 252 Ko chargé d'un bloc | découpe du moteur par page, changelog paginé à la demande |
| P2 | ✅ 5.29.0 | Recalculs chaque seconde (`useNowTicker`) sur des pages lourdes : `workshopView` clone l'état ; les effets sont recalculés à chaque rendu | mémoïsation par minute pour les vues lourdes, ticker local aux compteurs |
| P3 | ✅ 5.29.0 | 30 tâches planifiées, dont 3 chaque minute ; certaines parcourent tous les joueurs | regrouper par cadence et ne traiter que les joueurs concernés (index `nextDueAtMs`) ; mesurer avec les métriques serveur existantes |

### Documentation et dette

| # | Gravité | Constat | Piste |
|:--|:--|:--|:--|
| D1 | ✅ 5.28.1 | `README.md` dit que « toute la logique de jeu tourne côté client » : faux depuis la v2 | réécrire le README (architecture serveur, liens vers `CLAUDE.md` et `docs/`) |
| D2 | 🟡 | Pas de fiche avant cet audit pour la plupart des systèmes | fait : `docs/systems/` |

## 3. Benchmark : ce qu'on retient

| Jeu | Ce qu'ils font | Ce qu'on en tire |
|:--|:--|:--|
| OGame | Pillage à 50 % des stocks ; défenses reconstruites à 70 %, vaisseaux non ; Dock spatial pour une part des épaves ; emplacements de flotte par technologie ; 3 classes (Collecteur, Général, Explorateur) avec un vaisseau propre ; formes de vie (4 espèces) avec bâtiments et technologies propres ; officiers payants | le risque économique rend le JcJ intéressant (E1, E2) ; la **classe d'empire** est un levier d'identité fort ; limiter les flottes donne du poids aux choix (E4) |
| Clash of Clans | Constructeurs parallèles (levier de progression central) ; camps d'armée stricts ; clans de 50 ; Capitale de clan et raids du week-end ; mises à jour QoL régulières, par exemple afficher sur l'écran principal le nombre d'attaques restantes, ou prévenir avant une attaque incomplète | constructeurs (E3) ; alliances plus grandes (E5) ; **un temps fort par week-end** (Q4) ; information là où le joueur regarde (Q1, Q3) |
| Xterium | Dérivé d'OGame (économie, flottes, alliances, diplomatie). Pas de source détaillée fiable trouvée | rien de chiffré n'est repris |

Sources :
- [OGame : présentation des classes et des formes de vie (Gameforge, App Store)](https://apps.apple.com/app/id1593395507)
- [OGame : formes de vie (communiqué)](https://uberstrategist.com/press-release/lifeforms-expansion-release)
- [Clash of Clans : améliorations QoL (Supercell)](https://supercell.com/en/games/clashofclans/blog/news/quality-of-life-changes/)
- [Clash of Clans : changements de la Capitale de clan](https://supercell.com/en/games/clashofclans/blog/news/clan-capital-changes-2)
- [Xterium (AlternativeTo)](https://alternativeto.net/software/xterium-war-of-alliance-/about)

## 4. Suite

Lots proposés à la validation : `docs/proposals/feuille-de-route-2026-q4.md`.
