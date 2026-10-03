# Connexion : passkeys et Google

Deux façons de se connecter s'ajoutent au pseudo / mot de passe :

- **Passkey** (empreinte, Face ID, code du téléphone, clé de sécurité). Elle s'ajoute dans **Réglages → Méthodes de connexion**, puis on clique sur « Se connecter avec une passkey » sur la page de connexion.
- **Google**, via l'OAuth2 intégré à PocketBase. Le bouton n'apparaît que si Google est activé dans le tableau de bord.

## Passkeys

Rien à configurer chez un tiers. Le serveur de jeu (hooks PocketBase) vérifie lui-même les signatures (ES256 et RS256, attestation « none »).

- **Collection `passkeys`**
  - Elle est créée par `node pocketbase/setup.mjs`. Il faut relancer ce script après le déploiement.
  - Un joueur ne voit et ne supprime que ses propres passkeys. La création et le renommage passent par les routes du jeu.
- **Origines autorisées**
  - Elles se règlent avec la variable d'environnement `COSMIC_PASSKEY_ORIGINS` du conteneur PocketBase : une liste séparée par des virgules, par exemple `https://empire.fs0ciety.org`.
  - Sans elle, le serveur prend `COSMIC_GAME_URL`, sinon l'URL de l'application PocketBase, sinon `https://empire.fs0ciety.org`.
- **Domaine des passkeys**
  - Une passkey est liée au nom de domaine de l'origine (`empire.fs0ciety.org`). Si le jeu change un jour de domaine, les passkeys existantes ne fonctionneront plus sur le nouveau : les joueurs devront en recréer une.
  - En local, il faut ouvrir le jeu sur `http://localhost:<port>` et non sur `127.0.0.1`, car WebAuthn exige un nom de domaine.
- **Limites** : 10 passkeys par compte. Un défi est valable 5 minutes et ne sert qu'une fois.

## Google

1. Dans [Google Cloud Console](https://console.cloud.google.com/) → *API et services* → *Identifiants* → **Créer un ID client OAuth** (type « Application Web »).
2. **URI de redirection autorisé** : `https://base.fs0ciety.org/api/oauth2-redirect`.
3. Dans l'écran de consentement (*Branding*) :
   - Page d'accueil : `https://empire.fs0ciety.org`.
   - Politique de confidentialité : `https://empire.fs0ciety.org/confidentialite.html`.
   - Domaines autorisés : `fs0ciety.org`.
   - Champs d'application : `email` et `profile`, puis passer l'application en production.
4. **Prouver que le domaine t'appartient**. Sans cette étape, Google refuse avec « Le site Web correspondant à l'URL de votre page d'accueil n'est pas enregistré à votre nom ».
   1. Ouvrir [Google Search Console](https://search.google.com/search-console) **avec le même compte Google** que la Cloud Console.
   2. Ajouter une propriété **Domaine** `fs0ciety.org`. Cela couvre aussi `empire.` et `base.`.
   3. Copier l'enregistrement TXT proposé (`google-site-verification=…`) et l'ajouter dans la zone DNS de `fs0ciety.org`, chez le registrar ou chez Cloudflare.
   4. Cliquer sur **Valider** dans Search Console. La propagation DNS prend de quelques minutes à quelques heures.
   5. Attendre 24 h, puis relancer la vérification de la marque dans la Cloud Console.
   - Autre méthode : une propriété « Préfixe d'URL » `https://empire.fs0ciety.org` vérifiée par un fichier HTML. Il faut alors m'envoyer le fichier `google….html` pour que je le place dans `public/`.
5. Dans PocketBase (`https://base.fs0ciety.org/_/`) → collection **users** → ⚙ → **OAuth2** :
   1. Activer OAuth2.
   2. Ajouter **Google** et coller le Client ID et le Client secret.
   3. Laisser le *field mapping* vide. Le pseudo est choisi dans le jeu, il ne doit pas venir du nom Google.

## Comportement côté joueur

- **Nouveau joueur Google**
  - Le compte est créé sans pseudo. Le jeu affiche « Choisis ton pseudo » avant de créer l'empire (route `POST /api/cosmic/account/pseudo`, utilisable une seule fois).
  - Tant que le pseudo n'est pas choisi, `/api/cosmic/init` refuse de créer l'empire.
- **Joueur existant**
  - Si l'adresse e-mail Google est celle de son compte, PocketBase rattache automatiquement le fournisseur au compte existant.
  - Sinon, il peut lier le fournisseur depuis **Réglages → Méthodes de connexion → Lier**. Le jeu refuse si ce compte Google appartient déjà à un autre empire.
- **Délier** un fournisseur se fait depuis les mêmes réglages. Le mot de passe et les passkeys restent valables.
