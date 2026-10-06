# Proposition : menaces PNJ, suites de la revue AU1

Statut : **en attente de décision**. Constats : `docs/audit/2026-10-06-au1-menaces-pnj.md`.

## A. Attaque de `tech19_2` (PNJ-1, 🔴)

| Option | Effet | Pour | Contre |
|:--|:--|:--|:--|
| A1 | L'admin ramène `unit_attack` à 0,025 par niveau (+50 % au niveau 20) | immédiat, aucun code | les 3 joueurs perdent une partie de leur attaque |
| A2 | **Plafond moteur** : la couche techno ne donne pas plus de +50 % d'attaque ou de défense des unités, et la validation refuse un contenu qui dépasse ce total au niveau maximal | garde-fou durable pour tout contenu futur | même effet que A1 pour les 3 joueurs |
| A3 | Ne rien changer | aucun | +140 % d'attaque en JcJ pour un seul joueur |

**Recommandation : A2**, annoncée dans le changelog (règle 3 du GDD : rien ne retire de progrès sans annonce). Le reste de la techno
(Traqueur, vitesse de vol) ne bouge pas.

## B. Niveau du Traqueur Kesh (PNJ-2, 🟠)

| Option | Effet |
|:--|:--|
| B1 | **L'admin passe le Traqueur à `maxLevel` 20** et choisit son bonus par niveau (`levelBonus`) ; la validation signale toute techno qui monte une unité au-delà de son niveau maximal |
| B2 | Le moteur borne le niveau au maximum de l'unité : les Traqueurs niveau 20 redescendent à 1 |

**Recommandation : B1.** B2 retire du progrès à 3 joueurs. Bonus à fixer avec la simulation de la revue AU9 (unités) : « +1 700 par
niveau » donnerait 32 720 d'attaque au niveau 20 pour 3 places, hors de toute échelle (Croiseur Nova : 1 500 pour 20 places).

## C. Repaires (PNJ-3, 🟠)

| Option | Effet |
|:--|:--|
| C1 | `raidsNeeded` 4–5 → **3** |
| C2 | Les raids repoussés **de toutes les factions** comptent pour ouvrir un repaire (le premier repaire s'ouvre plus vite, puis par faction) |
| C3 | Repaire localisable par espionnage (sondes) contre un coût, sans attendre les raids |

**Recommandation : C1 + C3** : ouverture plus rapide et une action du joueur pour forcer la découverte. À traiter avec le calendrier de
la semaine (lot V).

## D. « Relancer » une prime terminée (PNJ-7, 🟡)

Relancer vers **la prime ouverte suivante du même palier** si celle d'origine est remplie, sinon masquer le bouton. Sans effet sur l'équilibre.
