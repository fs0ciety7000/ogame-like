# Colonies

## Règles et chiffres
| Élément | Valeur |
|:--|:--|
| Nombre | 2 au plus |
| Condition | 120 puis 140 niveaux de bâtiments cumulés sur la planète mère |
| Fondation | 50 M par commune + 1 M par rare, 2 h de voyage ; stock de départ 5 M ; extracteurs à 50 % du niveau de la mère (max 8) |
| Bâtiments | extracteurs communs, entrepôt, hangar de défense ; niveau 18 max ; production +50 % (« terres neuves ») |
| Gisement rare | biome, 0,1 à 3/s (15 niveaux) |
| Spécialisations | dont Bastion (hangar de défense +50 %) ; changement tous les 7 jours |
| Défense | défenses seulement, hangar propre (tech « Extension des hangars » appliquée depuis la 5.28) |

## Code et admin
`colonies.ts`, `ColoniesPage.tsx`.

## État (audit 2026-10-06)
- Les colonies restent des « fermes » à défendre : pas de flotte basée, pas de chantier naval, transport manuel.
- `homeLevels` compte les bâtiments verrouillés au niveau 1 (audit C3).
