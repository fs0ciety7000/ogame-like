# Workflow : de l'idée à la mise en ligne

Comment une fonctionnalité ou un correctif de game design avance dans ce dépôt. Chaque étape produit une trace écrite.
Une étape sautée se dit dans la PR.

## 1. Les huit étapes

| # | Étape | Produit | Qui valide |
|:--|:--|:--|:--|
| 1 | **Problème joueur** : la phrase du joueur, telle quelle | citation dans la proposition | — |
| 2 | **Diagnostic** : reproduire dans le moteur (test Vitest ou simulation) | cause + fichier:ligne | preuve par test |
| 3 | **Benchmark** : 2 ou 3 jeux de référence, ce qu'ils font et pourquoi | tableau (§3) | — |
| 4 | **Options** : au moins deux, avec coûts (dev, complexité joueur, risque) | tableau comparatif | — |
| 5 | **Recommandation chiffrée** : formules, paliers, courbes (§4) | `docs/proposals/<système>.md` | **l'utilisateur** |
| 6 | **Implémentation par lots** : moteur + tests → serveur → UI → **admin : chaque réglage de la fonctionnalité éditable dans le panel** (`GameRules` ou contenu, CLAUDE.md règle n° 2) | commits par lot | CI locale (`CLAUDE.md`) |
| 7 | **Audit** : grille de `GAME_DESIGN.md` §6 + audit DESIGN.md + mobile | cases cochées dans la PR | — |
| 8 | **Livraison** : fiche `docs/changes/`, report dans GDD / DESIGN / CLAUDE.md, **contenu complet** (succès, Codex, prompts Midjourney si une image manque : CLAUDE.md règle n° 4), changelog, billet devblog si besoin, essai sur la pré-prod si le serveur est touché (`docs/preprod.md`), PR, rappel des hooks | fiche + PR | l'utilisateur fusionne |

Règle : tout ce qui est dans `GameRules` (et les autres contenus de jeu), pour les fonctionnalités existantes et futures, se gère dans le
panel admin. Une proposition liste les réglages qu'elle ajoute et où l'admin les modifie.

Règle (CLAUDE.md règle n° 3) : on n'attend plus la décision à l'étape 5. La recommandation est appliquée, le choix et ses
alternatives sont notés dans `docs/QUESTIONS.md` pour être revus avec l'utilisateur ; une proposition qui touche aux données des
joueurs (unités, ressources, niveaux) prend l'option la plus prudente et dit comment revenir en arrière. Un lot fini, on passe au suivant ;
une feuille de route finie, on écrit la suivante et on la commence. Consigne de l'utilisateur : « N'attends plus que je te dise de passer à
la suite. Travaille automatiquement. Si tu as des questions ou besoin de précisions. Note et log les, on ajustera ensemble. »

Petit changement (ajustement, correctif, refactoring) : les étapes 3 à 5 peuvent être sautées, **jamais la fiche de changement** de
l'étape 8 (modèle dans `docs/changes/README.md`). Elle se remplit pendant le lot, pas après.

## 2. Écrire une proposition (`docs/proposals/<système>.md`)

Plan fixe :

1. **Constat** : citation du joueur, chiffres observés.
2. **Diagnostic** : causes classées de la plus sûre à la plus douteuse, chacune avec sa preuve.
3. **Benchmark** (§3).
4. **Options** : tableau « ce que ça règle / ce que ça coûte / risque ».
5. **Recommandation** : règles, chiffres, paliers, textes joueurs clés, maquette des écrans touchés.
6. **Invariants** : ceux qui changent, ceux qui s'ajoutent, et leurs tests.
7. **Plan de lots** : lot 0 (correctif d'urgence), lot 1… avec le contenu de chaque PR.
8. **Questions ouvertes** : ce que l'utilisateur doit trancher.

## 3. Benchmark : grille

| Question | Pourquoi |
|:--|:--|
| Que perd le joueur, et quand le sait-il ? | pilier « perdre sans choix, non » |
| Quel plafond, et quelle sortie ? | règle 1 de `GAME_DESIGN.md` |
| Quelle action manuelle, quel automatisme ? | QoL vs engagement |
| Combien de temps la boucle bloque-t-elle ? | une boucle courte ne casse pas une longue |
| Comment ça progresse (niveaux, paliers) ? | level design |

Références habituelles :

- **OGame** : pas de plafond de vaisseaux (la limite, c'est le coût et les emplacements de flotte) ; défenses reconstruites à 70 % ;
  **Dock spatial** : les épaves d'un combat se réparent pendant une fenêtre de 3 jours, réparation de 30 min à 12 h, vaisseaux
  à remettre en service à la main (sinon automatiquement au bout de 3 jours).
- **Clash of Clans** : capacité d'armée (camps) stricte, la formation s'arrête quand c'est plein et la file attend ; chaque bâtiment
  progresse par niveaux d'hôtel de ville (plafonds débloqués par paliers) ; « constructeurs » = files parallèles limitées.
- **Jeux de gestion mobiles à hôpital** (Rise of Kingdoms, Lords Mobile…) : les blessés vont à l'hôpital, dont la capacité est un bâtiment
  à améliorer ; au-delà, ils meurent. Le soin coûte des ressources et du temps, et s'accélère.
- Xterium (dérivé d'OGame) : pas de source fiable trouvée sur un système de réparation propre ; ne pas citer de chiffres.

## 4. Level design : méthode

### 4.1 Courbes

- **Coût** : géométrique, `base × croissance^(niveau−1)`, plafonné par `maxCost` (déjà le format des bâtiments).
- **Effet** : linéaire par niveau. Un bâtiment **de système** (capacité ou service) ajoute des **paliers** qualitatifs aux niveaux 5, 10,
  15, 20 (§4.2, réglables : groupe `buildingTiers`) ; un bâtiment **de courbe** (production, bouclier, capsules) n'a que des **jalons**
  (image, succès, Codex), jamais un bond de production : sa courbe porte l'équilibre d'I29 (GDD §5, règle n° 4, réécrite en 6.14.141).
- **Temps** : `secondsPerLevel × niveau`, réduit par les bonus ; viser 5 min (niv. 1), environ 2 h (niv. 10), environ 1 j (niv. 20).
- Vérifier chaque courbe dans le simulateur admin (« et si ») et l'historique d'équilibrage avant de fixer les chiffres.
- Un lot qui touche un générateur (Chroniques, passe, catalogue des saisons, saga d'alliance, mutateurs) lance
  `node scripts/procedural-sim.mjs --months 48` avant et après (ou `--base <préréglage | fichier>` pour les deux d'un coup) et reporte
  dans sa fiche les mesures qui bougent : répétitions (titres, répliques, noms, commandants, mutateurs), variété (factions, images),
  faisabilité (jour de fin simulé du médian et du plus actif, épisodes sur une action peu pratiquée) (6.14.140).

### 4.2 Paliers (modèle)

Deux familles de bâtiments (6.14.141, `docs/proposals/paliers-batiments.md`) :

- **Bâtiments de système** (une capacité ou un service) : un effet nouveau à chaque palier, selon le modèle ci-dessous. Aujourd'hui :
  entrepôt, Atelier de réparation, Cale sèche, Fonderie quantique (chantiers en plus aux niveaux 5 et 10) ; les hangars arrivent au lot
  PB-L4. Un bâtiment à 10 niveaux a ses paliers aux niveaux 5 et 10.
- **Bâtiments de courbe** (production : extracteurs ; bouclier ; capsules) : la courbe seule, et des **jalons** aux mêmes niveaux (image
  du palier, `tierImages` ; succès « Maître » au niveau 20 ; Codex). Pas d'effet de palier sur la production : elle est calée par I29.

| Niveau | Rôle du palier | Exemple |
|:--|:--|:--|
| 1 | le système existe, version minimale | la cale sèche accueille les vaisseaux sauvés |
| 5 | premier **choix** donné au joueur | trier : réparer ou démanteler ; ressource prioritaire de l'entrepôt |
| 10 | **confort** (automatisme, file) | remise en service automatique ; tampon de l'entrepôt ; premiers soins de l'Atelier |
| 15 | **spécialisation** (un choix entre deux voies) | priorité par classe ; Négoce ou Convoi ; classe de l'Atelier |
| 20 | **signature** visible (prestige, effet fort) | cale orbitale : +sauvetage ; entrepôt orbital ; réparation d'urgence quotidienne |

Règles d'écriture d'un palier :

- chaque chiffre est un réglage du groupe `buildingTiers` (registre des règles, section « Bâtiments : paliers » de l'admin), niveaux compris ;
- un palier vient du **niveau effectif** (bâtiment débloqué) ; un palier atteint par un chantier compte à la fin du chantier ;
- un choix (palier 5 ou 15) se fait sur la carte du bâtiment une fois le palier atteint (rien dans la barre latérale), le premier est
  libre, puis un changement gratuit par `choiceCooldownHours` (24 h) ; sans choix, le palier n'a pas d'effet (« à choisir ») ;
- un palier chiffré passe par la source « bâtiment » du circuit d'effets (`buildingTierEffects`) ou par un lecteur de `buildingTiers.ts`,
  et reste sous les plafonds (invariant I46) ;
- un bâtiment remis au niveau 1 à l'Ascension (entrepôt, Atelier) rejoue ses paliers ; ses choix restent enregistrés et reprennent effet
  au palier ;
- aucune migration : un joueur déjà au-dessus d'un palier le reçoit au déploiement.

### 4.3 Chaîne de déblocage

Un nouveau bâtiment s'insère dans une chaîne existante, jamais en tête :
technologie (Labo) → bâtiment prérequis à un niveau → déblocage (coût rare) → paliers.
La chaîne s'affiche sur la carte du bâtiment (« Requis : Atelier niv. 5 »).

### 4.4 Cycle de vie d'une unité (référence)

```
File du chantier ─► Hangar (à quai) ─► En vol (mission) ─► Combat
        ▲                 ▲                                  │
        │                 │                     ┌────────────┼──────────────┐
        │                 │                     ▼            ▼              ▼
        │                 │                 Détruite     Sauvée         Survivante (usée)
        │                 │                 (débris)   (Atelier)        coque abîmée
        │                 │                                │                │
        │                 └──── réparée (si place) ◄───────┘                │
        │                 └──── réparation de coque à quai ◄────────────────┘
        └── recyclage (démantèlement) : ressources récupérées, place libérée
```

Chaque flèche a : une règle moteur, une notification et un affichage. Une flèche sans l'un des trois est une dette.

## 5. Documents vivants

Chaque lot relit puis met à jour :

- la fiche du lot (`docs/changes/`) et l'index ;
- le GDD si une règle de jeu, un chiffre ou un invariant change ;
- `docs/DESIGN.md` si un composant ou une règle visuelle apparaît ;
- ce fichier si la méthode évolue ;
- `CLAUDE.md` pour toute règle de travail ou tout piège appris (goja, migrations, schéma…).
- `docs/audit/constats-ouverts.md` quand un constat s'ouvre ou se ferme ; chaque revue AU le réécrit (6.14.18, ET29-3) ;
  un constat « faisable seul » ne reste pas ouvert plus d'une feuille de route.
- un compte écrit dans une fiche système ou le GDD (unités, succès, modèles, tâches, plafonds) est gardé par `docsCounts.test.ts`
  (6.14.94) : le lot qui change le code met la phrase à jour ; le journal du GDD (§8) reste dans l'ordre des versions ; une feuille
  de route dont tous les lots sont livrés passe au statut « livrée ».

Une règle devenue fausse est réécrite, pas contournée.

**Revue de fin de feuille de route (AU)**, en plus de la grille du GDD §6 (6.14.99, TH-L7, Q237) :
- audit visuel des 13 thèmes avec `scripts/theme-audit.mjs` (montage isolé décrit en tête du script, jamais la production) ; on compare
  la part de textes sous 4,5:1 et les éléments coupés à `measures.json` de la revue précédente : toute hausse devient un constat ;
- balayage des opacités d'état sur du texte (règle DESIGN.md de 6.14.97) hors des fichiers déjà gardés par `verrousSansOpacite.test.ts` ;
- les captures livrées restent en thème Constellation ; les 13 thèmes servent à l'audit ;
- deux passages de `theme-audit.mjs` quand la revue corrige quelque chose : build d'avant, puis build corrigé (second `vite preview`
  sur un autre port, `AUDIT_FRONT`), chacun dans son dossier de sortie ; `python3 scripts/theme-audit-compare.py <avant> <après>`
  liste les hausses, et `--resume` garde le relevé compact dans `docs/audit/<date>-<revue>-themes-mesures.json`, base de la revue
  suivante (le dossier de captures reste hors dépôt) (6.14.148) ;
- performance (`preprod-perf.mjs`) : la mesure qui compte est celle de la pré-prod ; en local, un compte neuf voit la modale d'annonce,
  qui devient l'élément du LCP (`PERF_LCP=1` pour le vérifier) (6.14.148).

## 6. Lots et PR

- Lot 0 = correctif sans changement de règle (données, affichage, garde-fous). Il part seul s'il est urgent.
- Un lot = moteur + tests + serveur + UI d'un même morceau ; pas de lot « tout le moteur » puis « toute l'UI ».
- Le changelog décrit ce que le joueur voit, pas le code. Le devblog explique le pourquoi, chiffres à l'appui.

## 7. Chaîne de contenu : tout s'enchaîne

Consigne de l'utilisateur (2026-10-07) : pour chaque ajout de contenu, fonctionnalité ou système, la chaîne complète suit. L'objectif :
quand on ajoute un vaisseau, une techno ou un bâtiment, tout s'enchaîne. Ajouter un contenu, c'est parcourir cette liste dans le même lot,
ou dans les lots suivants de la feuille de route, sans attendre que quelqu'un le demande. La fiche du lot coche chaque ligne : fait,
sans objet, ou reporté au lot X.

| # | Maillon | Ce qu'on ajoute | Où |
|:--|:--|:--|:--|
| 1 | **Contenu** | la fiche (stats, coûts, prérequis, image) ; une unité coche ses **rôles** (sonde, recycleur, transport, soutien, faiblesse de boss, contre-espionnage, 6.14.123) : une règle de jeu lit le rôle, jamais l'identifiant (`unitRoles.test.ts`) ; une recherche ou un projet d'alliance porte ses **effets composés** (6.14.124) ; une classe d'empire ou un mutateur porte ses effets composés chiffrés, une faction ses fugitifs (6.14.125) | `units.ts`, `buildings.ts`, `technologies.ts`, `relics.ts`, `modules.ts`, `alliances.ts`, `empireClass.ts`, `mutators.ts`, `pirates.ts`… ; `CONTENT_MIGRATIONS` (`appendFromDefaults`, `cosmic_db.js`) |
| 2 | **Réglages et admin** | chaque chiffre réglable (règle n° 2), éditeur de la fiche, rapport d'impact | `GameRules` / `ruleRegistry.ts`, onglet du domaine, `ContentEditor`, `panels.tsx`, `impact.ts` |
| 3 | **Effets donnés** | ce que le contenu apporte passe par le circuit d'effets, sous les plafonds | `effects.ts` (`EFFECT_STATS`), `empireEffects` (`modifiers.ts`), `derived.test.ts`, `effectsRead.test.ts` |
| 4 | **Effets reçus** | les effets qui peuvent le viser (+ % d'attaque sur cette unité ou sa classe, + % aux stats de la lune…) : cible ajoutée et préréglages (une unité ajoutée dans l'admin a ses préréglages générés, 6.14.123) | `effectTargets.ts` (sélecteur unité / classe / catégorie), `effectCatalog.ts` (`EFFECT_PRESETS`, `generatedUnitPresets`), nouvelle stat dans `EFFECT_STATS` si besoin |
| 5 | **Porteurs d'effets** | au moins une relique, un plan ou module, un talent, un officier ou une techno qui utilise ces effets | `relics.ts` (`DEFAULT_RELICS`, `RELIC_EFFECT_STAT`), `modules.ts`, `techEffects.ts`, `commanders.ts`, `talents.ts` ; formulaires `RelicForm`, `TechEffectsEditor`, `ComposedEffectFields` |
| 6 | **Succès** | un palier d'entrée et un palier de maîtrise ; un secret si le contenu s'y prête | `achievements.ts` (`METRICS`, `derivedAchievements`, mesure lue à l'usage) |
| 7 | **Codex** | une entrée, débloquée par le joueur lui-même | `codex.ts` |
| 8 | **Titre, bannière** | si le contenu a une maîtrise ou un exploit à afficher | `titles.ts`, `banners.ts` |
| 9 | **Défis et missions** | un défi de passe, un objectif des Chroniques, un défi hebdo, une mission ou une prime qui fait jouer le contenu. **Objectif** (6.14.121) : un système nouveau déclare ses actions dans le registre des actions suivies (libellé, verbe, deux ordres, page, base, poids ; « mesurée » si la page s'ouvre tard) et les compte par `trackAction` ; une unité, une techno ou un bâtiment y est d'office (`unit:<id>`, `research:<id>`, `building:<id>`). **Nouveauté** (6.14.122) : la fiche porte sa date d'ajout (`addedOn`), le chapitre suivant lui donne un épisode | `trackedActions.ts` (`CHAIN_TRACKED_ACTIONS` de `contentChain.ts`), `novelty.ts`, `passGen.ts`, `chronicleGen.ts`, `challenges.ts`, `dailyMissions.ts`, `missions.ts`, `bounties.ts` |
| 10 | **Butin et récompenses** | où on l'obtient : tables de butin, coffres, Comptoir, enchères | `loot.ts`, `bounties.ts` (Comptoir), `auctions.ts`, `addReady` (vaisseaux, I3) |
| 11 | **Équilibre** | simulateur, « et si », analyse d'équilibrage, mesure dans la santé de l'équilibre si utile | `simulator.ts`, `whatIf.ts`, `balance/` |
| 12 | **Interface** | page ou carte, recherche Ctrl+K, page Formules, Journal, notification, tutoriel avancé si c'est une étape | `src/pages/`, `CommandPalette`, `FormulasPage`, `timeline.ts`, `advancedGuide.ts` |
| 13 | **Illustrations** | image provisoire ; ligne dans `scripts/illustrations.json` (prompt, format, détourage), visible sur `test.fs0ciety.org/img` ; envoi par lot, reconnaissance et intégration (`docs/illustrations.md`) | `public/assets/…` |
| 14 | **Joueurs** | changelog ; grosse mise à jour : billet récapitulatif et billets par thème, tenus à jour jusqu'à publication, et annonce (modale vue une fois par compte, revisible sur `/game/annonces`) | `changelog/`, `content/blog/`, `ANNOUNCEMENTS` (`Announcement.tsx`) |
| 15 | **Pré-prod** | déploiement et essai sur `test.fs0ciety.org` avant la PR | `docs/preprod.md` |

Exemple : un nouveau vaisseau « Corvette ».
- Fiche dans `units.ts` et migration de contenu ; ses rôles cochés (une corvette de transport : « Transport »), jamais son identifiant
  dans une règle.
- Coûts et stats réglables dans Admin → Unités.
- Bonus éventuel de la corvette dans la couche empire.
- Sélecteur `unit:corvette` déjà couvert ; préréglage « +10 % d'attaque des corvettes » dans `effectCatalog.ts`.
- Relique « Moteur de corvette » ; succès « 100 corvettes » et « corvette niveau 10 » ; entrée de Codex (automatique pour les unités).
- Défi de passe « construire 20 corvettes » et prime Kesh'Vaar ; présence dans les tables de butin. Date d'ajout `addedOn` dans la fiche :
  le chapitre suivant des Chroniques lui donne l'épisode « nouveauté » (« Construis-en 5 ») ; l'action `unit:corvette` est comptée d'office.
- Simulateur ; changelog, prompts et image.

Garde (6.14.11, renforcée en 6.14.114, `docs/proposals/chaine-contenu.md`) : `contentChainReport()` (`src/game/contentChain.ts`) donne,
pour chaque unité, bâtiment, techno, relique, boss, colonie (biome, spécialisation), talent, module et classe d'empire, l'état des maillons
vérifiables : Codex, succès d'entrée et de maîtrise, **succès propre** (unités et bâtiments : une mesure qui ne compte que ce contenu,
`chainOwnMetrics`), préréglage d'effet de l'unité, porteur d'effet, **porteur propre** (unités : cible `unit:<id>`, une classe ne suffit
pas), **recherche Ctrl+K** (`PALETTE_KINDS`, tenu avec `CommandPalette.tsx`). `contentChain.test.ts` échoue sur un manque absent de
`KNOWN_GAPS` et sur un manque connu déjà comblé ; chaque manque connu cite son lot. Le même bilan s'affiche dans Admin → Équilibrage →
« Chaîne de contenu », contenu ajouté dans l'admin compris, avec un lien vers l'onglet où régler chaque manque. Les autres maillons
(image, défi, changelog, pré-prod…) restent cochés dans la fiche du lot.
Depuis 6.14.133, `KNOWN_GAPS` est vide. Une unité ajoutée (code ou admin) reçoit d'office son préréglage (6.14.123), ses succès
« Escadre » et « Maître » (6.14.129), son plan de module « signature » (6.14.133) et son action « construire telle unité », activable par
thème dans les objectifs générés (6.14.131) : il reste son Codex, son image et ses textes.
