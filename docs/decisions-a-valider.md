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
| Q267 | Coffre de 6 à 18 h de production par ressource, coupé à la place libre de l'entrepôt, plancher 2 M ; à entrepôt plein, seulement 2 M (`docs/changes/6.14.106-plafonds-equilibre.md`) | actif 28 M → 709 M, moyen → 270 M ; quotidien à entrepôt presque plein 28 M → 8 M | valider (le quotidien perd au coffre, à surveiller en AE-L4) |
| Q268 | `exchange.weeklyRareCap` = 30 M de rares par semaine (lundi 00 h UTC), à resserrer après les mesures d'AE-L4 (`docs/changes/6.14.106-plafonds-equilibre.md`) | semaine la plus forte de l'actif 58 M → 30 M | valider |
| Q269 | S'applique aussi contre les seigneurs de guerre (pas contre les raids de faction) (`docs/changes/6.14.106-plafonds-equilibre.md`) | un joueur battu 4 fois souffle, même face aux seigneurs | valider |
| Q270 | Un mois par profil peut aller jusqu'à 20 % de sessions bloquées (au lieu de 15 %) : le quotidien passe à 16,7 % au pire mois (13,3 avant), le modèle variant de 6,7 à 23,3 % selon le tirage du coffre (`docs/changes/6.14.106-plafonds-equilibre.md`) | quotidien un peu plus bloqué un mois dans l'année | à trancher : je recommande de garder la tolérance, mais c'est un écart à une règle validée |
| Q264 | « N contrats toutes les 8 h » lit `bounties.dailyLimit` (primes par jour), comme le demandait l'audit, alors que le tableau propose 3 ou 4 contrats (`docs/changes/6.14.105-textes-de-regle-vivants.md`) | le texte peut paraître ambigu | valider, ou changer pour la formulation à deux chiffres |
| Q265 | 0 à 2 ; 0 à 0,9 pour une réduction de durée ou de taxe (`docs/changes/6.14.105-textes-de-regle-vivants.md`) | aucun | valider |
| Q266 | Carnet : « 3 points de talent » par Ascension (au lieu de « un ») ; Ordres du jour : l'Explorateur voit 4 expéditions par jour (au lieu de 3) (`docs/changes/6.14.105-textes-de-regle-vivants.md`) | les textes disent enfin la règle réelle | valider |
| Q261 | Un total différent de 100 % est refusé à l'enregistrement (pas de normalisation automatique) (`docs/changes/6.14.104-chiffres-reglables.md`) | aucun : les divisions gardent leurs parts | valider |
| Q262 | Larges : talents 0 à 0,25 par rang (réseau 0 à 2), modules 0 à 1 (voile 0 à 20), spécialisations 0,1 à 5, prix 1 à 100 000 Ambre (`docs/changes/6.14.104-chiffres-reglables.md`) | aucun ; une faute de frappe est refusée | valider |
| Q263 | Refus à l'enregistrement ; égalité permise sauf seuils stricts (bouclier < riposte, faible < fort, zone JcJ) (`docs/changes/6.14.104-chiffres-reglables.md`) | aucun, tant qu'un admin ne croise pas deux valeurs | valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
