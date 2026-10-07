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
| Q12 | Mise en production et PR hors du travail automatique | 57 commits (5.27.1 → 6.14.27) attendent, dont le plafond des PNJ (+140 % encore actif en prod) ; aucune mesure de rythme possible | **Donner le feu vert** : PR prête à rédiger, dossier `docs/release/5.27-a-6.14.md`, répétition réussie sur la pré-prod |

## 2. Joueurs et équilibre (chiffres réglables dans l'admin)

| Q | Décision appliquée | Effet pour les joueurs | Recommandation |
|:--|:--|:--|:--|
| Q1 | Passe : budget 140 h, Ambre ≤ 350, jetons ≤ 6 | même valeur que l'ancien passe | valider |
| Q2 | Raids repoussés hors des défis du passe | un défi ne dépend pas de l'adversaire | valider (environ 3 raids par semaine et par joueur, subis) |
| Q4 | Paliers bonus : 1 jeton par 120 points au-delà du max, 10 par mois | rien de perdu après le dernier palier | valider, à relire avec le passe de novembre |
| Q6 | Épisodes des Chroniques : 10 h × difficulté, sans jetons | barème de l'ancien gabarit | valider |
| Q9 | La base avancée peut défendre sa colonie, **désactivé** par défaut | aucune surprise pour les bases déjà posées | valider ; activer plus tard, avec une annonce |
| Q10 | Base : 14 jours, 1 par colonie, survivants rentrés à la base | — | valider |
| Q18 | Lune : niveaux 1 à 5, +2 % de bouclier, 500 k ferraille + 250 k énergie (×2 par niveau) | progression lente, sous le plafond de 15 % | valider, à relire 8 semaines après la mise en prod |
| Q20 | Succès « Clair de lune » (secret) et « Lune pleine » | barème des paliers | valider |
| Q24 | Codex : catégories Bâtiments et Technologies, 5 jetons + 25 Ambre chacune | +50 Ambre une fois par joueur ; % du Codex en baisse, titre « Archiviste » gardé | valider |
| Q26 | Succès des boss d'alliance sans rattrapage du passé | compteur à zéro pour tous, dit dans le changelog | valider |
| Q27 | « Tout réclamer » prend le Codex, une seule pastille | la pastille ne compte pas Seigneurs et Boss (vus sur la page) | valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|
| Q5 | Faction du chapitre : rivale du passe pour 9 thèmes sur 12 ; bazar → Cartel, colonies → Meute, rempart → Inquisition | valider |
| Q19 | Fiche de Codex « Lunes » débloquée par sa propre lune, rangée dans les Légendes | valider |

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
| Q8 | Pas de chargement à la demande des succès, saisons et Chroniques (gain 15 à 20 Ko pour une refonte) | valider |
| Q11 | Ordre de la feuille de route de printemps | clore : dépassée |
| Q15 | Orientation prise seule (lunes, chaîne de contenu) | valider, ou me donner le prochain système à ouvrir |
| Q16 | Bâtiments en liste sur téléphone au-delà de 10 bâtiments | valider |
| Q21 | Mesure des boss sur 56 jours, PV inchangés | valider |
| Q22 | Pré-prod : un conteneur, copie nettoyée (e-mails remplacés, messages privés supprimés) | valider |
| Q23 | Garde de la chaîne de contenu (Codex, succès, effets) | valider |
| Q25 | Préréglages d'effet des 10 unités | valider |
| Q28 | Illustrations : dépôt `/img`, détourage du Comptoir seulement | valider |
| Q29 | En prod, `/img` renvoie vers la pré-prod pour les envois | valider, ou me donner un accès en écriture limité à `illustration_uploads` en prod |
| Q30 | `/decisions` en prod : réponses lues par un jeton de lecture (`PROD_PB_TOKEN`), sinon répondre sur la pré-prod | valider ; ajouter le jeton dans l'environnement quand la prod est à jour |
