# Combat et JcJ

## Rôle
Résout attaques entre joueurs, raids PNJ, boss. Moteur en tours (5.18), dégâts persistants (5.20).

## Règles et chiffres
| Élément | Valeur |
|:--|:--|
| Tours | 8 au plus ; PV = résistance × 30 ; retraite à 50 % de PV perdus (30 % en Prudente) |
| Victoire | défenseur sous 20 % de ses PV, ou +30 % d'avance au dernier tour |
| Défenseur | +15 % de puissance ; bouclier 0,75 %/niv. de hangar de défense (max 15 %) + générateur ; vaisseaux à quai engagés à 50 % (Riposte 100 %, Bunker 0 %) |
| Formations | Assaut (+10 % ATK, +15 % pertes), Prudente (−10 % ATK, −25 % pertes), Raid (−15 % ATK, +30 % soute) |
| Butin | 30 % des communes (6.2), 8 % des rares, sur le stock exposé (hors part à l'abri) ; soute de pillage = 2 × la soute des survivants (6.2) ; match nul 30 % du butin |
| Pertes | défenses reconstruites à 60 % ; vaisseaux sauvés par l'Atelier (jusqu'à 85 % avec bonus depuis la 6.2, 95 % avant) ; débris 30 % du coût, 48 h |
| Protections | 2 h entre deux attaques sur la même cible ; bouclier 1 h après une défaite ; débutant 72 h (levée si on attaque) ; écart d'XP : butin et XP dégressifs dès ×3, attaque refusée à ×12 |
| XP | perte en défense plafonnée à 60 par 24 h |
| Lune (6.13) | un combat sur la planète mère laissant au moins 100 000 de débris : 1 % de chance par tranche de 100 000, 20 % au plus ; une lune par joueur, permanente : +3 % de bouclier, +5 % d'entrepôt à l'abri (couche empire) ; 6.14 : niveaux 1 à 5, +2 % de bouclier par niveau (11 % au niveau 5), 500 k ferraille + 250 k énergie ×2 par niveau ; 6.14.3 : succès « Clair de lune » et « Lune pleine » ; 6.14.44 : pitié lunaire, +5 % par combat subi sur la planète mère sans lune (attaquant joueur), lune garantie au 20e (`moonPity`, `MOON_RULES.pityPerDefense`) |
| Phalange (6.14.44, moteur) | radar d'alliance, perce-brouillard (vraie composition au niveau 2, stimulant au niveau 4, pour la cible seulement), balayage de l'agresseur (30 min d'énergie, 1 000 au moins ; recharge 30 → 10 min) ; portée 15 par niveau, + `phalanxRange` (plafond 50 %) ; invariant I22. Routes et interface aux lots É30-1b et É30-1c |
| Porte de saut (6.14.44, moteur) | dès le niveau 3 : rapatriement instantané d'une patrouille, garnison ou base avancée ; recharge 24 h, 22 h, 20 h (6 h au moins), − `jumpGateCooldown` (plafond 30 %) ; invariant I23 |

## Code et admin
`combat.ts`, `attack.ts`, `pvp.ts`, `formations.ts`, `debris.ts`, `moon.ts`, `phalanx.ts`, `jumpGate.ts`. Admin : Règles → Combat, JcJ, Lunes ; groupes `phalanx` (« Lunes : phalange ») et `jumpGate` (« Lunes : porte de saut ») dans Tous les réglages (section dédiée au lot É30-1d) ; simulateur « et si ».

## État (audit 2026-10-06)
- Attrition : sauvetage plafonné à 85 % (6.2). Butin : 30 % du stock exposé, soute ×2 (6.2), avec l'abri limité à 8 h de production (5.32). À suivre dans Admin → Équilibrage → Santé de l'équilibre (audit E1, E2).
