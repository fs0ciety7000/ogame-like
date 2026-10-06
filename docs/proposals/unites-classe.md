# Proposition : vaisseaux de classe (lot P, J.2)

Statut : **livrée** en 6.5.0, voir `docs/changes/6.5.0-vaisseaux-classe.md` (soute du Croiseur de raid ramenée à 90, voir §5).
Lot P de `docs/proposals/feuille-de-route-2026-hiver.md` ; suite de `classes-empire.md` (J.2).

## 1. Le problème vu par le joueur
La classe d'empire (6.0) donne des pourcentages, mais rien de visible dans le hangar. Un vaisseau propre à chaque classe rend le choix concret.

## 2. Principes
- Un vaisseau par classe, constructible **seulement** dans cette classe (en plus de sa technologie).
- Il fait mieux une chose, jamais tout : il ne doit dominer aucune unité de sa catégorie (`balance.test.ts`).
- Changer de classe ne retire rien : les vaisseaux déjà construits restent et volent ; on ne peut juste plus en construire.

## 3. Chiffres proposés
Comparaison avec les unités existantes (coût en ferraille / énergie, stats de base).

| Unité | Classe | Coût | Attaque | Défense | Vitesse | Soute | Places | Rôle |
|:--|:--|:--|--:|--:|--:|--:|--:|:--|
| Cargo (référence) | toutes | 1 200 / 300 | 50 | 10 | 3 | 50 | 1 | transport |
| **Récolteur** | Industriel | 2 500 / 1 000 | 40 | 60 | 4 | 160 | 2 | 80 de soute par place (cargo : 50) ; recyclage des champs de débris ×1,25 |
| Chasseur (référence) | toutes | 1 500 / 800 | 245 | 10 | 8 | 5 | 2 | combat |
| **Croiseur de raid** | Seigneur de guerre | 6 000 / 3 500 | 600 | 150 | 9 | 90 | 5 | 120 d'attaque par place (chasseur : 122) et 18 de soute par place : le pillage sans escorte de cargos |
| Sonde (référence) | toutes | 300 / 150 | 0 | 2 | 20 | 0 | 1 | espionnage |
| **Éclaireur lointain** | Explorateur | 1 500 / 1 000 | 60 | 40 | 24 | 30 | 1 | le plus rapide du jeu ; expéditions −15 % de durée s'il est dans la flotte |

Déblocage : la classe, plus une technologie existante (Récolteur : tech du recyclage ; Croiseur de raid : celle du chasseur ; Éclaireur :
celle des sondes). Niveaux 1 à 10 comme les autres unités.

## 4. Options écartées
- Bonus en pourcentage supplémentaire par classe : déjà fait en 6.0, invisible.
- Unité de classe très puissante : la classe deviendrait obligatoire (règle « aucune unité dominée »).

## 5. Questions tranchées (2026-10-06)
1. Soute du Croiseur de raid : **90** (180 au pillage). Décidée à 150, ramenée à 90 à l'implémentation : à 150, il « écrasait » le Bastion et le Brise-Rempart selon l'invariant « aucune unité dominée » (`balance.test.ts`). À 90 (18 par place), il garde la meilleure soute par place des vaisseaux de combat (Croiseur Nova : 15).
2. Bonus de rôle : **oui**, un par vaisseau, liés à la flotte (pas au circuit d'effets de l'empire) : recyclage +25 % pour le Récolteur, expédition −15 % s'il y a un Éclaireur lointain. Le Croiseur de raid n'en a pas : sa soute suffit.

## 6. Après validation
Unités dans `units.ts`, verrou de classe (moteur et serveur), `appendFromDefaults` dans `CONTENT_MIGRATIONS`, tests d'équilibre, fiches.
