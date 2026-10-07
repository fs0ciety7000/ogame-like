# Proposition : feuille de route d'automne 2029

Statut : **en cours** (2026-10-07, clôture d'AU23 : `docs/audit/2026-10-07-au23-ete-2029.md`). Règle n° 3 : jamais de pause ;
production, `main` et PR sautés (Q12).

## Planning

| # | Lot | Contenu | Taille | État |
|:--|:--|:--|:--|:--|
| 0 | PP-1 | Pré-prod `test.fs0ciety.org` : procédure (`docs/preprod.md`), script de nettoyage de la copie, e-mails coupés par variable, bandeau « Serveur de test » (demande de l'utilisateur, Q22) | M | livré en 6.14.8 |
| 0b | PP-2 | Pré-prod déployée par Coolify depuis la branche (`Dockerfile.preprod`, un seul conteneur) ; chaîne de contenu (`WORKFLOW.md` §7, règle n° 4) ; tout passe par la pré-prod (demande de l'utilisateur) | M | livré en 6.14.9 |
| 0c | C1 | Proposition `chaine-contenu.md` puis garde : test qui liste les maillons manquants (Codex des bâtiments et technos, succès par contenu, porteurs d'effets) et lots de rattrapage | M | livré en 6.14.11 (4 manques connus, rattrapés en C2 à C4) |
| 0d | C2 | Codex : entrées automatiques des 13 bâtiments et des 30 technos (débloquées par le joueur), garde `contentChain.test.ts` mise à jour | M | livré en 6.14.12 (Q24) |
| 0e | C3 | Préréglages d'effet pour les 10 unités qui n'en ont pas (`effectCatalog.ts`) | S | livré en 6.14.13 (Q25) |
| 0f | C4 | Mesure « boss d'alliance affrontés » et succès d'entrée | S | à faire |
| 1 | A29-1 | Inventaire des constats ouverts des revues AU1 à AU23 (`docs/audit/constats-ouverts.md`) : faisable seul, attend Z1 (pré-prod), attend l'utilisateur (ET29-3) ; plus la liste des contenus déjà livrés sans succès, entrée de Codex ou image définitive (CLAUDE.md règle n° 4) | M | à faire |
| 2 | A29-2 | Premier constat « faisable seul » de l'inventaire | selon le constat | à faire |
| 3 | Z1 | Mesures réelles **sur la pré-prod** (copie de la prod) : PRG-1, BOSS-2, commerce, bases, paliers bonus, lunes ; réponses à Q2, Q18, Q21 | M | accès ouvert et copie nettoyée (6.14.11) : à faire après C4 |
| 4 | Z0, Z6 | Mise en production, performance | — | en attente de l'utilisateur (Q12) |
| 5 | AU24 | Revue, même grille | M | fin des lots |
