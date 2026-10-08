# Proposition : rythme des succès (É30-6, PRG-5, AE-12)

Statut : **livrée** (6.14.117, fiche [`docs/changes/6.14.117-rythme-des-succes.md`](../changes/6.14.117-rythme-des-succes.md)).
Feuille de route `feuille-de-route-2030-automne.md`, lot 38. Suite d'AP-L4 (6.14.108, paliers générés bridés).

## 1. Constat

- Z1 (copie de la production du 2026-10-07) : le joueur médian a **70 succès sur 178** après une semaine (39 %). Cible de l'audit
  d'équilibrage AU27 (AE-12) : **15 à 25 %** la première semaine. AU3 (PRG-5) disait déjà « la moitié des joueurs a plus de 50 % des
  succès en 9 jours ».
- Le joueur ne voit presque plus de succès à viser après deux semaines : les paliers « or » et « légendaire » des mesures de volume
  tombent la première semaine, titres compris (Magnat V, Pilier de l'alliance V, Bastion V).

## 2. Diagnostic (rétro-simulation sur la pré-prod, `scripts/achievement-pace-sim.mjs`)

Les 10 joueurs humains dont le compte a 7,1 à 8,6 jours (médiane 7,6) sont vus « comme des nouveaux » : un succès est compté dès que
la mesure atteint le seuil. 198 succès actifs (liste enregistrée, paliers générés compris).

| Mesure | Valeur du joueur médian à J7,6 | Seuils écrits (bronze → dernier palier) | Succès tenus (médiane) |
|:--|--:|:--|--:|
| Unités possédées | 24 547 | 50, 500, 5 000, 50 000 | 3 sur 6 |
| Défenses possédées | 10 008 | 1 000 → 5 300 | 5 sur 5 |
| Ressources échangées au marché | 6,1 milliards | 1 million → 270 millions | 6 sur 6 |
| Dons au trésor d'alliance | 3,1 milliards | 1 million → 110 millions | 6 sur 6 |
| Missions en une journée (record) | 298 | 10 → 160 | 5 sur 5 |
| Débris recyclés | 13 millions | 100 000 → 27 millions | 4 sur 6 |

Causes, de la plus sûre à la plus douteuse :
1. **Seuils de volume calés sur l'économie de la 5.x** : la production a été multipliée depuis (134 M/h pour un extracteur au
   niveau 20, AE-1), les seuils écrits en ressources et en unités ne l'ont pas suivie (preuve : tableau ci-dessus, la médiane dépasse
   le dernier palier de 4 mesures sur 6).
2. **Paliers générés avant AP-L4** : 47 paliers créés en 3 jours sur un seul détenteur, au-dessus de seuils déjà bas (corrigé pour la
   suite en 6.14.108, les 47 restent : Q82).
3. **Fin de partie en 2 semaines** (AE-1) : niveaux de bâtiments et de technos au maximum vers J10 à J14. Corrigé par la bascule du
   rythme du 1er novembre 2026 (RL-3, 6.14.88) : simulateur de progression, profil actif à J7 : extracteurs au niveau 12 au lieu de 18,
   188 → 116 niveaux de technos, 136 → 88 niveaux de bâtiments (`progression-sim`). Ces mesures sont bornées par le jeu : les
   multiplier rendrait des succès impossibles.

## 3. Benchmark

| Question | Clash of Clans | OGame | Jeux mobiles (Rise of Kingdoms, Lords Mobile) |
|:--|:--|:--|:--|
| Paliers | 3 étoiles par succès, seuils en progression géométrique (×5 à ×10 entre étoiles) | pas de succès en jeu | succès par paliers, seuils relevés à chaque saison de serveur |
| Premier palier | immédiat (tutoriel) | — | immédiat |
| Dernier palier | des mois (« Gold Grab » : 100 M d'or) | — | des mois |

Retenu : premier palier immédiat (prise en main), écart géométrique entre paliers, dernier palier en mois.

## 4. Options

| Option | Ce que ça règle | Ce que ça coûte | Risque |
|:--|:--|:--|:--|
| A. **Facteur du seuil par mesure de volume**, appliqué à la lecture (seuil en jeu = seuil écrit × facteur), bronze gardé | les 11 mesures en cause, paliers générés compris, d'un seul réglage par mesure ; réversible (facteur 1) ; aucune donnée réécrite | textes des succès réécrits à l'affichage ; générateur et admin lisent le seuil en jeu | un texte libre écrit à la main sans le nombre garde son texte (la carte montre la cible) |
| B. Seuils écrits relevés dans le code, migration des listes enregistrées | même effet pour les succès par défaut | les paliers générés (au-dessus) gardent leurs seuils bas : migration impossible sans casser l'ordre des paliers ; non réversible d'un clic | ordre des paliers cassé sur la production (47 paliers) |
| C. Cadence : au plus N succès par jour, le reste en file | rythme garanti | « condition remplie mais rien » : frustrant, invisible dans les jeux de référence | file à expliquer partout |

## 5. Recommandation (appliquée, option A)

Groupe de règles **`achievementPace`** (registre, Admin → Règles → « Succès : rythme des succès de volume », et Tous les réglages) :

| Mesure | Facteur | Exemple (seuil écrit → en jeu) |
|:--|--:|:--|
| Unités possédées | ×10 | Armada 5 000 → 50 000 |
| Défenses possédées | ×10 | Bastion 1 000 → 10 000 |
| Unités construites | ×3 | Chantier infatigable 10 000 → 30 000 |
| Unités réparées à l'Atelier | ×2 | Chef d'atelier 1 000 → 2 000 |
| Missions terminées | ×5 | Explorateur 100 → 500 |
| Missions en une journée (record) | ×20 | Sans repos II 20 → 400 |
| Ressources pillées | ×10 | Corsaire 1 million → 10 millions |
| Débris recyclés | ×10 | Charognard des étoiles 5 millions → 50 millions |
| Ressources échangées au marché | ×200 | Magnat 50 millions → 10 milliards |
| Dons au trésor d'alliance | ×200 | Pilier de l'alliance 20 millions → 4 milliards |
| Ultimatums reçus | ×2 | Sur la Liste II 3 → 6 |

- Le **palier bronze** garde son seuil écrit (`keepBronze`) : le premier succès d'une mesure reste immédiat.
- Les mesures **bornées par le jeu** (niveaux, technos, rang, pourcentages, oui/non) ne bougent pas : la bascule du rythme les étire.
- Un **succès gagné reste gagné** : rien ne relit `unlockedAchievements` ; le facteur ne s'applique qu'aux succès pas encore obtenus.
- Le **texte** du succès suit le seuil en jeu (« Possède 50 000 unités. », « Échange 10 milliards de ressources au marché. »).
- Le **générateur** compte les détenteurs au seuil en jeu et écrit le palier suivant sur le seuil écrit (le facteur s'y applique ensuite).

**Effet simulé** (`node scripts/achievement-pace-sim.mjs`, 10 joueurs à J7,6) :

| | Q1 | médiane | Q3 | médiane (%) |
|:--|--:|--:|--:|--:|
| seuils écrits | 65 | 76 | 82 | 38,4 % |
| rythme (6.14.117) | 50 | 55 | 58 | 27,8 % |

Avec la bascule du rythme (mesures bornées : au moins 2 succès de moins pour le profil actif à J7, de 4 à 6 pour les joueurs réels,
qui vont plus vite que le profil actif), le joueur médian attendu est vers **24 à 26 %** à J7, dans la cible ou à sa limite haute.
À mesurer après la mise en production avec le relevé « succès par semaine » de la santé de l'équilibre (6.14.19).

## 6. Invariants

Aucun invariant numéroté ne change. Règle ajoutée au GDD (§7, succès) : seuil en jeu = seuil écrit × facteur de la mesure ; un succès
gagné n'est jamais repris. Tests : `rythmeSucces6117.test.ts`.

## 7. Plan de lots

1. **6.14.117** : règles, application, textes, générateur, admin, rétro-simulation, tests (livré).
2. Mesure après la mise en production (8 semaines de « succès par semaine ») ; réglage fin des facteurs dans l'admin si la médiane sort
   de 15 à 25 %.

## 8. Questions ouvertes (proposées dans la fiche 6.14.117)

- Facteurs plus forts pour viser 20 % sans attendre la bascule ? Choix fait : non (la bascule fait sa part, mesure d'abord).
- Paliers générés montant d'or en or plutôt que légendaires (question 3 de 6.14.108) : inchangé, à revoir avec les mesures.
