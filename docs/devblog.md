# Devblog : devblog.fs0ciety.org

Le devblog est fait main, sans WordPress ni Ghost.

- **Pages publiques** : rendues directement par PocketBase, le serveur du jeu. On obtient ainsi de vrais aperçus Discord, le référencement, un flux RSS et aucun serveur de plus à maintenir.
- **Rédaction** : elle se fait dans le jeu, page `/game/redaction`, avec la connexion du jeu.

## Mise en ligne du sous-domaine (une seule fois)

1. **DNS** : ajouter un enregistrement `CNAME devblog → base.fs0ciety.org`. Un `A` vers la même IP que PocketBase convient aussi. Si le domaine passe par Cloudflare, laisser le proxy activé ou non, comme pour `base`.
2. **Coolify** : dans la ressource **PocketBase**, onglet *Domains* → **Add Domain** : `https://devblog.fs0ciety.org`, **Internal port 8080** (le même que `base.fs0ciety.org` : c'est le même serveur), redirection HTTP → HTTPS activée.
   Sur les anciennes versions de Coolify, ajouter le domaine à la suite de l'existant dans le champ *Domains*, séparé par une virgule : `https://base.fs0ciety.org,https://devblog.fs0ciety.org`.
   Enregistrer, puis **Redeploy** : Traefik obtient le certificat HTTPS tout seul.
3. **Variables d'environnement** de PocketBase (facultatives, Coolify → *Environment Variables*) :

   | Variable | Défaut | Rôle |
   |---|---|---|
   | `COSMIC_BLOG_HOST` | `devblog.fs0ciety.org` | Domaine qui affiche le blog à la racine |
   | `COSMIC_GAME_URL` | `appURL` des réglages PocketBase, sinon `https://empire.fs0ciety.org` | Adresse du jeu : logo, emojis, bouton « Jouer » |

4. **Front du jeu** (facultatif) : `VITE_BLOG_URL=https://devblog.fs0ciety.org` (c'est la valeur par défaut). Les liens « Devblog » et l'espace rédaction s'en servent.

Avant que le DNS soit en place, le blog est déjà visible sur `https://base.fs0ciety.org/blog/`.

Le reste se déploie avec le pipeline existant. À chaque fusion sur `main`, le serveur importe le schéma (collections `blog_posts` et `blog_authors`) et met à jour les hooks.

## Auteurs

- Au démarrage, PocketBase ajoute **Nicotine** et **Tartiflex** aux auteurs si ces comptes existent.
- Il crée aussi un **article de bienvenue en brouillon** : à relire, puis à publier.
- Les **administrateurs du jeu** peuvent toujours écrire. Depuis l'espace rédaction, ils ajoutent ou retirent des auteurs (carte « Auteurs »).
- Chaque auteur règle son **profil d'auteur** : rôle, présentation, et l'avatar, repris du jeu en un clic.

Le bouton crayon de l'en-tête du jeu mène à l'espace rédaction. Il n'apparaît que pour les auteurs et les administrateurs.

## Écrire

| Syntaxe | Rendu |
|---|---|
| `## Titre`, `### Sous-titre` | Sections, avec ancre et entrée de sommaire |
| `**gras**`, `*italique*`, `~~barré~~`, `==surligné==`, `` `code` ``, `[[Ctrl]]` | Mise en forme |
| `[texte](https://…)`, `<https://…>` | Liens (ceux vers l'extérieur s'ouvrent dans un nouvel onglet) |
| `![légende](url "titre")` seule sur sa ligne | Figure avec légende |
| `- puce`, `1. numéro`, `- [x] fait` | Listes, imbriquées avec deux espaces |
| `> [!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!DANGER]`, `[!LORE]` | Encadrés colorés (le texte après la balise devient le titre) |
| tableaux `\| a \| b \|` puis `\|:--\|--:\|` | Tableaux alignés |
| ` ```js ` … ` ``` ` | Code coloré (js, ts, json, bash, http, css…) avec bouton Copier |
| ` ```api ` | Carte de route de l'API (voir ci-dessous) |
| `:::spoiler Titre` … `:::` | Bloc repliable |
| `:::grid` … `:::` | Galerie d'images |
| `:varan:`, `:rocket:` | Emojis du jeu, de l'équipe, et raccourcis courants |

Les images se collent ou se glissent directement dans le texte : elles sont envoyées, puis insérées. Toutes les images d'un article sont dans sa médiathèque, sous l'éditeur.

### Bloc API

````
```api
GET /api/cosmic/blog/posts?limite=3
Description en une phrase (markdown en ligne accepté).
```
````

- Une route `GET` publique reçoit un bouton **Essayer la route**. L'appel part du navigateur du lecteur et la réponse JSON s'affiche sous la carte.
- `auth: player` ou `auth: admin` : la carte est affichée, sans bouton d'essai.
- `body:` suivi de JSON : un exemple de corps de requête.

### Publication

- **Brouillon** : visible seulement par la rédaction.
- **Publier maintenant** : visible tout de suite, dans le flux RSS et dans `/api/cosmic/blog/posts`.
- **Programmer** : l'article apparaît tout seul à la date choisie.
- **Épingler** : l'article passe en vedette sur l'accueil.
- **Reprendre une version du journal** : pré-remplit l'article à partir d'une entrée du changelog.

## Adresses

| Adresse | Contenu |
|---|---|
| `/` | Accueil (article épinglé en vedette, 9 par page) |
| `/p/{slug}` | Article |
| `/c/{catégorie}` | `annonces`, `mises-a-jour`, `notes`, `coulisses`, `equilibrage`, `evenements` |
| `/t/{tag}` | Articles d'un tag |
| `/recherche?q=…` | Recherche |
| `/rss.xml` (ou `/feed`) | Flux RSS (texte complet) |
| `/sitemap.xml`, `/robots.txt` | Référencement |
| `/api/cosmic/blog/posts?limite=10&categorie=annonces` | Derniers articles en JSON (bots Discord, page de connexion du jeu) |

Sans le sous-domaine, toutes ces adresses existent aussi sous `/blog/…`.

## Icônes des catégories

Chaque catégorie cherche son icône dans `public/assets/blog/<id>.webp`, sur le blog comme dans le jeu. Tant que le fichier manque, c'est l'emoji qui s'affiche. Les prompts Midjourney sont dans `docs/prompts-5.8.md`.
