# Pré-prod : test.fs0ciety.org

Serveur de test : une copie de la production, pour tester une branche avant de la fusionner et pour lire des chiffres réels
(Q12 : mesures Z1, cibles d'équilibre Q2, Q18, Q21). Rien de ce qui s'y passe ne touche la production.

| | Production | Pré-prod |
|:--|:--|:--|
| Jeu (front) | `empire.fs0ciety.org` | `test.fs0ciety.org` |
| PocketBase | `base.fs0ciety.org` | `base-test.fs0ciety.org` |
| Hooks | branche `main` | branche de travail (`claude/…`) |
| E-mails, sauvegardes S3, Google / Apple | actifs | **coupés** |

## 1. PocketBase de test (Coolify)

1. **DNS** : `base-test` (CNAME vers le serveur Coolify, comme `base`).
2. **Coolify** : nouvelle ressource PocketBase (même image que la prod), **volume `pb_data` à part** (jamais celui de la prod),
   domaine `https://base-test.fs0ciety.org`.
3. **Variables d'environnement** :

   | Variable | Valeur | Pourquoi |
   |:--|:--|:--|
   | `COSMIC_MAIL_DISABLED` | `1` | aucun e-mail aux vrais joueurs, même avant le nettoyage (§3) |
   | `COSMIC_HOOKS_BRANCH` | `claude/hiver-k-s` (la branche à tester) | « Mettre à jour les hooks » prend cette branche |
   | `COSMIC_GAME_URL` | `https://test.fs0ciety.org` | liens du serveur vers le jeu de test |
   | `COSMIC_PASSKEY_ORIGINS` | `https://test.fs0ciety.org` | passkeys liées au domaine de test |
   | `COSMIC_GITHUB_TOKEN` | **ne pas mettre** | sinon le bouton « Copie vers R2 » lancerait la copie de la prod |
   | `COSMIC_BLOG_HOST` | **ne pas mettre** | le devblog reste celui de la prod |

4. Démarrer, créer le compte superutilisateur de test (mot de passe différent de la prod).

## 2. Importer la copie de la production

1. Production : `https://base.fs0ciety.org/_/` → Settings → **Backups** → télécharger la dernière sauvegarde (ou la prendre sur R2).
2. Pré-prod : `https://base-test.fs0ciety.org/_/` → Settings → Backups → **Upload backup** → **Restore**.
   La restauration remet aussi les réglages de la prod (SMTP, sauvegardes S3, Google / Apple) : `COSMIC_MAIL_DISABLED=1` bloque les
   e-mails du jeu en attendant le §3. Le superutilisateur redevient celui de la prod : le changer tout de suite.

## 3. Nettoyer la copie (une fois après chaque import)

```bash
PB_URL=https://base-test.fs0ciety.org PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… \
  PREPROD_GAME_URL=https://test.fs0ciety.org PREPROD_KEEP_EMAILS=ton@email \
  PREPROD_CONFIRM=oui node scripts/preprod-scrub.mjs
```

`scripts/preprod-scrub.mjs` refuse toute adresse qui n'est pas un serveur de test (`test`, `preprod`, local). Il :

- coupe les e-mails, les sauvegardes automatiques et leur copie S3, la connexion Google / Apple ;
- remplace les e-mails des comptes par `<id>@test.invalid`, sauf `PREPROD_KEEP_EMAILS`. La connexion par pseudo et mot de passe reste possible ;
- vide les jetons de désinscription et supprime les passkeys (liées au domaine de la prod) ainsi que les messages privés.

Si les fichiers (avatars, illustrations) sont sur S3 (Settings → Files storage), donner à la pré-prod **un autre bucket** : le script
le signale.

## 4. Front de test (Vercel)

Même projet Vercel que la prod :

1. Domaine `test.fs0ciety.org` rattaché à la branche à tester (Settings → Domains → Git branch).
2. Variables **Preview** de cette branche :
   - `VITE_POCKETBASE_URL=https://base-test.fs0ciety.org` ;
   - `VITE_SERVER_LABEL=Serveur de test`, qui affiche un bandeau en haut du jeu.
3. Redéployer, puis sur la pré-prod : Admin → bouton **Mettre à jour les hooks** (en tête de page). Les nouveaux champs se créent au démarrage.

## 5. Accès pour Claude (lecture et essais sur la pré-prod)

- **Secrets** : dans les réglages de l'environnement cloud, et jamais dans le dépôt ni dans le chat. Ajouter
  `PREPROD_PB_URL`, `PREPROD_PB_ADMIN_EMAIL` et `PREPROD_PB_ADMIN_PASSWORD`, avec un superutilisateur **propre à la pré-prod**.
- **Réseau** : autoriser `base-test.fs0ciety.org` et `test.fs0ciety.org` dans l'accès réseau de l'environnement.
- **Ce que Claude y fait** :
  - lire les agrégats : santé de l'équilibre, passe, boss, commerce ;
  - lancer les mesures Z1 ;
  - tester une branche en vrai : combats, crons, migrations.
- **Écritures** : permises sur la pré-prod uniquement. La production reste en lecture seule et n'est jamais une cible des scripts.
- **Données** : seuls des agrégats anonymes entrent dans les docs. Aucun extrait par joueur, aucun e-mail.

## 6. Rafraîchir

Pour repartir d'une copie fraîche : réimporter une sauvegarde de la prod (§2), relancer le nettoyage (§3), puis mettre à jour les hooks.
