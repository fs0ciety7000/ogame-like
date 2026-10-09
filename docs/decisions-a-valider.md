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
| Q400 | **Départ rapide des bâtiments** : niveau 2 en 20 s, niveau 5 en 3 min, courbe ×2 par niveau jusqu'au niveau 10 (inchangé) (`docs/proposals/rythme-du-depart.md`) | les premières minutes avancent vite ; 1re Ascension inchangée (actif J10 → J11) | valider |
| Q401 | **Après la bascule** : plus de saut 1 h 30 → 36 h au niveau 11 ; les niveaux 9 et 10 s'allongent (2 h 15, 9 h) (`docs/proposals/rythme-du-depart.md`) | montée régulière au lieu d'un mur | valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
| Q394 | Découpage du bloc d'entrée (coque du jeu à part) essayé, mesuré et non gardé : aucun gain sur Galaxie, Commerce et Alliance (le moteur entier est lu avant la page), FCP +0,4 s (`docs/changes/6.14.157-decoupage-entree.md`) | valider |
| Q395 | Règle `manualChunks` de CLAUDE.md : permettre un bloc « moteur » limité à ce qu'atteint `content.ts` (déjà au démarrage) (`docs/changes/6.14.157-decoupage-entree.md`) | valider |
| Q396 | Alerte de raid et passage de palier montés après la page (2 s au plus, rien de perdu) (`docs/changes/6.14.157-decoupage-entree.md`) | valider |
| Q397 | Suite R4c (L à XL) : objets de règles et catalogues par défaut en modules de données seules (casse le cycle de 53 modules), contenu appliqué par section, puis coque à part ; estimé −1 à −1,5 s sur mobile (`docs/changes/6.14.157-decoupage-entree.md`) | valider |
| Q398 | Garde des exports de `hooksEntry.ts` : un export compte comme appelé dès qu'un hook contient `.nom` (le bundle passe aussi en paramètre) ; prudente : ne retire jamais un export appelé, peut en laisser passer un inutile (`docs/changes/6.14.158-hooks-allege.md`) | valider |
| Q399 | Règle proposée pour CLAUDE.md : « un export de `hooksEntry.ts` est appelé par un hook écrit à la main ; `dead-exports.mjs --hooks` les liste, `deadExports.test.ts` échoue sinon » (`docs/changes/6.14.158-hooks-allege.md`) | valider |
| Q402 | Coûts des niveaux 5 à 8 non touchés (au-delà du niveau 4 ou 5, le coût freine) : mesure d'abord, lot RD-2 avec R10 après le 1er novembre (`docs/proposals/rythme-du-depart.md`) | valider |
| Q403 | Courbe du départ appliquée à tout contenu (règle globale), sans migration ; retour à l'ancienne formule par la case « Courbe du départ activée » (`docs/proposals/rythme-du-depart.md`) | valider |
| Q404 | Calme du nouveau compte : pas d'annonce ni de pastille Nouveautés pendant 24 h (`newcomerNews.quietHours`) (`docs/changes/6.14.161-parcours-debutant.md`) | valider |
| Q405 | Notes du changelog cachées aux joueurs (`audience: equipe`) : seule la 6.14.157 est marquée (`docs/changes/6.14.161-parcours-debutant.md`) | valider |
| Q406 | Vue liste du Labo par défaut seulement sur téléphone (< 768 px) ; sur ordinateur, l'arbre reste par défaut (nœuds à 7 px de texte) (`docs/changes/6.14.162-labo-mobile.md`) | valider |
| Q407 | Vue liste du Labo : « Verrouillées, à portée » ouvert, « Plus loin » replié par défaut (`docs/changes/6.14.162-labo-mobile.md`) | valider |
