# Alliances et social

## Alliances
| Élément | Valeur |
|:--|:--|
| Taille | **8 membres** de base, +4 par niveau de Quartiers fédérés (12, 16, 20 au plus, 5.33) ; rangs personnalisés (6), candidatures |
| Trésor | versements ≤ 20 % du stock d'une ressource, 10 par jour |
| Recherches | 5 : logistique, industrie, brouillage, bouclier (5 niveaux) et Quartiers fédérés (3 niveaux, +4 membres) ; 50 M communes × 2^(n−1), 12 h × n |
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
- Taille : 8 membres de base et jusqu'à 20 avec Quartiers fédérés depuis la 5.33 (audit E5, `proposals/alliances-grandes.md`). Boss d'alliance
  déjà proportionnel (PV = puissance des membres actifs, coût = heures de production de chaque membre). Territoires et garnisons à relever si
  une alliance dépasse 12.

## Revue AU5 (2026-10-07)
Rapport `docs/audit/2026-10-07-au5-alliances.md`. Depuis la 6.9.2 : départ, exclusion, déclaration de guerre et reddition confirmés ;
`alliances.maxDiplomats` (2) et `allianceChallenge.rewardHours` (6, 4, 2) réglables. Toutes les règles du domaine sont dans l'admin
(groupes `alliances`, `wars`, `territoryWar`, `allianceBoss` et registre 6.9.1 : objectif du jour, fiche, saga, diplomatie, territoires,
guerres de saison, coffre de guerre).

## Revue AU6 (2026-10-07)
Rapport `docs/audit/2026-10-07-au6-communications.md` : blocage et suppression confirmés (6.9.3) ; règles du canal, des salons, de la messagerie, des sondages et de la gazette réglables (registre 6.9.1).
