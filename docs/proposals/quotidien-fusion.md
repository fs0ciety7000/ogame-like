# Proposition : contrats et missions du jour fusionnés (lot N)

Statut : **livrée** en 6.2.1, voir `docs/changes/6.2.1-quotidien-fusion.md` (4 objectifs, minuit heure de Paris).
Suite de l'option 2 de `docs/proposals/journal-de-bord.md` (constat Q1). Lot N de `docs/proposals/feuille-de-route-2026-hiver.md`.

## 1. Constat

> « Trois contrats, trois missions, deux listes, deux séries, deux heures de remise à zéro. »

Aujourd'hui, deux systèmes quotidiens cohabitent sur Ordres du jour (`contracts.ts`, `dailyMissions.ts`) :

| | Contrats du jour | Missions du jour |
|:--|:--|:--|
| Nombre | 3, tirés pour chaque joueur | 3, les mêmes pour tous |
| Remise à zéro | minuit UTC (2 h, Paris) | minuit, Paris |
| Récompense | 120 rares × échelle × (1 + série) et 20 XP chacun | 1 jeton chacune, +2 jetons pour les trois |
| Bonus | série (+10 %/jour, max +50 %), coffre tous les 7 jours, 1 relance par jour | aucun |
| Par jour (base) | 360 rares × échelle, 60 XP | 5 jetons |

## 2. Recommandation : **4 ordres du jour**

- **4 objectifs par jour**, tirés pour chaque joueur dans une seule liste :
  - les 8 types de contrats ;
  - plus « lancer des sondes » et « acheter au marché », qui viennent des missions.
- **Remise à zéro à minuit, heure de Paris**, pour tout.
- Chaque objectif rapporte :
  - **90 rares** × échelle × (1 + série) ;
  - **15 XP** ;
  - **1 jeton**.
- Les **4** objectifs faits : **+1 jeton**, la série avance.

| Par jour (base) | Avant | Après |
|:--|:--|:--|
| Ressources rares | 360 × échelle | 360 × échelle |
| XP | 60 | 60 |
| Jetons | 5 | 5 |

- On garde la **série** (+10 % par jour, +50 % au plus), le **coffre tous les 7 jours** et **1 relance par jour**.
- Le défi du passe « Contrats du jour récupérés » compte chaque ordre réclamé, comme avant.
- « Tout réclamer » et la pastille unique couvrent les ordres, comme aujourd'hui.

## 3. Bascule

- Le jour du déploiement, la série de contrats en cours est conservée.
- Les contrats et missions du jour en cours sont remplacés par les 4 ordres au premier passage après la mise à jour. Une récompense prête
  mais non réclamée est versée automatiquement avant le remplacement, pour que personne ne perde rien.

## 4. Invariants et tests

- Totaux journaliers égaux avant et après (test sur les récompenses de base).
- Une récompense prête n'est jamais perdue à la bascule (test).

## 5. Questions ouvertes

1. 4 ordres par jour, ou 5 (plus de jetons, à rééquilibrer) ?
2. Remise à zéro à minuit, heure de Paris : d'accord ?
