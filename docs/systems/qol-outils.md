# Prise en main, QoL et outils

## Joueur
- Prise en main : 10 objectifs, tutoriel scénarisé (raid de Varan), guide avancé.
- Accueil « que faire maintenant », frise des chantiers, carte Atelier, défis.
- Objectifs personnels (6), modèles d'actions (12 × 20 étapes), file d'actions globale, file planifiée des bâtiments.
- « Tout réclamer », notifications groupées et par catégorie, rappels personnels.
- Ctrl+K (actions, onglets), raccourcis clavier, mode compact, vue cockpit, 13 thèmes.
- Page Formules (calculs expliqués avec les chiffres du joueur), simulateur de combat, Statistiques de l'empire.

## Admin
64 panneaux : contenu éditable, règles, équilibrage (diagnostic, historique, simulateur « et si »), planificateur d'événements, boss,
seigneurs, e-mails, rétention, signalements, sauvegardes R2, statut et métriques.

## Technique
- 30 tâches planifiées côté serveur (dont 3 chaque minute : flottes, maintenance, enchères).
- Bundle principal 904 Ko (non compressé), scène 3D 572 Ko, Admin 520 Ko, Labo 200 Ko, changelog 252 Ko.

## État (audit 2026-10-06)
- QoL riche mais dispersée : plusieurs « hubs » (accueil, file d'actions, objectifs, Chroniques, passe, défis) (audit Q1).
- `README.md` affirme encore que « toute la logique de jeu tourne côté client » : faux depuis la v2 (audit D1).
- Performance (5.29.0) : fenêtres rares chargées à la demande (bundle d'entrée 925 → 880 Ko), horloge de décompte unique (`useNowTicker`), tâches serveur regroupées par cadence. Reste : le moteur entier est dans le bundle d'entrée tant que le contenu de l'admin est appliqué au démarrage.
