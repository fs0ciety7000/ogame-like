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
| Q122 | Astuces de page gardées sur le compte (Q93) : où les enregistrer ? : Dans la liste `announcementsSeen` déjà partagée, avec des identifiants `tip:<page>` (aucun changement de moteur ni de schéma) | Écran mobile et accueil du joueur | Valider (option prudente) |
| Q123 | « Réafficher les astuces » (Réglages) : Ne vaut que pour l'appareil (aucune action ne retire une vue du compte) | Écran mobile et accueil du joueur | Valider (option prudente) |
| Q124 | Prise en main réduite (Q96) : Réutilise le drapeau `hidden` déjà enregistré sur le compte (`hideOnboarding` inchangée) | Écran mobile et accueil du joueur | Valider (option prudente) |
| Q125 | Plein écran sur téléphone : Retiré de l'en-tête, déplacé dans le menu « Plus » | Écran mobile et accueil du joueur | Valider (option prudente) |
| Q126 | Libellé « Serveur de test » à 375 px : Tronqué ; l'icône et l'infobulle gardent le sens | Écran mobile et accueil du joueur | Valider (option prudente) |
| Q127 | Liste des objectifs de la Prise en main : Repliée par défaut, à toutes les largeurs | Écran mobile et accueil du joueur | Valider (option prudente) |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
