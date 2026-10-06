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
| Route logistique (5.33) | convoi vers la planète mère toutes les 6, 12 ou 24 h ; réserve 0, 20 ou 50 % de l'entrepôt de la colonie (même part du gisement) ; 10 % perdus en route ; jamais au-delà de l'entrepôt de la planète mère ; un seul convoi au rattrapage |

## Code et admin
`colonies.ts`, `ColoniesPage.tsx`.

## État (audit 2026-10-06)
- Routes logistiques depuis la 5.33 (audit E6, `proposals/routes-logistiques.md`). Restent : pas de flotte basée, pas de chantier naval, pas de route inverse.
- Seuil de fondation : seuls les bâtiments construits comptent (`effectiveBuildingLevel`) depuis la 5.28.1 (C3).
