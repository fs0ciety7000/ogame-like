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

> **Corrigé en 6.14.162** (S2) : vue **liste** du Labo, par défaut sous 768 px, bascule « Liste / Arbre » gardée par appareil ; technos
> rangées par état (en cours, disponibles, verrouillées avec le prérequis manquant en clair, terminées repliées), bouton « Rechercher »
> par ligne, fiche dépliable, `?tech=<id>` ouvre la ligne ; dans l'arbre, glisser ne sélectionne plus le texte. Reste : l'arbre lui-même
> garde ses nœuds de 7 px sur bureau et son plein écran mobile (la liste est l'outil du téléphone). Fiche : `docs/changes/6.14.162-labo-mobile.md`.

### 🟠 Gênant

**NJ-4. La prime du raid d'initiation casse l'économie.**

> **Corrigé en 6.14.163** (S3) : prime du raid d'initiation en minutes de production réparties comme les coûts (30 / 15 / 5 / 5 min au lieu
> de 4 h de chaque : 49 500 au lieu de 864 000 à 15/s) ; Carnet plafonné à 60 min de production par ressource commune. Proposition :
> `docs/proposals/recompenses-du-depart.md` ; fiche : `docs/changes/6.14.163-recompenses-du-depart.md`.

- **Ce que voit le joueur** : à la minute 18, il reçoit 216 000 de chaque ressource. Il produit 15/s, ce qui fait environ 4 h de production
  par ressource. Les objectifs du Carnet versent ensuite 300 k puis 2 M.
- **Conséquence** : toute la progression de la première heure (« Disponible dans ~38 min » pour l'Entrepôt…) disparaît d'un coup.
  Le rythme des coûts n'a plus de sens.
- **Où** : prime de défense contre une faction.
- **Captures** : `50-apres-raid.png`, `51-journal-apres-raid.png`.
- **Piste** : plafonner la prime du raid d'initiation (par exemple 2 à 3 k par ressource, ou 30 min de production). Vérifier la formule de la
  prime pour un compte de moins de 1 h. À passer en proposition chiffrée avant de changer quoi que ce soit.

**NJ-5. La ferraille est le seul goulot, et deux ressources ne servent à rien.**

> **En partie corrigé en 6.14.163** (S3) : la prime du raid d'initiation (216 000 de nano et de données) faisait presque tout le surplus ;
> elle suit désormais les coûts (5 min de nano et de données). Reste le surplus dû à la production égale des quatre extracteurs : lot RR-2
> (échange au comptoir ou conseil « surplus », Q410), à mesurer au parcours S5. Fiche : `docs/changes/6.14.163-recompenses-du-depart.md`.

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

> **Corrigé en 6.14.164** (S4) : stocks en 3 chiffres au plus (« 150 k », « 1,23 M », `formatHud`), icône de 20 px sur téléphone ; chaque ressource,
> rare comprise, ouvre son infobulle (nom, stock, débit) au toucher (`TapTooltip`). **Reporté** : en-tête collant (il prendrait encore
> plus de hauteur, voir NJ-14 : à traiter avec la refonte de l'en-tête). Fiche : `docs/changes/6.14.164-confort-debutant.md`.

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

> **Corrigé en 6.14.164** (S4) : bouton « Espionner » en toutes lettres (joueur et colonie) ; « Espionner d'abord → » dans la fenêtre
> d'attaque sans rapport assez détaillé (Galaxie, Joueurs, Seigneurs) ; seuls les vaisseaux possédés y sont listés. Fiche : `docs/changes/6.14.164-confort-debutant.md`.

- **Ce que voit le joueur** : l'objectif dit « Envoie une sonde depuis la Galaxie ». Sur la fiche d'un joueur, il ne voit qu'un gros
  « ATTAQUER » et trois icônes (radar, œil, cadeau), sans libellé et sans info-bulle au toucher.
  - Le formulaire « Attaquer » dit « Aucun rapport d'espionnage : espionne la cible » mais ne propose pas de le faire.
  - Le formulaire « Envoyer une flotte » liste 14 types de vaisseaux, dont 11 à « Possédés : 0 ».
- **Où** : Galaxie.
- **Captures** : `64-panneau-joueur-icones.png`, `57-attaquer-dialog.png`.
- **Piste** : mettre un bouton texte « Espionner » à côté d'« Attaquer » tant que le joueur n'a pas fait son premier espionnage, et un lien
  « Espionner d'abord » dans le formulaire d'attaque. Masquer les vaisseaux non possédés.

**NJ-10. Le premier écran est une annonce hors sujet, et trop de fenêtres s'enchaînent.**

> **Corrigé en 6.14.161** (S1) : annonce marquée vue pour un compte de moins de 24 h, image bornée sur mobile. Fiche : `docs/changes/6.14.161-parcours-debutant.md`.
> **Reste corrigé en 6.14.164** (S4) : aucun épisode des Chroniques pour un compte de moins de 24 h (`newcomerNews.quietHours`), et 10 min
> au moins entre une histoire fermée et un épisode ou une scène de coalition (`newcomerNews.storyGapMinutes`) ; le rapport de combat
> prend aussi la place unique des grandes fenêtres. L'histoire du chapitre 3 « 7 min après » : pas reproduite (elle attend la fin d'une
> autre fenêtre, comme voulu). Fiche : `docs/changes/6.14.164-confort-debutant.md`.

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

> **Corrigé en 6.14.164** (S4) : bandeau « Serveur en cours de mise à jour, nouvelle tentative… » dès qu'une réponse est 502, 504, 503
> sans message du jeu ou sans réponse ; nouvel essai toutes les 5 s, « Serveur de retour » ensuite ; une action qui échoue le dit
> (« rien n'a été fait, réessaie dans quelques secondes ») et ne part plus à l'équipe comme une erreur. **Reporté** : désactiver tous
> les boutons pendant la coupure (chaque bouton gère son état ; le message suffit à ne plus cliquer dans le vide). Fiche : `docs/changes/6.14.164-confort-debutant.md`.

- **Ce que voit le joueur** : pendant le test, le serveur a renvoyé « 502 Bad Gateway » pendant 1 à 2 min, au moins 2 fois (déploiements
  pendant les pushs). Côté jeu, « Tout réclamer » ne fait rien et aucun message n'apparaît.
- **Contexte** : sur la pré-prod, c'est normal. En production, la même absence de message laisserait le joueur cliquer dans le vide.
- **Où** : toutes les pages.
- **Piste** : afficher un bandeau « Connexion perdue, nouvel essai… » quand l'API répond 5xx ou que le temps réel tombe, et désactiver les
  boutons d'action le temps du retour.

### 🟡 Confort

- **NJ-12. « Tout réclamer » ne voit pas toujours l'objectif prêt.** **Expliqué en 6.14.164** (S4), sans changement : « Tout réclamer » n'apparaît qu'à partir de **2** récompenses prêtes (5.11) ; un seul objectif prêt se réclame sur sa carte. Même calcul des deux côtés (`pendingClaims`).
  - **Ce que voit le joueur** : la carte de prise en main affiche « RÉCLAMER », mais la pastille « Tout réclamer » est absente ou ne le compte
    pas (3 fois, aux minutes 16, 28 et 55).
  - **Capture** : `67-obj-reclamer.png`.
  - **Piste** : rafraîchir `pendingClaims` dès qu'un objectif de prise en main est rempli.
- **NJ-13. « J'y vais » arrive en haut de la page.** **Corrigé en 6.14.164** (S4) : `?focus=<id>` ; la carte visée défile au centre et s'éclaire 2,5 s (Bâtiments, Unités, onglet Défenses pour les roquettes).
  - **Ce que voit le joueur** : il atterrit en haut de la page Bâtiments, au-dessus de la « File planifiée », et non sur la carte de
    l'extracteur visé.
  - **Capture** : `11-jyvais.png`.
  - **Piste** : faire défiler jusqu'à la carte ciblée et la mettre en évidence.
- **NJ-14. Le contenu commence bas sur l'écran.** **Reporté** (S4) : réduire l'en-tête au défilement et l'astuce de page touchent toute la mise en page (refonte de l'en-tête, avec l'en-tête collant de NJ-7) ; l'astuce se ferme déjà d'un toucher (« Tout masquer »).
  - **Ce que voit le joueur** :
    - Sur mobile, le contenu de chaque page commence vers 370 px sur 812. Avant lui viennent : le bandeau défilant (doublé), « +1 bandeau »,
      l'en-tête sur 2 rangées, le titre, le sous-titre et l'astuce.
    - Sur bureau, les cartes des Bâtiments commencent à 770 px sur 900.
  - **Captures** : `tour-passe.png`, `d03-batiments.png`.
  - **Piste** : réduire l'en-tête une fois la page défilée. Ne montrer l'astuce qu'à la première visite.
- **NJ-15. La recherche terminée reste affichée « Temps restant : 0s ».** **Corrigé en 6.14.164** (S4) : « Finalisation… » à 0 s (fiche et liste du Labo) et synchro demandée 1 s après la fin d'une recherche ou d'un bâtiment (avant : battement de 20 s).
  - **Ce que voit le joueur** : le panneau reste à « 0s » 10 à 40 s avant de passer au niveau suivant.
  - **Piste** : afficher « Finalisation… » à 0 s.
- **NJ-16. On ne peut pas mettre en file une recherche dont un prérequis est déjà en cours.** **Reporté** (S4) : accepter une recherche dont le prérequis est dans la file change la règle du serveur (validation des prérequis, file, annulation en chaîne) : pas une petite correction.
  - **Ce que voit le joueur** : la file a 4 places, mais une recherche reste grisée tant que son prérequis n'est pas fini.
  - **Piste** : accepter une recherche si son prérequis est déjà dans la file.
- **NJ-17. Le Labo disparaît de la barre du bas quand la Galaxie s'ouvre.** **Reporté** (S4) : les onglets par défaut viennent d'une décision (Q90, 6.14.64) ; le joueur peut déjà épingler le Labo (« Épingler » du menu Plus). Question proposée dans la fiche.
  - **Ce que voit le joueur** : le Labo, utilisé toutes les 2 minutes, passe dans « Plus ».
  - **Piste** : garder le Labo et mettre la Galaxie dans « Plus », ou laisser le joueur épingler ses onglets.
- **NJ-18. Les Nouveautés sont des notes de développeur.** **Corrigé en 6.14.161** (S1) : pas de pastille le premier jour, notes d'avant l'inscription jamais « nouvelles », notes `audience: equipe` cachées, lignes coupées réparées.
  - **Ce que voit le joueur** : la pastille affiche « 9+ » dès la première minute. Les notes sont techniques (« 10 Ko de moins au
    démarrage »).
  - Les paragraphes sont cassés par les retours à la ligne du Markdown (« une mission se / termine »).
  - **Capture** : `60-nouveautes.png`.
  - **Piste** : marquer comme lues les notes antérieures à l'inscription. Réparer le rendu des lignes coupées.
- **NJ-19. Il reste des fautes dans les textes.** **Corrigé en 6.14.164** (S4) : « 1 jour », « Mutateur d'octobre », « Passe d'octobre 2026 », « Forces du Silencieux » (`frDe`), « Cette page est maintenant dans ton menu », « COMMUNI-CATIONS » (césure à la syllabe), boutons de l'arbre en français.
  - **Ce que voit le joueur** :
    - « Meilleure série : 1 jours » (Ordres du jour) ;
    - « Mutateur de Octobre », « Passe de Octobre 2026 » ;
    - « Forces de Le Silencieux » (rapport de combat) ;
    - « Nouveau : Simulateur… Elle est maintenant dans ton menu » (Journal) ;
    - le bouton « Communications » coupé en « COMMUNICATIO / NS » dans le menu Plus ;
    - les libellés anglais « Zoom In / Zoom Out / Fit View » sur l'arbre du Labo.
  - **Captures** : `28-plus.png`, `29-ordres.png`.
- **NJ-20. Le comptoir accepte un échange qui ne donne rien.** **Corrigé en 6.14.164** (S4) : la quantité monte au minimum qui rapporte 1 à chaque paire choisie, avec « Mettre ce minimum » ; le bouton était déjà grisé à 0.
  - **Ce que voit le joueur** : avec la quantité par défaut (100), « Tu recevras 0 » s'affiche (« brut 1 · taxe 1 »), mais le bouton
    « Échanger » reste actif.
  - **Piste** : mettre par défaut la quantité qui donne au moins 1, et désactiver le bouton à 0.
- **NJ-21. Le panneau « Boss » de l'accueil est vide.** **Corrigé en 6.14.164** (S4) : le cadre « Boss » n'est plus affiché sans boss à montrer.
  - **Ce que voit le joueur** : un cadre titré « Boss » sans aucun contenu en bas de l'accueil.
  - **Capture** : `75-accueil-part2.png`.
- **NJ-22. Les cartes d'alliance se chevauchent sur mobile.** **Corrigé en 6.14.164** (S4) : la jauge des membres se partage la place (au plus 9 rem), le compteur ne passe plus sous le bouton.
  - **Ce que voit le joueur** : le bouton « Rejoindre » chevauche le compteur de membres (« 4/10 » à moitié caché).
  - **Capture** : `70-fonder.png`.
- **NJ-23. Le texte d'espionnage est trop mathématique.** **Corrigé en 6.14.164** (S4) : règle en mots (« 1 sonde pour ses ressources, 4 pour sa flotte… à niveau égal ; chaque niveau d'avance divise par 2 »), formule dans « Le calcul ».
  - **Ce que voit le joueur** : « Score = ton Espionnage − son contre-espionnage + log₂(sondes) », sans traduction pour un débutant.
  - **Capture** : `66-espionner-dialog.png`.
  - **Piste** : écrire « Plus tu envoies de sondes, plus le rapport est complet : 4 sondes pour voir sa flotte ».
- **NJ-24. Deux protections de débutant semblent se contredire.** **Corrigé en 6.14.164** (S4) : « Protégé jusqu'au … » (date de fin, tant que tu n'attaques pas) dans « Ce que tu risques » ; la date du bas y est celle de la règle de l'entrepôt, dite comme telle ; l'astuce des Joueurs renvoie à cette carte.
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
3. **NJ-3** : ajouter une vue liste au Labo sur mobile, avec le bouton « Lancer » par ligne. **Fait en 6.14.162.**
4. **NJ-4** : plafonner la prime du raid d'initiation et vérifier les récompenses du Carnet (300 k, 2 M) pour un compte de moins d'une heure.
   Passer par une proposition chiffrée. *Fait en 6.14.163 (S3).*
5. **NJ-10, NJ-18 et NJ-6** : ne montrer ni l'annonce 6.14 ni les Nouveautés antérieures à un compte neuf, et corriger le conseil sur l'XP.

## Second passage (6.14.164)

- **Serveur** : `test.fs0ciety.org`, version 6.14.164 en ligne à 10:53 UTC (6.14.163 au départ du test, 2 min d'attente).
- **Compte** : `Testeur_Claude2` (`testeur-claude2@test.invalid`), créé par « Créer mon empire » à 10:53:10 UTC. Mobile 375 × 812, thème
  Constellation. Aucun autre compte touché : espionnage d'un Seigneur PNJ (Zhar'Kesh), alliance `[TSC2]` fondée seul.
- **Durée** : 45 min de jeu (10:53 → 11:38), joué par un script Playwright qui repasse toutes les 30 à 60 s : il réclame, lance tout ce
  qui est payable (bâtiments, Labo, missions), lit les fenêtres. Il joue donc **plus vite qu'un humain** : les minutes ci-dessous sont un
  plancher. Captures dans le scratchpad de la session, sous `…/scratchpad/pt2/`.
- **Coupure** : aucune pendant le test ; le bandeau « Serveur en cours de mise à jour » (NJ-11) n'a pas pu être vu.

### Chronologie

| Min. | Ce qui se passe |
|:--|:--|
| 0 | Pas d'annonce : le premier écran est la bulle d'histoire de Vashka (1/3). « Tout réclamer · 2 ». |
| 1 | « J'y vais » ouvre Bâtiments **centré sur l'extracteur de ferraille**, carte éclairée. |
| 2 | Labo en **liste** par défaut, « Rechercher » sur chaque ligne, aucun défilement horizontal. |
| 3 | Objectif 3 réclamé : **+20 Acier renforcé**. Recherche Drone lancée aussitôt. |
| 10 | 5 drones. Chapitre 2 (histoire de 3 bulles). Première Patrouille courte. |
| 15 | **Raid scripté** : l'histoire d'Orsk Varan d'abord, puis l'alerte « Attaque imminente » (1:58), qui se ferme normalement. Passe : palier 1 atteint. |
| 17 | Raid repoussé (1 874 contre 397). Prime : **76 200** (52 200 / 14 400 / 4 800 / 4 800) à 29/s de ferraille. |
| 18–24 | L'**énergie** bloque l'objectif « Entrepôt niveau 2 » (10 000 d'énergie ; stock de 495 à la minute 20). |
| 24 | Espionnage du PNJ par le bouton « Espionner ». « Tout réclamer » paie le **palier 1 du passe** : 921 600 de ressources (voir NJ-25). |
| 27 | Alliance fondée. |
| 29 | Rang Fer II, fin de la prise en main (au premier passage : minute 55). Le Carnet prend la suite, sans pluie de fenêtres. |
| 32 | Classe Industriel. Objectif suivant du Carnet : « Cumuler 120 niveaux de bâtiments » (38 / 220 à la minute 45). |
| **33–45** | **Plus rien à lancer** : Labo plein (4/4, 4 à 6 min par recherche), chantiers sur des minuteries de 6 à 20 min, extracteur de ferraille niveau 8 à 191 900 de ferraille. Il ne reste que la Patrouille courte en boucle. |

**« Plus rien à faire »** : vers la **33e minute** (premier passage : 46e). Le départ est plus rapide (Acier donné, Fer II à 29 min) et le
script dépense tout dès que c'est payable : un joueur humain y arrivera sans doute vers 40 min. Le creux dure ensuite jusqu'à la fin du test.

### Vérification des corrections

| Constat | Correction | Verdict | Ce que j'ai vu |
|:--|:--|:--|:--|
| NJ-1 | S1 | **Tient** | +20 Acier renforcé à l'objectif 3 (minute 3), recherche Drone lancée sans détour, 5 drones à la minute 10. Le conseil cite l'objectif 3 et le comptoir. |
| NJ-2 | S1 | **Tient** | Histoire du chapitre 2 d'abord, puis l'alerte, jamais les deux ensemble. L'alerte se ferme. |
| NJ-3 | S2 | **Tient** | Liste par défaut à 375 px (disponibles, verrouillées avec « Il manque : … (tu as 0) »), bouton par ligne, `scrollWidth` 375. |
| NJ-4 | S3 | **Tient pour le raid et le Carnet** | Raid : 30 / 15 / 5 / 5 min de production (76 200 à 29/s, conforme à la formule). Carnet : « 208,8 k » affiché, soit 60 min à 58/s. **Mais le passe verse 2 h de production à la minute 24 : NJ-25.** |
| NJ-5 | S3 (en partie) | **Ne tient pas** (attendu : RR-2) | Nanocomposants et données s'accumulent toujours sans usage : voir NJ-26 et les stocks. |
| NJ-6 | S1 | **Tient** | « L'XP vient des missions, des combats, des primes… Bâtiments et recherches n'en donnent pas. » |
| NJ-7 | S4 | **Tient en partie** | Chiffres compacts (« 7,35 k », « 309 k ») et infobulle au toucher (nom, stock, débit, plein dans, bonus) sur chaque ressource, rares comprises. **Mais** la rangée des rares déborde : NJ-28. |
| NJ-9 | S4 | **Tient** | « Espionner » en toutes lettres (Seigneurs), « Espionner d'abord → » dans la fenêtre d'attaque, seuls les vaisseaux possédés listés. |
| NJ-10 | S1 + S4 | **Tient** | Aucune annonce au premier écran ; à la fin de la prise en main, pas d'enchaînement de fenêtres. |
| NJ-13 | S4 | **Tient** | `?focus=extracteur_ferraille` : carte au centre, cadre éclairé. |
| NJ-17 | reporté | Inchangé | Galaxie remplace le Labo dans la barre du bas dès la minute 8. |
| NJ-19 | S4 | **Tient en partie** | « Forces du Silencieux » corrigé, mais le titre du rapport dit encore « Attaque de Le Silencieux » : NJ-29. |
| NJ-20 | S4 | **Tient** | Le comptoir propose d'emblée la quantité qui rapporte 1. |
| NJ-23 | S4 | **Tient** | Règle en mots (1 / 4 / 16 / 64 sondes), formule repliée dans « Le calcul ». |
| NJ-8, NJ-11, NJ-12, NJ-15, NJ-18, NJ-21, NJ-22, NJ-24 | S1, S4 | Non revus | Pas rencontrés dans le parcours joué, ou pas observables sans coupure du serveur. |

### Nouveaux constats

**🟠 NJ-25. Le palier 1 du passe verse 2 h de production à la 24e minute.**

- **État** : Corrigé en 6.14.165 (S6) : toute récompense en heures d'un compte de moins de 24 h vaut au plus 60 min de production, le reste va à la réserve du départ.

- **Ce que voit le joueur** : le palier 1 du passe est atteint à la 15e minute. « Tout réclamer » le paie avec un objectif de prise en main :
  **388 800 ferraille, 208 800 énergie, 208 800 nanocomposants, 115 200 données** (921 600 au total) et 30 modules. Les stocks passent de
  ~20 k à ~400 k d'un coup.
- **Conséquence** : c'est le même saut que NJ-4, par une autre porte. La cible de S3 (« une récompense de la première heure vaut 10 à
  60 minutes de production ») n'est pas tenue : le palier dit « 2 h de production » et la proposition `recompenses-du-depart.md` comptait le
  passe parmi les récompenses de 60 min au plus.
- **Où** : `/game/passe`, palier 1 (puis 3 h au palier 4, 4 h au palier 7…).
- **Piste** : appliquer au passe le plafond `guideCapMinutes` du Carnet pour un compte de moins de 24 h, ou mesurer ses paliers de production
  sur la production de référence du départ. À chiffrer dans la proposition avant de changer.

**🟠 NJ-26. Le surplus de nanocomposants et de données reste entier (RR-2, Q410).**

- **État** : Corrigé en 6.14.165 (S6, RR-2) : comptoir commune ↔ commune affiché (1 pour 1, réglable), conseil « Échange ton surplus » les 3 premiers jours.

- **Ce que voit le joueur** : à 45 min, 309 k de nanocomposants et 205 k de données dorment, alors que la ferraille est à 13 k et que
  l'extracteur de ferraille niveau 8 demande 191 900 de ferraille et 121 300 d'énergie. Aucun conseil ne parle du surplus ; le comptoir
  dit « Aucun échange commune ↔ commune ».
- **Avant le surplus** : de la 18e à la 24e minute, c'est l'**énergie** qui bloque (495 à la minute 20 ; il en faut 10 000 pour
  l'objectif « Entrepôt niveau 2 », affiché « disponible dans ~10 min »).
- **Piste** : lot RR-2 tel que prévu (conseil « surplus » ou échange direct). Les chiffres mesurés sont ci-dessous.

**🟡 NJ-27. « Débloquer » paraît actif quand il manque des ressources rares.**

- **État** : Corrigé en 6.14.165 (S6) : bouton grisé, pastilles « manque N », « Il manque : … » et lien vers le comptoir.

- **Ce que voit le joueur** : Atelier de réparation et Labo de synthèse montrent un bouton « DÉBLOQUER » orange, alors qu'il manque 20 de
  chacune des 4 ressources rares. Le toucher affiche « RESSOURCES INSUFFISANTES. » sans dire lesquelles. « Améliorer » est, lui, bien grisé.
- **Capture** : `03-debloquer-atelier.png`.
- **Piste** : griser « Débloquer » comme « Améliorer », avec « manque N » sous chaque coût.

**🟡 NJ-28. La rangée des ressources rares déborde à droite.**

- **État** : Corrigé en 6.14.165 (S6) : pastilles qui passent à la ligne, rares sur leur ligne en 4 colonnes à 375 px.

- **Ce que voit le joueur** : à 375 px, la rangée (série, Ambre, 4 rares) mesure 400 px dans un cadre de 375 px qui défile en douce
  (`overflow-x: auto`). Le Fragment d'IA est coupé au bord ; dès que l'Ambre apparaît, deux rares sont hors de l'écran. Rien n'indique
  qu'on peut faire défiler.
- **Captures** : `06-accueil-haut.png`, `10-galaxie.png`.
- **Piste** : passer la série sous forme d'icône seule, ou réduire l'écart entre les puces ; à défaut, un fondu au bord droit.

**🟡 NJ-29. Qui attaque au raid d'initiation ? Et deux fautes de plus.**

- **État** : Corrigé en 6.14.165 (S6) : l'histoire présente le Silencieux (exécuteur de Varan) ; « Attaque du Silencieux », « Raid repoussé : Confrérie du Vide ».

- L'histoire nomme le Capitaine Orsk Varan, l'alerte dit « Raid : Le Silencieux » et le rapport « Attaque de Le Silencieux (Confrérie du Vide) » :
  le joueur ne sait pas qui est le Silencieux, et « de Le » reste dans le titre du rapport (`frDe` n'y est pas appliqué).
- Journal : « Confrérie du Vide **repoussé** ! » (accord : « repoussée »).
- **Piste** : un seul nom pour l'assaillant du raid scripté (Varan ou ses « éclaireurs »), `frDe` dans le titre du rapport, accord du message.

**🟡 NJ-30. La cloche affiche « 9+ » dès la 8e minute et ne redescend plus.**

- **État** : Corrigé en 6.14.165 (S6) : fins de chantier, de recherche, d'unités et de mission hors du chiffre (un point seulement).

- **Ce que voit le joueur** : chaque fin de chantier, de recherche ou de mission est une notification : 53 non lues à la 35e minute. La
  pastille ne signale plus rien d'important.
- **Piste** : ne pas compter les fins de chantier et de patrouille dans la pastille (elles restent au Journal), ou les marquer lues quand
  le joueur était sur la page.

### Stocks mesurés (lot RR-2, Q410)

| Minute | Ferraille | Énergie | Nanocomposants | Données | Production (F / É / N / D par s) |
|:--|--:|--:|--:|--:|:--|
| 20 | 18 800 | 495 | 17 400 | 20 000 | 29 / 15 / 29 / 16 |
| 40 | 162 000 | 177 000 | 274 000 | 178 000 | 123 / 68 / 69 / 69 |
| 45 | 13 300 | 74 000 | 309 000 | 205 000 | 123 / 122 / 123 / 123 |

Les stocks de 40 et 45 min comptent le palier 1 du passe (NJ-25 : +208 800 de nano, +115 200 de données). Sans lui, il resterait environ
100 k de nano et 90 k de données à 45 min, encore sans usage. La ferraille et l'énergie sont dépensées dès qu'elles rentrent.

### Ressenti

Le début est bien meilleur : rien ne bloque, l'histoire et l'alerte s'enchaînent proprement, le Labo se joue au pouce et Fer II arrive à 29 min.
Le passe rejoue pourtant la pluie de ressources que S3 a retirée au raid, et, passé la 33e minute, on attend des minuteries avec 300 k de
nanocomposants inutiles. L'objectif « 120 niveaux » du Carnet (38 à 45 min) n'offre pas de prochain pas à portée.
