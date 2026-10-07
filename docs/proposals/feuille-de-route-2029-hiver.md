# Proposition : feuille de route d'hiver 2029

Statut : **en cours** (2026-10-07, clôture d'AU24 : `docs/audit/2026-10-07-au24-automne-2029.md`). Règle n° 3 : jamais de pause ;
production, `main` et PR sautés (Q12), mais préparés.

## Planning

| # | Lot | Contenu | Taille | État |
|:--|:--|:--|:--|:--|
| 1 | H29-1 | Dossier de mise en production (`docs/release/5.27-a-6.14.md`) : lots depuis 5.27.0, migrations et données touchées, risques, ordre de déploiement (hooks, schéma, front), vérifications après déploiement, retour arrière ; essai de la migration complète sur la pré-prod (copie de la prod) | M | à faire |
| 2 | H29-2 | Tests d'intégration : lectures sans tri (AU29-3) triées ou cherchées par critère | S | livré en 6.14.21 |
| 3 | H29-3 | Codex : Seigneurs et Boss dans « Tout réclamer » côté serveur (données des seigneurs affrontés et du Hall of fame), pastille unique tenue (AU29-4, Q27) | M | à faire |
| 4 | H29-4 | Synthèse des décisions à valider (`docs/decisions-a-valider.md`) : une ligne par question ouverte, choix appliqué, conséquence, option recommandée (AU29-5) | S | à faire |
| 5 | Z0, Z6 | Mise en production, performance | — | en attente de l'utilisateur (Q12), facilité par H29-1 |
| 6 | AU25 | Revue, même grille ; inventaire `constats-ouverts.md` repris | M | fin des lots |
