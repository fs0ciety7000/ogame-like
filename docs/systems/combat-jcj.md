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

## Code et admin
`combat.ts`, `attack.ts`, `pvp.ts`, `formations.ts`, `debris.ts`. Admin : Règles → Combat, JcJ ; simulateur « et si ».

## État (audit 2026-10-06)
- Attrition : sauvetage plafonné à 85 % (6.2). Butin : 30 % du stock exposé, soute ×2 (6.2), avec l'abri limité à 8 h de production (5.32). À suivre dans Admin → Équilibrage → Santé de l'équilibre (audit E1, E2).
