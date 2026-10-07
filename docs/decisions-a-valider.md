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
| Q164 | 1re Ascension : ≈ 3 mois pour l'actif et 4,5 à 6 pour l'occasionnel (écart ×1,4), ou 3–4 mois pour l'actif et 5–6 pour le moyen (écart ×2) ? : ≈ 3 mois, freiné par la **durée** (aucun mur) | Rythme sur des mois (Ascension, recherche, projets de prestige) | Valider (recommandé par l'étude) |
| Q165 | Durée du dernier niveau du second palier : ≈ 10 jours ? : 30 h + 24 h par niveau (niveau 20 : 246 h) | Rythme sur des mois (Ascension, recherche, projets de prestige) | Valider (recommandé par l'étude) |
| Q166 | Recherche : facteur sur les niveaux tardifs, ou croissance globale plus forte ? : ×30 dès le niveau 6, 7 jours au plus par niveau | Rythme sur des mois (Ascension, recherche, projets de prestige) | Valider (recommandé par l'étude) |
| Q167 | Ascension : délai de 30 jours et maximum 10 ? : oui (une par saison, ≈ 18 mois de cycles pour l'actif) | Rythme sur des mois (Ascension, recherche, projets de prestige) | Valider (recommandé par l'étude) |
| Q168 | Projets de prestige : récompense seulement visible, ou petit bonus ? : visible seulement (classement, bannières, monument, succès) | Rythme sur des mois (Ascension, recherche, projets de prestige) | Valider (recommandé par l'étude) |
| Q169 | Ordre de livraison : projets avant la bascule du rythme ? : oui : RL-2 (projets) puis RL-3 (bascule au début d'un mois, annonce une semaine avant) | Rythme sur des mois (Ascension, recherche, projets de prestige) | Valider (recommandé par l'étude) |
| Q170 | Coût du second palier croissant à chaque Ascension (option B) ? : non (crée un mur : jusqu'à 95 % de sessions bloquées) ; les cycles raccourcissent un peu, comme dans un jeu à prestige | Rythme sur des mois (Ascension, recherche, projets de prestige) | Valider (recommandé par l'étude) |
| Q171 | Entrepôt du début : l'occasionnel perd 33 à 42 % de sa production le premier mois : mesurer d'abord (RL-4) | Rythme sur des mois (Ascension, recherche, projets de prestige) | Valider (recommandé par l'étude) |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
