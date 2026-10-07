# Fiches de changement

**Tout changement a sa fiche** : fonctionnalité, ajout, rework, ajustement d'équilibre, correctif, refactoring, changement de doc
ou d'outillage. Une fiche par lot (une PR peut en porter plusieurs). Pas de fiche, pas de commit.

Deux niveaux :

| Type | Fichier | Quand |
|:--|:--|:--|
| **Proposition** | `docs/proposals/<système>.md` | avant de coder, quand le changement touche l'équilibre, les données des joueurs ou un système entier ; la recommandation est appliquée sans attendre, le choix noté dans `docs/QUESTIONS.md` (règle n° 3, `WORKFLOW.md` §2) |
| **Fiche de changement** | `docs/changes/<version>-<slug>.md` | pour **chaque** lot livré, proposition ou non ; écrite pendant le lot, terminée avant le commit |

Une proposition livrée a aussi sa fiche de changement, qui renvoie vers elle.

## Règles

- Nom : `<version>-<slug>.md` (ex. `5.28.0-cale-seche.md`) ; la version est celle du changelog du lot.
- Plan fixe : le modèle ci-dessous. Une section sans objet porte « Sans objet », jamais rien.
- Les règles de jeu qui changent sont reportées dans le GDD (`docs/GAME_DESIGN.md`, fiches systèmes §7, invariants §4), les règles de
  travail dans `CLAUDE.md`, les règles visuelles dans `docs/DESIGN.md`, la méthode dans `docs/WORKFLOW.md`. La fiche dit lesquels ont bougé.
- L'index ci-dessous est tenu à jour, du plus récent au plus ancien.

## Modèle

```markdown
# <version> : <titre>

Type : fonctionnalité | ajout | rework | ajustement | correctif | refactoring | docs
Statut : en cours | livré (PR #…) | abandonné
Proposition : `docs/proposals/<système>.md` | aucune (raison)

## Demande
La demande telle qu'exprimée (citation), et le problème joueur derrière.

## Diagnostic
Ce qu'on a trouvé, avec la preuve (test, simulation, fichier:ligne). « Sans objet » pour un pur ajout.

## Ce qui change
- Pour le joueur (règles, écrans, chiffres).
- Pour l'admin (réglages, contenu, migrations).
- Dans le code (modules, actions serveur, schéma) : liste courte.

## Décisions et écarts
Choix faits pendant le lot, et écarts avec la proposition, avec la raison.

## Invariants et tests
Invariants du GDD touchés ou ajoutés ; tests ajoutés ou modifiés.

## Design (DESIGN.md)
Composants utilisés, couleurs = sens, vérification mobile (375 px). « Sans objet » sans front.

## Docs mises à jour
CLAUDE.md, GDD, DESIGN.md, WORKFLOW.md, changelog, devblog, prompts : ce qui a bougé.

## Validation
Commandes passées et résultats (tsc, eslint, vitest, build, intégration).

## Suites
Ce qui reste, les idées notées, les risques à surveiller.
```

## Index

| Version | Fiche | Type | Proposition |
|:--|:--|:--|:--|
| — | [Calendrier de la semaine : proposition](docs-calendrier-semaine.md) | docs | [calendrier-semaine](../proposals/calendrier-semaine.md), lot V |
| — | [Revue AU2 : boss](docs-au2-boss.md) | docs, correctif | [menaces-pnj](../proposals/menaces-pnj.md), revue AU2 |
| — | [Revue AU1 : menaces PNJ](docs-au1-menaces-pnj.md) | docs | [menaces-pnj](../proposals/menaces-pnj.md), revue AU1 |
| 6.5.1 | [Santé de l'équilibre, suite](6.5.1-sante-suite.md) | ajout | [feuille-de-route-2026-hiver](../proposals/feuille-de-route-2026-hiver.md), lot U |
| 6.6.0 | [Menaces PNJ (AU1 : A à D)](6.6.0-menaces-pnj.md) | rework | [menaces-pnj](../proposals/menaces-pnj.md) |
| 6.7.0 | [Rendez-vous étalés sur la semaine](6.7.0-calendrier-semaine.md) | rework | [calendrier-semaine](../proposals/calendrier-semaine.md) |
| 6.7.1 | [Casino ouvert en permanence, réglages admin](6.7.1-casino-reglages.md) | correctif | [calendrier-semaine](../proposals/calendrier-semaine.md) |
| 6.9.8 | [Colonies, délai de spécialisation affiché](6.9.8-colonies.md) | correctif | aucune (AU12) |
| 6.9.9 | [Puissance d'une flotte détaillée](6.9.9-puissance-flotte.md) | ajout | feuille de route (W) |
| 6.9.10 | [Bloc de démarrage mesuré, chargement à la demande reporté](6.9.10-mesure-bloc-demarrage.md) | docs | feuille de route (X), Q8 |
| 6.10.0 | [Base avancée sur une colonie](6.10.0-flotte-basee.md) | fonctionnalité | `flotte-basee.md` (Y), Q9, Q10 |
| 6.10.1 | [Revue AU13 : commerce dans la santé, Nouveautés par tranches, garde des routes admin](6.10.1-revue-transverse.md) | correctif | aucune (AU13), Q11 |
| docs | [Travail continu entre deux feuilles de route](docs-travail-continu-2.md) | docs | consigne du 2026-10-07, Q12 |
| 6.10.2 | [Pages longues sur mobile](6.10.2-pages-longues.md) | rework | feuille de route de printemps (Z2) |
| 6.10.3 | [Dernières constantes de règle dans l'admin](6.10.3-constantes-regles.md) | refactoring | feuille de route de printemps (Z5), Q7 |
| 6.11.0 | [Paliers bonus du passe](6.11.0-paliers-bonus.md) | fonctionnalité | `progression.md` (B1), Q4 |
| 6.11.1 | [La base avancée peut défendre sa colonie](6.11.1-base-defend-colonie.md) | fonctionnalité | `flotte-basee.md`, Q9 |
| 6.11.2 | [Revue AU14 et clôture du printemps](6.11.2-revue-printemps.md) | docs | aucune (AU14) |
| 6.11.3 | [Unités plus courte sur mobile](6.11.3-unites-mobile.md) | ajustement | aucune (E2), Q14 |
| 6.11.4 | [Débris sur les colonies](6.11.4-debris-colonies.md) | correctif | aucune (E1), Q13 |
| 6.11.5 | [Revue AU15 et clôture de l'été](6.11.5-revue-ete.md) | docs | aucune (AU15) |
| 6.11.6 | [Formules et Statistiques plus courtes sur mobile](6.11.6-formules-statistiques-mobile.md) | ajustement | aucune (A2) |
| 6.11.7 | [Seigneurs, Profil et Missions plus courts sur mobile](6.11.7-seigneurs-profil-missions-mobile.md) | ajustement | aucune (A3) |
| 6.11.8 | [Revue AU16 et clôture de l'automne](6.11.8-revue-automne.md) | docs | aucune (AU16), Q15 |
| 6.11.9 | [Bâtiments, Unités et État-major sous 5 000 px sur mobile](6.11.9-batiments-unites-etat-major-mobile.md) | ajustement | aucune (H1), Q14 |
| 6.11.10 | [Test d'intégration des seigneurs autonome](6.11.10-test-seigneurs-autonome.md) | refactoring | aucune (H2) |
| 6.11.11 | [Billet de devblog « le jeu sur téléphone »](6.11.11-billet-telephone.md) | docs | aucune (H3) |
| 6.11.12 | [Revue AU17 et clôture de l'hiver](6.11.12-revue-hiver.md) | docs | aucune (AU17) |
| 6.11.13 | [Pages mobiles mesurées avec un joueur avancé](6.11.13-joueur-avance-mobile.md) | ajustement | aucune (P1), Q16 |
| 6.11.14 | [Revue AU18 et pause des feuilles de route](6.11.14-revue-printemps-2028.md) | docs | aucune (AU18), Q17 |
| 6.11.15 | [Reprise du travail continu](6.11.15-reprise-travail-continu.md) | docs | aucune, Q15 à Q17 |
| 6.12.0 | [Vue « liste » de Bâtiments sur téléphone](6.12.0-batiments-vue-liste.md) | fonctionnalité | aucune (R2), Q16 |
| 6.13.0 | [Lunes](6.13.0-lunes.md) | fonctionnalité | `lunes.md`, Q15 |
| 6.13.1 | [Revue AU19 et clôture de l'été 2028](6.13.1-revue-ete-2028.md) | docs | aucune (AU19) |
| 6.13.2 | [Billet de devblog « Les lunes »](6.13.2-billet-lunes.md) | docs | aucune (A28-1) |
| 6.13.3 | [La lune visible des autres joueurs](6.13.3-lune-publique.md) | ajout | `lunes.md` (A28-2) |
| 6.13.4 | [Revue AU20 et clôture de l'automne 2028](6.13.4-revue-automne-2028.md) | docs | aucune (AU20) |
| 6.14.0 | [Améliorer sa lune](6.14.0-ameliorer-sa-lune.md) | fonctionnalité | `lunes.md` §8, Q18 |
| 6.14.1 | [Codex : les lunes](6.14.1-codex-lunes.md) | ajout | aucune (H28-2), Q19 |
| 6.14.2 | [Revue AU21](6.14.2-revue-au21.md) | docs | aucune (AU21) |
| 6.14.3 | [Succès lunaires](6.14.3-succes-lunaires.md) | ajout | aucune (P29-1), Q20 |
| 6.14.4 | [Billet « Ta lune grandit »](6.14.4-billet-lunes-2.md) | docs | aucune (P29-2) |
| 6.14.5 | [Revue AU22](6.14.5-revue-au22.md) | docs | aucune (AU22) |
| 6.14.6 | [Mesure BOSS-2 : boss abattus](6.14.6-mesure-boss.md) | ajout (admin) | aucune (E29-1), Q21 |
| 6.14.7 | [Revue AU23](6.14.7-revue-au23.md) | docs | aucune (AU23) |
| 6.14.8 | [Pré-prod test.fs0ciety.org](6.14.8-preprod.md) | ajout (outillage) | aucune (PP-1), Q22 |
| 6.14.9 | [Pré-prod Coolify et chaîne de contenu](6.14.9-preprod-coolify-chaine-contenu.md) | ajout (outillage), docs | aucune (PP-2), Q22 |
| 6.14.10 | [Reprise de session, intégration dans le dépôt](6.14.10-reprise-session.md) | outillage, docs | aucune |
| 6.14.11 | [Garde de la chaîne de contenu, pré-prod nettoyée](6.14.11-garde-chaine-contenu.md) | ajout (outillage), docs | `chaine-contenu.md` (C1), Q22, Q23 |
| 6.14.12 | [Codex : bâtiments et technologies](6.14.12-codex-batiments-technos.md) | ajout | `chaine-contenu.md` (C2), Q24 |
| 6.14.13 | [Préréglages d'effet pour toutes les unités](6.14.13-prereglages-unites.md) | ajout (admin) | `chaine-contenu.md` (C3), Q25 |
| 6.14.14 | [Succès des boss d'alliance](6.14.14-succes-boss-alliance.md) | ajout | `chaine-contenu.md` (C4), Q26 |
| 6.14.15 | [Pré-prod : adresses des fichiers, script de capture](6.14.15-preprod-adresses.md) | ajout (outillage) | aucune (PP-3), Q22 |
| 6.14.16 | [Mesures Z1 sur la pré-prod](6.14.16-mesures-z1.md) | docs, outillage | aucune (Z1), Q2, Q3, Q18, Q21 |
| 6.14.17 | [Codex dans « Tout réclamer »](6.14.17-codex-tout-reclamer.md) | correctif | aucune (Z1-2), Q27 |
| 6.14.18 | [Inventaire des constats ouverts](6.14.18-constats-ouverts.md) | docs | aucune (A29-1, ET29-3) |
| 6.14.19 | [Santé de l'équilibre complétée](6.14.19-sante-completee.md) | ajout (admin) | aucune (A29-2) |
| 6.14.20 | [Revue AU24](6.14.20-revue-au24.md) | docs | aucune (AU24) |
| 6.14.21 | [Tests d'intégration sans tri](6.14.21-tests-sans-tri.md) | correctif (tests) | aucune (H29-2) |
| 6.14.22 | [Atelier d'illustrations](6.14.22-atelier-illustrations.md) | ajout (outillage), docs | aucune (demande de l'utilisateur), Q28 |
| 6.14.23 | [Page /img de la pré-prod : envoi des illustrations par lot](6.14.23-img-preprod.md) | ajout (outillage) | aucune (demande de l'utilisateur), Q28 |
| 6.14.24 | [Dossier de mise en production 5.27 → 6.14](6.14.24-dossier-mise-en-production.md) | docs | aucune (H29-1), Q12 |
| 6.14.25 | [Seigneurs et Boss du Codex dans « Tout réclamer »](6.14.25-codex-serveur-tout-reclamer.md) | correctif | aucune (H29-3), Q27 |
| 6.14.26 | [Premières illustrations intégrées](6.14.26-premieres-illustrations.md) | ajout | aucune (IMG-2), Q28 |
| 6.14.27 | [/img : filtre par état, page en production](6.14.27-img-filtre-prod.md) | correctif, ajout (outillage) | aucune, Q29 |
| 6.14.28 | [Synthèse des décisions à valider](6.14.28-decisions-a-valider.md) | docs, outillage | aucune (H29-4) |
| 6.14.29 | [Revue AU25](6.14.29-revue-au25.md) | docs | aucune (AU25) |
| 6.14.30 | [Billet « la grande mise à jour »](6.14.30-billet-grande-mise-a-jour.md) | docs | aucune (P30-1) |
| 6.14.31 | [Texte de la PR prêt à coller](6.14.31-texte-pr.md) | docs | aucune (P30-2) |
| 6.14.32 | [Page /decisions dans le jeu](6.14.32-page-decisions.md) | ajout (outillage) | aucune, Q30 |
| 6.14.33 | [Billets de la grande mise à jour et annonce](6.14.33-billets-et-annonce.md) | docs, ajout | aucune (consignes du 2026-10-07) |
| 6.9.7 | [Comptoir d'échange et file du Labo réglables](6.9.7-economie.md) | correctif | aucune (AU11) |
| 6.9.6 | [Unités et flottes, texte d'annulation](6.9.6-unites-flottes.md) | correctif | aucune (AU9, AU10) |
| 6.9.5 | [Plafonds des bonus réglables, sources uniques](6.9.5-plafonds-bonus.md) | correctif | aucune (AU8) |
| 6.9.4 | [Flottes, rappel confirmé et distances réglables](6.9.4-galaxie-flottes.md) | correctif | aucune (AU7) |
| 6.9.3 | [Communications, confirmations et saisie mobile](6.9.3-communications.md) | correctif | aucune (AU6) |
| 6.9.2 | [Alliances, confirmations et réglages](6.9.2-alliances-confirmations.md) | correctif | aucune (AU5) |
| 6.9.1 | [Registre des réglages](6.9.1-registre-reglages.md) | correctif + refactoring | aucune (règle n° 2) |
| 6.9.0 | [Commerce réglable dans l'admin](6.9.0-commerce-reglable.md) | correctif + ajout | aucune (AU4, COM-1) |
| 6.8.2 | [Chroniques générées sous réglages](6.8.2-chroniques-generees.md) | fonctionnalité + ajout | [generation-passe-chroniques](../proposals/generation-passe-chroniques.md), lot 3 |
| — | [Travail en continu et journal des questions](docs-travail-continu.md) | docs | aucune |
| 6.8.1 | [Passe généré par budget](6.8.1-passe-par-budget.md) | fonctionnalité + ajout | [generation-passe-chroniques](../proposals/generation-passe-chroniques.md), lot 2 ; [progression](../proposals/progression.md), A |
| 6.8.0 | [Progression mesurée, novembre généré](6.8.0-progression-generative.md) | fonctionnalité + ajout | [generation-passe-chroniques](../proposals/generation-passe-chroniques.md), lot 1 ; [progression](../proposals/progression.md), C |
| 6.7.2 | [Tous les réglages de GameRules dans le panel admin](6.7.2-reglages-admin-complets.md) | ajout | — |
| — | [Revue AU3 : progression](docs-au3-progression.md) | docs | [progression](../proposals/progression.md) |
| — | [Proposition : passe et Chroniques génératifs](docs-generation-passe-chroniques.md) | docs | [generation-passe-chroniques](../proposals/generation-passe-chroniques.md) |
| 6.5.0 | [Vaisseaux de classe](6.5.0-vaisseaux-classe.md) | fonctionnalité | [unites-classe](../proposals/unites-classe.md), lot P |
| 6.4.1 | [Prise en main à jour](6.4.1-prise-en-main.md) | ajout | [feuille-de-route-2026-hiver](../proposals/feuille-de-route-2026-hiver.md), lot T |
| 6.4.0 | [Colonies, suite](6.4.0-colonies-suite.md) | fonctionnalité | [colonies-suite](../proposals/colonies-suite.md), lot Q |
| — | [Feuille de route : suite et revues AU1 à AU13](docs-feuille-de-route-suite.md) | docs | [feuille-de-route-2026-hiver](../proposals/feuille-de-route-2026-hiver.md) |
| — | [Billet de blog des lots N à Q](docs-blog-43.md) | docs | — |
| — | [Captures en thème Constellation](docs-captures-constellation.md) | docs | — |
| — | [Vaisseaux de classe : prompts et proposition](docs-unites-classe.md) | docs | [unites-classe](../proposals/unites-classe.md), lot P |
| 6.3.2 | [Bloc d'interface séparé](6.3.2-bundle-ui.md) | refactoring | [feuille-de-route-2026-hiver](../proposals/feuille-de-route-2026-hiver.md), lot S |
| 6.3.1 | [Vaisseaux et défenses](6.3.1-categories-unites.md) | ajustement | [categories-unites](../proposals/categories-unites.md), lot R |
| 6.3.0 | [Relancer toutes les missions](6.3.0-relancer.md) | ajout | [flottes-emplacements](../proposals/flottes-emplacements.md), lot O |
| 6.2.1 | [Objectifs du jour](6.2.1-quotidien-fusion.md) | rework | [quotidien-fusion](../proposals/quotidien-fusion.md), lot N |
| 6.2.0 | [Un JcJ qui rapporte](6.2.0-pillage.md) | ajustement | [entrepot-pillage](../proposals/entrepot-pillage.md), lot M |
| 6.1.0 | [D'où vient ce chiffre, suite](6.1.0-lisibilite-suite.md) | ajout | [feuille-de-route-2026-hiver](../proposals/feuille-de-route-2026-hiver.md), lot L |
| 6.0.1 | [Santé de l'équilibre (admin)](6.0.1-sante-equilibre.md) | fonctionnalité | [feuille-de-route-2026-hiver](../proposals/feuille-de-route-2026-hiver.md), lot K |
| — | [Fusion du quotidien : proposition chiffrée](docs-quotidien-fusion.md) | docs | [quotidien-fusion](../proposals/quotidien-fusion.md) |
| — | [Feuille de route, hiver 2026-2027](docs-feuille-de-route-hiver.md) | docs | [feuille-de-route-2026-hiver](../proposals/feuille-de-route-2026-hiver.md) |
| 6.0.0 | [Classes d'empire](6.0.0-classes-empire.md) | fonctionnalité | [classes-empire](../proposals/classes-empire.md) |
| 5.33.0 | [Routes logistiques des colonies](5.33.0-routes-logistiques.md) | fonctionnalité | [routes-logistiques](../proposals/routes-logistiques.md) |
| 5.33.0 | [Emplacements de flotte et « Relancer »](5.33.0-emplacements-flotte.md) | fonctionnalité | [flottes-emplacements](../proposals/flottes-emplacements.md) |
| 5.33.0 | [Alliances jusqu'à 20 membres](5.33.0-alliances-grandes.md) | fonctionnalité | [alliances-grandes](../proposals/alliances-grandes.md) |
| 5.32.0 | [Entrepôt plus risqué, chantiers comptés](5.32.0-entrepot-chantiers.md) | ajustement + fonctionnalité | [entrepot-pillage](../proposals/entrepot-pillage.md), [constructeurs](../proposals/constructeurs.md) |
| — | [Outillage : commandes autorisées](outillage-permissions.md) | docs | aucune |
| 5.31.0 | [Portefeuille et chiffres expliqués](5.31.0-lisibilite.md) | fonctionnalité | [feuille-de-route-2026-q4](../proposals/feuille-de-route-2026-q4.md), lot D |
| 5.30.0 | [Ordres du jour](5.30.0-ordres-du-jour.md) | fonctionnalité | [journal-de-bord](../proposals/journal-de-bord.md) |
| 5.29.0 | [Un jeu plus léger](5.29.0-performance.md) | refactoring | [feuille-de-route-2026-q4](../proposals/feuille-de-route-2026-q4.md), lot B |
| 5.28.1 | [Correctifs de cohérence](5.28.1-correctifs.md) | correctif | [feuille-de-route-2026-q4](../proposals/feuille-de-route-2026-q4.md), lot A |
| — | [Audit global et fiches systèmes](docs-audit-global.md) | docs | [feuille-de-route-2026-q4](../proposals/feuille-de-route-2026-q4.md) |
| 5.28.0 | [Cale sèche et hangars remis d'aplomb](5.28.0-cale-seche.md) | fonctionnalité + correctif | [cale-seche](../proposals/cale-seche.md) |
| 5.27.1 | [Comptoir de la Ruche réagencé](5.27.1-comptoir-reagence.md) | rework | aucune |
| — | [Méthode et documents de conception](docs-methode.md) | docs | aucune |
