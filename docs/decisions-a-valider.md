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
| Q31 | Prochain système : A phalange et porte de saut lunaires, B comptoirs d'alliance, C expéditions profondes de saison (`docs/proposals/prochain-systeme.md`) | Rien n'est commencé avant ton choix | **Choisir A** : répond aux 74 % de victoires de l'attaquant, s'appuie sur la lune, réglable et désactivable |
| Q12 | Mise en production et PR hors du travail automatique | 57 commits (5.27.1 → 6.14.27) attendent, dont le plafond des PNJ (+140 % encore actif en prod) ; aucune mesure de rythme possible | **Donner le feu vert** : PR prête à rédiger, dossier `docs/release/5.27-a-6.14.md`, répétition réussie sur la pré-prod |

## 2. Joueurs et équilibre (chiffres réglables dans l'admin)

| Q | Décision appliquée | Effet pour les joueurs | Recommandation |
|:--|:--|:--|:--|
| Q32 | Décor 3D de l'accueil réservé aux grands écrans, chargé après la page | Sur mobile, l'accueil répond tout de suite (≈ 155 Ko et ≈ 10 s de processeur en moins) ; le cylindre holographique n'y apparaît plus | Valider : le décor est flouté à 60 %, presque invisible sur un petit écran |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
