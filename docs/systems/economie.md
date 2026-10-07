# Économie et ressources

## Rôle
Tout ce que le joueur construit se paie en ressources. La production tourne hors ligne (rattrapée à la connexion par `flushState`).

## Règles et chiffres
| Élément | Valeur |
|:--|:--|
| Ressources communes | Ferraille, Énergie instable, Nanocomposants, Données anciennes |
| Ressources rares | Acier renforcé, Module cybernétique, Nanites synthétiques, Fragment d'IA |
| Production d'un extracteur | niv. 1 : 2/s, niv. 10 : 500/s, niv. 20 : 4 657/s (≈ 16,8 M/h) |
| Rares | bâtiments de fin de partie (1 à 10/s), gisements de colonie (0,1 à 3/s), missions, expéditions, pirates, primes, contrats |
| Entrepôt | capacité = 2 M × 1,6^niveau par ressource commune. À l'abri du pillage : 10 % de la capacité (+ technologies, Bastion, au plus 75 %) et, **à partir du 13 octobre 2026 (5.32)**, au plus 8 h de production de la ressource, avec un plancher de 500 k (réglages : Règles → Économie) |
| Entretien de flotte | énergie : 0,015/s par place d'attaque, 0,0075/s par place de défense ; panne d'énergie = autres productions × 0,5 |
| Rattrapage | jusqu'à +25 % de production sous 10 % de la médiane des actifs, nul à partir de 50 % |
| Échange (comptoir) | taxe 5 % au pot commun |
| Vacances | production × 0,25, 2 à 21 jours, 5 jours entre deux |

## Code et admin
`economy.ts`, `resources.ts`, `catchup.ts`, `flush.ts`, `vacation.ts`. Admin : Règles → Économie, Rattrapage ; Contenu → Bâtiments.

## Invariants
I6 (butin et livraisons arrivent même entrepôt plein ; le stock au-delà de la capacité est gardé, la production s'arrête) : testé depuis la
6.14.61 (`fleets.test.ts`, « I6 : entrepôt plein » : retour d'attaque, rapatriement, livraison rappelée, colonie, contrat).

## État (audit 2026-10-06)
- Entrepôt trop généreux (audit E1, confirmé en production : 115 h de production à l'abri contre 57 h de stock médian). Correctif 5.32 : 8 h à l'abri au plus, carte « Ce que tu risques » sur la page Ressources. Reste à voir (option B) : la soute de l'attaquant borne encore le butin (1,9 M par attaque en moyenne).
- Beaucoup de monnaies secondaires (voir `commerce-monnaies.md`).

## Revue AU11 (2026-10-07)
Recherches en parallèle réglables (`research.maxConcurrent`, 6.9.7).
