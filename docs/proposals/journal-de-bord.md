# Proposition : Ordres du jour (Journal de bord)

Statut : **livrée en partie (5.30.0)**, voir `docs/changes/5.30.0-ordres-du-jour.md`. Option 2 (fusion) **validée le 2026-10-06**, chiffrée dans `docs/proposals/quotidien-fusion.md` (lot N). Q4 (calendrier lissé) en attente de décision.
Constats : Q1, Q4 de `docs/audit/2026-10-06-audit-global.md`. Lot C de `docs/proposals/feuille-de-route-2026-q4.md`.

## 1. Le problème vu par le joueur

« Chaque jour, je fais le tour de six écrans pour ne rien oublier. » Les corvées quotidiennes sont réparties ainsi :

| Corvée | Où | Rythme | Réclamation |
|:--|:--|:--|:--|
| Série de connexion | en-tête (StreakBadge) | jour | bouton dédié |
| Missions du jour (3) | accueil, bloc Progression | jour | une par une |
| Contrats du jour (3) | accueil, bloc Progression | jour | un par un ; « Tout réclamer » |
| Primes Kesh'Vaar (4) | page Primes | tableau renouvelé | lancer une chasse |
| Expéditions (3 par jour) | page Missions | jour | lancer |
| Objectifs d'alliance (vote) | page Alliance | jour | voter |
| Défi de la semaine | accueil, onglet Semaine | semaine | réclamer |
| Passe, Chroniques | pages dédiées, accueil | mois | réclamer |
| Boss (jusqu'à 4) | pages dédiées | semaine | attaquer |

Il y a quatre pastilles différentes dans la barre latérale (Accueil, Passe, Chroniques, Codex), et « Tout réclamer » ignore la série,
les missions du jour et les Chroniques.

## 2. Diagnostic

- `claimAll.ts` (`pendingClaims`) ne connaît que les contrats, le passe, la prise en main et le Carnet.
- `NavBar.tsx` (`useBadges`) somme quatre sources différentes, sans vue d'ensemble.
- `ProgressHub` (5.21.1) regroupe déjà missions et contrats sur l'accueil, mais pas la série, les primes, les expéditions ni l'alliance.
- Rendez-vous : `agenda.ts` calcule boss, événements, épisodes et fins de saison, sur l'accueil seulement (AgendaCard, 30 jours).
  Rien ne montre la semaine qui vient, ni qu'un week-end concentre boss mondial, guerre de territoire, tournoi du casino et proie d'élite.

## 3. Benchmark

| Jeu | Ce qu'ils font |
|:--|:--|
| Clash of Clans | un seul écran d'objectifs (quotidiens, saison) ; compteurs visibles sur l'écran principal ; « tout collecter » |
| OGame | pas de quotidiennes (jeu sobre) ; les événements sont annoncés dans un calendrier |
| Jeux mobiles de gestion | « Daily Tasks » avec une barre d'activité et des coffres paliers ; un seul point rouge qui mène à l'écran |

À retenir : **un seul endroit, une seule pastille, un seul bouton**. Le joueur doit voir en 5 s ce qui reste, et tout récupérer en 1 clic.

## 4. Options

### Option 1 : afficher ensemble, sans fusionner (recommandée, livrée)
- Page **Ordres du jour** (`/game/ordres`), en tête de la barre latérale :
  - **liste de contrôle** : série, missions, contrats, primes, expéditions, objectifs d'alliance, défi, passe, Chroniques. Chaque ligne donne
    sa progression, son état (à réclamer, à faire, fait) et un lien vers l'écran qui agit ;
  - les cartes existantes en dessous : missions, contrats, défi ;
  - **rendez-vous de la semaine** : les 7 prochains jours de `agenda.ts`, regroupés par jour, avec le week-end signalé.
- **« Tout réclamer »** couvre aussi la série, les missions du jour et les épisodes des Chroniques. Chaque réclamation passe par son
  action habituelle : mêmes contrôles, mêmes récompenses.
- **Une seule pastille** dans la barre latérale (Ordres du jour) = récompenses prêtes. Elle remplace celles de l'Accueil, du Passe et des
  Chroniques. Le Codex garde la sienne : ce n'est pas une corvée du jour.
- Chiffres : aucun changement de récompense ni de règle.

### Option 2 : fusionner contrats et missions du jour
- 4 objectifs du jour au lieu de 3 + 3, récompense unique (ressources + jetons), un coffre à 4/4.
- Plus simple, mais **change l'économie** : les contrats donnent des ressources indexées sur la production, les missions des jetons du
  casino. Il faudrait recalibrer les deux (jetons par semaine, ressources par jour), avec les données de production (lot E).
- **En attente de décision.**

### Option Q4 : lisser le calendrier
- Le planificateur décale l'un des rendez-vous quand plus de 2 temps forts tombent le même week-end.
- Touche la rotation des boss et la guerre de territoire : à décider avec l'admin, données d'activité à l'appui.
- Livré en 5.30.0 : **l'affichage seulement** (le week-end chargé se voit) ; le lissage attend la décision.

## 5. Recommandation

Option 1 tout de suite : elle ne change aucune règle, aucun chiffre ni aucune donnée de joueur. Option 2 et lissage Q4 plus tard, avec
les données de production (Admin → Rétention, Équilibrage), à trancher par l'utilisateur.

## 6. Mesure du succès

- Part des joueurs actifs qui réclament leur série et leurs 3 missions (Admin → Rétention) : à comparer une semaine avant et après.
- Nombre de clics sur « Tout réclamer » (journal d'activité).
