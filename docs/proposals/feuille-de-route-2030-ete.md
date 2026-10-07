# Proposition : feuille de route d'été 2030

Statut : **en cours** (2026-10-07, clôture d'AU26 : `docs/audit/2026-10-07-au26-printemps-2030.md`). Règle n° 3. Mise en production
écartée pour l'instant (Q12, 2026-10-07 : « on a encore beaucoup de choses à faire ») : on enrichit le jeu sur la pré-prod.
Cette feuille de route s'affiche sur `/decisions` (onglet « Feuille de route », 6.14.41) : chaque lot s'y valide ou s'y modifie, et
une action ajoutée par l'utilisateur devient un lot ici (son identifiant `A…` est cité dans la ligne, ce qui la marque traitée).

## Planning

| # | Lot | Contenu | Taille | État |
|:--|:--|:--|:--|:--|
| 1 | É30-2 | Z6 sur la pré-prod : poids du JavaScript au démarrage, temps d'affichage de l'accueil et des pages lourdes (375 px et bureau), comparés aux mesures de 6.9.10 ; une piste chiffrée si un seuil est dépassé | M | livré (6.14.39) |
| 2 | É30-1 | Phalange et porte de saut lunaires (Q31 validée, option A) : proposition `docs/proposals/phalange-porte-de-saut.md` (Q33 à Q41), en 5 lots ci-dessous | L | en cours |
| 2a | É30-1a | Moteur pur et tests : `phalanx.ts`, `jumpGate.ts`, pitié lunaire, stats `phalanxRange` et `jumpGateCooldown`, registre des règles, invariants I21 à I23 | S à M | livré (6.14.44) |
| 2b | É30-1b | Serveur : routes `moon/phalanx`, `moon/scan`, `fleet/jump`, radar d'alliance au lancement, niveau de lune public, schéma, intégration | M | livré (6.14.48) |
| 2c | É30-1c | Interface : lune, alerte de raid, jauge de menace, bouton « Saut », alliés menacés, portée dans la Galaxie ; audit DESIGN et 375 px | M | à faire |
| 2d | É30-1d | Admin et chaîne de contenu : réglages et santé, 2 reliques, succès, Codex, titre, défi d'alliance, 5 prompts sur `/img`, changelog, billet, annonce | M | à faire |
| 2e | É30-1e | Essai sur la pré-prod, audit, fiches et GDD | S | à faire |
| 3 | É30-3 | Illustrations : intégration au fil des envois (routine horaire), annonce 6.14 publiée avec son image | selon envois | attend l'utilisateur (`/img`) |
| 4 | É30-4 | Feuille de route sur `/decisions` : lots à valider ou modifier, actions à ajouter, plans en cours ; Q12 écartée | S | livré (6.14.41) |
| 5 | É30-5 | Performance, suite de 6.14.39 : stabilité sur mobile (CLS p75 0,7, `PERF_SHIFTS=1`), LCP de la Galaxie (8,4 s mobile), images du Codex chargées à la demande (6 à 8 Mo) | M | à faire |
| 6 | É30-6 | Rythme des succès (PRG-5 : médiane 70 sur 178 en une semaine) : proposition chiffrée de paliers plus étalés, sans retirer un succès gagné | M | à faire |
| 7 | É30-7 | Reliques qui partagent une image (`sceau_sentinelle`, `plaque_bastion` et deux autres paires) : prompts propres, lignes sur `/img` | S | à faire |
| 8 | AU27 | Revue, même grille | M | fin des lots |
| — | Z0 | Mise en production | — | écartée pour l'instant (Q12) |
