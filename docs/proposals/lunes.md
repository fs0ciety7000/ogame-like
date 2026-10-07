# Proposition : lunes (lot R3, Q15)

Statut : **livrée** en 6.13.0, voir `docs/changes/6.13.0-lunes.md` (recommandation appliquée seule, règle n° 3 ; choix noté en Q15). Lots R4 et R5 de
`docs/proposals/feuille-de-route-2028-ete.md`.

## 1. Le problème vu par le joueur
- « Un gros combat chez moi ne laisse qu'un champ de débris : 48 h plus tard, il ne reste rien. »
- « Se faire attaquer n'apporte jamais rien : on perd, on reconstruit. »
- Depuis le printemps, aucun système n'a été ouvert (Q15) : le jeu manque d'une surprise rare qui marque l'empire.

## 2. Diagnostic
- `performAttack` (`attack.ts`) calcule déjà les débris de chaque combat (`debrisFromLosses`, 30 % du coût des vaisseaux détruits).
- Le circuit d'effets (`empireEffects`, `modifiers.ts`) accepte une nouvelle source sans autre code ; les plafonds de la couche empire
  s'appliquent (rapport d'impact `impact.ts`, test `derived.test.ts`).
- Deux grandeurs défensives ont de la marge sous leur plafond empire : `shield` (bouclier, plafond 15 %) et `protectedStorage`
  (part à l'abri, plafond 25 %).

## 3. Benchmark
| Jeu | Règle |
|:--|:--|
| OGame | Un combat qui laisse au moins 100 000 unités de débris donne 1 % de chance de lune par tranche de 100 000, 20 % au plus. La lune a ses bâtiments (phalange, porte de saut) |
| Clash of Clans | Pas d'équivalent ; les trophées de défense récompensent un village bien défendu |
| Gestion mobile | Récompenses de « survie » après un raid (bouclier, coffre de consolation) |

## 4. Options
| | Option | Pour | Contre |
|:--|:--|:--|:--|
| A | Lune complète façon OGame : nouvel emplacement, bâtiments, phalange, porte de saut | très riche | nouvelle position sur la carte, nouveaux bâtiments et flottes, gros risque sur les données |
| B | **Lune attachée à la planète mère** : naît d'un gros combat chez toi (chance OGame), donne un petit bonus défensif permanent par le circuit d'effets, une seule par joueur | simple, rare, récompense le défenseur, aucune donnée existante touchée | pas de nouvelle action à jouer (lot 2 possible) |
| C | B + améliorations de la lune (Ambre ou ressources) | profondeur | équilibre inconnu sans chiffres réels (Q12) |

## 5. Recommandation : B, version prudente
- **Naissance** : à la fin d'un combat sur la **planète mère** d'un joueur (pas une colonie, pas un PNJ), si le défenseur n'a pas de lune :
  chance = 1 % par tranche de **100 000** de débris (ferraille + énergie), **20 %** au plus. Tirage au serveur.
- **Effets** (couche empire, source « Lune ») : **+3 % de bouclier planétaire**, **+5 % d'entrepôt à l'abri du pillage**. Les plafonds
  restent (15 % et 25 %) : la lune ne fait que remplir la marge.
- Une lune par joueur, permanente, avec un nom tiré au sort ; notification et ligne dans le Journal.
- Réglages (règle n° 2) : `MOON_RULES` (ouverture, débris par point de chance, chance maximale, deux bonus), groupe « Lunes » de l'admin.
- Données : nouveau champ `moon` (null pour tous les joueurs actuels) ; rien d'existant ne change.

## 6. Invariants
- I21 : un joueur a au plus une lune ; elle ne naît que d'un combat sur sa planète mère, jamais pour un PNJ ni sur une colonie ; ses
  effets passent par la couche empire et ses plafonds (test `lunes.test.ts`, `derived.test.ts`).

## 7. Plan de lots
1. R4 : moteur (`moon.ts`, naissance dans `performAttack`, source d'effets, réglages, registre, tests).
2. R5 : serveur (champ, notification), interface (Accueil / Statistiques / fiche d'effets), admin, changelog, intégration.

## 8. Complément (lot H28-1, option C) : améliorer sa lune

Statut : **livrée** en 6.14.0 (`docs/changes/6.14.0-ameliorer-sa-lune.md`), recommandation appliquée seule (règle n° 3 ; Q18).

- Constat (rapport d'impact, 6.13.0) : `shield` empire 3 % sur un plafond de 15 % (12 points de marge) ; `protectedStorage` empire déjà à
  25 % sur 25 % (officière Ysolde Grey 20 % + lune 5 %) : aucune marge.
- Benchmark : OGame monte les bâtiments lunaires un par un, payés en métal, cristal et deutérium, sans autre bonus passif.

| | Option | Pour | Contre |
|:--|:--|:--|:--|
| C1 | **Niveaux 1 à 5, +2 % de bouclier par niveau** (3 % → 11 %), payés en ferraille et énergie, coût ×2 par niveau | une dépense de fin de partie, reste sous le plafond | bonus modeste |
| C2 | Niveaux qui montent aussi l'entrepôt à l'abri | plus fort | dépasse le plafond (25 %) : interdit par `derived.test.ts` |

**Recommandation : C1.** Coût du passage au niveau n+1 : 500 000 ferraille et 250 000 énergie × 2^(n−1) (niveau 5 : 7,5 M de ferraille au
total). Achat immédiat, sans file. Réglages dans `MOON_RULES` (niveau maximal, bonus par niveau, coût de base, croissance).
Une lune déjà née est au niveau 1 (champ `level` absent = 1) : rien ne change pour elle.
