# Prise en main, QoL et outils

## Joueur
- Prise en main : 10 objectifs, tutoriel scénarisé (raid de Varan, parti à l'instant de la réclamation des roquettes, 2 min de trajet : 6.14.52), Carnet du commandant (guide avancé) en 4 chapitres depuis la 6.4.1 :
  Ton empire (objectif du jour, classe), Colonies (dont route logistique), Reliques et commandants, Ascension.
- Accueil « que faire maintenant », frise des chantiers, carte Atelier, défis.
- Objectifs personnels (6), modèles d'actions (12 × 20 étapes), file d'actions globale, file planifiée des bâtiments.
- « Tout réclamer », notifications groupées et par catégorie, rappels personnels.
- Journal : tout ce qui se termine au rattrapage arrive au Journal, quel que soit le chemin (action, combat, tâche de la nuit, contrat,
  changement de pseudo, remboursement d'enchère) : invariant I24 (6.14.52).
- Suppression du compte (Réglages → Zone dangereuse) : faite par le serveur, mot de passe revérifié ; alliance quittée (fondateur
  remplacé), garnisons alliées renvoyées, mises et cautions des autres joueurs rendues ; irréversible (6.14.66, I28).
- Menu progressif (6.14.74 à 6.14.76, I30, GDD §7.7) : un compte neuf voit 13 entrées ; chaque page s'ouvre au premier de ses
  déclencheurs (usage, étape de la Prise en main ou du Carnet, rang plafond de Fer III à Or III) et ne se referme jamais ; un danger
  ouvre Galaxie, Combats et Menaces ; pastille « Nouveau » jusqu'à la première visite, ligne « Prochaine ouverture », pages fermées
  grisées dans Ctrl+K ; visiter une page fermée l'ouvre ; « Tout afficher » (Réglages → Jeu et aide). Comptes créés avant le
  2026-10-08 et au moins Fer II : menu complet. Règles `navUnlock` (Admin → Règles → Tous les réglages ; éditeur dédié au lot DP-L5).
- Ctrl+K (actions, onglets), raccourcis clavier, mode compact, vue cockpit, 13 thèmes.
- Page Formules (calculs expliqués avec les chiffres du joueur), simulateur de combat, Statistiques de l'empire.

## Admin
64 panneaux : contenu éditable, règles, équilibrage (diagnostic, historique, simulateur « et si »), planificateur d'événements, boss,
seigneurs, e-mails (l'envoi « à blanc » crée les jetons de désinscription manquants sans rien envoyer, 6.14.52), rétention, signalements, sauvegardes R2, statut et métriques.
- Garde-fous (6.14.59, I26) : toute section de contenu est vérifiée par le serveur à l'enregistrement (`guardContentConfig`), selon la
  forme de sa valeur par défaut, à toute profondeur (nombre fini, `null` refusé pour un nombre, champ chiffré obligatoire dans une liste
  d'objets, pas de négatif si le défaut est positif). Le refus nomme le champ et le type attendu ; l'éditeur affiche les mêmes erreurs
  avant l'enregistrement. Onglet Règles : encadré « À vérifier (non bloquant) » pour les nombres à plus de ×2 de leur défaut (Q75).
- Fiche d'un joueur (Joueurs, 6.14.65, I28) : l'éditeur n'envoie que les écarts saisis (`adminEditDiff`) à `admin/player-action`
  (`edit`, motif obligatoire) ; le serveur les applique sur la fiche du moment, rattrapée, sous les plafonds (niveaux maximaux, entrepôt
  des ressources communes, hangars avec les vaisseaux en vol), journalise champ par champ et prévient le joueur. Au-delà de l'entrepôt :
  « Rendre des ressources ». Remise à zéro de l'XP de tous les joueurs : `resetAllXp`, une transaction. L'admin du jeu n'écrit plus la
  fiche par l'API des collections (règle `players.updateRule`).

## Technique
- 30 tâches planifiées côté serveur (dont 3 chaque minute : flottes, maintenance, enchères).
- Bundle principal 904 Ko (non compressé), scène 3D 572 Ko, Admin 520 Ko, Labo 200 Ko, changelog 252 Ko.

## État (audit 2026-10-06)
- 5.30 : Ordres du jour réunit les corvées quotidiennes, avec une seule pastille dans la barre latérale (= `pendingClaims`) ; 6.14.17 : le Codex y entre, sa pastille propre disparaît. Reste dispersé : file d'actions, objectifs personnels.
- `README.md` affirme encore que « toute la logique de jeu tourne côté client » : faux depuis la v2 (audit D1).
- Performance (5.29.0) : fenêtres rares chargées à la demande (bundle d'entrée 925 → 880 Ko), horloge de décompte unique (`useNowTicker`), tâches serveur regroupées par cadence. Reste : le moteur entier est dans le bundle d'entrée tant que le contenu de l'admin est appliqué au démarrage.
- 6.14.52 (AC-A, revue AU27) : aucune fiche joueur réécrite depuis une lecture ancienne (campagne d'e-mails : jetons créés avant l'envoi,
  `ensureMailTokens` ; message privé et désinscription en transaction) ; notifications des rattrapages muets écrites. 6.14.65 (AC-B) : éditeur de
  fiche de l'admin par différences, côté serveur ; 6.14.66 (AC-C) : suppression de compte côté serveur (`purgePlayer`), règles de
  suppression de `players` et `queues` réservées aux admins, recopiées au démarrage (`SCHEMA_RULE_SYNC`) : `proposals/chaine-actions.md`.
