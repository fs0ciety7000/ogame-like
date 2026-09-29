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

Les attaques sont arbitrées par le serveur : protections (délai de 2 h par
cible, bouclier de 1 h après une défaite, protection débutant de 72 h, écart
d'XP), combat et XP sont calculés par `pocketbase/pb_hooks/cosmic.pb.js`,
jamais par le navigateur de l'attaquant.

Le dossier `pocketbase/pb_hooks/` doit se retrouver dans le dossier
`pb_hooks` du serveur PocketBase (à côté de `pb_data`) :

- **Coolify** : dans le service PocketBase → *Storages*, ajoute un volume
  monté sur `/pb/pb_hooks` (ou le chemin `pb_hooks` de ton image, voir sa
  doc), puis copies-y `cosmic.pb.js` et `cosmic_game.js` (onglet *Terminal*
  du conteneur, ou *File mount* avec le contenu des deux fichiers).
  Redémarre le service.
- Vérification : `curl -X POST https://ton-pocketbase/api/cosmic/attack`
  doit répondre **401** (route présente, connexion requise) et non 404.

`cosmic_game.js` est généré depuis `src/game` : après toute modification des
règles de jeu, lance `npm run build:hooks`, commite, et recopie le fichier
sur le serveur (un test échoue si le fichier est périmé).

Remise à zéro de l'XP de tous les joueurs (ressources et bâtiments conservés) :

```bash
PB_URL=… PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… node scripts/reset-xp.mjs --dry-run
PB_URL=… PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… node scripts/reset-xp.mjs
```

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
