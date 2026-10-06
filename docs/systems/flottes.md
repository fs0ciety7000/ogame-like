# Flottes, espionnage, expéditions

## Règles et chiffres
| Élément | Valeur |
|:--|:--|
| Carte | 100 × 100 (distance max ≈ 141) |
| Trajet | 5 min + 3 min × distance / vitesse ; attaque plafonnée à 90 min |
| Missions de flotte | attaque, transport, livraison, garnison (1 à 24 h, 3 par hôte), patrouille (30 à 480 min), recyclage, expédition, repaire, prime, boss |
| Espionnage | sondes ; 1 min + 0,5 min × distance ; détection 10 % + 10 %/point d'écart (5 à 75 %) ; paliers du rapport 0/2/4/6 |
| Expéditions | 10 vaisseaux min., 2/4/8 h, 3 par jour ; gisement 35, rien 15, trésor 15, embuscade 15, faction 10, épave 10 (poids) ; en chaîne jusqu'à 3 étapes de plus |
| Débris | 30 % du coût, 48 h, drones récupérateurs (soute) |

**Pas de limite d'emplacements de flotte** (OGame : emplacements liés à la technologie Ordinateur).

## Code et admin
`fleets.ts`, `espionage.ts`, `expeditions.ts`, `debris.ts`, `GalaxyPage.tsx`, cron `cosmic_fleets` (chaque minute).

## État (audit 2026-10-06)
- Épave d'expédition hors plafond de hangar (audit C1).
- Absence d'emplacements de flotte : rien ne limite le nombre de flottes simultanées (audit E4).
