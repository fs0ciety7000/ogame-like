# Décisions à valider (synthèse de `docs/QUESTIONS.md`)

Lot H29-4 (6.14.28), constat AU29-5. Le 2026-10-07, 24 questions étaient ouvertes. Pour chacune, le choix fait seul (règle n° 3), son
effet et ma recommandation. Réponse rapide possible : « je valide tout sauf Qx, Qy ». Une décision changée devient un lot. Une décision
validée passe au statut « validée » dans `QUESTIONS.md`.

Page de réponse : **`/decisions`** dans le jeu (`test.fs0ciety.org/decisions`, `empire.fs0ciety.org/decisions` après la mise en
production), réservée aux admins du jeu. Elle lit `QUESTIONS.md` et ce fichier au build. Les réponses sont gardées dans la collection
`decision_answers` ; Claude les relit avec `node scripts/decisions.mjs`. **Chaque nouvelle question ouverte ajoute sa ligne ici**
(groupe, effet, conseil) : un test l'exige. L'artifact « Décisions à valider » de 6.14.28 est remplacé par cette page.

## 1. Bloquante

| Q | Décision | Effet | Recommandation |
|:--|:--|:--|:--|

## 2. Joueurs et équilibre (chiffres réglables dans l'admin)

| Q | Décision appliquée | Effet pour les joueurs | Recommandation |
|:--|:--|:--|:--|
| Q109 | Ember de Constellation : la teinte proposée par l'audit (`#e8a23a`) se confond avec l'or : `#e0802c` (orange de la bande du thème) | Couleurs et accueil (design UI/UX) | Valider (option prudente) |
| Q110 | Accent de Constellation (accent ≠ texte) : Sable `#d6c49a` ; l'onglet actif garde son soulignement | Couleurs et accueil (design UI/UX) | Valider (option prudente) |
| Q111 | Bouton « Créer mon empire » sur l'accueil : `secondary` : « Connexion » reste le seul bouton plein | Couleurs et accueil (design UI/UX) | Valider (option prudente) |
| Q112 | Confusions de couleurs voulues des autres thèmes (Cockpit monochrome, Holo, Netrunner, Matrice…) : Gardées telles quelles, figées dans la garde `themeTokens.test.ts` | Couleurs et accueil (design UI/UX) | Valider (option prudente) |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
| Q104 | Campagne d'e-mails : comment protéger la fiche du joueur ? : Jetons de désinscription créés avant l'envoi (transaction, seul champ écrit) ; aucune migration des jetons sur la production | Valider (option prudente) |
| Q105 | Envoi « à blanc » de l'admin : Il crée les jetons manquants (seul champ touché) et en rend le nombre ; pause `holdMs` (5 s au plus, admin) pour les tests | Valider (option prudente) |
| Q106 | Destinataire supprimé pendant une campagne : Il ne reçoit rien et compte comme un échec | Valider (option prudente) |
| Q107 | Livreur qui abandonne un contrat de commerce : Son rattrapage n'est pas sauvé, donc pas notifié (sinon notifié deux fois au rattrapage suivant) | Valider (option prudente) |
| Q108 | Texte « Enchère annulée » (vendeur supprimé par l'admin) : Sur le modèle d'« Enchère dépassée » | Valider (option prudente) |
| Q71 | Talents, classes, mutateurs, modules : chiffres seulement dans le registre (petit), ou sections de contenu complètes (ajout et retrait) ? : **Chiffres d'abord (AA3)**, sections ensuite (AA7, AA9). Les ids restent stables, il n'y a rien à migrer chez les joueurs | Valider (option recommandée par l'audit) |
| Q72 | Tutoriel, accueil, guide avancé, annonces de version : réglables dans l'admin ? : **Non pour l'instant** : ce sont des textes d'interface livrés avec une version (et l'admin crée déjà des annonces personnalisées). À revoir si l'équipe veut éc | Valider (option recommandée par l'audit) |
| Q73 | Bornes des effets de techno (`EFFECT_MAX_PER_LEVEL`) et plafonds : réglables ? : **Plafonds oui** (déjà dans `effectCaps`), **bornes de validation non** : elles protègent les invariants I9 et `TECH_COMBAT_CAP` contre une erreur de saisie | Valider (option recommandée par l'audit) |
| Q74 | Rôles d'unités (AA-16) : drapeau `roles` dans la fiche d'unité, ou ids dans un groupe de règles (`SPY_RULES.probeUnitId`, `debris.recyclerUn : **Drapeau dans la fiche** : une unité ajoutée prend son rôle d'une case à cocher, et les deux champs actuels deviennent des valeurs de repli | Valider (option recommandée par l'audit) |
| Q75 | Validation renforcée (AA1) : refuser, ou seulement avertir, les valeurs hors bornes ? : **Refuser** les types et formes invalides ; **avertir** (sans bloquer) au-delà de ×2 / ÷2 du défaut. C'est le plus prudent pour les données des joueurs, sans br | Valider (option recommandée par l'audit) |
| Q76 | Quelle trace au Journal pour les réclamations ? : **B**, en `read: true` (pas de toast ni de pastille en plus, comme le défi hebdomadaire) | Valider (option recommandée par l'audit) |
| Q77 | Que deviennent les échéances pendant une maintenance ? : **B** : les flottes continuent (sinon un afflux à la réouverture), les rendez-vous collectifs sont décalés | Valider (option recommandée par l'audit) |
| Q78 | Suppression de compte par le joueur : **A** maintenant (ferme le contournement d'AC-3) ; B plus tard si des joueurs le demandent | Valider (option recommandée par l'audit) |
| Q79 | Que permet-on en vacances ? : **A**, liste blanche = les 8 actions actuelles + lecture (phalange sans balayage, Codex consultable) | Valider (option recommandée par l'audit) |
| Q80 | Clé d'idempotence pour les envois non répétables ? : **B** pour l'instant (aucun incident relevé), à rouvrir si un double envoi est signalé | Valider (option recommandée par l'audit) |
| Q81 | Rythme du heartbeat : mesurer d'abord (Z6), puis **C** si l'écriture domine | Valider (option recommandée par l'audit) |
