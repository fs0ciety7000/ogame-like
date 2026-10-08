# Pré-prod : test.fs0ciety.org

Serveur de test : une copie de la production, déployée par Coolify depuis la branche de travail (`claude/hiver-k-s`).
**Tout passe par là avant la production** : chaque push sur la branche redéploie la pré-prod. On y teste, on y mesure (Z1, Q2, Q18,
Q21), et seule une PR fusionnée sur `main` atteint la production (`.github/workflows/deploy.yml`).

| | Production | Pré-prod |
|:--|:--|:--|
| Adresse | `empire.fs0ciety.org` (jeu) + `base.fs0ciety.org` (API) | `test.fs0ciety.org` (jeu **et** API, un seul conteneur) |
| Code | `main`, après fusion d'une PR | branche `claude/hiver-k-s`, à chaque push |
| Construction | Vercel (front) + hooks téléchargés | `Dockerfile.preprod` : front construit + PocketBase + hooks de la branche |
| E-mails, sauvegardes S3, Google / Apple | actifs | **coupés** |

## 1. DNS

Chez le registrar ou chez Cloudflare : un enregistrement `test` qui pointe vers le serveur Coolify. C'est le même serveur que `base` :
un CNAME `test → base.fs0ciety.org` ou un A vers la même IP.

## 2. Créer l'application dans Coolify

1. **Projects** → le projet du jeu (ou un nouveau projet « Cosmic Empires — test ») → **+ New** → **Private Repository (with GitHub App)**.
   Prendre le dépôt `fs0ciety7000/ogame-like`, branche **`claude/hiver-k-s`**.
2. **Build Pack** : **Dockerfile**.
   - Base Directory : `/`.
   - Dockerfile Location : `/Dockerfile.preprod`.
3. **Network** :
   - Ports Exposes : `8090` ;
   - Domains : `https://test.fs0ciety.org`.
4. **Persistent Storage** → **+ Add** → **Volume** :
   - nom `cosmic-test-data` ;
   - Destination Path `/pb/pb_data`.

   Ne jamais monter le volume de la prod.
5. **Environment Variables** : rien d'obligatoire, l'image porte déjà les garde-fous. Facultatif : `PB_VERSION` en **Build Variable**
   pour l'aligner sur la prod (la version est affichée dans PocketBase → Settings, en bas de page ; par défaut `0.36.0`).
   Ne jamais ajouter `COSMIC_GITHUB_TOKEN` (il lancerait la copie R2 de la prod) ni `COSMIC_BLOG_HOST`.
6. **Advanced** → **Auto Deploy** activé : chaque push sur la branche reconstruit et redéploie.
7. **Deploy**. Au bout de quelques minutes, `https://test.fs0ciety.org/api/health` répond.

L'image (`Dockerfile.preprod`) fixe :
- `COSMIC_MAIL_DISABLED=1` : aucun e-mail du jeu, même juste après l'import ;
- `COSMIC_HOOKS_AUTOUPDATE=0` : les hooks viennent de la branche déployée ;
- `COSMIC_GAME_URL` et `COSMIC_PASSKEY_ORIGINS` sur `https://test.fs0ciety.org` ;
- le bandeau « Serveur de test » dans le jeu.

## 3. Premier superutilisateur

Coolify → l'application → **Terminal** :

```sh
/pb/pocketbase superuser upsert ton@email 'un-mot-de-passe-de-test' --dir /pb/pb_data
```

Le mot de passe doit être **différent de celui de la prod**.

## 4. Importer la copie de la production

1. Production : `https://base.fs0ciety.org/_/` → Settings → **Backups** → télécharger la dernière sauvegarde (ou la prendre sur R2).
2. Pré-prod : `https://test.fs0ciety.org/_/` → Settings → Backups → **Upload backup** → **Restore**. PocketBase redémarre ; si le
   conteneur s'arrête, Coolify le relance.
3. La restauration remet les comptes superutilisateurs et les réglages de la prod. Dans le Terminal, recréer tout de suite un
   superutilisateur de test :
   - le tien : commande du §3 ;
   - celui de Claude (§6), avec son propre mot de passe.

## 5. Nettoyer la copie (après chaque import)

Depuis une machine avec Node et le dépôt :

```bash
PB_URL=https://test.fs0ciety.org PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… \
  PREPROD_GAME_URL=https://test.fs0ciety.org PREPROD_KEEP_EMAILS=ton@email \
  PREPROD_CONFIRM=oui node scripts/preprod-scrub.mjs
```

Une fois l'accès donné (§6), Claude peut le lancer.

`scripts/preprod-scrub.mjs` refuse toute adresse qui n'est pas un serveur de test (`test`, `preprod`, local). Il :
- coupe les e-mails (SMTP), les sauvegardes automatiques et leur copie S3, la connexion Google / Apple ;
- remplace les e-mails des comptes par `<id>@test.invalid`, sauf `PREPROD_KEEP_EMAILS`. La connexion par pseudo et mot de passe reste possible ;
- vide les jetons de désinscription et supprime les passkeys (liées au domaine de la prod) ainsi que les messages privés.
- réécrit vers la pré-prod les adresses de la prod (`base.` et `empire.fs0ciety.org`) dans la configuration du jeu et les billets :
  les illustrations envoyées dans l'admin sont dans la sauvegarde, seule l'adresse change. Les historiques (`admin_logs`, `reports`) restent tels quels.

Illustrations : `https://test.fs0ciety.org/img` (admins du jeu), envoi des rendus Midjourney par lot ; procédure dans `docs/illustrations.md`.

Mesures (agrégats anonymes, lecture seule) : `node scripts/preprod-measure.mjs <fichier.json>`, plus le rapport du serveur
`/api/cosmic/admin/balance` ; méthode et point zéro dans `docs/audit/2026-10-07-z1-mesures.md`.

Captures d'écran d'une page (375 px et bureau, thème Constellation) : `node scripts/preprod-capture.mjs /game/codex <dossier> "Bâtiments,Technologies"`.

Après le nettoyage, ou quand Claude remet une adresse sur un compte, une session déjà ouverte avec ce compte peut être refusée
(« Accès refusé » sur `/img`, admin non reconnu) : se déconnecter, puis se reconnecter.

Si les fichiers (avatars, illustrations) sont rangés sur S3 (Settings → Files storage), donner à la pré-prod **un autre bucket** : le
script le signale.

## 6. Accès de Claude (réglages de l'environnement cloud)

Dans claude.ai/code, ouvrir le menu de l'environnement dans la barre de titre de la session, puis **Edit** :

1. **Secrets** : section **Network secrets** (« API credentials » sur une app pas à jour), sinon **Environment variables**.
   Une ligne par variable, au format `NOM=valeur` :

   | Nom | Valeur |
   |:--|:--|
   | `PREPROD_PB_URL` | `https://test.fs0ciety.org` |
   | `PREPROD_PB_ADMIN_EMAIL` | l'e-mail du superutilisateur de test créé pour Claude (§4.3) |
   | `PREPROD_PB_ADMIN_PASSWORD` | son mot de passe (propre à la pré-prod) |

2. **Network access** :
   - en niveau **Limited**, ajouter `test.fs0ciety.org` dans **Allowed domains** et laisser « Allow package managers » coché ;
   - en niveau **Custom** sur une app pas à jour, même ajout, avec la liste par défaut des gestionnaires de paquets.
3. Enregistrer. Les variables sont lues **par une nouvelle session** : en ouvrir une sur la même branche.

Jamais de secret dans le chat ni dans le dépôt.

Ce que Claude fait ensuite sur la pré-prod :
- après chaque push, vérification du déploiement (santé, version des hooks, pages clés) ;
- mesures Z1 (agrégats anonymes seulement dans les docs) ;
- essais de combats, de crons et de migrations ;
- nettoyage après import ;
- performance (6.14.39) : `node scripts/preprod-perf.mjs [--runs 3] [/game …]`, chargement à froid en profils mobile (375 px,
  processeur ×4, 4G lente) et bureau ; `PERF_SHIFTS=1` affiche les éléments qui provoquent des décalages (CLS), `PERF_LCP=1`
  l'élément retenu pour le LCP (6.14.116) ; `PERF_FRONT_URL` mesure un build local (`vite preview`) avec un PocketBase local ;
  `PERF_TRACE=1` liste chaque requête (début → fin, Ko) : le chemin critique du démarrage (6.14.152). Depuis 6.14.152, le compte
  `claude_capture` existant reçoit un jeton d'emprunt d'identité (`impersonate`, 2 h) : la mesure ne réécrit plus son mot de passe.
  Mesure locale comparable à la pré-prod : build avec `VITE_POCKETBASE_URL=http://127.0.0.1:8090` (sinon `.env.local` vise la
  production), et compte local qui a déjà vu les annonces (sinon la modale d'annonce devient l'élément du LCP) ;
- veille (6.14.39) : `node scripts/preprod-watch.mjs` en arrière-plan, toutes les 2 min, rend la main dès qu'un envoi `/img` ou une
  réponse `/decisions` arrive (CLAUDE.md, règle n° 3) ;
- documents en direct (6.14.42) : `node scripts/live-docs.mjs push|status|pull`, collection `live_docs` lue par `/decisions` et `/img`
  avant la version du build (pas de redéploiement pour une question, une feuille de route ou un prompt) ;
- essai de la lune (6.14.70) : `node scripts/preprod-essai-lune.mjs <dossier> [--sans-captures] [--garder]` joue la phalange et la porte
  de saut avec trois comptes dédiés (`claude_lune_a`, `_b`, `_c`, e-mails `@test.invalid`, mots de passe tirés au hasard et gardés nulle
  part) : alliance de test, attaque leurrée, radar, perce-brouillard, balayage, saut et refus, succès ; captures 375 et 1440 px en thème
  Constellation (Admin → Règles → Lunes par un droit d'admin temporaire) ; puis ménage (flottes rappelées, alliance dissoute, comptes
  supprimés par `account/delete`, sauf `--garder`). Une ligne « ok » ou « ÉCART » par vérification. `ESSAI_FRONT_URL` capture un Vite
  local lancé avec `VITE_POCKETBASE_URL=$PREPROD_PB_URL` (correctif d'interface vu avant le push).

Les écritures sont permises sur la pré-prod uniquement ; la production reste en lecture seule.

## 7. Rafraîchir la copie

Réimporter une sauvegarde de la prod (§4), recréer les superutilisateurs de test, puis relancer le nettoyage (§5). Le code, lui, suit
la branche tout seul (Auto Deploy).
