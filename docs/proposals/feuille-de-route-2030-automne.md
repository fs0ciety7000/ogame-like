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
| 14b | É30-1f | Suite de l'essai de la lune (6.14.70) : une seule notification après un saut (taire « Patrouille terminée »), retour de flotte réussi qui n'est plus en rouge au Journal système, mesure « victoires de l'attaquant avec ou sans lune » (niveau de lune du défenseur dans le rapport de combat) | S | livré (6.14.77) |
| 15 | AE-L0 | Proposition d'équilibrage chiffrée et simulateur de progression dans le dépôt | S | livré (6.14.71) |
| 16 | AE-L1 | Réglages sûrs : coffre du 7e jour, défense de la planète mère, bouclier après défaite, écart d'XP (essayés sur la pré-prod) | S | livré (6.14.72 ; essai sur la pré-prod au prochain push) |
| 17 | UX-4 | Écran mobile : ressources sur une ligne, bandeaux fusionnés, contenu visible plus haut | M | livré (6.14.62) |
| 18 | UX-5 | Accueil du joueur : Prise en main en tête, redondances retirées | M | livré (6.14.63) |
| 19 | UX-8 | Navigation mobile : onglets par défaut, pastille « Plus » neutre | S | livré (6.14.64) |
| 20 | AJ27-1 | Docs remises au code (GDD, fiches, constats ouverts) et garde de comptage | S | livré (6.14.94) |
| 21 | AA2 | Libellés, unités, bornes et aide pour chaque réglage de l'admin | M | livré (6.14.95) |
| 22 | AA3 | Chiffres en dur rendus réglables (Comptoir, talents, spécialisations, modules, sac…), valeurs inchangées | M | livré (6.14.104) |
| 23 | AA4 | Textes de règle construits depuis les règles (parrainage, primes, boss d'alliance, Comptoir) | S | livré (6.14.105) |
| 24 | RL-0 | Rythme sur des mois : proposition et simulateur sur 365 jours (`docs/proposals/rythme-long-terme.md`, Q164 à Q171) ; reste le mode `--long` de `progression-sim.mjs` | S | livré en partie (6.14.78) |
| 24b | RL-1 | Recherche : champs `lateFromLevel`, `lateTimeFactor`, `maxLevelSeconds`, `costGrowth`, `timeGrowth` réglables dans l'admin, valeurs neutres d'abord | S | livré (6.14.84) |
| 24c | RL-2 | Projets de prestige (groupe `prestige`, 8 h de production, récompense visible seulement) avec toute la chaîne de contenu (remplace AE-L6) | M | livré (6.14.85) ; reportés : thème de saison, défi d'alliance et défi du passe (voir la fiche) |
| 24d | RL-3 | Bascule du rythme (comprend AE-L2 : second palier ×4 en durée, recherche tardive ×30, Ascension tous les 30 jours au plus, 10 au maximum) au début d'un mois avec annonce ; garde I29 étendue à 365 jours | M | livré (6.14.88 ; bascule datée au 1er novembre 2026, annonce en attente de son image `annonce-rythme`) |
| 24e | RL-4 | Mesures après la bascule (sessions bloquées, production perdue, jour des Ascensions) | S | à faire |
| 24f | RL-5 | Réglage fin après 8 semaines ; échelle des rangs au-delà de J90 | S | livré en partie (6.14.89, réglage avant bascule ; mesures après la bascule restent) |
| 25 | AE-L3 | Coffre indexé, plafond de rareté hebdomadaire, défaites par 24 h (moteur et admin) | M | livré (6.14.106) |
| 26 | AE-L4 | Santé de l'équilibre : Ambre par source, temps avant la mort des boss, 1re Ascension, production perdue | S | livré (6.14.107) |
| 27 | AP-L4 | Succès procéduraux bridés (détenteurs minimum, un palier par mois) | S | livré (6.14.108) |
| 28 | AP-L5 | Objectifs du jour pondérés et réglables | S | livré (6.14.109) |
| 29 | AC-D | Dépenses et traces : un seul chemin de dépense, Journal des réclamations, rappel de flotte notifié | M | livré (6.14.110) |
| 30 | AC-E | Tâches planifiées : verrou par cadence, e-mails par lots | M | livré (6.14.111 ; avec AC-8 allégé et la règle de maintenance Q77) |
| 31 | AC-F | Erreurs traduites (403, 409, 429, 503) et garde de vacances unique | S | livré (6.14.112) |
| 32 | AC-G | Réclamations groupées (casino du jour, défi, titre du Codex dans « Tout réclamer ») | M | livré (6.14.113) |
| 33 | UX-6 | Hiérarchie des pages (Missions, Passe, Alliance, Seigneurs, Codex) | M | livré (6.14.67) |
| 34 | UX-7 | Tactile et accessibilité (44 px sur écran tactile, `aria-label`, raison des boutons grisés) | M | livré (6.14.68) |
| 35 | AJ27-4 | Garde de chaîne de contenu par contenu, panneau « Chaîne de contenu » dans l'admin | M | livré (6.14.114) |
| 36 | AJ27-5 | Colonies dans la chaîne : succès, Codex des biomes, Formules | M | livré (6.14.115) |
| 37 | É30-5 | Performance : stabilité mobile, LCP de la Galaxie, images du Codex à la demande | M | livré (6.14.116 ; mesure sur la pré-prod au push) |
| 38 | É30-6 | Rythme des succès (avec AP-L4) | M | livré (6.14.117 ; `docs/proposals/rythme-des-succes.md`) |
| 39 | É30-7 | Reliques à image propre et prompts des biomes et classes | S | livré (6.14.118) |
| 40 | AP-L7 | Nouveau générateur : registre des actions suivies (lune, colonies, nouvelles unités dans les objectifs) | L | livré (6.14.121) |
| 41 | AP-L8 | Nouveau générateur : épisode « nouveauté » pour le contenu récemment ajouté | M | livré (6.14.122) |
| 42 | AA5 | Rôles d'unités (sonde, recycleur, faiblesse de boss) au lieu d'identifiants en dur | M | livré (6.14.123) |
| 43 | AA6 | Recherches d'alliance par effets composés (une recherche ajoutée dans l'admin a un effet) | M | livré (6.14.124) |
| 44 | AA7 | Classes, mutateurs, fugitifs : listes éditables | M | livré (6.14.125) |
| 45 | AA8 | Historique champ par champ et retour arrière par groupe dans l'admin | M | livré (6.14.126 ; carte « Chaîne de contenu » déjà livrée en 6.14.114) |
| 46 | AJ27-6 | Succès dérivés par unité et par bâtiment | M | livré (6.14.129, `docs/changes/6.14.129-succes-par-contenu.md`) |
| 47 | AJ27-7 | Objectifs paramétrés par contenu (construire telle unité, rechercher telle techno) | L | livré (6.14.131, `docs/changes/6.14.131-objectifs-parametres.md`) |
| 48 | AJ27-8 | Formules générées depuis les registres, Ctrl+K étendu | M | livré (6.14.130, `docs/changes/6.14.130-formules-ctrlk.md`) |
| 49 | AJ27-9 | Codex : officiers, Doctrines, Arsenal | M | livré (6.14.132, `docs/changes/6.14.132-codex-doctrines-arsenal.md`) |
| 50 | AJ27-10 | Reliques par source, porteurs « signature » par unité | M | livré (6.14.133, `docs/changes/6.14.133-porteurs-signature.md`) |
| 51 | DP-L1 | Déblocage progressif du menu : moteur (`navUnlock`, déclencheurs signal / étape / rang), invariants (remplace AE-L5 ; `docs/proposals/deblocage-progressif.md`, Q152 à Q158) | M | livré (6.14.74, `docs/changes/6.14.74-deblocage-moteur.md`) |
| 51b | DP-L2 | Déblocage progressif : interface (menu, mobile, Ctrl+K, « Prochaine ouverture », « Tout afficher ») | M | livré (6.14.75, `docs/changes/6.14.75-deblocage-interface.md`) |
| 51c | DP-L3 | Déblocage progressif : Prise en main, Carnet, panneau Lune, passe | S | livré (6.14.76, `docs/changes/6.14.76-deblocage-prise-en-main.md`) |
| 51d | DP-L4 | Déblocage progressif : serveur (objectifs du jour filtrés, danger qui ouvre sa page) | S | livré (6.14.79, `docs/changes/6.14.79-deblocage-serveur.md`) |
| 51e | DP-L5 | Déblocage progressif : éditeur dans l'admin | S | livré (6.14.80, `docs/changes/6.14.80-deblocage-admin.md`) |
| 51f | DP-L6 | Déblocage progressif : chaîne de contenu et livraison | S | livré (6.14.81, `docs/changes/6.14.81-deblocage-chaine.md`) ; essai pré-prod d'un compte neuf au prochain push |
| 52 | AP-L9 | Mutateurs en contenu, anti-répétition | M | livré (6.14.136, `docs/changes/6.14.136-mutateurs-sans-repetition.md`) |
| 53 | AP-L10 | Variété narrative (banques de textes réglables) | M | livré (6.14.137, `docs/changes/6.14.137-variete-narrative.md`) |
| 54 | AP-L11 | Illustrations de saison (thèmes, portraits, second boss par archétype) | M | livré (6.14.138, `docs/changes/6.14.138-illustrations-saison.md` ; rendus à envoyer sur /img) |
| 55 | AP-L12 | Catalogue des saisons au-delà de 36 mois | M | livré (6.14.139, `docs/changes/6.14.139-catalogue-prolonge.md`) |
| 56 | AP-L14 | Outil `procedural-sim.mjs` dans le dépôt | S | livré (6.14.140, `docs/changes/6.14.140-procedural-sim.md`) |
| 57 | UX-9 | Cohérence visuelle (couleurs de décor, titres, icônes à la place des emoji) | M | livré (6.14.82, `docs/changes/6.14.82-coherence-visuelle.md`) ; Réglages mobile (AD-22) et pastilles du menu repris en 6.14.86 |
| 58 | UX-10 | Hygiène et gardes du design system | M | livré (6.14.83, `docs/changes/6.14.83-hygiene-design.md`) ; exceptions du menu, de l'en-tête, des Réglages et des `useEffect` de l'admin retirées en 6.14.86 ; restent admin (arrondis, emoji, dates), accueil, cockpit, Succès |
| 59 | UX-11 | Ctrl+K et animation des flottes de la Galaxie | S | livré (6.14.86, `docs/changes/6.14.86-finitions-interface.md`) |
| 60 | AC-H | Ménage, boutons « Lancer maintenant », test « tour des actions » | M | livré (6.14.135, `docs/changes/6.14.135-menage-tour-actions.md`) |
| 62 | AA9 | Talents, modules, catalogues en sections de contenu | L | livré (6.14.127 et 6.14.128 ; `docs/changes/6.14.127-talents-modules.md`, `docs/changes/6.14.128-catalogue-passe.md`) |
| 63 | AJ27-12 | Paliers des bâtiments (proposition, `docs/proposals/paliers-batiments.md`, questions PB-Q1 à PB-Q8) | L | livré (6.14.134, proposition ; lots à valider) |
| 63a | PB-L0 | Paliers des bâtiments : règle n° 4 réécrite (bâtiments de système, bâtiments de courbe) dans le GDD, `WORKFLOW.md` et les fiches (`docs/proposals/paliers-batiments.md`, Q336) | S | à faire |
| 63b | PB-L1 | Paliers : groupe `buildingTiers` et section d'admin, source d'effets « bâtiment », choix du joueur (24 h), ligne « Paliers » des cartes, invariant | M | à faire |
| 63c | PB-L2 | Paliers de l'entrepôt (ressource prioritaire, tampon de 2 h, Négoce ou Convoi, abri de 12 h) | M | à faire |
| 63d | PB-L3 | Paliers de l'Atelier (Cale sèche affichée, réparation éclair, classe spécialisée, accélération de 2 h par jour) | M | à faire |
| 63e | PB-L4 | Paliers des hangars (baies modulaires, file d'attente et I2 réécrit, spécialisations, signatures ; mesure JcJ) | L | à faire |
| 63f | PB-L5 | Paliers : chaîne de contenu (succès « Architecte » et « Bâtisseur avisé », Codex, Formules, Ctrl+K, changelog, billet, images) | S | à faire |
| 64 | É30-3 | Illustrations : intégration au fil des envois (127 emplacements sur `/img`) | selon envois | en continu |
| 65a | TH-L1 | Verrous sans opacité (Passe, « manque X » des Bâtiments), contraste ≥ 4,5:1 (AU28 thèmes) | S | livré (6.14.97) |
| 65b | TH-L2 | Titres longs (coupure au mot) et libellés du menu « Plus » dans les thèmes à Inter | S | livré (6.14.98) |
| 65c | TH-L3 | Catégorie « Production » en neutre (ember réservé à l'attention) | S | livré (6.14.96) |
| 65d | TH-L4 | Garde des contrastes mesurée sur `space-600` (Q235) | S | livré (6.14.96) |
| 65e | TH-L5 | Palette Netrunner : or/accent et violet/danger séparés (Q233) | M | livré (6.14.100) |
| 65f | TH-L6 | Ember lisible dans les thèmes orange : icône d'alerte obligatoire (Q234) | M | livré (6.14.101) |
| 65g | TH-L7 | `scripts/theme-audit.mjs` à chaque revue de fin de feuille de route (Q237) | S | livré (6.14.99) |
| 65 | AU28 | Revue, même grille, audit des 13 thèmes (`theme-audit.mjs`, WORKFLOW §5) | M | fin des lots |
| — | AC-I, AE-L7, AP-L6, AP-L13, AJ27-11, UX-12 | Après mesures (Z6, 8 semaines en production) ou ménage | — | plus tard |
| — | Z0 | Mise en production | — | écartée pour l'instant (Q12) |
