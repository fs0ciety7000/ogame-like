---
slug: comment-le-jeu-ecrit-ses-chapitres
title: "Coulisses : comment le jeu écrit ses chapitres"
excerpt: "Chaque mois, un nouveau chapitre des Chroniques s'écrit à partir de ce que vous avez fait. Antagoniste, épisodes, difficulté, récompenses : on ouvre le moteur."
category: coulisses
tags: [chroniques, generateur, formules, api]
version: "5.4"
cover: /assets/chronicles/2027-03-boss.webp
---
Depuis la 5.4, les Chroniques ne s'arrêtent plus. Quand l'équipe n'a pas écrit le chapitre du mois, **le jeu l'écrit lui-même**, à partir de vos parties. Voici comment. :gear:

## Ce que le serveur regarde

Chaque jour, le serveur fait le point sur le mois écoulé. Pour chaque type d'action (missions, combats, raids repoussés, contrats, colonies…), il calcule :

- l'**activité médiane** des joueurs actifs ;
- le **total** du secteur ;
- le **joueur le plus actif**.

C'est ce qui permet au chapitre de vous **citer** : « Le mois dernier, Tartiflex a gagné 40 combats… » Oui, vous êtes dans l'histoire. :eyes:

## Ce qu'il écrit

Un chapitre généré contient :

1. un **antagoniste** et son **boss de saison** ;
2. un **prologue** ;
3. **quatre épisodes** construits comme un scénario : menace, traque, rebondissement, assaut final ;
4. des **objectifs** réglés sur ce que les joueurs font vraiment.

:::grid
![Octobre](/assets/chronicles/2026-10-sceau.webp)
![Novembre](/assets/chronicles/2026-11-sceau.webp)
![Décembre](/assets/chronicles/2026-12-sceau.webp)
![Janvier](/assets/chronicles/2027-01-sceau.webp)
:::

## Une difficulté qui s'ajuste

Si la plupart d'entre vous ont fini les épisodes du mois précédent, les objectifs montent. Si peu y sont arrivés, ils baissent.

| Réussite du mois précédent | Coefficient des objectifs |
|:--|--:|
| Très faible | jusqu'à ×0,7 |
| Normale | ×1 |
| Très forte | jusqu'à ×1,4 |

> [!NOTE] Pas de jugement hâtif
> Un épisode ne compte dans ce calcul qu'après **5 jours** d'ouverture. Un départ lent ne fait pas chuter la difficulté.

## Ce que ça rapporte

- Chaque épisode : **40 points de passe**, plus de l'Ambre, une capsule, des heures de production ou un Dossier d'entraînement.
- Le chapitre complet : un **titre** propre au chapitre, une **bannière** de profil, une **relique** (rare, ou épique si le chapitre était difficile) et **30 Ambre**.
- Le **Codex** gagne le dossier du boss et les archives du mois.

> [!IMPORTANT] L'équipe garde la main
> Un mois écrit à la main n'est **jamais remplacé**. Tout chapitre généré reste modifiable : prologue, titre de fin, objectifs.

## Toutes les formules, à découvert

Même philosophie pour la page **Formules** (menu *Progression*) : production, stockage, énergie, combat, butin, protections, raids, missions, passe… Chaque section montre la formule **et ton propre calcul**, avec tes chiffres. Une version publique existe aussi sur `/formules`, lisible sans compte.

## Pour les bricoleurs : l'API du devblog

Ce blog expose ses articles en JSON. Essaie, la réponse s'affiche juste en dessous :

```api
GET /api/cosmic/blog/posts?categorie=coulisses&limite=5
Les derniers articles « Coulisses », en JSON : titre, résumé, catégorie, tags, date et lien.
```

De quoi brancher un bot Discord en quelques lignes :

```js
const res = await fetch("https://devblog.fs0ciety.org/api/cosmic/blog/posts?limite=1");
const { posts } = await res.json();
const last = posts[0];
console.log(`📣 ${last.title} : ${last.url}`);
```

:::spoiler Le flux RSS, pour les plus pressés
Chaque page du blog a son flux : <https://devblog.fs0ciety.org/rss.xml>. La plupart des bots Discord savent le lire sans une ligne de code.
:::

Prochain épisode des coulisses : comment on mesure l'équilibrage, jour après jour. :chart:
