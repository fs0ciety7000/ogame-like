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
| 5.30.0 | [Ordres du jour](5.30.0-ordres-du-jour.md) | fonctionnalité | [journal-de-bord](../proposals/journal-de-bord.md) |
| 5.29.0 | [Un jeu plus léger](5.29.0-performance.md) | refactoring | [feuille-de-route-2026-q4](../proposals/feuille-de-route-2026-q4.md), lot B |
| 5.28.1 | [Correctifs de cohérence](5.28.1-correctifs.md) | correctif | [feuille-de-route-2026-q4](../proposals/feuille-de-route-2026-q4.md), lot A |
| — | [Audit global et fiches systèmes](docs-audit-global.md) | docs | [feuille-de-route-2026-q4](../proposals/feuille-de-route-2026-q4.md) |
| 5.28.0 | [Cale sèche et hangars remis d'aplomb](5.28.0-cale-seche.md) | fonctionnalité + correctif | [cale-seche](../proposals/cale-seche.md) |
| 5.27.1 | [Comptoir de la Ruche réagencé](5.27.1-comptoir-reagence.md) | rework | aucune |
| — | [Méthode et documents de conception](docs-methode.md) | docs | aucune |
