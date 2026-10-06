# Proposition : menaces PNJ, suites de la revue AU1

Statut : **livrée** (6.6.0, `docs/changes/6.6.0-menaces-pnj.md`). Décision : A, B, C (C1 + C3), D. Constats : `docs/audit/2026-10-06-au1-menaces-pnj.md` et `docs/audit/2026-10-06-au2-boss.md`.
La décision A règle aussi BOSS-1 (structure des boss gonflée) ; la décision D vaut pour les primes et les boss (BOSS-4).

## A. Attaque de `tech19_2` (PNJ-1, 🔴)

| Option | Effet | Pour | Contre |
|:--|:--|:--|:--|
| A1 | L'admin retire ou réduit `unit_attack` sur `tech19_2` | immédiat, aucun code | aucun garde-fou pour la suite |
| A2 | **Plafond moteur** : la couche techno ne donne pas plus de +150 % d'attaque ou de défense des unités au total, et la validation refuse une techno qui dépasse +100 % à son niveau maximal (Puissance d'attaque donne déjà +100 %) | garde-fou durable pour tout contenu futur | les 3 joueurs perdent le bonus en trop |
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

## Décision et livraison (6.6.0)

- **A** : plafond moteur livré (+150 % au total, +100 % par techno). L'utilisateur a précisé l'intention de `tech19_2` : « que le
  Traqueur soit 50 % plus efficace sur les PNJ ». L'unité porte déjà ce bonus (`KESH_PVE_BONUS` 0,5) : l'effet `unit_attack` 0,07 de
  la techno est donc **retiré** (migration `tech19_2-6.6`) plutôt que ramené à 0,025.
- **B** : Traqueur 20 niveaux, **+10** attaque et défense par niveau (+25 jugé « fort » par `unitBalanceAudit`).
- **C** : 3 raids pour toutes les factions, « Localiser » pour 12 h de production dès 1 raid repoussé (le coût remplace les sondes de C3 :
  une seule ressource à lire, aucune flotte à envoyer).
- **D** : relance vers la prime ouverte suivante du même palier, sinon pas de bouton.
