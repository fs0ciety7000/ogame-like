# Proposition : hangars en surcharge et Cale sèche

Statut : **en attente de décision** (2026-10-06, après la 5.27.1).
Méthode : `docs/WORKFLOW.md`. Invariants : `docs/GAME_DESIGN.md` §4.

## 1. Constat

> « Taille Hangar attaque/défense : nombre vaisseaux dépasse la limite depuis maj des réparations. »

Certains joueurs ont plus de places occupées que de places disponibles (par exemple 46 000 / 40 000). Tant que c'est le cas, le chantier naval
refuse toute construction, sans autre sortie que de perdre des vaisseaux.

## 2. Diagnostic

La comptabilité du combat est saine. Une simulation (attaque à quai et en vol, défense avec Atelier niv. 10) montre que
base + en vol + Atelier ne grandit jamais : `I1` tient. Le dépassement vient d'ailleurs.

| # | Cause | Preuve | Gravité |
|:--|:--|:--|:--|
| C1 | **Migration 5.22 sans plafond.** De la 5.20 à la 5.22, le champ `players.workshop` manquait en production : les vaisseaux sauvés quittaient la flotte et la réparation n'était pas enregistrée. Les places libérées ont été **reconstruites** par les joueurs. Au démarrage de la 5.22, `restoreWorkshopUnits` a rendu toutes ces unités d'un coup, sans regarder la capacité. | `pocketbase/pb_hooks/cosmic_db.js` (`restoreWorkshopUnits`), appelé une fois dans `cosmic.pb.js` (`onBootstrap`) | **cause principale**, ponctuelle, déjà passée |
| C2 | **Ascension** : bâtiments au niveau 1, hangars compris (2 000 places), flotte gardée en entier | `src/game/ascension.ts` (`ascend`) | surcharge garantie à chaque Ascension |
| C3 | Le **retour de l'Atelier** (`advanceWorkshop`, `rushWorkshop`) n'a aucune vérification de place | `src/game/workshop.ts` | sans effet tant que `I2` tient, aggrave C1 et C2 |
| C4 | La stat d'effet `hangarCapacity` (« Hangar en extension », « Casemates ») est déclarée mais **jamais lue** : `getUnitCapacity` ne lit que la technologie | `src/game/effects.ts`, `effectCatalog.ts`, `buildings.ts` | bonus affiché sans effet |
| C5 | Hangar de défense des colonies : la tech « Extension des hangars » ne s'applique pas (`getUnitCapacity` sans `techLevels`) | `src/game/colonies.ts` (`colonyDefenseHangar`) | écart planète mère / colonie non documenté |
| C6 | Le calcul « places occupées » existe en trois copies : page Unités, serveur, Statistiques | `UnitsPage.tsx`, `actions.ts`, `empireStats.ts` | risque d'écart d'affichage (`I5`) |

Le problème de fond est le design de la 5.20 : **un vaisseau en réparation garde sa place de hangar**. Après une grosse défaite, le hangar est
plein de coques que le joueur ne peut ni utiliser ni remplacer. La boucle courte (combat) bloque la boucle longue (construction) pendant des
heures, et c'est ce qui a rendu C1 visible.

Ordre de grandeur : Atelier niv. 10 = 97,5 PV/s. 3 000 chasseurs sauvés (300 PV chacun) = 900 000 PV = **2 h 34** d'immobilisation, et 6 000 places
bloquées.

## 3. Benchmark

| Jeu | Plafond | Blessés / épaves | Ce que décide le joueur | Leçon |
|:--|:--|:--|:--|:--|
| OGame | aucun plafond de vaisseaux | Dock spatial : épaves réparables pendant 3 jours, réparation de 30 min à 12 h | lancer la réparation, puis **remettre en service** (sinon automatique au bout de 3 jours) | la réparation vit **hors** du stock ; le joueur garde la main |
| Clash of Clans | camps d'armée stricts | pas de blessés (troupes consommées) | la file de formation attend qu'une place se libère, rien n'est détruit | un plafond plein **met en attente**, il ne détruit pas |
| Jeux à hôpital (Rise of Kingdoms, Lords Mobile) | capacité de l'hôpital = bâtiment à améliorer | blessés à l'hôpital ; au-delà, ils meurent | soigner (ressources + temps), accélérer | la capacité de soin est **un bâtiment à part**, une vraie chaîne de progression |
| Cosmic Empires (5.20 à 5.27) | hangars | Atelier : sauvés immobilisés, **dans** le hangar | accélérer à l'Ambre | à corriger : blocage sans choix |

Xterium : aucune source fiable trouvée sur un système de réparation propre, donc pas de chiffres cités.

## 4. Options

| Option | Ce que ça règle | Ce que ça coûte | Risque |
|:--|:--|:--|:--|
| A. **Choix réparer / démanteler** après le combat | le joueur libère la place s'il préfère | un choix de plus après chaque combat (fatigue) ; ne règle pas C1 et C2 | faible |
| B. **Cale sèche** : nouveau bâtiment, les vaisseaux en réparation y occupent des **postes** au lieu du hangar ; paliers et progression | supprime le blocage ; vraie chaîne de level design | un bâtiment, une page, un équilibrage | moyen (nouvel équilibre) |
| C. **Retour selon la place** : un vaisseau réparé ne rentre que s'il y a de la place, sinon il attend « prêt » | protège `I2` partout | ne règle pas le blocage d'après défaite | faible |
| D. **État « surcharge » explicite** : jamais de destruction, construction bloquée, sorties proposées | règle C1 et C2 proprement pour les joueurs déjà touchés | rien de nouveau à apprendre | faible |

## 5. Recommandation : D tout de suite, puis B avec A et C dedans

### 5.1 Lot 0 (5.27.2) : réparer sans changer les règles

- **Surcharge assumée.** Une fonction unique `hangarLoad(player, away, category)` (base, vol, Atelier, file, capacité, excédent), utilisée par
  le serveur, la page Unités, les Statistiques et l'accueil (`I5`).
  Si excédent > 0 : `HudCallout` ember « Hangar en surcharge : +6 000 places », avec trois sorties :
  - « Améliorer le hangar » ;
  - « Démanteler l'excédent » (revente à 50 %, déjà en jeu) ;
  - « Envoyer en mission ».
  Rien n'est détruit d'office.
- **C4** : `getUnitCapacity` lit aussi la stat `hangarCapacity` (circuit d'effets).
- **C5** : à trancher (§8) ; par défaut, la tech s'applique aux colonies.
- **C2** : à trancher (§8) ; par défaut, l'Ascension **garde les niveaux des hangars** (la flotte est gardée, son logement aussi).
- **Tests** :
  - `I3` : aucune source n'ajoute d'unités hors construction, retour ou réparation ;
  - `I4` : après une Ascension, capacité ≥ flotte, ou surcharge signalée ;
  - un test « une migration qui rend des unités respecte la capacité ».

### 5.2 La Cale sèche (5.28) : le système complet

**Rôle** : les vaisseaux sauvés au combat vont en cale sèche. Ils occupent un **poste** de la cale, plus une place du hangar.
Le hangar reste libre pour reconstruire.

**Chaîne de déblocage** : Labo tech6 (hangars) → Atelier de réparation niv. 5 → déblocage de la Cale sèche
(20 de chaque rare, comme l'Atelier) → 20 niveaux.

**Règles** :

1. Les vaisseaux sauvés vont en cale tant qu'il reste des postes. Au-delà, ils gardent leur place au hangar (règle actuelle) : rien n'est perdu.
2. La réparation reste celle de l'Atelier (PV/s, Ambre, Analgésique) : la cale ne change que **la place**.
3. Un vaisseau réparé rentre au hangar **s'il y a de la place**. Sinon, il attend en cale, marqué « Prêt » (option C), avec le bouton
   « Remettre en service » quand la place revient. La remise est automatique au palier 10.
4. Les défenses ne passent pas par la cale (elles sont reconstruites sur place, 60 %).
5. Sans cale (niv. 0) : comportement actuel. La mise à jour ne change rien pour qui ne la construit pas.

**Chiffres** (à valider au simulateur) :

| Niveau | Postes (places) | Coût indicatif (nano + données) | Temps |
|--:|--:|:--|:--|
| 1 | 1 000 | 2 000 + 2 000 | 20 min |
| 5 | 5 000 | environ 40 000 chacun | 1 h 40 |
| 10 | 10 000 | environ 900 000 chacun | 3 h 20 |
| 15 | 15 000 | environ 4 M chacun | 5 h |
| 20 | 20 000 | 10 M chacun (puis palier 2 comme l'Atelier) | 6 h 40 |

Postes = 1 000 × niveau, soit la moitié d'un hangar d'attaque au même niveau (2 000 × niveau). La courbe de coût suit celle de l'Atelier
(`costFromLevel: 2`, `maxCost` 10 M), à 1 200 s par niveau.

**Paliers** (modèle `WORKFLOW.md` §4.2) :

| Palier | Nom | Effet |
|:--|:--|:--|
| Niv. 1 | Cale sèche | les sauvés occupent des postes, pas le hangar |
| Niv. 5 | **Triage** | choix par type d'unité, après le combat ou plus tard depuis la cale : **Réparer** ou **Démanteler** (60 % du coût en ferraille et énergie, au lieu de 50 % à la revente : la cale récupère mieux). Réglage par défaut dans Réglages : « Réparer tout ». |
| Niv. 10 | **Remise en service automatique** | un vaisseau « Prêt » rentre dès qu'une place se libère, et l'Atelier répare 10 % plus vite |
| Niv. 15 | **Priorités** | ordre de réparation par classe (Fort, Moyen, Faible) ou par type ; l'Atelier commence par ce qui compte |
| Niv. 20 | **Cale orbitale** | +5 points de taux de sauvetage (s'ajoute à l'Atelier, plafond global 75 %) ; visuel signature sur la planète |

**Synergies** :

- Officier Mécanicien, Vaisseau-atelier, Nanoréparation, Analgésique : inchangés (vitesse).
- Nouvel effet composable `dockCapacity` (+x % de postes) pour les reliques et les modules.
- Succès : « Cale pleine » (remplir 100 % des postes), « Démolisseur » (démanteler 1 000 vaisseaux).
- Codex : fiche de la Cale sèche.

**Écrans** (DESIGN.md) :

- Bâtiments → onglet Atelier, avec une colonne « Cale sèche » :
  - `StatTile` postes occupés / total ;
  - liste par type (en réparation, Prêt) ;
  - boutons Réparer / Démanteler (`askConfirm`, ton `danger` pour démanteler, `CostPill` du remboursement).
- Unités : le compteur du hangar affiche « 38 000 / 40 000 · 6 000 en cale » (`HudChip` neutral).
- Rapport de combat : « 3 000 vaisseaux sauvés → Cale sèche (2 h 34) » avec un lien.
- Accueil : carte Atelier existante, avec « Prêts : 1 200 » en ton accent (action à mener).

### 5.3 Ce que ça change pour les invariants

| Invariant | Avant | Après |
|:--|:--|:--|
| `I2` places | base + vol + Atelier + file ≤ hangar | base + vol + **(Atelier − en cale)** + file ≤ hangar ; en cale ≤ postes |
| `I3` | à écrire | test sur toutes les sources de combat + migrations |
| `I4` | à écrire | Ascension garde les hangars (ou surcharge signalée) |
| `I5` | trois copies | `hangarLoad` unique |

## 6. Plan de lots

| Lot | Version | Contenu | Données joueurs touchées |
|:--|:--|:--|:--|
| 0 | 5.27.2 | `hangarLoad` unique, état surcharge et ses sorties, C4, C5, Ascension (C2), tests `I3` `I4` `I5` | non (C2 seulement à la prochaine Ascension) |
| 1 | 5.28.0 | Cale sèche niv. 1 à 20 : moteur, serveur (schéma, flush), onglet Atelier, compteurs, rapport, admin (postes, coûts) | nouveau champ `workshop.docked` |
| 2 | 5.28.1 | Paliers 5 et 10 : Triage (démanteler 60 %), réglage par défaut, remise automatique, +10 % de vitesse | non |
| 3 | 5.28.2 | Paliers 15 et 20, effet `dockCapacity`, succès, Codex, prompts d'illustration, billet devblog | non |

## 7. Ce que je ne recommande pas

- **Détruire l'excédent** à la Clash of Clans : C1 est de notre fait, les joueurs n'ont rien fait de mal.
- **Retirer la limite** à l'OGame : les hangars sont un pilier de progression du jeu depuis la v1.
- **Taxe d'entretien sur l'excédent** : double peine (`GAME_DESIGN.md` règle 5).

## 8. Questions à trancher

1. **Ascension** : garder les niveaux des hangars (recommandé) ou les remettre à 1 avec surcharge signalée ?
2. **Colonies** : la tech « Extension des hangars » s'applique-t-elle aux hangars de défense des colonies (recommandé : oui) ?
3. **Cale sèche** : bâtiment séparé (recommandé, vraie progression) ou extension de l'Atelier (paliers de l'Atelier, moins de travail) ?
4. **Démantèlement** : 60 % en cale (recommandé) ou 50 % comme la revente ?
5. Lancer le **lot 0 seul** tout de suite, puis attendre ton retour sur la Cale sèche ?
