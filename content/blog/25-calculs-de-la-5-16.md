---
slug: calculs-de-la-5-16
title: "Les calculs de la 5.16 : rattrapage, expéditions profondes, recyclage et compagnie"
excerpt: "Toutes les formules derrière la 5.16, avec des exemples chiffrés : quand le rattrapage s'applique, ce que rapporte une expédition profonde, combien porte un drone, ce qu'un traité coûte vraiment."
category: equilibrage
tags: [formules, équilibrage, expéditions, rattrapage, recyclage]
version: "5.16.0"
cover: /assets/units/drone_recuperateur.webp
---
> [!NOTE] Valeurs par défaut
> Les chiffres ci-dessous sont les réglages par défaut du moteur. L'administration peut les ajuster. La page **Formules** du jeu affiche toujours les tiens, calculés avec tes propres niveaux.

## Le rattrapage des petits empires

Chaque nuit, le serveur mesure le **développement** de chaque joueur actif :

- **Développement** = somme des niveaux de tous les bâtiments et de toutes les technologies.
- Il calcule la **médiane** des joueurs actifs : ceux connectés depuis moins de 7 jours, à condition d'être au moins 5.
- Le ratio entre ton score et cette médiane donne ton bonus :

```
ratio ≤ 10 %         → bonus = 25 %
10 % < ratio < 50 %  → bonus = 25 % × (50 % − ratio) / 40 %
ratio ≥ 50 %         → aucun bonus
```

| Ton score (médiane = 200) | Ratio | Bonus de production |
|:--|--:|--:|
| 15 | 7,5 % | +25 % |
| 30 | 15 % | +21,9 % |
| 60 | 30 % | +12,5 % |
| 90 | 45 % | +3,1 % |
| 100 | 50 % | aucun |

Le bonus est **figé pour la journée** (26 h, pour couvrir le passage du calcul). Le serveur et ton navigateur lisent donc exactement le même chiffre, et la production affichée est celle que tu touches. Il s'applique aux ressources produites par tes bâtiments, pas au butin.

## Les expéditions profondes

À chaque profondeur `p` (1, 2 ou 3) :

```
butin des événements  = butin normal × (1 + 0,25 × p)
force des embuscades  = force normale × (1 + 0,2 × p)
XP de fin             = XP normale × (1 + 0,5 × p_finale)
embuscade perdue      → 30 % de la cale perdue
```

| Profondeur | Butin | Embuscades | XP de fin | Durée de l'étape |
|:--|--:|--:|--:|--:|
| 0 (normal) | ×1 | ×1 | ×1 | durée choisie |
| 1 | ×1,25 | ×1,2 | ×1,5 | ½ durée |
| 2 | ×1,5 | ×1,4 | ×2 | ½ durée |
| 3 | ×1,75 | ×1,6 | ×2,5 | ½ durée |

> [!TIP] Quand pousser ?
> Pousser rapporte surtout quand ta **cale est encore légère**, car une embuscade perdue n'emporte que 30 % de ce que tu transportes. Avec une cale pleine, la prudence l'emporte, sauf avec une flotte nettement plus forte que les patrouilles du secteur. Un **contrat d'escorte** (embuscades ×0,5) change le calcul : il compense largement le ×1,6 de la profondeur 3.

## Ce que coûte un traité

Le prix d'un traité se compte en **heures de production commune** : 2 h pour un pacte, 4 h pour une escorte, au rythme de production actuel de chaque ressource commune.

Exemple : un empire qui produit 500 ferraille/s, 500 énergie/s, 259 nano/s et 259 données/s paie, pour un pacte :

| Ressource | Par seconde | 2 heures |
|:--|--:|--:|
| Ferraille | 500 | 3 600 000 |
| Énergie | 500 | 3 600 000 |
| Nanocomposants | 259 | 1 864 800 |
| Données | 259 | 1 864 800 |

En regard, un raid pirate réussi pille au-delà de la part protégée de ton entrepôt (10 % de sa capacité). Le pacte devient rentable dès que tu crains plus d'un raid par semaine.

L'**embargo** est gratuit mais musclé : les raids de la faction ont 25 % de force en plus, les repousser rapporte 50 % de prime en plus, et ta notoriété monte d'un cran.

## Le recyclage, enfin juste

La capacité d'une flotte de recyclage vaut désormais **exactement** la soute indiquée sur la fiche du Drone récupérateur :

```
capacité = CAP du drone × niveau × (1 + bonus de cale) × nombre de drones
```

Avec les valeurs par défaut (CAP 10) :

| Niveau du drone | Par drone | 500 drones | 500 drones avec +20 % de cale |
|:--|--:|--:|--:|
| 1 | 10 | 5 000 | 6 000 |
| 5 | 50 | 25 000 | 30 000 |
| 10 | 100 | 50 000 | 60 000 |

L'ancien réglage donnait 250 par niveau, soit 2 500 par drone au niveau 10, sans rapport avec la fiche. Si tu trouves ça trop juste, c'est le **CAP du drone** qu'il faut augmenter (administration → Unités). Il s'appliquera partout, recyclage compris.

## Le plafond de jetons de butin

Les jetons du casino tirés au **butin de combat** sont plafonnés à **25 par semaine** (la semaine du casino) :

- **Comptent dans le plafond** : boss, seigneurs, menaces, joueurs, expéditions.
- **Ne comptent pas** : le jeton du jour, la série, les défis, le passe et les récompenses fixes des boss.

La jauge du casino montre où tu en es.

## Le mutateur du mois

Le mutateur est tiré **de façon déterministe** à partir du mois : le même pour tout le monde, prévisible un mois à l'avance. Si le tirage retombe sur le mutateur du mois précédent, on prend le suivant dans la liste : jamais deux mois de suite le même.

Il passe par le même circuit d'effets que les officiers et les reliques (source « Mutateur de saison »). Ses bonus s'additionnent donc à ceux de tes officiers et de tes reliques : −15 % de construction avec un officier à −10 % donne −25 %. Les technologies, elles, s'appliquent ensuite, par-dessus.

## Le comparateur avant/après

Au survol de « Améliorer », le jeu calcule le **temps de remboursement** :

```
remboursement = coût total (toutes ressources) ÷ gain de production par seconde
```

| Amélioration (extracteur) | Gain | Coût total | Remboursé en |
|:--|--:|--:|--:|
| niveau 4 → 5 | +10/s | 9 312 | 15 min 31 s |
| niveau 9 → 10 | +241/s | 4 299 998 | 4 h 57 min |

Plus le remboursement est court, plus l'amélioration est rentable. C'est un bon moyen de choisir entre deux bâtiments.

## La Gazette

Chaque numéro couvre la période **depuis le numéro précédent** d'une autre semaine. Les chiffres (combats, butin, échanges, commandants actifs) sont comparés au numéro d'avant, en valeur absolue : « +12 » signifie douze combats de plus.

Une rubrique identique mot pour mot à celle du numéro précédent est retirée, et la manchette change toujours.
