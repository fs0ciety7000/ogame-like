# Proposition : prochain système de jeu (Q15 → Q31)

Statut : **choix fait** (2026-10-07) : l'utilisateur a validé **A** sur `/decisions` (Q31). Suite dans
`docs/proposals/phalange-porte-de-saut.md` (lot É30-1). B (comptoirs d'alliance) reste la piste suivante.

## 1. Ce que disent les chiffres (Z1, copie de la production)

| Constat | Mesure | Lecture |
|:--|:--|:--|
| Le défenseur subit | l'attaquant gagne **74 %** des combats JcJ (30 j) ; **86 %** des joueurs ont du stock pillable | se défendre ne se joue pas : on encaisse |
| Le commerce dort | **1,1** échange par joueur et par semaine ; pot commun alimenté à 96 % par l'admin | peu de raisons d'échanger entre joueurs |
| Les joueurs pacifiques manquent de buts | 46 expéditions en 30 jours, dont **1** profonde (2 %) | l'exploration ne retient pas |

## 2. Benchmark

| Jeu | Défense active | Échanges | Exploration |
|:--|:--|:--|:--|
| OGame | phalange (voir les flottes en approche), porte de saut, missiles interplanétaires | marchand, échanges de flotte | expéditions à risque |
| Clash of Clans | replays de défense, bouclier après défaite | dons de troupes de clan | campagne solo |
| Gestion mobile | alerte d'attaque et « bouclier » payant | marché à commandes | événements d'exploration à paliers |

## 3. Options

| | Système | Le joueur peut… | Taille | Risques | Données touchées |
|:--|:--|:--|:--|:--|:--|
| **A** | **Phalange et porte de saut lunaires** (lunes, lot 2) | voir les flottes hostiles en approche jusqu'à 30 min plus tôt (phalange, portée selon le niveau de lune) ; faire passer une flotte de défense de la planète mère à une colonie en un saut (recharge 24 h) | M (3 lots) | équilibre JcJ : l'attaquant perd la surprise (réglable, désactivable) | `moon` (niveaux existants), aucune nouvelle collection |
| **B** | **Comptoirs d'alliance** (marché interne) | poser des ordres réservés à son alliance, sans taxe du pot commun, avec un objectif hebdomadaire d'échanges qui rapporte au coffre | M (3 lots) | contournement du pot commun (plafonds par semaine) | `market_offers` (champ `allianceId`), règles du pot |
| **C** | **Expéditions profondes de saison** | partir à plusieurs sur une carte d'anomalies à paliers (1 à 10), avec un butin qui monte et un risque d'embuscade partagé | L (4 à 5 lots) | équilibre du butin, charge serveur (tâche des expéditions) | `fleets.expedition`, nouvelle section de règles |

## 4. Recommandation : A

- Répond au constat le plus fort (74 % de victoires de l'attaquant, 86 % de joueurs exposés) par du jeu, pas par un chiffre en moins.
- S'appuie sur la lune déjà livrée (niveaux 1 à 5), donc peu de code nouveau et aucune donnée existante transformée.
- Tout est réglable (portée, recharge, coût) et désactivable dans Admin → Règles → Lunes.
- B ensuite : le commerce reste faible, mais la mesure attend la mise en production (règle du pot en prod).

Chiffres de départ proposés pour A, à affiner dans le lot 1 :
- phalange : portée **10 min par niveau de lune** (50 min au niveau 5), alerte dans le Journal et notification ;
- porte de saut : niveau de lune **3** requis, recharge **24 h**, flotte de défense seulement (pas d'attaque depuis la porte).
