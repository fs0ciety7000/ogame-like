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
| Q202 | Tons des pastilles du menu : Ordres du jour en or, Léviathan en violet, signalements en orange, lectures en neutre ; aucune pastille rouge aujourd'hui (`BADGE_TONE`) | Finitions de l'interface | Valider (option prudente) |
| Q203 | Cloche des notifications : Rouge seulement pour une attaque subie ou un espion détecté non lus ; compteurs des onglets neutres | Finitions de l'interface | Valider (option prudente) |
| Q204 | Réglages sur mobile : Onglets en grille 2 × 2 ; adresse e-mail coupée n'importe où (`break-all`) | Finitions de l'interface | Valider (option prudente) |
| Q205 | Ctrl+K : actions impossibles : Gardées en fin de liste, grisées avec leur raison ; l'Ambre d'une techno n'est pas vérifiée (le serveur juge) ; joueur, alliance et techno en accent, réclamations en or | Finitions de l'interface | Valider (option prudente) |
| Q206 | Animation des flottes de la Galaxie : Un rendu par seconde, glissement par transition CSS | Finitions de l'interface | Valider (option prudente) |
| Q207 | Coût d'un projet de prestige : Calculé sur la production des extracteurs et technos, sans bonus d'Ascension, reliques, événements ni alliance (prix stable, jamais plus de 8 h de la vraie production) | Projets de prestige | Valider (option prudente) |
| Q208 | Annuler un projet de prestige : Impossible une fois lancé (la confirmation le dit) | Projets de prestige | Valider (option prudente) |
| Q209 | Plusieurs projets en même temps : Non : un seul à la fois, fixé par l'invariant I32 (pas de réglage `maxConcurrent`) | Projets de prestige | Valider (option prudente) |
| Q210 | Désactiver les projets (`enabled` à faux) : Ferme les nouveaux projets ; un projet en cours se termine ; compteur et succès restent | Projets de prestige | Valider (option prudente) |
| Q211 | Points d'un projet achevé : Ceux du réglage au moment où il s'achève | Projets de prestige | Valider (option prudente) |
| Q212 | Ouverture de la page Prestige : Par sa condition seulement (4 extracteurs niveau 10), sans rang plafond | Projets de prestige | Valider (option prudente) |
| Q213 | Récompense visible : Monument réglable (seuil et nom, Stèle à 1 projet jusqu'à Merveille du secteur à 1000) plutôt qu'une bannière de profil | Projets de prestige | Valider (option prudente) |
| Q214 | Succès des projets de prestige : Récompenses habituelles des succès (XP, heures de production) ; le projet lui-même ne donne aucun bonus | Projets de prestige | Valider (option prudente) |
| Q215 | Reportés : Thème de projet par saison, projet d'alliance, défi du passe « Lance 3 projets », défi d'alliance, annonce en modale (avec RL-3) | Projets de prestige | Valider (option prudente) |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
