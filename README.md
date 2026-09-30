# Cosmic Empires

Un 4X spatial temps réel : bâtiments, unités, laboratoire de recherche,
missions, combats entre joueurs — synchronisé en direct sur tous tes
appareils.

Réécriture complète du prototype HTML/CSS/JS d'origine (conservé dans
`legacy/` pour référence) vers une stack moderne :

- **React 18 + TypeScript + Vite** — SPA rapide, typée de bout en bout.
- **Tailwind CSS v4 + Radix UI + Framer Motion** — interface sombre façon
  sci‑fi, accessible, animée.
- **PocketBase** — comptes (connexion par pseudo ou email), base de
  données et temps réel (SSE), auto‑hébergé. Toute la logique de jeu tourne
  côté client, avec une production hors‑ligne rattrapée automatiquement ;
  les règles d'accès PocketBase limitent chaque joueur à ses propres
  données.
- **Zustand** — état client léger, alimenté par les abonnements temps réel.
- **sonner** — toasts, **cloche de notifications** — journal d'évènements
  persistant (constructions, recherches, missions, combats) alimenté en
  temps réel.

## Fonctionnalités

- Connexion / inscription par pseudo, avec un vrai email de récupération
  (mot de passe oublié fonctionnel) et une page Réglages (changer de mot de
  passe, supprimer son compte).
- Ressources (communes + rares), production continue même hors‑ligne,
  comptoir d'échange.
- Bâtiments à niveaux, coûts/temps échelonnés, déblocages.
- Unités (file de production par catégorie, capacité liée aux hangars,
  vente).
- Laboratoire : arbre de technologies à prérequis, jusqu'à 4 recherches en
  parallèle.
- Missions chronométrées avec récompenses.
- Classement des joueurs en temps réel, espionnage, attaques avec rapport
  de combat détaillé — livré instantanément au défenseur, même si son
  onglet était fermé au moment de l'attaque.
- Rangs, statistiques de victoires/défaites, temps de jeu.
- Suite de tests (Vitest) sur toute la logique de jeu — `npm run test`.
- Code-splitting par page + animations (compteurs de ressources, transitions,
  célébration de montée de rang).

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

## Déploiement

`npm run build` produit `dist/` (SPA statique : rediriger toutes les routes
vers `index.html`, voir `vercel.json`). Renseigne `VITE_POCKETBASE_URL` dans
les variables d'environnement de l'hébergeur. Si le site est servi en
HTTPS, PocketBase doit l'être aussi (sinon le navigateur bloque les
requêtes).

## Structure

```
src/
  game/        formules pures du jeu (bâtiments, unités, recherche, combat…)
  services/    accès PocketBase (actions de jeu, abonnements temps réel)
  store/       état client (Zustand) alimenté par les abonnements
  hooks/       synchro temps réel, ressources affichées en direct, tickers
  components/  UI (primitives + composants de jeu)
  pages/       une page par écran du jeu
pocketbase/    schéma (pb_schema.json), script d'installation, hooks serveur (pb_hooks/)
scripts/       migration Firebase -> PocketBase, remise à zéro de l'XP
src/server/    point d'entrée de la logique compilée pour les hooks
src/pages/admin/ interface d'administration (éditeurs de contenu, joueurs, outils)
legacy/        ancien prototype HTML/CSS/JS (référence, non utilisé)
```

### Modèle de données PocketBase

```
users                 comptes (email, username = pseudo, name = pseudo affiché)
players/{id}          profil, ressources, bâtiments, unités, techs (id = id du compte)
queues/{id}           files d'attente (constructions/unités/recherches/missions)
notifications         journal d'évènements (temps réel)
battle_reports        rapports de combat (créés par l'attaquant, traités une
                      seule fois par le défenseur)
spy_reports, resource_gifts, alliances, alliance_messages
```

Toute la logique (production, files, combat) est rejouée côté client à
partir d'un horodatage (`resourcesUpdatedAtMs`) à chaque action et à
intervalle régulier (~20s), ce qui permet un rattrapage correct de la
progression pendant les périodes hors‑ligne.
