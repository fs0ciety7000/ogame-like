# Proposition : garde de la chaîne de contenu (lot C1, Q23)

Statut : **livrée** en 6.14.11, voir `docs/changes/6.14.11-garde-chaine-contenu.md` (recommandation appliquée seule, règle n° 3 ;
choix noté en Q23). Lots de rattrapage C2 à C4 dans `docs/proposals/feuille-de-route-2029-automne.md`.

## 1. Le problème vu par le joueur (et par l'admin)
- « J'ai débloqué un nouveau bâtiment : il n'a pas de fiche dans le Codex, alors que chaque vaisseau en a une. »
- « Je veux une relique “+10 % d'attaque des Cargos” : l'éditeur d'effets ne propose rien pour le Cargo. »
- Consigne de l'utilisateur (2026-10-07, règle n° 4) : « si on veut ajouter un nouveau vaisseau, une nouvelle tech, un nouveau bâtiment,
  tout s'enchaîne ». Aujourd'hui, rien ne signale un maillon oublié : la chaîne (`WORKFLOW.md` §7) n'est qu'une liste à cocher.

## 2. Diagnostic (preuve : `contentChainReport()`, 6.14.11)
Bilan du contenu par défaut (24 unités, 13 bâtiments, 30 technos, 26 reliques, 6 boss mondiaux, 3 boss d'alliance, boss de chronique) :

| Maillon | Couvert | Manquant |
|:--|:--|:--|
| Codex | unités, reliques, tous les boss (entrées automatiques, `codex.ts`) | **13 bâtiments, 30 technos** : aucune entrée |
| Succès d'entrée | unités (`unitTypesPct`), bâtiments (`buildingsUnlockedPct`), technos (`techCount`), reliques (`relicsOwned`), boss mondiaux (`worldBossTypes`), boss de chronique (`bossSeals`) | **3 boss d'alliance** : aucune mesure |
| Succès de maîtrise | unités (`maxUnitLevel`), bâtiments (`maxBuildingLevel`), technos (`techsMaxedPct`) | — |
| Préréglage d'effet (`EFFECT_PRESETS`) | 14 unités sur 24 | **10 unités** : sonde, cargo, roquette, traqueur kesh, chasse fantôme, brise-rempart, lame écarlate, récolteur, croiseur de raid, éclaireur lointain |
| Porteur d'effet en vigueur | 24 unités sur 24 (modules d'armement / blindage par classe, soute et propulsion pour le soutien, reliques ciblées) | — |

Les mesures de succès sont des agrégats qui lisent le registre en vigueur (`UNITS`, `BUILDINGS`…) : un contenu ajouté y entre sans autre
code. Il n'existe pas de succès par contenu ; ce n'est pas un manque (voir option C).

## 3. Benchmark
| Jeu | Pratique |
|:--|:--|
| OGame | Chaque vaisseau, bâtiment et recherche a sa fiche technique (« Technologie ») dès le premier déblocage |
| Clash of Clans | Chaque troupe et bâtiment a une fiche d'info et des succès agrégés (« Débloquer tous les… ») ; pas de succès par troupe |
| Pipelines de contenu (jeux service) | Une validation automatique (« content linter ») refuse un contenu sans ses données associées avant la publication |

## 4. Options
| | Option | Pour | Contre |
|:--|:--|:--|:--|
| A | Liste à cocher seule (fiche du lot) | rien à coder | rien ne détecte un oubli, la règle n° 4 dépend de la mémoire |
| B | **Garde par test + liste des manques connus** : `contentChainReport()` calcule les maillons de chaque contenu ; le test échoue sur un manque nouveau ou sur un manque connu déjà comblé ; chaque manque connu renvoie à un lot de rattrapage | détecte l'oubli au moment du commit, dette visible et datée, aucun effet sur les joueurs | seuls les maillons vérifiables dans le moteur sont couverts (pas l'image, le changelog, la pré-prod) |
| C | B + un succès par contenu (entrée et maîtrise pour chaque unité, bâtiment, techno) | chaîne « complète » au sens strict | ~130 succès en plus, liste illisible, récompenses à rééquilibrer (XP, Ambre) sans chiffres réels (Q12) |

## 5. Recommandation : B
- Module moteur `src/game/contentChain.ts` (pur, hors bundle des hooks) : `contentChainReport()`, `contentChainGaps()`, mesures de succès
  par type (`CHAIN_ACHIEVEMENT_METRICS`). Maillons vérifiés : Codex, succès d'entrée, succès de maîtrise, préréglage d'effet propre à
  l'unité, porteur d'effet en vigueur qui la vise (sélecteur d'unité, de classe ou de catégorie). `null` = sans objet (ex. maîtrise d'une
  relique, porteur d'effet d'un bâtiment : les effets visent des unités).
- Garde `contentChain.test.ts` : liste `KNOWN_GAPS`, une clé `<type>:<id|*>:<maillon>` par manque connu avec son lot.
- Lots de rattrapage (feuille de route d'automne 2029) :
  - **C2** : entrées de Codex automatiques des bâtiments et des technos (débloquées par le joueur : bâtiment construit, techno
    recherchée), avec image existante ;
  - **C3** : préréglages d'effet pour les 10 unités sans préréglage (attaque ou points de vie, barème `UNIT` d'`effectCatalog.ts`) ;
  - **C4** : mesure « boss d'alliance affrontés » et succès d'entrée.
- Plus tard (noté, pas planifié) : le même bilan dans l'admin (onglet Contenu), utile quand l'admin ajoute une unité depuis le panel.

## 6. Ce qui ne change pas
Aucune règle de jeu, aucune donnée de joueur, aucun réglage. Pas de changelog joueur.
