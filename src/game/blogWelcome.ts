/* v5.8 : premier article du devblog, créé en brouillon au premier
   démarrage (relu et publié par l'équipe). Il montre aussi tout ce que
   l'éditeur sait faire. */

export const BLOG_WELCOME = {
  slug: "bienvenue-sur-le-devblog",
  title: "Bienvenue sur le devblog",
  excerpt: "Le journal de bord de l'équipe : annonces, mises à jour, coulisses du développement et petites notes du staff.",
  category: "annonces",
  tags: ["devblog", "communaute"],
  version: "5.8",
  body: `Salut à toutes et à tous, commandants ! :varan:

Cosmic Empires a désormais son **journal de bord**. C'est ici que l'équipe publiera les annonces, le détail de chaque mise à jour, les coulisses du développement et quelques petites notes en passant.

## Ce que vous trouverez ici

| Catégorie | Pour quoi faire |
|:--|:--|
| 📣 Annonces | Nouvelles saisons, événements, grands rendez-vous |
| 🛠️ Mises à jour | Le détail de chaque version, avec les chiffres |
| 📝 Notes du staff | Conseils, coups de cœur, réponses à vos questions |
| 🔭 Coulisses | Comment le jeu est fabriqué, outils et API |
| ⚖️ Équilibrage | Les raisons derrière chaque changement de chiffres |
| 🎉 Événements | Week-ends, boss de saison, défis |

> [!TIP] Suivre le blog
> Le flux RSS est en bas de chaque page. Il se branche sur Discord, sur un lecteur de flux ou sur votre application préférée.

## Un blog qui parle le langage du jeu

Les articles s'écrivent en markdown, avec quelques extras :

- les **emojis du jeu** : :gravhorn: :silencieux: :ysgrim: ;
- des encadrés pour les notes, les avertissements et les extraits des archives ;
- des tableaux, des galeries d'images et des blocs repliables ;
- [x] des listes de tâches pour suivre les chantiers ;
- [ ] et bien d'autres choses à venir.

> [!LORE] Extrait des archives du Chœur
> « Les empires ne tombent pas au combat. Ils tombent quand plus personne ne raconte leur histoire. »

### Des routes de l'API, en direct

Pour les curieux et les créateurs d'outils, certains articles présenteront l'API du jeu. Les routes publiques peuvent être testées directement depuis la page :

\`\`\`api
GET /api/cosmic/blog/posts?limite=3
Les trois derniers articles du devblog, en JSON. Parfait pour un bot Discord.
\`\`\`

\`\`\`api
GET /api/health
L'état du serveur du jeu.
\`\`\`

Les routes réservées aux joueurs connectés sont présentées sans bouton d'essai :

\`\`\`api
POST /api/cosmic/action
auth: player
Toutes les actions de jeu (construire, rechercher, échanger…) passent par cette route, vérifiées par le serveur.
body:
{ "type": "trade", "sellId": "scrap", "buyId": "energy", "amount": 1000 }
\`\`\`

Et les exemples de code sont colorés :

\`\`\`js
const res = await fetch("/api/cosmic/blog/posts?categorie=mises-a-jour");
const { posts } = await res.json();
console.log(posts[0].title); // le dernier patch
\`\`\`

:::spoiler Un secret pour les plus curieux
Le Léviathan n'a pas dit son dernier mot. 🐙
:::

## Et maintenant ?

Le premier vrai article arrive bientôt : le récapitulatif de tout ce qui a changé depuis la 4.9. D'ici là, retournez défendre vos colonies. On se retrouve dans le secteur ! :salute:

— L'équipe Cosmic Empires`,
};
