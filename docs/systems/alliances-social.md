# Alliances et social

## Alliances
| Élément | Valeur |
|:--|:--|
| Taille | **6 membres** au plus ; rangs personnalisés (6), candidatures |
| Trésor | versements ≤ 20 % du stock d'une ressource, 10 par jour |
| Recherches | 4 (logistique, industrie, brouillage, bouclier), 5 niveaux, 50 M communes × 2^(n−1) |
| Projets | 3 méga-structures, 5 paliers, 500 M × 2^(n−1) |
| Garnisons | 50 % de la puissance, 1 à 24 h, 3 par hôte |
| Guerres | 3 membres min., 5 M + 5 M, préparation 12 h, 72 h |
| Territoires | 24 secteurs, +2 % par secteur (max 6 %) ; guerre de territoire un week-end sur deux |
| Saisons d'alliance | sagas mensuelles, guerres de saison, coffre de guerre |
| Quotidien | vote du matin (objectifs du jour) |
| Diplomatie | 3 pactes, préavis 24 h |

## Social
Canal global (300 caractères, 8/min), salons thématiques (30 au plus, fermés après 14 j d'inactivité), mentions, épingles, événements,
messages privés (archives), réactions, sondages, gazette quotidienne, signalements.

## Code et admin
`alliances.ts`, `allianceProfile.ts`, `allianceDaily.ts`, `allianceSaga.ts`, `allianceBoss.ts`, `wars.ts`, `territories.ts`,
`territoryWar.ts`, `seasonWars.ts`, `diplomacy.ts`, `globalChat.ts`, `messages.ts`, `gazette.ts`.

## État (audit 2026-10-06)
- **6 membres** pour autant de systèmes collectifs (guerres, territoires sur 24 secteurs, boss d'alliance, sagas) : peu de joueurs par
  alliance pour remplir tout ce contenu. Clash of Clans tient sur des clans de 50. Voir audit E5.
