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

**Emplacements de flotte (5.33)** : 10 flottes en vol à la fois (`FLEET_RULES.slotsBase`, Règles → Flottes en vol). Les sondes et les expéditions ne
comptent pas ; les garnisons, si. Le serveur compte (`fleetsActive`), le moteur refuse (`fleetSlotBlocker`). Le panneau Flottes affiche « n / 10 »
et « Relancer » renvoie la dernière mission envoyée (gardée dans le navigateur, revérifiée par le serveur).

## Code et admin
`fleets.ts`, `espionage.ts`, `expeditions.ts`, `debris.ts`, `GalaxyPage.tsx`, cron `cosmic_fleets` (chaque minute).

## État (audit 2026-10-06)
- Épave d'expédition : les vaisseaux trouvés vont dans les « prêts » de l'Atelier depuis la 5.28.1 (C1), remis en service selon la place.
- Emplacements de flotte : 10 depuis la 5.33 (audit E4, `proposals/flottes-emplacements.md`). Production : 11 flottes au plus chez un joueur. Emplacements à débloquer plus tard si l'arbitrage manque.
