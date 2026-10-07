---
slug: guide-du-commandant
title: "Le guide du commandant : tout comprendre, de la première mine à l'Ascension"
excerpt: "Ressources, bâtiments, recherches, unités, combats, XP et récompenses : le tutoriel complet de Cosmic Empires, avec les tableaux de coûts, de production et de progression."
category: notes
tags: [guide, tutoriel, débutant, économie, unités, progression]
version: "5.16.0"
pinned: true
cover: /assets/units/fregate.webp
---
> [!LORE] Mot d'accueil de Vashka
> « Commandant, une planète, quatre extracteurs et beaucoup de patience. Le reste, c'est toi qui le construis. »

Ce guide reprend le jeu depuis le début, chiffres à l'appui.

> [!NOTE] À propos des chiffres
> Ce sont les valeurs par défaut du moteur. L'administration peut les ajuster, et tes officiers, reliques et technologies les modifient. La page **Formules** du jeu affiche toujours les tiens. Chaque unité a aussi sa **fiche technique**.

## 1. Les ressources

| Ressource | Type | D'où elle vient |
|:--|:--|:--|
| 🔩 Ferraille | commune | Extracteur de ferraille |
| ⚡ Énergie instable | commune | Réacteur instable |
| 🧬 Nanocomposants | commune | Extracteur de nanocomposants |
| 📡 Données anciennes | commune | Archives fracturées |
| 🛠️ Acier renforcé | rare | Fonderie quantique, missions, colonies |
| 🧩 Module cybernétique | rare | missions, colonies, butin |
| 🤖 Nanites synthétiques | rare | missions, colonies, butin |
| 🧠 Fragment d'IA | rare | Synthétiseur neuronal, missions, colonies |

Les ressources communes paient presque tout au début. Les rares arrivent avec les niveaux 11 à 20 des bâtiments, les technologies de fin de partie et les grosses unités.

> [!TIP] L'énergie fait tourner la flotte
> Chaque place de hangar occupée consomme de l'énergie en continu : 0,015/s pour l'attaque, 0,0075/s pour la défense. En panne d'énergie, les autres productions tombent à 50 %. Garde ton réacteur en avance sur ta flotte.

## 2. La production

Les quatre extracteurs suivent la même table :

| Niveau | Par seconde | Par heure |
|:--|--:|--:|
| 1 | 2 | 7 200 |
| 2 | 4 | 14 400 |
| 3 | 7 | 25 200 |
| 4 | 13 | 46 800 |
| 5 | 23 | 82 800 |
| 6 | 42 | 151 200 |
| 7 | 75 | 270 000 |
| 8 | 135 | 486 000 |
| 9 | 259 | 932 400 |
| 10 | 500 | 1 800 000 |
| 12 | 781 | 2 811 600 |
| 15 | 1 526 | 5 493 600 |
| 18 | 2 980 | 10 728 000 |
| 20 | 4 657 | 16 765 200 |

Jusqu'au niveau 10, la production double presque à chaque niveau. Au-delà, chaque niveau ajoute +25 %.

## 3. Ce que coûtent les améliorations

**Extracteurs** (les quatre au même prix, en ferraille et énergie) :

| Niveau visé | Ferraille | Énergie | Rare | Durée |
|:--|--:|--:|--:|--:|
| 2 | 166 | 71 | — | 10 min |
| 5 | 6 129 | 3 183 | — | 40 min |
| 10 | 2 499 999 | 1 799 999 | — | 1 h 30 |
| 15 | 38 713 184 | 23 227 910 | 154 852 | 7 h |
| 20 | ≈ 500 M | ≈ 300 M | ≈ 2 M | 12 h |

À partir du niveau 11, chaque extracteur demande **sa** ressource rare : acier pour la ferraille, module cybernétique pour le réacteur, nanites pour les nanocomposants et fragment d'IA pour les archives.

**Hangars** (attaque ou défense) :

| Niveau visé | Ferraille | Énergie | Durée | Places ajoutées |
|:--|--:|--:|--:|--:|
| 2 | 883 | 499 | 15 min | +2 000 par niveau |
| 5 | 22 568 | 18 387 | 1 h | |
| 10 | 4 999 999 | 7 499 999 | 2 h 15 | |

**Entrepôt** : sa capacité vaut 2 000 000 × 1,6^niveau.

| Niveau | Capacité |
|:--|--:|
| 1 | 3 200 000 |
| 5 | 20 971 520 |
| 10 | 219 902 325 |
| 15 | ≈ 2,3 milliards |
| 20 | ≈ 24 milliards |

Au-delà de la capacité, la production s'arrête. 10 % de l'entrepôt est **à l'abri du pillage**.

**Atelier de réparation** : 5 % des pertes réparées par niveau jusqu'au niveau 10, soit 50 %. Ensuite, +2 % par niveau, jusqu'à 70 % au niveau 20.

> [!TIP] Le comparateur
> Survole « Améliorer » : le jeu affiche le gain et le **temps de remboursement**. Un extracteur 4 → 5 se rembourse en un quart d'heure ; 9 → 10 en un peu moins de 5 heures.

## 4. La recherche

Le Labo mène jusqu'à **4 recherches en même temps**. Les premières à viser :

| Technologie | Effet | Niveau max | Coût du niveau 1 |
|:--|:--|--:|:--|
| Amélioration énergétique | énergie plus efficace | 10 | 150 ferraille, 50 énergie |
| Optimisation industrielle | bâtiments moins chers | 10 | 400 ferraille, 50 données |
| Puissance d'attaque | +attaque de toutes les unités | 10 | 200 énergie, 100 nano |
| Blindage avancé | +défense de toutes les unités | 10 | 300 ferraille, 50 nano |
| Infrastructure spatiale | débloque des bâtiments | 1 | 800 ferraille, 400 énergie, 200 nano |
| Systèmes défensifs | débloque les défenses | 4 | 500 ferraille, 200 nano, 100 données |
| Armes expérimentales | débloque les vaisseaux d'attaque | 5 | 600 énergie, 300 nano, 150 données |

Chaque unité a aussi **sa** technologie, qui la débloque puis permet d'en monter le niveau. Le coût d'une recherche est multiplié par environ 2,7 d'un niveau au suivant : 150 ferraille au niveau 1, 7 971 au niveau 5 pour l'Amélioration énergétique.

En fin de partie, cinq technologies (Métallurgie quantique, Cortex neuronal, Champs de confinement, Propulsion à antimatière, Lance gravitationnelle) coûtent des centaines de milliers de ressources et débloquent les bâtiments et unités ultimes.

## 5. Les unités

Valeurs au niveau 1. L'attaque et la défense gagnent un bonus fixe par niveau (5 pour la plupart des unités) ; la vitesse et la soute se multiplient par le niveau.

| Unité | Rôle | Coût (ferr. / én.) | ATK | DEF | VIT | CAP | Places |
|:--|:--|--:|--:|--:|--:|--:|--:|
| Drone récupérateur | recyclage, missions | 500 / 200 | 15 | 5 | 5 | 10 | 1 |
| Sonde d'espionnage | espionnage | 300 / 150 | 0 | 2 | 20 | 0 | 1 |
| Frégate | polyvalente | 1 000 / 500 | 100 | 20 | 3 | 5 | 1 |
| Cargo | transport | 1 200 / 300 | 50 | 10 | 3 | 50 | 1 |
| Sentinelle | puissance brute | 800 / 400 | 120 | 30 | 1 | 0 | 1 |
| Chasseur | frappe rapide | 1 500 / 800 | 245 | 10 | 8 | 5 | 2 |
| Croiseur Nova | fin de partie | 15 000 / 9 000 | 1 500 | 1 000 | 6 | 300 | 20 |
| Étoile Noire | fin de partie | 50 000 / 30 000 | 500 | 500 | 1 | 1 000 | 80 |
| Roquette | défense | 200 / 100 | 60 | 0 | — | — | 1 |
| Canon à impulsion | défense | 1 200 / 600 | 80 | 10 | — | — | 1 |
| Canon plasma | défense | 1 500 / 750 | 105 | 20 | — | — | 1 |
| Batterie anti-aérienne | défense | 1 800 / 900 | 135 | 15 | — | — | 1 |
| Intercepteur | défense mobile | 2 000 / 1 200 | 255 | 60 | 12 | 5 | 2 |
| Lance gravitationnelle | défense ultime | 18 000 / 12 000 | 600 | 1 200 | — | — | 12 |

Le Croiseur Nova gagne +250 ATK/DEF par niveau, l'Étoile Noire +1 700 et la Lance gravitationnelle +150. Le **Traqueur Kesh** (plan du Comptoir de la Ruche) frappe 50 % plus fort contre tous les PNJ.

> [!WARNING] Une flotte avance à la vitesse de son vaisseau le plus lent
> Une seule Sentinelle (vitesse 1) ralentit tout le convoi. Pour les raids rapides, sépare les flottes.

## 6. Le combat en bref

- La **puissance** d'une flotte dépend de l'attaque et de la défense de ses vaisseaux, technologies, officiers et formation compris.
- La **fenêtre d'attaque** estime l'issue avant l'envoi : regarde-la toujours.
- Le **butin** est limité par la soute (CAP) de la flotte et par la part non protégée de l'entrepôt adverse.
- Les pertes sont plafonnées, et l'**atelier** en répare une partie au retour.
- Les nouveaux joueurs sont protégés un temps, et on ne peut pas frapper en boucle la même cible : la fenêtre d'attaque indique quand elle redevient attaquable.

## 7. L'XP et les rangs

L'XP vient surtout des **missions (60 XP par heure de mission, quelle que soit la mission)**, des combats, des expéditions et des boss.

| Rang | XP | Rang | XP |
|:--|--:|:--|--:|
| Fer III | 100 | Platine III | 17 000 |
| Fer I | 500 | Émeraude III | 36 000 |
| Bronze III | 900 | Diamant III | 70 000 |
| Argent III | 3 000 | Maître III | 130 000 |
| Or III | 7 500 | Grand Maître | 240 000 |
| Or I | 13 000 | Challenger | 320 000 |
| | | Élite | 420 000 |

## 8. Les récompenses régulières

**Série de connexion** (cycle de 7 jours) :

| Jour | Ressources communes | Bonus |
|:--|:--|:--|
| 1 | 1 h de production | 2 jetons |
| 2 | 1 h 30 | 2 jetons |
| 3 | 2 h | 2 jetons |
| 4 | 2 h 30 | 2 jetons |
| 5 | 3 h | 2 jetons |
| 6 | 3 h 30 | 2 jetons + 35 Ambre |
| 7 | 5 h | 2 jetons + **coffre** (50 à 300 Ambre, 1 à 25 jetons, 2 à 12 M de chaque ressource commune (6.14.72)) |

Chaque jour rapporte au moins 2 000 de chaque ressource commune, même pour un tout petit empire.

**Missions** : leur butin commun vaut au moins 1,5 fois la production que tu aurais eue pendant leur durée. Leurs ressources rares grandissent avec tes niveaux de bâtiments.

**Et aussi** :

- Défis hebdomadaires et missions du jour.
- Passe de saison (30 paliers).
- Chroniques du mois.
- Boss mondiaux, de saison et d'alliance.
- Primes Kesh'Vaar, succès, et les jetons du casino.

Le bouton **Tout réclamer** (ou Ctrl+K) ramasse tout ce qui t'attend.

## 9. Un ordre de progression qui marche

1. **Extracteurs 1 → 5** en alternance, réacteur un peu devant.
2. **Amélioration énergétique** et **Optimisation industrielle** au Labo.
3. **Drones récupérateurs** : missions courtes, puis recyclage des champs de débris.
4. **Entrepôt** dès que la barre du haut annonce « plein dans moins de 2 h ».
5. **Hangars** et premières unités : frégates et chasseurs pour l'attaque, roquettes et canons pour la défense.
6. **Extracteurs 6 → 10**, en suivant le comparateur.
7. **Alliance** : trésor, recherches communes, boss d'alliance.
8. **Niveaux 11 et plus**, puis **colonies** pour les ressources rares.
9. **Technologies de fin de partie**, Croiseurs Nova et Étoiles Noires.
10. **Ascension** : on recommence, plus fort, avec des talents permanents.

> [!TIP] Tu es en retard sur les autres ?
> C'est prévu : le **rattrapage** donne jusqu'à +25 % de production aux empires très en retard sur la médiane du serveur. Le bonus s'efface à mesure que tu les rejoins.
