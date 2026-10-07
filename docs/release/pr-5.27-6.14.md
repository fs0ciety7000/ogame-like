# Texte de la PR `claude/hiver-k-s` → `main` (prêt à coller)

Lot P30-2 (6.14.31). À utiliser le jour où l'utilisateur donne le feu vert (Q12). Claude peut ouvrir la PR lui-même sur demande.

**Titre :** `5.27.1 → 6.14.30 : la grande mise à jour (45 versions joueurs, pré-prod validée)`

---

## Résumé

Fusion de la branche de travail dans `main`. La production est en 5.27.0 depuis le 2026-10-06. Cette PR porte 45 versions visibles par
les joueurs et les lots d'outillage, soit 97 fiches. Tout a tourné sur la pré-prod `test.fs0ciety.org`, sur une copie de la
production : migrations appliquées, services ok, joueurs intacts.

- **Dossier de mise en production** : `docs/release/5.27-a-6.14.md` (données, risques, déroulé, vérifications, retour arrière).
- **Billet pour les joueurs** : `content/blog/49-grande-mise-a-jour.md`, à importer en brouillon puis à publier après le déploiement.

## Données

- Schéma : ajouts seulement. Collection `illustration_uploads` ; `players.empireClass` et `players.moon` ; `profiles.empireClass` et
  `profiles.moonName` ; `fleets.base` ; `debris_fields.locationId`.
- 8 migrations de contenu, une seule fois chacune (`content_migrations`) :
  `rules-6.2`, `categories-6.4`, `class-units-6.5`, `lairs-6.6`, `traqueur-6.6`, `tech19_2-6.6`, `chronicles-library-6.8`,
  `cale-seche-5.28`.
- Tâches planifiées regroupées en trois cadences (`cosmic_minute`, `cosmic_five`, `cosmic_ten`).

## Vérifications

- [ ] CI verte : lint, tests (1 144), build, intégration PocketBase (80).
- [ ] Après la fusion, le workflow « Déploiement serveur » fait la sauvegarde complète, puis pose le schéma et les hooks.
- [ ] `GET /api/cosmic/version` → `6.14.26` ; `GET /api/cosmic/status` → services ok.
- [ ] `content_migrations` : les 8 migrations ci-dessus.
- [ ] Une connexion et une action de jeu réussies ; Comptoir et Codex illustrés ; `/img` (admin) affiche la liste.
- [ ] Billet importé et publié.

## Fiches portées

- 5.27.1 : Comptoir de la Ruche réagencé (`docs/changes/5.27.1-comptoir-reagence.md`)
- 5.28.0 : Cale sèche et hangars remis d'aplomb (`docs/changes/5.28.0-cale-seche.md`)
- 5.28.1 : Correctifs de cohérence (`docs/changes/5.28.1-correctifs.md`)
- 5.29.0 : Un jeu plus léger (`docs/changes/5.29.0-performance.md`)
- 5.30.0 : Ordres du jour (`docs/changes/5.30.0-ordres-du-jour.md`)
- 5.31.0 : Portefeuille et chiffres expliqués (`docs/changes/5.31.0-lisibilite.md`)
- 5.32.0 : Entrepôt plus risqué, chantiers comptés (`docs/changes/5.32.0-entrepot-chantiers.md`)
- 5.33.0 : Alliances jusqu'à 20 membres (`docs/changes/5.33.0-alliances-grandes.md`)
- 5.33.0 : Emplacements de flotte et « Relancer » (`docs/changes/5.33.0-emplacements-flotte.md`)
- 5.33.0 : Routes logistiques des colonies (`docs/changes/5.33.0-routes-logistiques.md`)
- 6.0.0 : Classes d'empire (`docs/changes/6.0.0-classes-empire.md`)
- 6.0.1 : Santé de l'équilibre (admin) (`docs/changes/6.0.1-sante-equilibre.md`)
- 6.1.0 : D'où vient ce chiffre, suite (`docs/changes/6.1.0-lisibilite-suite.md`)
- 6.2.0 : Un JcJ qui rapporte (`docs/changes/6.2.0-pillage.md`)
- 6.2.1 : Objectifs du jour (`docs/changes/6.2.1-quotidien-fusion.md`)
- 6.3.0 : Relancer toutes les missions (`docs/changes/6.3.0-relancer.md`)
- 6.3.1 : Vaisseaux et défenses (`docs/changes/6.3.1-categories-unites.md`)
- 6.3.2 : Bloc d'interface séparé (`docs/changes/6.3.2-bundle-ui.md`)
- 6.4.0 : Colonies, suite (`docs/changes/6.4.0-colonies-suite.md`)
- 6.4.1 : Prise en main à jour (`docs/changes/6.4.1-prise-en-main.md`)
- 6.5.0 : Vaisseaux de classe (`docs/changes/6.5.0-vaisseaux-classe.md`)
- 6.5.1 : Santé de l'équilibre, suite (`docs/changes/6.5.1-sante-suite.md`)
- 6.6.0 : Menaces PNJ (AU1 : A à D) (`docs/changes/6.6.0-menaces-pnj.md`)
- 6.7.0 : Rendez-vous étalés sur la semaine (`docs/changes/6.7.0-calendrier-semaine.md`)
- 6.7.1 : Casino ouvert en permanence, réglages admin (`docs/changes/6.7.1-casino-reglages.md`)
- 6.7.2 : Tous les réglages de GameRules dans le panel admin (`docs/changes/6.7.2-reglages-admin-complets.md`)
- 6.8.0 : Progression mesurée, novembre généré (`docs/changes/6.8.0-progression-generative.md`)
- 6.8.1 : Passe généré par budget (`docs/changes/6.8.1-passe-par-budget.md`)
- 6.8.2 : Chroniques générées sous réglages (`docs/changes/6.8.2-chroniques-generees.md`)
- 6.9.0 : Commerce réglable dans l'admin (`docs/changes/6.9.0-commerce-reglable.md`)
- 6.9.1 : Registre des réglages (`docs/changes/6.9.1-registre-reglages.md`)
- 6.9.2 : Alliances, confirmations et réglages (`docs/changes/6.9.2-alliances-confirmations.md`)
- 6.9.3 : Communications, confirmations et saisie mobile (`docs/changes/6.9.3-communications.md`)
- 6.9.4 : Flottes, rappel confirmé et distances réglables (`docs/changes/6.9.4-galaxie-flottes.md`)
- 6.9.5 : Plafonds des bonus réglables, sources uniques (`docs/changes/6.9.5-plafonds-bonus.md`)
- 6.9.6 : Unités et flottes, texte d'annulation (`docs/changes/6.9.6-unites-flottes.md`)
- 6.9.7 : Comptoir d'échange et file du Labo réglables (`docs/changes/6.9.7-economie.md`)
- 6.9.8 : Colonies, délai de spécialisation affiché (`docs/changes/6.9.8-colonies.md`)
- 6.9.9 : Puissance d'une flotte détaillée (`docs/changes/6.9.9-puissance-flotte.md`)
- 6.9.10 : Bloc de démarrage mesuré, chargement à la demande reporté (`docs/changes/6.9.10-mesure-bloc-demarrage.md`)
- 6.10.0 : Base avancée sur une colonie (`docs/changes/6.10.0-flotte-basee.md`)
- 6.10.1 : Revue AU13 : commerce dans la santé, Nouveautés par tranches, garde des routes admin (`docs/changes/6.10.1-revue-transverse.md`)
- 6.10.2 : Pages longues sur mobile (`docs/changes/6.10.2-pages-longues.md`)
- 6.10.3 : Dernières constantes de règle dans l'admin (`docs/changes/6.10.3-constantes-regles.md`)
- 6.11.0 : Paliers bonus du passe (`docs/changes/6.11.0-paliers-bonus.md`)
- 6.11.1 : La base avancée peut défendre sa colonie (`docs/changes/6.11.1-base-defend-colonie.md`)
- 6.11.2 : Revue AU14 et clôture du printemps (`docs/changes/6.11.2-revue-printemps.md`)
- 6.11.3 : Unités plus courte sur mobile (`docs/changes/6.11.3-unites-mobile.md`)
- 6.11.4 : Débris sur les colonies (`docs/changes/6.11.4-debris-colonies.md`)
- 6.11.5 : Revue AU15 et clôture de l'été (`docs/changes/6.11.5-revue-ete.md`)
- 6.11.6 : Formules et Statistiques plus courtes sur mobile (`docs/changes/6.11.6-formules-statistiques-mobile.md`)
- 6.11.7 : Seigneurs, Profil et Missions plus courts sur mobile (`docs/changes/6.11.7-seigneurs-profil-missions-mobile.md`)
- 6.11.8 : Revue AU16 et clôture de l'automne (`docs/changes/6.11.8-revue-automne.md`)
- 6.11.9 : Bâtiments, Unités et État-major sous 5 000 px sur mobile (`docs/changes/6.11.9-batiments-unites-etat-major-mobile.md`)
- 6.11.10 : Test d'intégration des seigneurs autonome (`docs/changes/6.11.10-test-seigneurs-autonome.md`)
- 6.11.11 : Billet de devblog « le jeu sur téléphone » (`docs/changes/6.11.11-billet-telephone.md`)
- 6.11.12 : Revue AU17 et clôture de l'hiver (`docs/changes/6.11.12-revue-hiver.md`)
- 6.11.13 : Pages mobiles mesurées avec un joueur avancé (`docs/changes/6.11.13-joueur-avance-mobile.md`)
- 6.11.14 : Revue AU18 et pause des feuilles de route (`docs/changes/6.11.14-revue-printemps-2028.md`)
- 6.11.15 : Reprise du travail continu (`docs/changes/6.11.15-reprise-travail-continu.md`)
- 6.12.0 : Vue « liste » de Bâtiments sur téléphone (`docs/changes/6.12.0-batiments-vue-liste.md`)
- 6.13.0 : Lunes (`docs/changes/6.13.0-lunes.md`)
- 6.13.1 : Revue AU19 et clôture de l'été 2028 (`docs/changes/6.13.1-revue-ete-2028.md`)
- 6.13.2 : Billet de devblog « Les lunes » (`docs/changes/6.13.2-billet-lunes.md`)
- 6.13.3 : La lune visible des autres joueurs (`docs/changes/6.13.3-lune-publique.md`)
- 6.13.4 : Revue AU20 et clôture de l'automne 2028 (`docs/changes/6.13.4-revue-automne-2028.md`)
- 6.14.0 : Améliorer sa lune (`docs/changes/6.14.0-ameliorer-sa-lune.md`)
- 6.14.1 : Codex : les lunes (`docs/changes/6.14.1-codex-lunes.md`)
- 6.14.2 : Revue AU21 (`docs/changes/6.14.2-revue-au21.md`)
- 6.14.3 : Succès lunaires (`docs/changes/6.14.3-succes-lunaires.md`)
- 6.14.4 : Billet « Ta lune grandit » (`docs/changes/6.14.4-billet-lunes-2.md`)
- 6.14.5 : Revue AU22 (`docs/changes/6.14.5-revue-au22.md`)
- 6.14.6 : Mesure BOSS-2 : boss abattus (`docs/changes/6.14.6-mesure-boss.md`)
- 6.14.7 : Revue AU23 (`docs/changes/6.14.7-revue-au23.md`)
- 6.14.8 : Pré-prod test.fs0ciety.org (`docs/changes/6.14.8-preprod.md`)
- 6.14.9 : Pré-prod Coolify et chaîne de contenu (`docs/changes/6.14.9-preprod-coolify-chaine-contenu.md`)
- 6.14.10 : Reprise de session, intégration dans le dépôt (`docs/changes/6.14.10-reprise-session.md`)
- 6.14.11 : Garde de la chaîne de contenu, pré-prod nettoyée (`docs/changes/6.14.11-garde-chaine-contenu.md`)
- 6.14.12 : Codex : bâtiments et technologies (`docs/changes/6.14.12-codex-batiments-technos.md`)
- 6.14.13 : Préréglages d'effet pour toutes les unités (`docs/changes/6.14.13-prereglages-unites.md`)
- 6.14.14 : Succès des boss d'alliance (`docs/changes/6.14.14-succes-boss-alliance.md`)
- 6.14.15 : Pré-prod : adresses des fichiers, script de capture (`docs/changes/6.14.15-preprod-adresses.md`)
- 6.14.16 : Mesures Z1 sur la pré-prod (`docs/changes/6.14.16-mesures-z1.md`)
- 6.14.17 : Codex dans « Tout réclamer » (`docs/changes/6.14.17-codex-tout-reclamer.md`)
- 6.14.18 : Inventaire des constats ouverts (`docs/changes/6.14.18-constats-ouverts.md`)
- 6.14.19 : Santé de l'équilibre complétée (`docs/changes/6.14.19-sante-completee.md`)
- 6.14.20 : Revue AU24 (`docs/changes/6.14.20-revue-au24.md`)
- 6.14.21 : Tests d'intégration sans tri (`docs/changes/6.14.21-tests-sans-tri.md`)
- 6.14.22 : Atelier d'illustrations (`docs/changes/6.14.22-atelier-illustrations.md`)
- 6.14.23 : Page /img de la pré-prod : envoi des illustrations par lot (`docs/changes/6.14.23-img-preprod.md`)
- 6.14.24 : Dossier de mise en production 5.27 → 6.14 (`docs/changes/6.14.24-dossier-mise-en-production.md`)
- 6.14.25 : Seigneurs et Boss du Codex dans « Tout réclamer » (`docs/changes/6.14.25-codex-serveur-tout-reclamer.md`)
- 6.14.26 : Premières illustrations intégrées (`docs/changes/6.14.26-premieres-illustrations.md`)
- 6.14.27 : /img : filtre par état, page en production (`docs/changes/6.14.27-img-filtre-prod.md`)
- 6.14.28 : Synthèse des décisions à valider (`docs/changes/6.14.28-decisions-a-valider.md`)
- 6.14.29 : Revue AU25 (`docs/changes/6.14.29-revue-au25.md`)
- 6.14.30 : Billet « la grande mise à jour » (`docs/changes/6.14.30-billet-grande-mise-a-jour.md`)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01JGD7FtHAneKzyjfFyuuCTC
