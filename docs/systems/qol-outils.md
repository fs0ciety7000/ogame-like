# Prise en main, QoL et outils

## Joueur
- Prise en main : 10 objectifs, tutoriel scénarisé (raid de Varan, parti à l'instant de la réclamation des roquettes, 2 min de trajet : 6.14.52), Carnet du commandant (guide avancé) en 4 chapitres depuis la 6.4.1 :
  Ton empire (objectif du jour, classe), Colonies (dont route logistique), Reliques et commandants, Ascension.
- Accueil « que faire maintenant », frise des chantiers, carte Atelier, défis.
- Objectifs personnels (6), modèles d'actions (12 × 20 étapes), file d'actions globale, file planifiée des bâtiments.
- « Tout réclamer », notifications groupées et par catégorie, rappels personnels. 6.14.110 (AC-D, Q76) : chaque réclamation laisse
  une ligne déjà lue au Journal avec le gain (ressources, Ambre, jetons, XP), « Tout réclamer » une seule ligne récapitulative ; une
  ligne déjà lue ne fait pas de toast. Un rappel de flotte laisse une ligne ; l'hôte d'une garnison rappelée est prévenu. Un succès
  gagné par l'action s'affiche dans la même réponse (I34). 6.14.113 (AC-G, I37) : « Tout réclamer » prend aussi le jeton du jour
  du casino, la récompense du défi de la semaine et le titre du Codex (contexte lu par le serveur) ; la pastille d'Ordres du jour compte
  le jeton et le défi quand leurs réglages publics sont chargés (jamais le titre du Codex, comme les catégories Seigneurs et Boss) ;
  lignes « Jeton du casino » et « Défi de la semaine » quand ils attendent. Page Codex, carte du défi et jeton du casino passent par
  l'action (un seul chemin) ; chaque sous-action est isolée (rien de versé à moitié).
- Journal : tout ce qui se termine au rattrapage arrive au Journal, quel que soit le chemin (action, combat, tâche de la nuit, contrat,
  changement de pseudo, remboursement d'enchère) : invariant I24 (6.14.52).
- Suppression du compte (Réglages → Zone dangereuse) : faite par le serveur, mot de passe revérifié ; alliance quittée (fondateur
  remplacé), garnisons alliées renvoyées, mises et cautions des autres joueurs rendues ; irréversible (6.14.66, I28).
- Menu progressif (6.14.74 à 6.14.81, I30, I31, GDD §7.7) : un compte neuf voit 13 entrées ; chaque page s'ouvre au premier de ses
  déclencheurs (usage, étape de la Prise en main ou du Carnet, rang plafond de Fer III à Or III) et ne se referme jamais ; un danger
  ouvre Galaxie, Combats et Menaces ; pastille « Nouveau » jusqu'à la première visite, ligne « Prochaine ouverture », pages fermées
  grisées dans Ctrl+K ; visiter une page fermée l'ouvre ; « Tout afficher » (Réglages → Jeu et aide). Comptes créés avant le
  2026-10-08 et au moins Fer II : menu complet. Le serveur annonce chaque ouverture (« Nouveau : … », une notification, mémoire
  `stats.navAnnounced`) et tire les objectifs d'un nouveau jour parmi les pages ouvertes (I31, 6.14.79). Astuce de page à l'arrivée,
  Ambre de la barre des ressources, succès « À découvrir », « Que faire maintenant ? » et vue cockpit suivent le menu (6.14.81).
  Règles `navUnlock` : Admin → Règles → **Ouverture du menu** (réglages généraux, une fiche par page, aperçu d'un compte neuf par rang,
  6.14.80).
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

- Journal de contenu (6.14.126, I42, Admin → Contenu) : « Ce qui a changé » montre la différence champ par champ entre une version et
  l'état qui l'a suivie (listes comparées par identifiant, 200 lignes au plus) ; « Revenir pour un seul groupe » remet un groupe de
  règles sans toucher aux autres ; les réglages du serveur hors sections de contenu (casino, générateurs, annonces, bandeaux, émojis,
  équipe) ont aussi leurs versions, partie réglée seulement (`SETTINGS_HISTORY`, `contentHistory.ts`) ; l'équipe n'a que l'historique.
  Chaque retour arrière passe par la garde de contenu du serveur (`assertContentValid`).

## Technique
- 17 tâches planifiées côté serveur (`cronAdd` de `cosmic.pb.js`) ; les tâches à la minute, aux 5 et aux 10 min sont des étapes de `CADENCES` (`cosmic_db.js`, 5.29).
- 6.14.111 (AC-E, I35) : une cadence tient un verrou (`$app.store()`) : elle ne démarre pas tant que la précédente tourne, un passage
  sauté est compté (Admin → Santé, colonne « Sautés »). Campagnes d'e-mails en file (`mail_queue`, `server_metrics`), envoyées par lots
  de 50 par minute (étape `cosmic_mail_queue`, dernière de la cadence minute). Factions : contenu lu une fois par passage et
  identifiants seuls ; flottes : jusqu'à 200 par passage (40 s au plus) ; rattrapage de la nuit et rappels du Comptoir par paquets de
  100 joueurs. Pendant une maintenance, guerres, Léviathan, boss et guerre de territoire attendent ; leurs échéances sont décalées de
  sa durée à la fin (Q77). Réglages : groupe `serverTasks` (Admin → Règles → Tous les réglages).
- 6.14.112 (AC-F) : erreurs du serveur traduites côté client (`src/lib/gameErrors.ts`, `callGame`, `afterSend` de `pocketbase.ts`) :
  message du jeu gardé, texte clair pour 403, 409, 429, 503 ; une 500 part à l'équipe.
- Tailles des blocs et temps de chargement : dernière mesure dans `docs/changes/6.14.39-performance-preprod.md`.

## État (audit 2026-10-06)
- 5.30 : Ordres du jour réunit les corvées quotidiennes, avec une seule pastille dans la barre latérale (= `pendingClaims`) ; 6.14.17 : le Codex y entre, sa pastille propre disparaît. Reste dispersé : file d'actions, objectifs personnels.
- `README.md` affirme encore que « toute la logique de jeu tourne côté client » : faux depuis la v2 (audit D1).
- Performance (5.29.0) : fenêtres rares chargées à la demande (bundle d'entrée 925 → 880 Ko), horloge de décompte unique (`useNowTicker`), tâches serveur regroupées par cadence. Reste : le moteur entier est dans le bundle d'entrée tant que le contenu de l'admin est appliqué au démarrage.
- 6.14.52 (AC-A, revue AU27) : aucune fiche joueur réécrite depuis une lecture ancienne (campagne d'e-mails : jetons créés avant l'envoi,
  `ensureMailTokens` ; message privé et désinscription en transaction) ; notifications des rattrapages muets écrites. 6.14.65 (AC-B) : éditeur de
  fiche de l'admin par différences, côté serveur ; 6.14.66 (AC-C) : suppression de compte côté serveur (`purgePlayer`), règles de
  suppression de `players` et `queues` réservées aux admins, recopiées au démarrage (`SCHEMA_RULE_SYNC`) : `proposals/chaine-actions.md`.

## 6.14.104 (revue AU27, lot AA3)
Santé de l'équilibre complétée en 6.14.107 (AE-L4) : Admin → Équilibrage → Santé ajoute l'Ambre de la semaine passée par source
(12 sources, médiane et 9e décile par joueur), les heures avant la mort des boss abattus, le jour de la 1re Ascension (médiane et
quartiles), la production perdue à entrepôt plein, les quartiles de production horaire (Q3 ÷ Q1), le coffre du 7e jour (médiane, part
au plancher), les actifs au plafond du comptoir et les protections après défaites, avec une liste d'alertes ; l'historique quotidien
garde ces mesures et un tableau « Ambre par semaine et par source ». Traces de taille fixe dans `stats` (`healthTrace.ts`), calculs
dans `balance/health.ts`. Seuils d'alerte dans le groupe `balanceHealth` (Admin → Règles → « Santé de l'équilibre : seuils d'alerte »).

Seuils des outils d'équilibrage dans le groupe `unitAudit` : alerte des seigneurs (×1,5 le 2e joueur), zone cible JcJ (40 à 65 %
de victoires des attaquants), valeur d'une rare (50) (Admin → Règles → « Outils d'équilibrage : seuils »). `validateRules` contrôle
aussi les paires de réglages (`CROSS_BOUNDS`, `content.ts`) : minimum ≤ maximum, seuils dans l'ordre (Q260).
