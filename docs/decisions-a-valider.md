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
| Q238 | Portraits de saison pour novembre, décembre, janvier seulement ; migration des saisons écrites (`docs/changes/6.14.93-illustrations-api-lot-2.md`) | Les commandants des mois suivants gardent le portrait du rôle principal | Valider |
| Q239 | En-têtes illustrés sur 8 pages (`docs/changes/6.14.93-illustrations-api-lot-2.md`) | Un visuel en haut de 8 pages, texte gardé lisible par le fondu | Valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
| Q233 | Séparer or/accent et violet/danger, la barre rouge devient un décor (lot TH-L5) ; thème gardé (`docs/audit/2026-10-07-au28-themes.md`) | valider |
| Q234 | Icône d'alerte obligatoire sur tout ember (lot TH-L6), sans casser le monochrome de Cockpit (`docs/audit/2026-10-07-au28-themes.md`) | valider |
| Q235 | Mesurer sur `space-600`, plus proche du fond réel des panneaux (lot TH-L4) (`docs/audit/2026-10-07-au28-themes.md`) | valider |
| Q236 | Rouge franc `#ff4433` au lieu du rose `#ff3d5a` (déjà appliqué) : ne se confond plus avec l'accent (`docs/audit/2026-10-07-au28-themes.md`) | valider |
| Q237 | Constellation pour les captures livrées ; audit des 13 thèmes (`scripts/theme-audit.mjs`) à chaque revue de fin de feuille de route (TH-L7) (`docs/audit/2026-10-07-au28-themes.md`) | valider |
| Q240 | Classes, modules, colonies : fichiers intégrés, affichage au lot suivant (`docs/changes/6.14.93-illustrations-api-lot-2.md`) | Valider |
