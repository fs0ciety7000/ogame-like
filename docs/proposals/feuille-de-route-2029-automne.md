# Proposition : feuille de route d'automne 2029

Statut : **close** (2026-10-07, AU24 : `docs/audit/2026-10-07-au24-automne-2029.md`), suite dans `feuille-de-route-2029-hiver.md`. Ouverte à la clôture d'AU23 (`docs/audit/2026-10-07-au23-ete-2029.md`). Règle n° 3 : jamais de pause ;
production, `main` et PR sautés (Q12).

## Planning

| # | Lot | Contenu | Taille | État |
|:--|:--|:--|:--|:--|
| 0 | PP-1 | Pré-prod `test.fs0ciety.org` : procédure (`docs/preprod.md`), script de nettoyage de la copie, e-mails coupés par variable, bandeau « Serveur de test » (demande de l'utilisateur, Q22) | M | livré en 6.14.8 |
| 0b | PP-2 | Pré-prod déployée par Coolify depuis la branche (`Dockerfile.preprod`, un seul conteneur) ; chaîne de contenu (`WORKFLOW.md` §7, règle n° 4) ; tout passe par la pré-prod (demande de l'utilisateur) | M | livré en 6.14.9 |
| 0c | C1 | Proposition `chaine-contenu.md` puis garde : test qui liste les maillons manquants (Codex des bâtiments et technos, succès par contenu, porteurs d'effets) et lots de rattrapage | M | livré en 6.14.11 (4 manques connus, rattrapés en C2 à C4) |
| 0d | C2 | Codex : entrées automatiques des 13 bâtiments et des 30 technos (débloquées par le joueur), garde `contentChain.test.ts` mise à jour | M | livré en 6.14.12 (Q24) |
| 0e | C3 | Préréglages d'effet pour les 10 unités qui n'en ont pas (`effectCatalog.ts`) | S | livré en 6.14.13 (Q25) |
| 0f | C4 | Mesure « boss d'alliance affrontés » et succès d'entrée | S | livré en 6.14.14 (Q26) : garde sans manque connu |
| 1 | PP-3 | Pré-prod : adresses absolues des fichiers de la prod (`base.fs0ciety.org/api/files/…`) réécrites vers la pré-prod dans la configuration copiée (les fichiers sont dans la sauvegarde) ; étape ajoutée à `preprod-scrub.mjs` (constat 6.14.14) | S | livré en 6.14.15 |
| 2 | Z1 | Mesures réelles **sur la pré-prod** (copie de la prod, agrégats anonymes) : PRG-1 (points du passe), BOSS-2 (boss abattus), commerce, bases avancées, paliers bonus, lunes, Codex ; réponses à Q2, Q3, Q18, Q21 ; rapport `docs/audit/2026-10-07-z1-mesures.md` ; script réutilisable `scripts/preprod-measure.mjs` | M | livré en 6.14.16 (Q3 close ; constat Z1-b → Z1-2) |
| 3 | Z1-2 | Ajustements tirés des mesures (lots prudents, réglages de l'admin d'abord) ; une ligne par décision dans `QUESTIONS.md` | S | livré en 6.14.17 : Codex dans « Tout réclamer » (Q27) ; aucun autre chiffre ne justifie un ajustement prudent |
| 4 | A29-1 | Inventaire des constats ouverts des revues AU1 à AU23 (`docs/audit/constats-ouverts.md`) : faisable seul, réglé par Z1, attend l'utilisateur ; plus les contenus livrés sans image définitive (CLAUDE.md règle n° 4) | M | livré en 6.14.18 (`docs/audit/constats-ouverts.md`) |
| 5 | A29-2 | Santé de l'équilibre complétée (premiers constats « faisable seul » de l'inventaire) : casino et pot commun (COM-3), unités d'élite débloquées (PNJ-5), repaires et raids repoussés (PNJ-4), succès par semaine (PRG-5) | M | livré en 6.14.19 |
| 6 | Z0, Z6 | Mise en production, performance | — | en attente de l'utilisateur (Q12) |
| 7 | AU24 | Revue, même grille ; clôture de l'automne 2029 et feuille de route suivante | M | livré en 6.14.20 |

Révision du 2026-10-07 (après C4, demande de l'utilisateur : « adapte le plan ») : Z1 avance avant l'inventaire, car l'accès à la
pré-prod est ouvert et ses chiffres règlent une partie des constats ; PP-3 ajouté (constat de la vérification de C2).
