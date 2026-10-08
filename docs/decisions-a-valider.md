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
| Q352 | Choix de palier en vacances : Refusé pendant les vacances (garde de vacances unique) (`docs/changes/6.14.142-paliers-moteur.md`) | aucun | valider |
| Q353 | Tampon de l'entrepôt : Planète mère seulement, pas de tampon dans les colonies ; non pillable, pas compté comme production perdue ; occasionnel : 1 → 2 sessions bloquées sur 20 au pire mois (sous la borne I29) (`docs/changes/6.14.143-paliers-entrepot.md`) | un peu moins de production perdue (−0,2 à −1 point) | valider |
| Q354 | Négoce (entrepôt 15) : Lecteur direct du comptoir (taxe 5 % → 3 %), pas la grandeur `tradeTax` du circuit d'effets (`docs/changes/6.14.143-paliers-entrepot.md`) | comptoir moins cher pour qui le choisit | valider |
| Q355 | Réparation d'urgence (Atelier 20) : Bouton propre « Urgence » dans l'Atelier, 2 h une fois par jour (heure de Paris), pas dans « Tout réclamer » (`docs/changes/6.14.144-paliers-atelier.md`) | une accélération gratuite par jour | valider |
| Q356 | Premiers soins et palier 5 de l'Atelier : Premiers soins (lots de 15 min ou moins) appliqués au rattrapage, pas pendant le combat ; palier 5 lu sur le prérequis de la Cale sèche (`docs/changes/6.14.144-paliers-atelier.md`) | les petites réparations rentrent seules | valider |
| Q346 | Mutateurs sans répétition : Pas de retour avant 6 mois, priorité à ceux pas vus depuis 12 mois, à partir de janvier 2027 (octobre 2026 à janvier 2027 inchangés) ; défi hebdomadaire laissé hors du registre (`docs/changes/6.14.136-mutateurs-sans-repetition.md`) | au moins 10 mutateurs distincts sur 12 mois (7 avant) | valider |
| Q347 | **Heure du changement de mois des mutateurs** : Minuit heure de Paris, été comme hiver (avant : 23 h en hiver) (`docs/changes/6.14.136-mutateurs-sans-repetition.md`) | le mutateur change une heure plus tard en hiver | valider (vérifier la bascule du 1er novembre) |
| Q348 | Variété narrative : Banques de textes réglables, anti-répétition sur 12 mois, factions des années 2 et 3, répliques des jalons du passe selon l'année ; le brouillon de novembre déjà écrit garde ses textes (`docs/changes/6.14.137-variete-narrative.md`) | répliques distinctes 56 % → 100 % sur 12 mois | valider |
| Q349 | Illustrations de saison : 64 lignes sur `/img` d'un coup (thèmes des années 2 et 3, portraits de février 2027 à octobre 2029, seconds boss) ; un brouillon déjà écrit garde l'image du thème (`docs/changes/6.14.138-illustrations-saison.md`) | plus d'images à produire sur `/img` | valider |
| Q350 | Saisons au-delà de 36 mois : Générées dès novembre 2029 en prolongeant la saison du même rang (sous-titre, nouveau commandant, second rôle), puis relues ; portraits des commandants générés (`docs/changes/6.14.139-catalogue-prolonge.md`) | pas de répétition visible sur 96 mois | valider |
| Q351 | Outil `procedural-sim.mjs` : Lancé à la main (revue de fin de feuille de route) (`docs/changes/6.14.140-procedural-sim.md`) | aucun | valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
