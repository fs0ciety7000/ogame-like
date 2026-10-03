# Connexion : passkeys, Google et Apple

Trois façons de se connecter s'ajoutent au pseudo / mot de passe :

- **Passkey** (empreinte, Face ID, code du téléphone, clé de sécurité). Elle s'ajoute dans **Réglages → Méthodes de connexion**, puis on clique sur « Se connecter avec une passkey » sur la page de connexion.
- **Google** et **Apple**, via l'OAuth2 intégré à PocketBase. Les boutons n'apparaissent que pour les fournisseurs activés dans le tableau de bord.

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
3. Dans l'écran de consentement, ajouter les champs d'application `email` et `profile`. Passer l'application en production pour que tout le monde puisse se connecter.
4. Dans PocketBase (`https://base.fs0ciety.org/_/`) → collection **users** → ⚙ → **OAuth2** :
   1. Activer OAuth2.
   2. Ajouter **Google** et coller le Client ID et le Client secret.
   3. Laisser le *field mapping* vide. Le pseudo est choisi dans le jeu, il ne doit pas venir du nom Google.

## Apple

Il faut un compte Apple Developer, qui est payant.

1. Dans [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) → **Identifiers** :
   1. Vérifier que l'App ID a la capacité *Sign in with Apple*.
   2. Créer un **Services ID**, par exemple `org.fs0ciety.empire.web`. C'est le *Client ID*.
2. Sur le Services ID → *Sign in with Apple* → **Configure** :
   - Domaine : `base.fs0ciety.org`.
   - Return URL : `https://base.fs0ciety.org/api/oauth2-redirect`.
3. **Keys** → créer une clé avec *Sign in with Apple*, puis télécharger le fichier `.p8`. Noter le *Key ID* et le *Team ID*.
4. Dans PocketBase → collection **users** → **OAuth2** → ajouter **Apple** :
   1. Client ID : le Services ID.
   2. Client secret : bouton **Generate secret**, en renseignant le Team ID, le Key ID, le contenu du `.p8` et une durée de 6 mois au maximum.
   3. **Ce secret expire.** Il faut le régénérer avant l'échéance, sinon la connexion Apple s'arrête.

Apple peut masquer l'adresse du joueur avec un relais `@privaterelay.appleid.com`. Le compte fonctionne normalement, et les e-mails du jeu passent par ce relais.

## Comportement côté joueur

- **Nouveau joueur Google ou Apple**
  - Le compte est créé sans pseudo. Le jeu affiche « Choisis ton pseudo » avant de créer l'empire (route `POST /api/cosmic/account/pseudo`, utilisable une seule fois).
  - Tant que le pseudo n'est pas choisi, `/api/cosmic/init` refuse de créer l'empire.
- **Joueur existant**
  - Si l'adresse e-mail Google ou Apple est celle de son compte, PocketBase rattache automatiquement le fournisseur au compte existant.
  - Sinon, il peut lier le fournisseur depuis **Réglages → Méthodes de connexion → Lier**. Le jeu refuse si ce compte Google ou Apple appartient déjà à un autre empire.
- **Délier** un fournisseur se fait depuis les mêmes réglages. Le mot de passe et les passkeys restent valables.
