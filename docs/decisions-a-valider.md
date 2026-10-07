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
| Q225 | Rythme après le 1er novembre : niveau 11 en 36 h, +27 h par niveau, recherche tardive dès le niveau 7 ×25 (`docs/changes/6.14.89-reglage-fin-rythme.md`) | 1re Ascension J91 (actif) à J133 (occasionnel) ; plus de mur de recherche après l'Ascension en simulation | valider |
| Q226 | Marge du joueur quotidien : 13,3 % de sessions bloquées (cible 15 %) (`docs/proposals/rythme-long-terme.md`) | une session par mois sans action utile au pire mois | valider, mesurer en RL-4 |
| Q227 | Aucun levier nouveau (Entrepôt gardé à l'Ascension écarté) (`docs/proposals/rythme-long-terme.md`) | l'Ascension remet l'Entrepôt au niveau 1, comme avant | valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
| Q228 | Séparer or/accent et violet/danger, la barre rouge devient un décor (lot TH-L5) ; thème gardé (`docs/audit/2026-10-07-au28-themes.md`) | valider |
| Q229 | Icône d'alerte obligatoire sur tout ember (lot TH-L6), sans casser le monochrome de Cockpit (`docs/audit/2026-10-07-au28-themes.md`) | valider |
| Q230 | Mesurer sur `space-600`, plus proche du fond réel des panneaux (lot TH-L4) (`docs/audit/2026-10-07-au28-themes.md`) | valider |
| Q231 | Rouge franc `#ff4433` au lieu du rose `#ff3d5a` (déjà appliqué) : ne se confond plus avec l'accent (`docs/audit/2026-10-07-au28-themes.md`) | valider |
| Q232 | Constellation pour les captures livrées ; audit des 13 thèmes (`scripts/theme-audit.mjs`) à chaque revue de fin de feuille de route (TH-L7) (`docs/audit/2026-10-07-au28-themes.md`) | valider |
