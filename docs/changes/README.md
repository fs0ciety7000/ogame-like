# Fiches de changement

**Tout changement a sa fiche** : fonctionnalité, ajout, rework, ajustement d'équilibre, correctif, refactoring, changement de doc
ou d'outillage. Une fiche par lot (une PR peut en porter plusieurs). Pas de fiche, pas de commit.

Deux niveaux :

| Type | Fichier | Quand |
|:--|:--|:--|
| **Proposition** | `docs/proposals/<système>.md` | avant de coder, quand le changement touche l'équilibre, les données des joueurs ou un système entier ; attend la décision de l'utilisateur (`WORKFLOW.md` §2) |
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
