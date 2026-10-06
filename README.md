# Cosmic Empires

Un 4X spatial temps réel : bâtiments, unités, laboratoire de recherche,
missions, combats entre joueurs — synchronisé en direct sur tous tes
appareils.

Réécriture complète du prototype HTML/CSS/JS d'origine (conservé dans
`legacy/` pour référence) vers une stack moderne :

- **React 18 + TypeScript + Vite** — SPA rapide, typée de bout en bout.
- **Tailwind CSS v4 + Radix UI + Framer Motion** — interface sombre façon
  sci‑fi, accessible, animée.
- **PocketBase** — comptes (pseudo, email, passkeys, Google / Apple), base de
  données et temps réel (SSE), auto‑hébergé. **Le serveur fait autorité** : chaque
  action passe par les hooks (`pocketbase/pb_hooks`), qui exécutent le moteur de
  `src/game` empaqueté pour goja. Le client affiche et anticipe, il n'applique
  jamais une règle seul.
- **Zustand** — état client léger, alimenté par les abonnements temps réel.
- **sonner** — toasts, **cloche de notifications** — journal d'évènements
  persistant (constructions, recherches, missions, combats) alimenté en
  temps réel.

## Documentation

À lire avant de contribuer (agent ou humain) :

| Fichier | Contenu |
| --- | --- |
| `CLAUDE.md` | comment on travaille ici : règles du moteur, du front, validation, livraison |
| `docs/GAME_DESIGN.md` | GDD : piliers, boucles, invariants du moteur, fiches systèmes, journal d'audit |
| `docs/systems/` | une fiche par domaine du jeu (règles et chiffres en vigueur, code, admin) |
| `docs/DESIGN.md` | design system de l'interface (jetons, composants HUD) |
| `docs/WORKFLOW.md` | chaîne d'une fonctionnalité, du brief à la livraison |
| `docs/proposals/`, `docs/audit/`, `docs/changes/` | propositions chiffrées, audits datés, une fiche par lot livré |
| `changelog/`, `content/blog/` | notes de version et devblog |

## En bref

Ressources communes et rares, bâtiments à paliers, laboratoire, chantier naval et hangars, Atelier de réparation et Cale sèche,
flottes (attaque, espionnage, recyclage, expéditions, patrouilles), PNJ (pirates, seigneurs de guerre, boss mondiaux), alliances
(territoires, guerres, projets), économie (marché, enchères, Comptoir, pot commun), saisons (passe, Chroniques, divisions),
Ascension et colonies. Le détail, avec les chiffres, est dans `docs/systems/`.

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseigne VITE_POCKETBASE_URL
npm run dev
```

Sans `VITE_POCKETBASE_URL`, l'application vise `http://127.0.0.1:8090` et
affiche un bandeau d'avertissement sur l'écran de connexion.

## Installer le schéma PocketBase

Une seule commande (relançable sans risque) crée les collections du jeu
avec leurs règles d'accès, et active la connexion par pseudo sur `users` :

```bash
PB_URL=https://ton-pocketbase PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… \
  node pocketbase/setup.mjs
```

Le schéma est décrit dans `pocketbase/pb_schema.json` (importable aussi à la
main : admin PocketBase → Settings → Import collections). Pour le mot de
passe oublié, configure le SMTP dans Settings → Mail settings et l'URL de
l'application dans Settings → Application.

## Hooks serveur (PocketBase)

Toute la partie est arbitrée par le serveur : production, constructions,
unités, recherches, missions, échanges, dons et combats passent par les
routes `/api/cosmic/*` de `pocketbase/pb_hooks/cosmic.pb.js`. Les règles
d'accès (`pb_schema.json`) interdisent au navigateur d'écrire lui-même ses
ressources, niveaux, unités ou son XP.

Fichiers de `pocketbase/pb_hooks/` :

| Fichier | Rôle |
| --- | --- |
| `cosmic_updater.pb.js` | au démarrage, télécharge les autres fichiers depuis la branche `main` de GitHub |
| `cosmic.pb.js` | les routes du jeu |
| `cosmic_db.js` | lecture/écriture des joueurs en base |
| `cosmic_game.js` | logique de jeu, **générée** depuis `src/game` (`npm run build:hooks`) |
| `cosmic_sync.js` | la mise à jour depuis GitHub (utilisée par l'updater et l'administration) |

**Installation (une seule fois)** : seul `cosmic_updater.pb.js` est à copier
dans le dossier `pb_hooks` du serveur (volume Coolify monté sur
`/pb/pb_hooks`, voir la doc de ton image), puis redémarre PocketBase :

```bash
# dans le terminal du conteneur PocketBase
wget -O /pb/pb_hooks/cosmic_updater.pb.js \
  https://raw.githubusercontent.com/fs0ciety7000/ogame-like/main/pocketbase/pb_hooks/cosmic_updater.pb.js
```

Ensuite, **à chaque démarrage**, PocketBase récupère la dernière version
des hooks sur `main` (seulement si tous les fichiers sont téléchargés et
valides ; sinon il garde ceux en place). Après un déploiement, le bouton
*Administration → Outils → Mettre à jour les hooks* fait la même chose sans
redémarrer à la main. Variables d'environnement facultatives :
`COSMIC_HOOKS_AUTOUPDATE=0` (désactive), `COSMIC_HOOKS_BRANCH=autre-branche`.
La mise à jour est ignorée quand `pb_hooks` est celui d'une copie du dépôt
(développement local).

`cosmic.pb.js` résout aussi les flottes en vol (arrivée, combat, retour)
grâce à une tâche planifiée qui tourne chaque minute (`cronAdd`), et à
chaque action du joueur concerné.

`cosmic.pb.js` consigne aussi chaque modification faite par un
administrateur dans la collection `admin_logs` (onglet *Journal* de
l'administration). `node pocketbase/setup.mjs` active en plus une
sauvegarde automatique quotidienne (3 h UTC, 14 conservées).

Vérification : `curl -X POST https://ton-pocketbase/api/cosmic/action`
doit répondre **401** (route présente, connexion requise) et non 404.

Après toute modification des règles dans `src/game`, lance
`npm run build:hooks` et commite `cosmic_game.js` (un test échoue si le
fichier est périmé).

Remise à zéro de l'XP de tous les joueurs (ressources et bâtiments conservés) :

```bash
PB_URL=… PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… node scripts/reset-xp.mjs --dry-run
PB_URL=… PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… node scripts/reset-xp.mjs
```

## Administration du jeu

Page **Administration** (icône clé à molette dans l'en-tête, `/game/admin`),
réservée aux comptes listés dans la collection `admins` :

```bash
# promouvoir un compte existant (inscris-toi d'abord dans le jeu)
PB_URL=… PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… GAME_ADMIN_EMAILS=moi@exemple.fr node pocketbase/setup.mjs
```

(ou dans l'admin PocketBase : collection `admins` → *New record*, id = id du compte).

Ce qu'on y règle, sans toucher au code :

- **Bâtiments, unités, technologies, missions** : créer, dupliquer, modifier,
  supprimer ; images envoyées dans la collection `game_assets`. Chaque fiche
  affiche un aperçu (coûts et production par niveau, puissance par place de
  hangar, rentabilité par heure des missions). Le contenu est validé avant
  enregistrement (références cassées, doublons, cycles de prérequis).
- **Règles** : délais et boucliers JcJ, protection débutant, plafond de perte
  d'XP, taux de butin.
- **Joueurs** : XP, ressources, niveaux de bâtiments/unités/technos, vider
  des files d'attente bloquées.
- **Outils** : export/import JSON de tout le contenu, remise à zéro de l'XP.

Le contenu modifié est stocké dans `game_config` (une entrée par section ;
« Valeurs par défaut » la supprime et revient au code). Il s'applique en
direct chez tous les joueurs et **côté serveur** (combat arbitré par les
hooks). Les nouvelles *mécaniques* (nouveau type de ressource, nouvel effet
de techno ou de bâtiment) restent du code : `src/game/`.

## Migrer les données depuis Firebase

1. Console Firebase → Paramètres du projet → Comptes de service →
   « Générer une nouvelle clé privée » → enregistre le fichier sous
   `service-account.json` à la racine (ignoré par git).
2. Lance d'abord une simulation, puis la vraie migration :

   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
   export PB_URL=https://ton-pocketbase PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=…
   node scripts/migrate-firebase-to-pocketbase.mjs --dry-run
   node scripts/migrate-firebase-to-pocketbase.mjs
   ```

Comptes, profils, files d'attente, notifications, alliances et messages,
rapports et dons sont copiés. Les mots de passe Firebase ne sont pas
transférables : chaque compte reçoit un mot de passe provisoire, listé dans
`migration-output/passwords.csv` (à transmettre en privé ; ajoute
`--send-reset-emails` pour envoyer aussi un lien de réinitialisation aux
comptes qui ont un vrai email). Le script est relançable.

## Tests et intégration continue

```bash
npm run lint && npm run build && npm test     # vérifications rapides
# Intégration, contre un PocketBase de TEST (jamais la production) :
PB_TEST_URL=http://127.0.0.1:8090 PB_TEST_ADMIN_EMAIL=… PB_TEST_ADMIN_PASSWORD=… \
  npx vitest run src/services/pocketbase.integration.test.ts
# Parcours de fumée dans Chromium (client lancé avec VITE_POCKETBASE_URL de test) :
BASE_URL=http://localhost:5173 node e2e/smoke.mjs
```

GitHub Actions (`.github/workflows/ci.yml`) lance tout cela à chaque pull
request : un PocketBase vierge est démarré avec les hooks de la branche
(`COSMIC_HOOKS_AUTOUPDATE=0`), le schéma est installé, puis viennent les tests
d'intégration et le parcours de fumée (bureau et téléphone : erreurs
JavaScript, pages vides, débordement horizontal).

## Déploiement

`npm run build` produit `dist/` (SPA statique : rediriger toutes les routes
vers `index.html`, voir `vercel.json`). Renseigne `VITE_POCKETBASE_URL` dans
les variables d'environnement de l'hébergeur. Si le site est servi en
HTTPS, PocketBase doit l'être aussi (sinon le navigateur bloque les
requêtes).

## Structure

```
src/
  game/        moteur pur (TypeScript sans DOM ni réseau) : toutes les règles du jeu, testées
  server/      hooksEntry.ts : ce que le moteur expose aux hooks PocketBase
  services/    appels au serveur (routes /api/cosmic/*) et abonnements temps réel
  store/       état client (Zustand) alimenté par les abonnements
  hooks/       synchro temps réel, ressources affichées en direct, tickers
  components/  UI (primitives HUD + composants de jeu)
  pages/       une page par écran ; pages/admin/ : administration
pocketbase/    schéma, script d'installation, hooks serveur (pb_hooks/ : routes, tâches planifiées, moteur empaqueté)
changelog/     notes de version (frontmatter version, iteration, date, title)
content/blog/  billets du devblog
docs/          GDD, design system, méthode, fiches systèmes, audits, propositions, fiches de lot
scripts/       migration Firebase -> PocketBase, remise à zéro de l'XP
legacy/        ancien prototype HTML/CSS/JS (référence, non utilisé)
```

### Modèle de données PocketBase

```
users                 comptes (email, username = pseudo, name = pseudo affiché)
players/{id}          profil, ressources, bâtiments, unités, technologies, Atelier (id = id du compte)
queues/{id}           files d'attente (constructions, unités, recherches, missions)
fleets                flottes en vol (résolues par le serveur à l'arrivée et au retour)
notifications         journal d'évènements (temps réel)
battle_reports, spy_reports, resource_gifts, alliances, alliance_messages, …
game_config           contenu et règles réglés dans l'admin (lisible par tous)
```

La production est rejouée par le moteur à partir d'un horodatage (`resourcesUpdatedAtMs`) : côté serveur à chaque action et dans les
tâches planifiées, côté client pour l'affichage en direct. Les heures hors ligne sont ainsi rattrapées exactement.
