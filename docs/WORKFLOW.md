# Workflow : de l'idée à la mise en ligne

Comment une fonctionnalité ou un correctif de game design avance dans ce dépôt. Chaque étape produit une trace écrite.
Une étape sautée se dit dans la PR.

## 1. Les huit étapes

| # | Étape | Produit | Qui valide |
|:--|:--|:--|:--|
| 1 | **Problème joueur** : la phrase du joueur, telle quelle | citation dans la proposition | — |
| 2 | **Diagnostic** : reproduire dans le moteur (test Vitest ou simulation) | cause + fichier:ligne | preuve par test |
| 3 | **Benchmark** : 2 ou 3 jeux de référence, ce qu'ils font et pourquoi | tableau (§3) | — |
| 4 | **Options** : au moins deux, avec coûts (dev, complexité joueur, risque) | tableau comparatif | — |
| 5 | **Recommandation chiffrée** : formules, paliers, courbes (§4) | `docs/proposals/<système>.md` | **l'utilisateur** |
| 6 | **Implémentation par lots** : moteur + tests → serveur → UI → **admin : chaque réglage de la fonctionnalité éditable dans le panel** (`GameRules` ou contenu, CLAUDE.md règle n° 2) | commits par lot | CI locale (`CLAUDE.md`) |
| 7 | **Audit** : grille de `GAME_DESIGN.md` §6 + audit DESIGN.md + mobile | cases cochées dans la PR | — |
| 8 | **Livraison** : fiche `docs/changes/`, report dans GDD / DESIGN / CLAUDE.md, changelog, billet devblog si besoin, PR, rappel des hooks | fiche + PR | l'utilisateur fusionne |

Règle : tout ce qui est dans `GameRules` (et les autres contenus de jeu), pour les fonctionnalités existantes et futures, se gère dans le
panel admin. Une proposition liste les réglages qu'elle ajoute et où l'admin les modifie.

Règle (CLAUDE.md règle n° 3) : on n'attend plus la décision à l'étape 5. La recommandation est appliquée, le choix et ses
alternatives sont notés dans `docs/QUESTIONS.md` pour être revus avec l'utilisateur ; une proposition qui touche aux données des
joueurs (unités, ressources, niveaux) prend l'option la plus prudente et dit comment revenir en arrière. Un lot fini, on passe au suivant.

Petit changement (ajustement, correctif, refactoring) : les étapes 3 à 5 peuvent être sautées, **jamais la fiche de changement** de
l'étape 8 (modèle dans `docs/changes/README.md`). Elle se remplit pendant le lot, pas après.

## 2. Écrire une proposition (`docs/proposals/<système>.md`)

Plan fixe :

1. **Constat** : citation du joueur, chiffres observés.
2. **Diagnostic** : causes classées de la plus sûre à la plus douteuse, chacune avec sa preuve.
3. **Benchmark** (§3).
4. **Options** : tableau « ce que ça règle / ce que ça coûte / risque ».
5. **Recommandation** : règles, chiffres, paliers, textes joueurs clés, maquette des écrans touchés.
6. **Invariants** : ceux qui changent, ceux qui s'ajoutent, et leurs tests.
7. **Plan de lots** : lot 0 (correctif d'urgence), lot 1… avec le contenu de chaque PR.
8. **Questions ouvertes** : ce que l'utilisateur doit trancher.

## 3. Benchmark : grille

| Question | Pourquoi |
|:--|:--|
| Que perd le joueur, et quand le sait-il ? | pilier « perdre sans choix, non » |
| Quel plafond, et quelle sortie ? | règle 1 de `GAME_DESIGN.md` |
| Quelle action manuelle, quel automatisme ? | QoL vs engagement |
| Combien de temps la boucle bloque-t-elle ? | une boucle courte ne casse pas une longue |
| Comment ça progresse (niveaux, paliers) ? | level design |

Références habituelles :

- **OGame** : pas de plafond de vaisseaux (la limite, c'est le coût et les emplacements de flotte) ; défenses reconstruites à 70 % ;
  **Dock spatial** : les épaves d'un combat se réparent pendant une fenêtre de 3 jours, réparation de 30 min à 12 h, vaisseaux
  à remettre en service à la main (sinon automatiquement au bout de 3 jours).
- **Clash of Clans** : capacité d'armée (camps) stricte, la formation s'arrête quand c'est plein et la file attend ; chaque bâtiment
  progresse par niveaux d'hôtel de ville (plafonds débloqués par paliers) ; « constructeurs » = files parallèles limitées.
- **Jeux de gestion mobiles à hôpital** (Rise of Kingdoms, Lords Mobile…) : les blessés vont à l'hôpital, dont la capacité est un bâtiment
  à améliorer ; au-delà, ils meurent. Le soin coûte des ressources et du temps, et s'accélère.
- Xterium (dérivé d'OGame) : pas de source fiable trouvée sur un système de réparation propre ; ne pas citer de chiffres.

## 4. Level design : méthode

### 4.1 Courbes

- **Coût** : géométrique, `base × croissance^(niveau−1)`, plafonné par `maxCost` (déjà le format des bâtiments).
- **Effet** : linéaire par niveau, avec **paliers** qualitatifs aux niveaux 5, 10, 15, 20 (format `bonusFromLevel` / `tier2`).
- **Temps** : `secondsPerLevel × niveau`, réduit par les bonus ; viser 5 min (niv. 1), environ 2 h (niv. 10), environ 1 j (niv. 20).
- Vérifier chaque courbe dans le simulateur admin (« et si ») et l'historique d'équilibrage avant de fixer les chiffres.

### 4.2 Paliers (modèle)

| Niveau | Rôle du palier | Exemple |
|:--|:--|:--|
| 1 | le système existe, version minimale | la cale sèche accueille les vaisseaux sauvés |
| 5 | premier **choix** donné au joueur | trier : réparer ou démanteler |
| 10 | **confort** (automatisme, file) | remise en service automatique, deuxième poste |
| 15 | **spécialisation** | priorité par classe, cocon |
| 20 | **signature** visible (prestige, effet fort) | cale orbitale : +sauvetage |

### 4.3 Chaîne de déblocage

Un nouveau bâtiment s'insère dans une chaîne existante, jamais en tête :
technologie (Labo) → bâtiment prérequis à un niveau → déblocage (coût rare) → paliers.
La chaîne s'affiche sur la carte du bâtiment (« Requis : Atelier niv. 5 »).

### 4.4 Cycle de vie d'une unité (référence)

```
File du chantier ─► Hangar (à quai) ─► En vol (mission) ─► Combat
        ▲                 ▲                                  │
        │                 │                     ┌────────────┼──────────────┐
        │                 │                     ▼            ▼              ▼
        │                 │                 Détruite     Sauvée         Survivante (usée)
        │                 │                 (débris)   (Atelier)        coque abîmée
        │                 │                                │                │
        │                 └──── réparée (si place) ◄───────┘                │
        │                 └──── réparation de coque à quai ◄────────────────┘
        └── recyclage (démantèlement) : ressources récupérées, place libérée
```

Chaque flèche a : une règle moteur, une notification et un affichage. Une flèche sans l'un des trois est une dette.

## 5. Documents vivants

Chaque lot relit puis met à jour :

- la fiche du lot (`docs/changes/`) et l'index ;
- le GDD si une règle de jeu, un chiffre ou un invariant change ;
- `docs/DESIGN.md` si un composant ou une règle visuelle apparaît ;
- ce fichier si la méthode évolue ;
- `CLAUDE.md` pour toute règle de travail ou tout piège appris (goja, migrations, schéma…).

Une règle devenue fausse est réécrite, pas contournée.

## 6. Lots et PR

- Lot 0 = correctif sans changement de règle (données, affichage, garde-fous). Il part seul s'il est urgent.
- Un lot = moteur + tests + serveur + UI d'un même morceau ; pas de lot « tout le moteur » puis « toute l'UI ».
- Le changelog décrit ce que le joueur voit, pas le code. Le devblog explique le pourquoi, chiffres à l'appui.
