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
- **Effet** : linéaire par niveau, avec **paliers** qualitatifs aux niveaux 5, 10, 15, 20 (format `bonusFromLevel` / `tier2`).
- **Temps** : `secondsPerLevel × niveau`, réduit par les bonus ; viser 5 min (niv. 1), environ 2 h (niv. 10), environ 1 j (niv. 20).
- Vérifier chaque courbe dans le simulateur admin (« et si ») et l'historique d'équilibrage avant de fixer les chiffres.

### 4.2 Paliers (modèle)

| Niveau | Rôle du palier | Exemple |
|:--|:--|:--|
| 1 | le système existe, version minimale | la cale sèche accueille les vaisseaux sauvés |
| 5 | premier **choix** donné au joueur | trier : réparer ou démanteler |
| 10 | **confort** (automatisme, file) | remise en service automatique, deuxième poste |
| 15 | **spécialisation** | priorité par classe, cocon |
| 20 | **signature** visible (prestige, effet fort) | cale orbitale : +sauvetage |

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
  (6.14.93) : le lot qui change le code met la phrase à jour ; le journal du GDD (§8) reste dans l'ordre des versions ; une feuille
  de route dont tous les lots sont livrés passe au statut « livrée ».

Une règle devenue fausse est réécrite, pas contournée.

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
| 1 | **Contenu** | la fiche (stats, coûts, prérequis, image) | `units.ts`, `buildings.ts`, `technologies.ts`, `relics.ts`, `modules.ts`… ; `CONTENT_MIGRATIONS` (`appendFromDefaults`, `cosmic_db.js`) |
| 2 | **Réglages et admin** | chaque chiffre réglable (règle n° 2), éditeur de la fiche, rapport d'impact | `GameRules` / `ruleRegistry.ts`, onglet du domaine, `ContentEditor`, `panels.tsx`, `impact.ts` |
| 3 | **Effets donnés** | ce que le contenu apporte passe par le circuit d'effets, sous les plafonds | `effects.ts` (`EFFECT_STATS`), `empireEffects` (`modifiers.ts`), `derived.test.ts`, `effectsRead.test.ts` |
| 4 | **Effets reçus** | les effets qui peuvent le viser (+ % d'attaque sur cette unité ou sa classe, + % aux stats de la lune…) : cible ajoutée et préréglages | `effectTargets.ts` (sélecteur unité / classe / catégorie), `effectCatalog.ts` (`EFFECT_PRESETS`), nouvelle stat dans `EFFECT_STATS` si besoin |
| 5 | **Porteurs d'effets** | au moins une relique, un plan ou module, un talent, un officier ou une techno qui utilise ces effets | `relics.ts` (`DEFAULT_RELICS`, `RELIC_EFFECT_STAT`), `modules.ts`, `techEffects.ts`, `commanders.ts`, `talents.ts` ; formulaires `RelicForm`, `TechEffectsEditor`, `ComposedEffectFields` |
| 6 | **Succès** | un palier d'entrée et un palier de maîtrise ; un secret si le contenu s'y prête | `achievements.ts` (`METRICS`, `derivedAchievements`, mesure lue à l'usage) |
| 7 | **Codex** | une entrée, débloquée par le joueur lui-même | `codex.ts` |
| 8 | **Titre, bannière** | si le contenu a une maîtrise ou un exploit à afficher | `titles.ts`, `banners.ts` |
| 9 | **Défis et missions** | un défi de passe, un objectif des Chroniques, un défi hebdo, une mission ou une prime qui fait jouer le contenu | `passGen.ts`, `chronicleGen.ts`, `challenges.ts`, `dailyMissions.ts`, `missions.ts`, `bounties.ts` |
| 10 | **Butin et récompenses** | où on l'obtient : tables de butin, coffres, Comptoir, enchères | `loot.ts`, `bounties.ts` (Comptoir), `auctions.ts`, `addReady` (vaisseaux, I3) |
| 11 | **Équilibre** | simulateur, « et si », analyse d'équilibrage, mesure dans la santé de l'équilibre si utile | `simulator.ts`, `whatIf.ts`, `balance/` |
| 12 | **Interface** | page ou carte, recherche Ctrl+K, page Formules, Journal, notification, tutoriel avancé si c'est une étape | `src/pages/`, `CommandPalette`, `FormulasPage`, `timeline.ts`, `advancedGuide.ts` |
| 13 | **Illustrations** | image provisoire ; ligne dans `scripts/illustrations.json` (prompt, format, détourage), visible sur `test.fs0ciety.org/img` ; envoi par lot, reconnaissance et intégration (`docs/illustrations.md`) | `public/assets/…` |
| 14 | **Joueurs** | changelog ; grosse mise à jour : billet récapitulatif et billets par thème, tenus à jour jusqu'à publication, et annonce (modale vue une fois par compte, revisible sur `/game/annonces`) | `changelog/`, `content/blog/`, `ANNOUNCEMENTS` (`Announcement.tsx`) |
| 15 | **Pré-prod** | déploiement et essai sur `test.fs0ciety.org` avant la PR | `docs/preprod.md` |

Exemple : un nouveau vaisseau « Corvette ».
- Fiche dans `units.ts` et migration de contenu.
- Coûts et stats réglables dans Admin → Unités.
- Bonus éventuel de la corvette dans la couche empire.
- Sélecteur `unit:corvette` déjà couvert ; préréglage « +10 % d'attaque des corvettes » dans `effectCatalog.ts`.
- Relique « Moteur de corvette » ; succès « 100 corvettes » et « corvette niveau 10 » ; entrée de Codex (automatique pour les unités).
- Défi de passe « construire 20 corvettes » et prime Kesh'Vaar ; présence dans les tables de butin.
- Simulateur ; changelog, prompts et image.

Garde (6.14.11, `docs/proposals/chaine-contenu.md`) : `contentChainReport()` (`src/game/contentChain.ts`) donne, pour chaque unité,
bâtiment, techno, relique et boss, l'état des maillons 5 à 7 (Codex, succès d'entrée et de maîtrise, préréglage d'effet de l'unité, porteur
d'effet). `contentChain.test.ts` échoue sur un manque absent de `KNOWN_GAPS` et sur un manque connu déjà comblé. Les autres maillons
(image, changelog, pré-prod…) restent cochés dans la fiche du lot.
