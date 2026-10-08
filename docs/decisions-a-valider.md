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
| Q374 | **Jetons perdus après un assaut de boss** (avant 6.14.151) non rendus : impossible à compter sans journal (`docs/changes/6.14.151-fiabilite-integration.md`) | au plus 10 jetons par mois pour un passe fini ; corrigé pour la suite | valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
| Q375 | Délai fixe de 30 s pour les tests d'intégration qui écrivent plus de 3 sections (`docs/changes/6.14.151-fiabilite-integration.md`) | valider |
| Q376 | Données du démarrage (`game_config`, `players`, `queues`) demandées dès `index.html` (script de tête qui lit le jeton de session), plutôt qu'au chargement du module (≈ 3 s de gain en moins sur mobile) (`docs/changes/6.14.152-performance-demarrage.md`) | valider |
| Q377 | Préchargement tôt gardé malgré un premier affichage (FCP) mobile +0,25 s (1,3 → 1,55 s), contre une page affichée plus tôt (`docs/changes/6.14.152-performance-demarrage.md`) | valider |
| Q378 | Fenêtres rares (annonce, bilan, Ctrl+K, raccourcis, rang) montées après la page, 2 s au plus (`docs/changes/6.14.152-performance-demarrage.md`) | valider |
| Q379 | Découpage du bloc d'entrée (lot L) décidé après la mesure sur la pré-prod, seulement si le LCP mobile dépasse encore 4 s (`docs/changes/6.14.152-performance-demarrage.md`) | valider |
| Q380 | Règle proposée pour CLAUDE.md : « un export que rien ne lit hors de son module n'est pas exporté ; `scripts/dead-exports.mjs` les liste, `deadExports.test.ts` échoue sinon » (`docs/changes/6.14.153-menage-exports.md`) | valider |
| Q381 | Recenser aussi les exports de `hooksEntry.ts` jamais appelés par `pocketbase/pb_hooks` (bundle plus léger) (`docs/changes/6.14.153-menage-exports.md`) | valider |
