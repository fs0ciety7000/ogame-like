# Cosmic Empires

Un 4X spatial temps réel : bâtiments, unités, laboratoire de recherche,
missions, combats entre joueurs — synchronisé en direct sur tous tes
appareils.

Réécriture complète du prototype HTML/CSS/JS d'origine (conservé dans
`legacy/` pour référence) vers une stack moderne :

- **React 18 + TypeScript + Vite** — SPA rapide, typée de bout en bout.
- **Tailwind CSS v4 + Radix UI + Framer Motion** — interface sombre façon
  sci‑fi, accessible, animée.
- **Firebase Auth + Firestore** — connexion par pseudo, données en temps
  réel (`onSnapshot`), transactions atomiques pour chaque action de jeu.
  100 % compatible avec le plan gratuit **Spark** (aucune Cloud Function
  requise : toute la logique de jeu tourne côté client, comme dans le jeu
  original, mais avec une production hors‑ligne rattrapée automatiquement).
- **Zustand** — état client léger, alimenté par les abonnements Firestore.
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
cp .env.example .env.local   # renseigne ta config Firebase (voir ci-dessous)
npm run dev
```

Sans configuration Firebase, l'application démarre quand même et affiche un
bandeau d'avertissement sur l'écran de connexion.

## Configurer Firebase (gratuit)

1. Crée un projet sur <https://console.firebase.google.com> (plan **Spark**,
   gratuit).
2. Active **Authentication → Email/mot de passe**.
3. Active **Firestore Database** (mode production).
4. Dans les paramètres du projet → Vos applications, ajoute une application
   Web et copie sa config dans `.env.local`.
5. Déploie les règles de sécurité et l'index nécessaire :

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add            # sélectionne ton projet
   firebase deploy --only firestore:rules,firestore:indexes
   ```

## Déploiement (Firebase Hosting, gratuit)

```bash
npm run build
firebase deploy --only hosting
```

`firebase.json` sert le dossier `dist/` avec un rewrite SPA (`index.html`)
et un cache long sur `assets/`.

## Structure

```
src/
  game/        formules pures du jeu (bâtiments, unités, recherche, combat…)
  services/    accès Firestore (transactions, abonnements temps réel)
  store/       état client (Zustand) alimenté par les abonnements
  hooks/       synchro temps réel, ressources affichées en direct, tickers
  components/  UI (primitives + composants de jeu)
  pages/       une page par écran du jeu
legacy/        ancien prototype HTML/CSS/JS (référence, non utilisé)
```

### Modèle de données Firestore

```
players/{uid}                    profil, ressources, bâtiments, unités, techs
players/{uid}/meta/queues        files d'attente (constructions/unités/recherches/missions)
players/{uid}/notifications/{id} journal d'évènements (temps réel)
battle_reports/{id}              rapports de combat (créés par l'attaquant,
                                  traités et notifiés au défenseur en direct)
usernames/{pseudo}               réservation pseudo -> email, pour résoudre la
                                  connexion et le mot de passe oublié (Firebase
                                  Auth ne connaît que des emails) — lecture par
                                  id seul, jamais de liste consultable en masse
```

### Mot de passe oublié

Les comptes créés **avant** l'ajout de cette fonctionnalité utilisent un
email technique interne (non joignable) : ils n'ont pas de mot de passe
oublié tant qu'ils n'ont pas été recréés. C'est un choix assumé — changer
l'email Firebase Auth d'un compte existant nécessite une confirmation par
lien (asynchrone, parfois sur un autre appareil) qu'on ne peut pas fiabiliser
sans backend, donc plutôt que de risquer de bloquer l'accès à un compte, la
fonctionnalité ne s'applique qu'aux nouvelles inscriptions (email réel
demandé dès la création). Ces joueurs peuvent toujours changer leur mot de
passe depuis Réglages tant qu'ils restent connectés.

Toute la logique (production, files, combat) est rejouée côté client à
partir d'un horodatage (`resourcesUpdatedAtMs`) à chaque action et à
intervalle régulier (~20s), ce qui permet un rattrapage correct de la
progression pendant les périodes hors‑ligne, sans dépasser les quotas
gratuits Firestore.
