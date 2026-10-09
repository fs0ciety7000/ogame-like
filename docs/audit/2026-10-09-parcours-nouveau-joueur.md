# Parcours d'un nouveau joueur : test réel sur la pré-prod (2026-10-09)

- **Serveur** : `test.fs0ciety.org`, version 6.14.159 (branche `claude/hiver-k-s`).
- **Compte** : `Testeur_Claude` (`testeur-claude@test.invalid`), créé par le bouton « Créer mon empire », comme un vrai joueur.
  L'inscription n'a demandé **aucune validation d'e-mail** : l'admin n'a rien eu à faire.
- **Appareil** : mobile 375 × 812 (thème Constellation) pendant presque tout le test. Quelques écrans vérifiés en bureau 1440 × 900.
- **Durée** : environ 62 minutes de jeu réel. Je suis revenu toutes les 2 à 4 minutes, comme un joueur qui garde l'onglet ouvert.
- **Captures** : dans le scratchpad de la session, sous `…/scratchpad/playtest/`. Les noms de fichiers sont cités dans chaque constat.
- **Hors du test** : je n'ai touché à aucun autre compte. J'ai espionné un PNJ plutôt qu'un joueur et créé ma propre alliance
  (`[TSTC]`) au lieu d'en rejoindre une. Je n'ai rien recyclé dans les champs de débris des autres joueurs.

## 1. Chronologie (minute de jeu depuis l'inscription)

| Min. | Ce qui se passe |
|:--|:--|
| 0 | Accueil clair, formulaire d'inscription en 3 champs. L'arrivée en jeu se fait en environ 8 s. |
| 0 | **Première fenêtre** : l'annonce « Mise à jour 6.14 · Ta lune veille » (phalange, porte de saut…). Son image occupe tout l'écran mobile. Viennent ensuite les 3 bulles d'histoire de Vashka. |
| 1 | « Tout réclamer · 2 » : jeton de casino et série J1. Le résumé affiché après la réclamation est clair. Prise en main, chapitre 1 : « Extracteur de ferraille niv. 3 ». |
| 1–3 | Bâtiments : le niveau 2 se termine en 20 s. Je débloque Réacteur, Nanocomposants et Archives (500 chacun). Six chantiers tournent en parallèle, c'est agréable. |
| 4–6 | Labo : l'arbre est **illisible sur mobile**. La première recherche (Analyse de matériaux) dure 30 s. |
| 9 | L'objectif « Posséder 5 drones » est **bloqué** : la recherche Drone demande 20 Acier renforcé et un nouveau compte en a 0. Le lien « Lancer la recherche → » de la carte Unités ouvre le Labo sur la mauvaise techno. Je trouve seul le comptoir de la page Ressources (100 communes donnent 1 rare). |
| 12–15 | Recherches Drone, Roquette et Frégate. Je construis 5 drones et 10 roquettes. |
| 16 | Chapitre 2 : un **raid scripté** de la Confrérie arrive (compte à rebours de 2 min). **Deux fenêtres se superposent** et l'alerte d'attaque ne répond plus au toucher. |
| 18 | Raid repoussé. **Prime de 216 000 de chaque ressource** (864 000 au total), alors que je produis environ 15 par seconde. |
| 19–21 | Je monte tout d'un coup. Première mission (Patrouille courte, 1 min). Chapitre 3. Expédition de 2 h avec 10 frégates. |
| 22–28 | Galaxie : « Espionner » n'est qu'une **icône sans libellé**. J'espionne un PNJ, ce qui valide l'objectif. Le texte de l'histoire du chapitre 3 n'arrive qu'à la minute 28. |
| 31 | Alliance créée gratuitement. Dernier objectif : « Rang Fer II ». |
| 33–55 | La **ferraille est le seul goulot** : jusqu'à 450 k de nanocomposants et 380 k de données restent sans usage. La conseil du jeu dit que les bâtiments et les recherches donnent de l'XP, mais l'XP ne bouge pas. |
| **46–51** | **Plus rien d'utile à lancer** : Labo plein (4/4), chantiers occupés ou trop chers (192 k de ferraille, soit 22 min de production), drones et roquettes partis en mission. Il ne reste qu'à attendre. |
| 55 | Fer II atteint grâce aux missions. Fin de la prise en main. Trois fenêtres d'histoire s'enchaînent (épilogue et 2 épisodes de Chroniques). Le « Carnet du commandant » (chapitre 1/5) prend la suite. |
| 57 | Classe Industriel choisie. Objectif suivant du Carnet : « Cumuler 120 niveaux de bâtiments ». J'en ai environ 40, ce qui représente plusieurs jours de jeu. |
| 62 | Arrêt du test. |

**« Plus rien à faire »** : le premier vrai creux arrive vers **46 minutes**. Il dure environ 5 minutes et ne se comble qu'en lançant des Patrouilles
courtes d'une minute en boucle. Avant ça, il y a toujours quelque chose à lancer.

**Clics des actions courantes (mobile)** :

| Action | Clics | Détail |
|:--|:--|:--|
| Améliorer un bâtiment | 2 | onglet, puis bouton, après un défilement. |
| Lancer une recherche | 4 à 6 | Labo, plein écran, glisser l'arbre, toucher le nœud minuscule, Lancer. |
| Construire 10 unités | 4 | onglet, quantité, Construire. |
| Lancer une mission | 2 | |
| Tout réclamer | 1 | |
| Espionner | 4 | Galaxie, toucher le point, icône œil, Envoyer. |
| Échanger au comptoir | 6 | |

## 2. Constats

### 🔴 Bloquant

**NJ-1. Le premier objectif d'unités est bloqué par une ressource que le joueur n'a pas.**

> **Corrigé en 6.14.161** (S1) : 20 Acier renforcé versés par l'objectif 3 (réglable), conseil et lien vers le comptoir. Fiche : `docs/changes/6.14.161-parcours-debutant.md`.

- **Ce que voit le joueur** : « Posséder 5 drones récupérateurs » (prise en main, chapitre 1). La recherche Drone coûte 20 Acier renforcé
  (« manque 20 ») et un compte neuf en a 0. Le seul indice est « Ta production n'y suffira pas : passe par le marché », mais le marché
  n'est pas dans la navigation. Le comptoir est en bas de la page Ressources.
- **Aggravant** : l'objectif du jour « Construire 20 unités » paie en Acier… qu'il faut déjà avoir pour débloquer la première unité.
- **Où** : Labo, Unités.
- **Captures** : `22-labo-drone.png`, `35-jyvais-drones.png`, `38-comptoir.png`.
- **Piste** : donner 20 à 50 Acier au départ (ou en récompense de l'objectif 3), ou retirer l'Acier du coût du Drone niveau 1. Le lien
  « passe par le marché » doit mener au comptoir.

**NJ-2. Raid scripté : deux fenêtres superposées, et l'alerte ne répond plus.**

> **Corrigé en 6.14.161** (S1) : une seule fenêtre à la fois (histoire puis alerte), alerte en fenêtre Radix. Fiche : `docs/changes/6.14.161-parcours-debutant.md`.

- **Ce que voit le joueur** : à la minute 16, l'alerte « Attaque imminente » s'affiche par-dessus la bulle d'histoire « La Confrérie attaque »,
  qui reste cachée dessous.
  - Le X, « Fuir en patrouille » et « Voir la galaxie » ne réagissent pas : la fenêtre d'histoire bloque les clics sur toute la page.
  - Le premier toucher ferme en fait l'histoire invisible, que le joueur ne lit donc jamais.
- **Où** : Accueil, alerte de raid et histoire du chapitre 2.
- **Captures** : `43-flotte-hostile.png`, `44-apres-fermeture-alerte.png`, `47-clic-voir-galaxie.png`.
- **Piste** : ne jamais ouvrir l'alerte de raid pendant une histoire. On peut la mettre en file derrière l'histoire, ou fermer l'histoire
  quand l'alerte arrive. Ajouter un test d'intégration « histoire et alerte ouvertes ensemble ».

**NJ-3. L'arbre du Labo est inutilisable sur mobile.**

- **Ce que voit le joueur** : un graphe dézoomé dont les nœuds font moins de 5 px de texte. La colonne de gauche (les technos disponibles
  au début) est **coupée hors champ**.
  - Glisser sur l'arbre hors du plein écran sélectionne le texte de la page au lieu de déplacer la carte.
  - « Plein écran » n'occupe que 360 px de haut et cache la barre de navigation.
  - Le panneau de la techno choisie (avec le bouton « Lancer ») est sous l'arbre : il faut défiler.
  - Sur bureau, les nœuds restent minuscules (environ 7 px).
- **Où** : `/game/labo`.
- **Captures** : `16-labo-full.png`, `17-labo-plein-ecran.png`, `18-labo-zoom.png`, `20-labo-pan2.png`, `d02-labo.png`.
- **Piste** : ajouter sur mobile une **vue liste** par catégorie (Fondations, Économie…) avec l'état « disponible / manque X » et un bouton
  « Lancer » par ligne. Garder le graphe en option.

### 🟠 Gênant

**NJ-4. La prime du raid d'initiation casse l'économie.**

- **Ce que voit le joueur** : à la minute 18, il reçoit 216 000 de chaque ressource. Il produit 15/s, ce qui fait environ 4 h de production
  par ressource. Les objectifs du Carnet versent ensuite 300 k puis 2 M.
- **Conséquence** : toute la progression de la première heure (« Disponible dans ~38 min » pour l'Entrepôt…) disparaît d'un coup.
  Le rythme des coûts n'a plus de sens.
- **Où** : prime de défense contre une faction.
- **Captures** : `50-apres-raid.png`, `51-journal-apres-raid.png`.
- **Piste** : plafonner la prime du raid d'initiation (par exemple 2 à 3 k par ressource, ou 30 min de production). Vérifier la formule de la
  prime pour un compte de moins de 1 h. À passer en proposition chiffrée avant de changer quoi que ce soit.

**NJ-5. La ferraille est le seul goulot, et deux ressources ne servent à rien.**

- **Ce que voit le joueur** : vers 40 min, 450 k de nanocomposants et 380 k de données s'accumulent, alors que chaque bâtiment demande
  70 à 230 k de ferraille.
- **Seule issue** : passer par le comptoir (données → rare → ferraille, environ 48 % de pertes en 2 échanges). Rien ne la suggère.
- **Où** : Bâtiments, Ressources.
- **Captures** : `37-ressources.png`, `27-entrepot.png`.
- **Piste** : mettre des données et des nanos dans les coûts des bâtiments de production, ou ajouter un échange commune ↔ commune au comptoir.
  À défaut, afficher un conseil « Échange ton surplus » quand une ressource dépasse 5 fois le coût du prochain chantier.

**NJ-6. Le conseil sur l'XP est faux.**

> **Corrigé en 6.14.161** (S1) : texte corrigé, lien vers les Missions. Fiche : `docs/changes/6.14.161-parcours-debutant.md`.

- **Ce que voit le joueur** : l'objectif « Atteindre le rang Fer II » dit « L'XP vient des combats, des bâtiments, des recherches et des
  missions ». Pourtant, des dizaines de niveaux de bâtiments et de recherches ne lui ont rapporté aucune XP : il est resté à 213 XP de la
  minute 20 à la minute 42.
- **Où** : prise en main, objectif 10, dans `src/game/onboarding.ts`.
- **Capture** : `79-xp-jour.png`.
- **Piste** : corriger le texte, par exemple « L'XP vient des missions, des primes, des combats et des succès ». Proposer un lien direct vers une
  mission qui donne de l'XP.

**NJ-7. La barre de ressources est tronquée sur mobile.**

- **Ce que voit le joueur** : dès qu'un stock dépasse 100 k, il lit « 150,… », « 240,… », « 42,1… ». La dernière ressource rare est coupée au
  bord droit. Les 4 ressources rares n'ont qu'une icône, sans nom ni info-bulle au toucher. La barre défile hors de l'écran avec la page
  (pas d'en-tête collant).
- **Où** : en-tête, sur toutes les pages.
- **Captures** : `62-galaxie-haut.png`, `75-accueil-part0.png`, `24-unites.png`.
- **Piste** : utiliser le format compact (« 150 k », « 1,2 M ») sans ellipse. Ouvrir une bulle avec le nom au toucher d'une icône.

**NJ-8. Le lien « Lancer la recherche → » d'une unité verrouillée mène à la mauvaise techno.**

> **Corrigé en 6.14.161** (S1) : `?tech=<id>`, techno sélectionnée et cadrée. Fiche : `docs/changes/6.14.161-parcours-debutant.md`.

- **Ce que voit le joueur** : sur la carte Drone récupérateur, le lien ouvre le Labo avec « Analyse de matériaux » sélectionnée, pas « Drone
  récupérateur ».
- **Où** : Unités vers Labo.
- **Capture** : `36-labo-depuis-unite.png`.
- **Piste** : passer l'identifiant de la techno dans l'URL et la sélectionner (et la centrer) à l'arrivée.

**NJ-9. « Espionner » est une icône sans texte.**

- **Ce que voit le joueur** : l'objectif dit « Envoie une sonde depuis la Galaxie ». Sur la fiche d'un joueur, il ne voit qu'un gros
  « ATTAQUER » et trois icônes (radar, œil, cadeau), sans libellé et sans info-bulle au toucher.
  - Le formulaire « Attaquer » dit « Aucun rapport d'espionnage : espionne la cible » mais ne propose pas de le faire.
  - Le formulaire « Envoyer une flotte » liste 14 types de vaisseaux, dont 11 à « Possédés : 0 ».
- **Où** : Galaxie.
- **Captures** : `64-panneau-joueur-icones.png`, `57-attaquer-dialog.png`.
- **Piste** : mettre un bouton texte « Espionner » à côté d'« Attaquer » tant que le joueur n'a pas fait son premier espionnage, et un lien
  « Espionner d'abord » dans le formulaire d'attaque. Masquer les vaisseaux non possédés.

**NJ-10. Le premier écran est une annonce hors sujet, et trop de fenêtres s'enchaînent.**

> **Corrigé en 6.14.161** (S1) : annonce marquée vue pour un compte de moins de 24 h, image bornée sur mobile ; reste : fenêtres d'histoire en fin de prise en main (S4). Fiche : `docs/changes/6.14.161-parcours-debutant.md`.

- **Ce que voit le joueur** :
  - Le premier écran après l'inscription est l'annonce de la 6.14 (lune, phalange, porte de saut, garnisons d'alliance) : du jargon de
    joueur avancé. Son image remplit tout l'écran mobile et le texte n'apparaît qu'en défilant.
  - Suivent 3 bulles d'histoire.
  - En fin de prise en main, 3 fenêtres d'histoire de suite (épilogue et 2 épisodes de Chroniques).
  - L'histoire du chapitre 3 s'est affichée 7 minutes après le début du chapitre, au milieu d'une autre action.
- **Où** : Accueil.
- **Captures** : `03-apres-inscription.png`, `05-accueil-jeu.png`, `68-histoire-ch3.png`.
- **Piste** : ne montrer aucune annonce de mise à jour à un compte créé après sa date (les marquer comme vues à l'inscription). Une seule fenêtre
  d'histoire à la fois, avec des Chroniques différées au lendemain pour un compte de moins de 24 h.

**NJ-11. La pré-prod redémarre en pleine partie.**

- **Ce que voit le joueur** : pendant le test, le serveur a renvoyé « 502 Bad Gateway » pendant 1 à 2 min, au moins 2 fois (déploiements
  pendant les pushs). Côté jeu, « Tout réclamer » ne fait rien et aucun message n'apparaît.
- **Contexte** : sur la pré-prod, c'est normal. En production, la même absence de message laisserait le joueur cliquer dans le vide.
- **Où** : toutes les pages.
- **Piste** : afficher un bandeau « Connexion perdue, nouvel essai… » quand l'API répond 5xx ou que le temps réel tombe, et désactiver les
  boutons d'action le temps du retour.

### 🟡 Confort

- **NJ-12. « Tout réclamer » ne voit pas toujours l'objectif prêt.**
  - **Ce que voit le joueur** : la carte de prise en main affiche « RÉCLAMER », mais la pastille « Tout réclamer » est absente ou ne le compte
    pas (3 fois, aux minutes 16, 28 et 55).
  - **Capture** : `67-obj-reclamer.png`.
  - **Piste** : rafraîchir `pendingClaims` dès qu'un objectif de prise en main est rempli.
- **NJ-13. « J'y vais » arrive en haut de la page.**
  - **Ce que voit le joueur** : il atterrit en haut de la page Bâtiments, au-dessus de la « File planifiée », et non sur la carte de
    l'extracteur visé.
  - **Capture** : `11-jyvais.png`.
  - **Piste** : faire défiler jusqu'à la carte ciblée et la mettre en évidence.
- **NJ-14. Le contenu commence bas sur l'écran.**
  - **Ce que voit le joueur** :
    - Sur mobile, le contenu de chaque page commence vers 370 px sur 812. Avant lui viennent : le bandeau défilant (doublé), « +1 bandeau »,
      l'en-tête sur 2 rangées, le titre, le sous-titre et l'astuce.
    - Sur bureau, les cartes des Bâtiments commencent à 770 px sur 900.
  - **Captures** : `tour-passe.png`, `d03-batiments.png`.
  - **Piste** : réduire l'en-tête une fois la page défilée. Ne montrer l'astuce qu'à la première visite.
- **NJ-15. La recherche terminée reste affichée « Temps restant : 0s ».**
  - **Ce que voit le joueur** : le panneau reste à « 0s » 10 à 40 s avant de passer au niveau suivant.
  - **Piste** : afficher « Finalisation… » à 0 s.
- **NJ-16. On ne peut pas mettre en file une recherche dont un prérequis est déjà en cours.**
  - **Ce que voit le joueur** : la file a 4 places, mais une recherche reste grisée tant que son prérequis n'est pas fini.
  - **Piste** : accepter une recherche si son prérequis est déjà dans la file.
- **NJ-17. Le Labo disparaît de la barre du bas quand la Galaxie s'ouvre.**
  - **Ce que voit le joueur** : le Labo, utilisé toutes les 2 minutes, passe dans « Plus ».
  - **Piste** : garder le Labo et mettre la Galaxie dans « Plus », ou laisser le joueur épingler ses onglets.
- **NJ-18. Les Nouveautés sont des notes de développeur.** **Corrigé en 6.14.161** (S1) : pas de pastille le premier jour, notes d'avant l'inscription jamais « nouvelles », notes `audience: equipe` cachées, lignes coupées réparées.
  - **Ce que voit le joueur** : la pastille affiche « 9+ » dès la première minute. Les notes sont techniques (« 10 Ko de moins au
    démarrage »).
  - Les paragraphes sont cassés par les retours à la ligne du Markdown (« une mission se / termine »).
  - **Capture** : `60-nouveautes.png`.
  - **Piste** : marquer comme lues les notes antérieures à l'inscription. Réparer le rendu des lignes coupées.
- **NJ-19. Il reste des fautes dans les textes.**
  - **Ce que voit le joueur** :
    - « Meilleure série : 1 jours » (Ordres du jour) ;
    - « Mutateur de Octobre », « Passe de Octobre 2026 » ;
    - « Forces de Le Silencieux » (rapport de combat) ;
    - « Nouveau : Simulateur… Elle est maintenant dans ton menu » (Journal) ;
    - le bouton « Communications » coupé en « COMMUNICATIO / NS » dans le menu Plus ;
    - les libellés anglais « Zoom In / Zoom Out / Fit View » sur l'arbre du Labo.
  - **Captures** : `28-plus.png`, `29-ordres.png`.
- **NJ-20. Le comptoir accepte un échange qui ne donne rien.**
  - **Ce que voit le joueur** : avec la quantité par défaut (100), « Tu recevras 0 » s'affiche (« brut 1 · taxe 1 »), mais le bouton
    « Échanger » reste actif.
  - **Piste** : mettre par défaut la quantité qui donne au moins 1, et désactiver le bouton à 0.
- **NJ-21. Le panneau « Boss » de l'accueil est vide.**
  - **Ce que voit le joueur** : un cadre titré « Boss » sans aucun contenu en bas de l'accueil.
  - **Capture** : `75-accueil-part2.png`.
- **NJ-22. Les cartes d'alliance se chevauchent sur mobile.**
  - **Ce que voit le joueur** : le bouton « Rejoindre » chevauche le compteur de membres (« 4/10 » à moitié caché).
  - **Capture** : `70-fonder.png`.
- **NJ-23. Le texte d'espionnage est trop mathématique.**
  - **Ce que voit le joueur** : « Score = ton Espionnage − son contre-espionnage + log₂(sondes) », sans traduction pour un débutant.
  - **Capture** : `66-espionner-dialog.png`.
  - **Piste** : écrire « Plus tu envoies de sondes, plus le rapport est complet : 4 sondes pour voir sa flotte ».
- **NJ-24. Deux protections de débutant semblent se contredire.**
  - **Ce que voit le joueur** : « Les débutants sont protégés 3 h » (Classement), alors que la page Ressources parle de « chiffres après le
    mardi 13 octobre ».
  - **Piste** : une seule phrase, au même endroit : « Protégé jusqu'au … ».

## 3. Ce qui marche bien

- **Inscription en 3 champs, sans e-mail à valider**, et arrivée en jeu en quelques secondes. La connexion par pseudo fonctionne. L'annonce
  déjà vue ne réapparaît pas sur un autre appareil.
- **Les premières minutes sont rapides** (niveaux 2 à 4 en quelques secondes, 6 chantiers en parallèle). On a toujours quelque chose à faire
  pendant 45 minutes.
- **Une prise en main racontée** (Vashka, Varan) : 3 chapitres, 10 objectifs, des « J'y vais » qui mènent à la bonne page (sauf NJ-8).
  Le **raid scripté** fait monter la tension avec un compte à rebours, une estimation « Tes défenses tiennent » et un rapport de combat animé.
- **Le Carnet du commandant prend aussitôt la suite** de la prise en main : pas de vide à la fin du tutoriel.
- **« Tout réclamer » et les petits messages de résultat** sont clairs. On ressent bien chaque gain.
- **La file planifiée** (« Programmer ») et le message « Les unités d'une même catégorie se construisent l'une après l'autre » sont bien
  expliqués.
- **La palette de recherche** (loupe) trouve une unité ou une techno et dit ce qui manque.
- **Aucun débordement horizontal** sur les 12 pages visitées à 375 px.
- La version bureau est lisible et bien rangée, avec la barre latérale, les ressources nommées et la carte de la galaxie à côté du panneau
  de la cible.

## 4. Mon ressenti de joueur

Je continuerais, mais surtout grâce à l'histoire et au raid de la minute 16, le meilleur moment du test. Trois choses m'auraient fait
décrocher :

- le **blocage sur l'Acier à la minute 9** (NJ-1). Sans fouiller la page Ressources, je reste bloqué ;
- l'**alerte de raid qui ne répond plus** (NJ-2). On croit à un bug juste au moment le plus tendu ;
- le **Labo sur téléphone** (NJ-3). Chaque recherche devient une corvée.

La prime de 864 k m'a d'abord ravi, puis tout a perdu sa valeur : plus rien n'a de prix pendant 20 minutes. Ensuite, on attend la ferraille
avec des centaines de milliers de ressources inutiles. L'écran est dense : beaucoup de pastilles (« 9+ » en permanence), de bandeaux et
de fenêtres pour quelqu'un qui débute.

## 5. Top 5 avant la mise en production

1. **NJ-2** : empêcher l'alerte de raid et une fenêtre d'histoire de s'ouvrir en même temps (l'alerte ne répond plus). Petite correction,
   gros effet.
2. **NJ-1** : débloquer le premier vaisseau sans ressource rare (Acier donné au départ, ou retiré du coût du Drone niveau 1). Faire mener
   « passe par le marché » au comptoir.
3. **NJ-3** : ajouter une vue liste au Labo sur mobile, avec le bouton « Lancer » par ligne.
4. **NJ-4** : plafonner la prime du raid d'initiation et vérifier les récompenses du Carnet (300 k, 2 M) pour un compte de moins d'une heure.
   Passer par une proposition chiffrée.
5. **NJ-10, NJ-18 et NJ-6** : ne montrer ni l'annonce 6.14 ni les Nouveautés antérieures à un compte neuf, et corriger le conseil sur l'XP.
