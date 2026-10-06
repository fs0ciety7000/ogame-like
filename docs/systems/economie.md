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
| Entrepôt | capacité = 2 M × 1,6^niveau par ressource commune ; 10 % de la capacité à l'abri du pillage |
| Entretien de flotte | énergie : 0,015/s par place d'attaque, 0,0075/s par place de défense ; panne d'énergie = autres productions × 0,5 |
| Rattrapage | jusqu'à +25 % de production sous 10 % de la médiane des actifs, nul à partir de 50 % |
| Échange (comptoir) | taxe 5 % au pot commun |
| Vacances | production × 0,25, 2 à 21 jours, 5 jours entre deux |

## Code et admin
`economy.ts`, `resources.ts`, `catchup.ts`, `flush.ts`, `vacation.ts`. Admin : Règles → Économie, Rattrapage ; Contenu → Bâtiments.

## Invariants
I6 (butin et livraisons arrivent même entrepôt plein).

## État (audit 2026-10-06)
- **Entrepôt trop généreux** : au niv. 15, ≈ 2,3 Md de capacité, donc ≈ 230 M à l'abri (≈ 42 h de production), et il n'est jamais plein en pratique. Le pillage devient symbolique et rien ne pousse à dépenser. Voir audit E1.
- Beaucoup de monnaies secondaires (voir `commerce-monnaies.md`).
