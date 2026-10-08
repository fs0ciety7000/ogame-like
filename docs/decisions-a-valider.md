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
| Q301 | Seuil des actions mesurées : Tirée seulement si le joueur médian la fait 0,5 fois par semaine (`docs/changes/6.14.119-actions-suivies.md`) | les nouvelles actions arrivent dans les tirages quand elles sont pratiquées | valider |
| Q302 | Objectif du jour « convoi de colonie » : Poids 0,5, 2 convois, proposé seulement avec une route (`docs/changes/6.14.119-actions-suivies.md`) | un objectif facile de plus pour qui a une route | valider |
| Q303 | Défi hebdomadaire : Laissé hors du registre (rotation à réécrire), reporté à AP-L9 ou AA7 (`docs/changes/6.14.119-actions-suivies.md`) | aucun | valider |
| Q304 | Version du générateur : Non montée (aucun mois écrit ni brouillon régénéré), écart à la règle de maintenance de la proposition (`docs/changes/6.14.119-actions-suivies.md`) | aucun | valider |
| Q305 | Contenu « nouveau » : Date d'ajout explicite (`addedOn`, posée par l'admin à la création) plutôt qu'une détection automatique ; les 67 contenus d'avant ne sont pas datés, donc jamais mis en avant (`docs/changes/6.14.120-episode-nouveaute.md`) | l'épisode « nouveauté » ne vise que le contenu ajouté désormais | valider |
| Q306 | Épisode « nouveauté » : Remplace l'épisode 2 du chapitre ; rien si moins de 50 % des actifs y ont accès (`docs/changes/6.14.120-episode-nouveaute.md`) | un chapitre par mois au plus met en avant une nouveauté | valider |
| Q295 | Codex sur téléphone : Grille par défaut sur téléphone (la vue 3D téléchargeait 6 Mo avant le premier affichage), 3D au choix (`docs/changes/6.14.116-performance-mobile.md`) | Codex 6,5 Mo → 1,4 Mo sur mobile | valider |
| Q296 | Pic de décalage au bureau : Reste intermittent (groupes du menu ajoutés au premier rendu) ; proposé : rendre le menu en une fois dans un lot suivant (`docs/changes/6.14.116-performance-mobile.md`) | aucun (visuel) | valider le report |
| Q297 | **Rythme des succès de volume** : Facteur par mesure appliqué au seuil écrit (unités ×10, défenses ×10, marché ×200, dons ×200…), bronze inchangé, rien de retiré : médiane simulée 76 → 55 succès en une semaine (38 → 28 %) (`docs/proposals/rythme-des-succes.md`) | les succès de volume s'obtiennent plus tard | valider (mesurer après la bascule et la mise en production) |
| Q298 | Palier bronze : Garde son seuil écrit (premier succès facile à obtenir) (`docs/proposals/rythme-des-succes.md`) | aucun | valider |
| Q299 | Titres liés à une mesure : Gardent leur seuil (marché 1 million, recyclage 1 million…) (`docs/proposals/rythme-des-succes.md`) | aucun | valider |
| Q300 | Images des 12 reliques d'avant 6.14.92 : Gardées (pas refaites dans le style des reliques générées par API) (`docs/changes/6.14.118-reliques-images-prompts.md`) | aucun | valider |
| Q289 | Succès propre exigé par la chaîne : Pour les unités et les bâtiments seulement (22 unités et 11 bâtiments sans succès propre, prévus en AJ27-6) (`docs/changes/6.14.114-garde-chaine-contenu.md`) | aucun pour l'instant | valider |
| Q290 | Porteur propre par unité : Exigé : un effet qui vise l'unité elle-même, pas sa classe (23 unités sans, prévues en AJ27-10) (`docs/changes/6.14.114-garde-chaine-contenu.md`) | aucun pour l'instant | valider |
| Q291 | Place du panneau « Chaîne de contenu » : Admin → Équilibrage (`docs/changes/6.14.114-garde-chaine-contenu.md`) | aucun (admin) | valider |
| Q292 | Codex des biomes : Les 4 biomes s'ouvrent à la fondation de la première colonie (2 colonies au plus et un biome au hasard : sinon, catégorie impossible à compléter) (`docs/changes/6.14.115-colonies-chaine.md`) | la catégorie Colonies peut se compléter | valider |
| Q293 | Récompense de la catégorie Colonies du Codex : 5 jetons et 25 Ambre (barème des autres catégories) (`docs/changes/6.14.115-colonies-chaine.md`) | +25 Ambre une fois | valider |
| Q294 | Succès « Convoyeur » : 100 convois arrivés, palier argent (`docs/changes/6.14.115-colonies-chaine.md`) | aucun | valider |
| Q279 | Objectif « Dépenser » : Compte maintenant la fondation de colonie et la lune (un seul chemin de dépense) (`docs/changes/6.14.110-depenses-et-traces.md`) | objectif un peu plus facile à remplir | valider |
| Q280 | Toasts des lignes déjà lues : Aucun toast pour une notification créée déjà lue (réclamations ; effet de bord : cadeau envoyé, défi récupéré) (`docs/changes/6.14.110-depenses-et-traces.md`) | moins de toasts en double | valider |
| Q281 | Rappel d'une garnison : L'hôte est prévenu même s'il a coupé les évènements d'alliance (`docs/changes/6.14.110-depenses-et-traces.md`) | l'hôte sait que sa défense part | valider |
| Q282 | Envoi des e-mails : 50 par minute, file `mail_queue`, une fois par joueur (`docs/changes/6.14.111-taches-planifiees.md`) | campagnes étalées, serveur plus léger | valider |
| Q283 | Maintenance et admin : Routes d'admin permises pendant une maintenance ; guerres, Léviathan, boss et guerre de territoire attendent puis sont décalés (`docs/changes/6.14.111-taches-planifiees.md`) | aucune échéance perdue pendant une coupure | valider |
| Q284 | Verrou des tâches planifiées : Expire après 2 intervalles (un passage bloqué ne fige pas la cadence) (`docs/changes/6.14.111-taches-planifiees.md`) | aucun | valider |
| Q285 | **Actions bloquées en vacances** : Liste blanche réglable (`vacation.allowed`) : en plus d'avant, phalange, porte de saut, Comptoir et primes, casino, défi, Codex, factions, changement de pseudo et dépenses d'alliance sont refusés en vacances ; les gestes sociaux d'alliance restent permis (`docs/changes/6.14.112-erreurs-et-vacances.md`) | un joueur en vacances ne réclame plus son jeton de casino ni le défi | à trancher : je recommande de permettre casino, défi et Codex (réclamations sans effet de combat) |
| Q286 | Erreur 500 : Même message pour les admins et les joueurs (signalée à l'équipe) (`docs/changes/6.14.112-erreurs-et-vacances.md`) | aucun | valider |
| Q287 | Titre du Codex et pastille : Hors de la pastille d'Ordres du jour (comme Seigneurs et Boss), mais dans « Tout réclamer » (`docs/changes/6.14.113-reclamations-groupees.md`) | pas de pastille fausse | valider |
| Q288 | Lignes d'Ordres du jour : Jeton du casino et défi affichés seulement quand une récompense attend (`docs/changes/6.14.113-reclamations-groupees.md`) | ordres du jour plus courts | valider |
| Q274 | Date des anciens paliers générés : Datés au premier passage du générateur : leurs mesures restent fermées 30 jours (`docs/changes/6.14.108-succes-generes-brides.md`) | pas de nouveau palier généré pendant 30 jours | valider |
| Q275 | Lecture de Q89 (détenteurs minimum) : 3 joueurs **et** 10 % des actifs : le plus exigeant des deux (`docs/changes/6.14.108-succes-generes-brides.md`) | les paliers générés arrivent plus lentement | valider |
| Q276 | Rareté des succès générés : Restent légendaires ; à revoir avec É30-6 (rythme des succès) (`docs/changes/6.14.108-succes-generes-brides.md`) | aucun | valider |
| Q277 | Poids des objectifs « Envoyer un don » et « Gagner une attaque » : Laissés à 1 (seule la défense passe à 0,5) (`docs/changes/6.14.109-objectifs-du-jour-ponderes.md`) | aucun | valider |
| Q278 | Libellé de l'objectif de défense : « Repousser 1 attaque (joueur ou raid de faction) », qui passe à la ligne à 375 px (`docs/changes/6.14.109-objectifs-du-jour-ponderes.md`) | le joueur sait qu'un raid de faction compte | valider |
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
| Q271 | Ambre par source : Remboursements et ventes aux enchères exclus (un transfert ne crée pas d'Ambre) (`docs/changes/6.14.107-sante-equilibre-completee.md`) | valider |
| Q272 | Seuils d'alerte de santé par défaut : Primes ≤ 60 % de l'Ambre, 9e décile ≤ ×2, boss abattus 60 à 80 % et morts en 36 à 60 h, **1re Ascension J35 à J90**, production perdue ≤ 20 %, Q3 ÷ Q1 ≤ ×5, coffres au plancher ≤ 50 %, plafond du comptoir ≤ 10 % des actifs, protégés ≤ 5 % (`docs/changes/6.14.107-sante-equilibre-completee.md`) | changer la bande de la 1re Ascension en J80 à J180 à la bascule ; valider le reste |
| Q273 | Comptage des protections : Comme le serveur (`recentDefeatsMs`) : défaites contre les raids de faction comprises (`docs/changes/6.14.107-sante-equilibre-completee.md`) | valider |
