# CLAUDE.md : guide de travail sur Cosmic Empires

Ce fichier est lu en premier par tout agent qui travaille sur le dépôt. Il dit **comment on travaille** ici.
Le reste est dans `docs/` :

| Document | Sert à |
|:--|:--|
| `docs/DESIGN.md` | toute modification du front (jetons, composants HUD, couleurs = sens, animations) |
| `docs/GAME_DESIGN.md` | **GDD** : piliers, boucles, carte des systèmes, **invariants du moteur**, règles de conception, fiches systèmes, grille et journal d'audit |
| `docs/WORKFLOW.md` | chaîne complète d'une fonctionnalité : brief → benchmark → chiffres → moteur → serveur → UI → audit → livraison ; méthode de level design |
| `docs/systems/*.md` | **une fiche par domaine du jeu** (règles et chiffres en vigueur, code, admin, état) : à lire avant de toucher un système |
| `docs/audit/*.md` | rapports d'audit datés (constats C, E, Q, P, D numérotés, réutilisés par les propositions) |
| `docs/proposals/*.md` | propositions chiffrées en attente de décision (une par système), dont la feuille de route |
| `docs/changes/*.md` | **une fiche par lot livré** (fonctionnalité, ajout, rework, ajustement, correctif, refactoring, docs), modèle et index dans `docs/changes/README.md` |
| `changelog/*.md`, `content/blog/*.md` | notes de version (joueurs) et billets du devblog |

## Règle n° 1 : chaque changement a son .md, et les docs s'auto-alimentent

Valable pour toute la session et tout le projet, à chaque demande :

1. **Avant de coder** un système, de l'équilibre ou ce qui touche les données des joueurs : une proposition `docs/proposals/<système>.md`
   (plan de `docs/WORKFLOW.md` §2), puis attendre la décision de l'utilisateur.
2. **Pour chaque lot**, même petit (ajout, rework, ajustement, correctif, refactoring, docs) : une fiche `docs/changes/<version>-<slug>.md`
   selon le modèle de `docs/changes/README.md`, ajoutée à l'index. Pas de fiche, pas de commit.
3. **Report dans les documents de référence**, dans le même commit :
   - règles de jeu → GDD (`docs/GAME_DESIGN.md`) : invariants §4, fiches systèmes §7, journal §8, et fiche du domaine dans `docs/systems/` ;
   - règles visuelles → `docs/DESIGN.md` ;
   - méthode → `docs/WORKFLOW.md` ;
   - règles de travail, pièges, conventions → ce fichier.
4. **Corriger plutôt qu'empiler** : une règle devenue fausse est réécrite, pas complétée par une exception. Une proposition livrée passe au
   statut « livrée » et renvoie à sa fiche.
5. Ces fichiers sont la mémoire du projet : les relire en début de session et avant chaque lot, ne jamais repartir de zéro.

## Règle n° 2 : tout est réglable dans le panel admin

> **Instructions : tout ce qui est dans GameRules etc pour les fonctionnalités existantes et futures doivent pouvoir être gérées dans le panel admin !**

- Chaque chiffre de jeu (stats, effets, coûts, durées, plafonds, bonus, calendriers, textes de règle) vit dans un contenu réglable :
  unités, technos, bâtiments, factions… dans leur onglet ; le reste dans `GameRules` (`content.ts`), avec un libellé dans `RULE_GROUP_LABELS`.
- Une nouvelle fonctionnalité ajoute ses réglages à `GameRules` (ou à une section de contenu) **et** son éditeur dans l'admin, dans le même lot.
  Un champ sans section dédiée reste éditable dans **Admin → Règles → Tous les réglages (avancé)** (`AllRulesEditor`), qui affiche chaque champ
  automatiquement ; une section dédiée avec libellés clairs reste la règle pour les chiffres courants.
- Une constante par défaut peut rester dans le code ; la valeur en vigueur vient toujours des règles. Une valeur réglable doit être JSON pur
  (pas de fonction, de `Date`, de `undefined`).
- Garde : `rulesAdmin.test.ts` (libellé de chaque groupe, valeurs éditables sans perte, éditeur monté) et `reglages671.test.ts` (réglages appliqués).

## Langue et ton

- Tout en **français** : code commenté, textes du jeu, commits, PR, docs.
- Textes joueurs : tutoiement, phrases courtes, le chiffre avant l'adjectif (« +25 % d'XP pendant 24 h »).

## Architecture en une minute

- `src/game/` : **moteur pur** (TypeScript sans DOM ni réseau). Il est empaqueté pour PocketBase
  (`pocketbase/pb_hooks/cosmic_game.js`) via les exports de `src/server/hooksEntry.ts`. Toute règle de jeu vit ici.
- `pocketbase/pb_hooks/cosmic_db.js` (écrit à la main) : routes, tâches planifiées (`timedCron`), transactions.
  `cosmic.pb.js` déclare les routes et les `cronAdd`. Une nouvelle tâche à la minute, aux 5 ou aux 10 min devient une étape de `CADENCES`
  (`cosmic_db.js`), pas un nouveau `cronAdd`. Le serveur fait autorité : le client n'applique jamais une règle seul.
- `src/services/` : appels au serveur et abonnements temps réel ; `src/store/` : état zustand ; `src/pages/`, `src/components/` : interface.
- `game_config` (lisible par tous) : `weekly_stock`, `patrons`, `server_pot`, etc.

## Règles du moteur (`src/game`)

- Pas de `localeCompare`, `Intl`, `toLocaleString` (un test de garde échoue) : goja ne les a pas tous.
- Pas de `matchAll` ni de `\p{L}` dans le code empaqueté pour goja : boucle `exec` et classe explicite (`[0-9A-Za-z_À-ɏ-]`).
- Toute nouvelle fonction appelée par `cosmic_db.js` doit être **exportée dans `hooksEntry.ts`**.
- Un invariant de `docs/GAME_DESIGN.md` qui change = un test qui change dans le même commit.
- Places et capacité des hangars : uniquement `hangarLoad` / `playerUnitCapacity` (`src/game/hangar.ts`). Un test interdit `getUnitCapacity(` ailleurs.
- Une récompense quotidienne ou à réclamer s'ajoute à `pendingClaims` (`claimAll.ts`) : elle est alors couverte par « Tout réclamer »
  et par la pastille unique d'Ordres du jour (`ordersReadyCount`). Pas de nouvelle pastille dans la barre latérale.
- Une récompense en vaisseaux (épave, coffre…) passe par `addReady` (`workshop.ts`), jamais directement dans `units` ou une flotte : invariant I3.
- Nouveau champ du profil joueur : l'ajouter à `GAME_FIELDS` (`playerFields.ts`), au type `PlayerState` et à `pocketbase/pb_schema.json`
  (le serveur crée le champ au démarrage par la synchronisation du schéma). Un nouveau bonus passe par une source du circuit d'effets
  (`empireEffects`) et reste sous les plafonds : `derived.test.ts` échoue si un maximum théorique les dépasse.
- Technos de combat : la couche techno plafonne l'attaque et la défense des unités à +150 % (`TECH_COMBAT_CAP`) ; une techno ne dépasse pas
  +100 % à son niveau maximal ni le niveau maximal de l'unité qu'elle monte (`validateTechEffect`). Avant d'ajouter un bonus « contre les PNJ »,
  vérifier qu'il n'existe pas déjà dans l'unité (ex. `KESH_PVE_BONUS`) : incident `tech19_2`, revue AU1.
- Nouvelle stat d'effet : elle doit être lue dans la couche empire (champ de `Modifiers` consommé ou lecteur direct), sinon `effectsRead.test.ts` échoue (I9).
- Réglages : voir la règle n° 2 (tout `GameRules` dans le panel admin). Nouveau groupe de règles : fusion dans `mergeContent`, `Object.assign`
  dans `applyGameContent`, libellé dans `RULE_GROUP_LABELS`, champs dans `panels.tsx` ou l'onglet du domaine.
- Initialisation des modules : un objet de règles au niveau du module ne lit jamais une constante importée d'un autre module du moteur
  (`keshPveBonus: KESH_PVE_BONUS` a planté le chargement du jeu dans le navigateur : import circulaire units ↔ combat, tests verts).
  Valeur littérale, ou accesseur (`get x() { … }`) lu à l'usage. Toujours ouvrir l'appli dans un navigateur après un changement du moteur.
- Calendrier : un rendez-vous serveur récurrent a un jour et une heure réglables dans l'admin (`BossSchedule.weekday`, `CasinoSettings.tournamentWeekly`) et
  ne démarre pas le même jour qu'un autre (invariant I16, `calendrier67.test.ts`). Un nouveau réglage optionnel lu depuis la base garde
  `null` pour « ancien comportement » : un champ absent reprend la valeur par défaut à la fusion des règles.
- Une action serveur qui dépend des flottes en vol passe par `actionNeedsAway` (`cosmic.pb.js` lit alors les flottes).
- Nouveau bâtiment, unité, techno ou relique par défaut : l'ajouter aussi au contenu personnalisé par une entrée `appendFromDefaults` de `CONTENT_MIGRATIONS` (`cosmic_db.js`), sinon il n'apparaît pas sur un serveur dont l'admin a modifié la liste.
- Une migration ponctuelle (`onBootstrap`) qui rend ou retire des unités, des ressources ou des niveaux **respecte les plafonds**
  (hangar, entrepôt) ou documente pourquoi elle les dépasse. Voir l'incident 5.22 dans `docs/proposals/cale-seche.md`.

## Règles du front

- Toujours suivre `docs/DESIGN.md` : `HudPanel`, `HudChip` (`asChild` + `button` si cliquable), `HudCallout`, `StatTile`, `CostPill`,
  `EmptyState`, `Button`. Pas de hex, pas de `text-white`, pas de `rgba(`, pas de `rounded-md/lg/xl`, pas de `shadow-lg`.
- Nombres en `font-mono tabular-nums` ; capitales seulement en `font-mono` ; confirmations par `askConfirm`.
- Corps de `useEffect` entre accolades.
- Un décompte en direct utilise `useNowTicker` (horloge partagée), jamais son propre `setInterval`. Une fenêtre rare montée dans `AppShell` se charge en `lazyPage`.
- `manualChunks` (`vite.config.ts`) ne force que des paquets tiers chargés dès l'entrée (bloc `ui`, `vendor`) : jamais `src/game` ni `lucide-react`,
  sinon le code des pages paresseuses remonte dans un bloc chargé au démarrage.
- Ne pas lancer prettier sur le dépôt.
- Chaque lot front se termine par un audit DESIGN.md des fichiers touchés, plus une vérification mobile (largeur 375 px, sans défilement horizontal).
- Captures d'écran (vérifications, livrables, rapports) : toujours en thème **Constellation**. Le thème est gardé par appareil :
  `localStorage.setItem("cosmic-empires:theme", "constellation")` dans un `addInitScript` de Playwright, avant le chargement de la page.

## Valider avant de committer

```bash
npm run build:hooks      # le bundle des hooks inclut le changelog : à relancer après toute modif de src/game ou changelog/
npx tsc -b
npx eslint src           # 0 erreur
npx vitest run
npm run build
```

Puis le test d'intégration PocketBase (script local de la session, il vide la base) quand le serveur est touché.
`.env.local` peut pointer vers la production : pour tester l'interface en local, lancer Vite avec `VITE_POCKETBASE_URL=http://127.0.0.1:8090`.
Un test vérifie que le bundle des hooks est à jour : il échoue si `build:hooks` a été oublié.

## Livrer

- Une branche de travail par session ; une PR **par lot terminé** (pas de PR intermédiaire).
- Chaque lot a sa fiche `docs/changes/` (règle n° 1) ; la PR liste les fiches qu'elle porte.
- Chaque lot visible par les joueurs a :
  - un fichier `changelog/AAAA-MM-JJ-slug.md` (frontmatter `version`, `iteration`, `date`, `title`) ;
  - pour les lots importants, un billet `content/blog/NN-slug.md`.
- Après la fusion d'une PR qui touche `pocketbase/pb_hooks`, rappeler à l'admin de cliquer « Mettre à jour les hooks ».
- Aucun secret (mot de passe, jeton) dans le dépôt, même temporaire.
- `.claude/settings.json` liste les commandes autorisées sans confirmation (build, tests, git sur `claude/*`, PocketBase local).
  Jamais de règle vers la production ni de push sur `main`.
- Données de production : lecture seule (GET), extraits gardés hors du dépôt (scratchpad). Seuls des agrégats anonymes entrent dans les docs.

## Méthode de game design

Avant d'écrire du code pour un système de jeu, suivre `docs/WORKFLOW.md` :

1. le problème vu par le joueur ;
2. le diagnostic dans le moteur (preuve par un test ou une simulation) ;
3. le benchmark (OGame, Clash of Clans, jeux de gestion mobiles) ;
4. au moins deux options comparées, puis une recommandation chiffrée ;
5. la validation de l'utilisateur, puis l'implémentation par lots.

Ce qui change l'équilibre ou les données des joueurs passe d'abord par une proposition dans `docs/proposals/`.
Une fois livrée : statut « livrée » en tête de la proposition, règles reportées dans les fiches systèmes du GDD, ligne au journal d'audit.
Ces documents s'enrichissent à chaque lot : une règle apprise (incident, piège goja, convention) va dans CLAUDE.md le jour même.
