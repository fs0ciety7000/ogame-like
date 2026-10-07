# Proposition : feuille de route d'automne 2030

Statut : **en cours** (2026-10-07, clôture d'AU27 : `docs/changes/6.14.51-revue-au27.md`). Construite à partir des sept audits AU27
(`docs/audit/2026-10-07-au27-*.md`). Ordre : sûreté des données, puis ce que les joueurs voient, puis l'évolutivité (règle n° 2 :
« tout ajustable via l'admin, le jeu évolutif »), puis la profondeur. Les choix de conception sont Q64 à Q103 (`/decisions`). Chaque
lot se valide, se modifie ou s'ajoute dans l'onglet « Feuille de route » de `/decisions`.

## Planning

| # | Lot | Contenu | Taille | État |
|:--|:--|:--|:--|:--|
| 1 | AC-A | Écritures sûres : campagne d'e-mails sans réécriture de la fiche, statistiques en transaction, notifications des 4 chemins de rattrapage, raid du tutoriel (AC-1, AC-4, AC-9, AC-13) | S | livré (6.14.52) |
| 2 | AP-L1 | Succès par défaut toujours présents (le générateur n'écrit plus la liste entière ; 4 succès manquent sur la pré-prod) | S | livré (6.14.56) |
| 3 | AP-L2 | Brouillons et chapitres écrits par un ancien générateur régénérés (brouillon de novembre à l'ancien format) | S | livré (6.14.57) |
| 4 | AP-L3 | Passe et Chroniques faisables : planchers bornés par la médiane du serveur, garde avant publication d'office (fin au jour 35 pour le joueur médian) | M | livré (6.14.58) |
| 5 | AA1 | Garde-fous du contenu réglé dans l'admin : validation récursive côté serveur, `null` refusé, unités, bâtiments et technos vérifiés | M | livré (6.14.59) |
| 6 | AJ27-3 | Reliques de la 5.23 : vérification de la pré-prod, migration `appendFromDefaults` et garde | S | livré (6.14.60) |
| 7 | AJ27-2 | Test de l'invariant I6 (butin et livraisons entrepôt plein) | S | livré (6.14.61) |
| 8 | AC-B | Édition admin d'un joueur par le serveur (différences sur l'état rattrapé, plafonds, journal) | M | livré (6.14.65) |
| 9 | AC-C | Suppression de compte côté serveur (ménage complet, règle de suppression réservée aux admins) | M | livré (6.14.66) |
| 10 | UX-1 | Accueil public mobile (formulaire et devblog coupés à 375 px) | S | livré (6.14.53) |
| 11 | UX-3 | Textes de règle justes (astuces, toasts) et nombres lisibles | S | livré (6.14.54) |
| 12 | UX-2 | Couleurs du thème distinctes et contraste AA, avec garde | M | livré (6.14.55) |
| 13 | É30-1d | Phalange : admin, santé, reliques, succès, Codex, titre, défi d'alliance, prompts, changelog, billet, annonce ; recharges au Journal | M | livré (6.14.69) |
| 14 | É30-1e | Phalange : essai sur la pré-prod avec deux comptes, audit, GDD | S | livré (6.14.70) |
| 15 | AE-L0 | Proposition d'équilibrage chiffrée et simulateur de progression dans le dépôt | S | livré (6.14.71) |
| 16 | AE-L1 | Réglages sûrs : coffre du 7e jour, défense de la planète mère, bouclier après défaite, écart d'XP (essayés sur la pré-prod) | S | livré (6.14.72 ; essai sur la pré-prod au prochain push) |
| 17 | UX-4 | Écran mobile : ressources sur une ligne, bandeaux fusionnés, contenu visible plus haut | M | livré (6.14.62) |
| 18 | UX-5 | Accueil du joueur : Prise en main en tête, redondances retirées | M | livré (6.14.63) |
| 19 | UX-8 | Navigation mobile : onglets par défaut, pastille « Plus » neutre | S | livré (6.14.64) |
| 20 | AJ27-1 | Docs remises au code (GDD, fiches, constats ouverts) et garde de comptage | S | à faire |
| 21 | AA2 | Libellés, unités, bornes et aide pour chaque réglage de l'admin | M | à faire |
| 22 | AA3 | Chiffres en dur rendus réglables (Comptoir, talents, spécialisations, modules, sac…), valeurs inchangées | M | à faire |
| 23 | AA4 | Textes de règle construits depuis les règles (parrainage, primes, boss d'alliance, Comptoir) | S | à faire |
| 24 | AE-L2 | Progression : second palier des bâtiments ×4 et rareté (après Q99 et Q100) | M | en attente de l'étude du rythme long terme (`docs/proposals/rythme-long-terme.md`) : J42 seulement pour l'actif, avec 43 % de sessions sans rien à lancer |
| 25 | AE-L3 | Coffre indexé, plafond de rareté hebdomadaire, défaites par 24 h (moteur et admin) | M | à faire |
| 26 | AE-L4 | Santé de l'équilibre : Ambre par source, temps avant la mort des boss, 1re Ascension, production perdue | S | à faire |
| 27 | AP-L4 | Succès procéduraux bridés (détenteurs minimum, un palier par mois) | S | à faire |
| 28 | AP-L5 | Objectifs du jour pondérés et réglables | S | à faire |
| 29 | AC-D | Dépenses et traces : un seul chemin de dépense, Journal des réclamations, rappel de flotte notifié | M | à faire |
| 30 | AC-E | Tâches planifiées : verrou par cadence, e-mails par lots | M | à faire |
| 31 | AC-F | Erreurs traduites (403, 409, 429, 503) et garde de vacances unique | S | à faire |
| 32 | AC-G | Réclamations groupées (casino du jour, défi, titre du Codex dans « Tout réclamer ») | M | à faire |
| 33 | UX-6 | Hiérarchie des pages (Missions, Passe, Alliance, Seigneurs, Codex) | M | livré (6.14.67) |
| 34 | UX-7 | Tactile et accessibilité (44 px sur écran tactile, `aria-label`, raison des boutons grisés) | M | livré (6.14.68) |
| 35 | AJ27-4 | Garde de chaîne de contenu par contenu, panneau « Chaîne de contenu » dans l'admin | M | à faire |
| 36 | AJ27-5 | Colonies dans la chaîne : succès, Codex des biomes, Formules | M | à faire |
| 37 | É30-5 | Performance : stabilité mobile, LCP de la Galaxie, images du Codex à la demande | M | à faire |
| 38 | É30-6 | Rythme des succès (avec AP-L4) | M | à faire |
| 39 | É30-7 | Reliques à image propre et prompts des biomes et classes | S | à faire |
| 40 | AP-L7 | Nouveau générateur : registre des actions suivies (lune, colonies, nouvelles unités dans les objectifs) | L | à faire |
| 41 | AP-L8 | Nouveau générateur : épisode « nouveauté » pour le contenu récemment ajouté | M | à faire |
| 42 | AA5 | Rôles d'unités (sonde, recycleur, faiblesse de boss) au lieu d'identifiants en dur | M | à faire |
| 43 | AA6 | Recherches d'alliance par effets composés (une recherche ajoutée dans l'admin a un effet) | M | à faire |
| 44 | AA7 | Classes, mutateurs, fugitifs : listes éditables | M | à faire |
| 45 | AA8 | Historique champ par champ et retour arrière par groupe dans l'admin | M | à faire |
| 46 | AJ27-6 | Succès dérivés par unité et par bâtiment | M | à faire |
| 47 | AJ27-7 | Objectifs paramétrés par contenu (construire telle unité, rechercher telle techno) | L | à faire |
| 48 | AJ27-8 | Formules générées depuis les registres, Ctrl+K étendu | M | à faire |
| 49 | AJ27-9 | Codex : officiers, Doctrines, Arsenal | M | à faire |
| 50 | AJ27-10 | Reliques par source, porteurs « signature » par unité | M | à faire |
| 51 | DP-L1 | Déblocage progressif du menu : moteur (`navUnlock`, déclencheurs signal / étape / rang), invariants (remplace AE-L5 ; `docs/proposals/deblocage-progressif.md`, Q152 à Q158) | M | à faire |
| 51b | DP-L2 | Déblocage progressif : interface (menu, mobile, Ctrl+K, « Prochaine ouverture », « Tout afficher ») | M | à faire |
| 51c | DP-L3 | Déblocage progressif : Prise en main, Carnet, panneau Lune, passe | S | à faire |
| 51d | DP-L4 | Déblocage progressif : serveur (objectifs du jour filtrés, danger qui ouvre sa page) | S | à faire |
| 51e | DP-L5 | Déblocage progressif : éditeur dans l'admin | S | à faire |
| 51f | DP-L6 | Déblocage progressif : chaîne de contenu et livraison | S | à faire |
| 52 | AP-L9 | Mutateurs en contenu, anti-répétition | M | à faire |
| 53 | AP-L10 | Variété narrative (banques de textes réglables) | M | à faire |
| 54 | AP-L11 | Illustrations de saison (thèmes, portraits, second boss par archétype) | M | à faire |
| 55 | AP-L12 | Catalogue des saisons au-delà de 36 mois | M | à faire |
| 56 | AP-L14 | Outil `procedural-sim.mjs` dans le dépôt | S | à faire |
| 57 | UX-9 | Cohérence visuelle (couleurs de décor, titres, icônes à la place des emoji) | M | à faire |
| 58 | UX-10 | Hygiène et gardes du design system | M | à faire |
| 59 | UX-11 | Ctrl+K et animation des flottes de la Galaxie | S | à faire |
| 60 | AC-H | Ménage, boutons « Lancer maintenant », test « tour des actions » | M | à faire |
| 61 | AE-L6 | Puits de dépense permanent (proposition) | L | à faire |
| 62 | AA9 | Talents, modules, catalogues en sections de contenu | L | à faire |
| 63 | AJ27-12 | Paliers des bâtiments (proposition) | L | à faire |
| 64 | É30-3 | Illustrations : intégration au fil des envois (127 emplacements sur `/img`) | selon envois | en continu |
| 65 | AU28 | Revue, même grille | M | fin des lots |
| — | AC-I, AE-L7, AP-L6, AP-L13, AJ27-11, UX-12 | Après mesures (Z6, 8 semaines en production) ou ménage | — | plus tard |
| — | Z0 | Mise en production | — | écartée pour l'instant (Q12) |
