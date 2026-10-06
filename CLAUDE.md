# CLAUDE.md : guide de travail sur Cosmic Empires

Ce fichier est lu en premier par tout agent qui travaille sur le dépôt. Il dit **comment on travaille** ici.
Le reste est dans `docs/` :

| Document | Sert à |
|:--|:--|
| `docs/DESIGN.md` | toute modification du front (jetons, composants HUD, couleurs = sens, animations) |
| `docs/GAME_DESIGN.md` | piliers, boucles de jeu, carte des systèmes, **invariants du moteur**, grille d'audit |
| `docs/WORKFLOW.md` | chaîne complète d'une fonctionnalité : brief → benchmark → chiffres → moteur → serveur → UI → audit → livraison ; méthode de level design |
| `docs/proposals/*.md` | propositions chiffrées en attente de décision (une par système) |
| `changelog/*.md`, `content/blog/*.md` | notes de version (joueurs) et billets du devblog |

## Langue et ton

- Tout en **français** : code commenté, textes du jeu, commits, PR, docs.
- Textes joueurs : tutoiement, phrases courtes, le chiffre avant l'adjectif (« +25 % d'XP pendant 24 h »).

## Architecture en une minute

- `src/game/` : **moteur pur** (TypeScript sans DOM ni réseau). Il est empaqueté pour PocketBase
  (`pocketbase/pb_hooks/cosmic_game.js`) via les exports de `src/server/hooksEntry.ts`. Toute règle de jeu vit ici.
- `pocketbase/pb_hooks/cosmic_db.js` (écrit à la main) : routes, tâches planifiées (`timedCron`), transactions.
  `cosmic.pb.js` déclare les routes et les `cronAdd`. Le serveur fait autorité : le client n'applique jamais une règle seul.
- `src/services/` : appels au serveur et abonnements temps réel ; `src/store/` : état zustand ; `src/pages/`, `src/components/` : interface.
- `game_config` (lisible par tous) : `weekly_stock`, `patrons`, `server_pot`, etc.

## Règles du moteur (`src/game`)

- Pas de `localeCompare`, `Intl`, `toLocaleString` (un test de garde échoue) : goja ne les a pas tous.
- Pas de `matchAll` ni de `\p{L}` dans le code empaqueté pour goja : boucle `exec` et classe explicite (`[0-9A-Za-z_À-ɏ-]`).
- Toute nouvelle fonction appelée par `cosmic_db.js` doit être **exportée dans `hooksEntry.ts`**.
- Un invariant de `docs/GAME_DESIGN.md` qui change = un test qui change dans le même commit.
- Une migration ponctuelle (`onBootstrap`) qui rend ou retire des unités, des ressources ou des niveaux **respecte les plafonds**
  (hangar, entrepôt) ou documente pourquoi elle les dépasse. Voir l'incident 5.22 dans `docs/proposals/cale-seche.md`.

## Règles du front

- Toujours suivre `docs/DESIGN.md` : `HudPanel`, `HudChip` (`asChild` + `button` si cliquable), `HudCallout`, `StatTile`, `CostPill`,
  `EmptyState`, `Button`. Pas de hex, pas de `text-white`, pas de `rgba(`, pas de `rounded-md/lg/xl`, pas de `shadow-lg`.
- Nombres en `font-mono tabular-nums` ; capitales seulement en `font-mono` ; confirmations par `askConfirm`.
- Corps de `useEffect` entre accolades.
- Ne pas lancer prettier sur le dépôt.
- Chaque lot front se termine par un audit DESIGN.md des fichiers touchés, plus une vérification mobile (largeur 375 px, sans défilement horizontal).

## Valider avant de committer

```bash
npm run build:hooks      # le bundle des hooks inclut le changelog : à relancer après toute modif de src/game ou changelog/
npx tsc -b
npx eslint src           # 0 erreur
npx vitest run
npm run build
```

Puis le test d'intégration PocketBase (script local de la session, il vide la base) quand le serveur est touché.
Un test vérifie que le bundle des hooks est à jour : il échoue si `build:hooks` a été oublié.

## Livrer

- Une branche de travail par session ; une PR **par lot terminé** (pas de PR intermédiaire).
- Chaque lot visible par les joueurs a :
  - un fichier `changelog/AAAA-MM-JJ-slug.md` (frontmatter `version`, `iteration`, `date`, `title`) ;
  - pour les lots importants, un billet `content/blog/NN-slug.md`.
- Après la fusion d'une PR qui touche `pocketbase/pb_hooks`, rappeler à l'admin de cliquer « Mettre à jour les hooks ».
- Aucun secret (mot de passe, jeton) dans le dépôt, même temporaire.

## Méthode de game design

Avant d'écrire du code pour un système de jeu, suivre `docs/WORKFLOW.md` :

1. le problème vu par le joueur ;
2. le diagnostic dans le moteur (preuve par un test ou une simulation) ;
3. le benchmark (OGame, Clash of Clans, jeux de gestion mobiles) ;
4. au moins deux options comparées, puis une recommandation chiffrée ;
5. la validation de l'utilisateur, puis l'implémentation par lots.

Ce qui change l'équilibre ou les données des joueurs passe d'abord par une proposition dans `docs/proposals/`.
