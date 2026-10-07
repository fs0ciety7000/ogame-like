# Proposition : phalange et porte de saut lunaires (É30-1, Q31)

Statut : **livrée** (2026-10-07) : lots É30-1a livré (moteur, `docs/changes/6.14.44-phalange-moteur.md`), É30-1b livré (serveur, `docs/changes/6.14.48-phalange-serveur.md`) et É30-1c livré (interface, `docs/changes/6.14.49-phalange-interface.md`), É30-1d livré (admin et chaîne de contenu, `docs/changes/6.14.69-phalange-chaine.md`), É30-1e livré (essai réel sur la pré-prod, `docs/changes/6.14.70-essai-lune-preprod.md`). Q31 validée par l'utilisateur sur `/decisions` (option A de `docs/proposals/prochain-systeme.md`).
La recommandation s'applique sans attendre (règle n° 3) ; les choix de conception sont listés au §8 et notés dans `docs/QUESTIONS.md`.
Lots É30-1a à É30-1e de `docs/proposals/feuille-de-route-2030-ete.md`.

## 1. Constat

Ce que dit le joueur :
- « Je vois l'attaque arriver, mais je ne peux rien en faire : je fuis en patrouille ou j'encaisse. »
- « Mon allié se fait piller à côté de chez moi et je l'apprends dans le rapport de combat. »
- « Ma lune me donne 3 % de bouclier. Et c'est tout ? » (constat AU28-3 : la lune est un bonus passif, aucune action à jouer)

Chiffres (Z1, copie de la production, `docs/audit/2026-10-07-z1-mesures.md`) :

| Mesure | Valeur | Lecture |
|:--|:--|:--|
| Victoire de l'attaquant (30 j) | **74 %** sur 119 combats JcJ | se défendre ne se joue pas |
| Joueurs pillables | **86 %** (64 h de stock pour 8 h à l'abri) | presque tout le monde est une cible |
| Combats JcJ par jour (7 j) | 2,1 | petit volume : les chiffres bougeront vite |
| Joueurs actifs (7 j) | 14 sur 16 comptes | |
| Alliances | 2 (6 et 4 membres) | 10 actifs sur 14 ont des alliés |
| Lunes en production | **0** (les lunes sont sur la branche, pas encore en production) | voir le risque R1 (§9) |

## 2. Diagnostic dans le moteur

Classé du plus sûr au plus douteux. Chaque point cite le code lu.

### 2.1 Le défenseur voit déjà tout, dès le décollage (sûr)

La prémisse de `prochain-systeme.md` (« voir les flottes hostiles en approche jusqu'à 30 min plus tôt ») est **caduque** :

- **Règle d'accès de la collection `fleets`** (`pocketbase/pb_schema.json`, `listRule` et `viewRule`) : le défenseur lit toute flotte
  `attack` ou `pirate` en approche qui le vise (`targetUid`), ou qui vise une de ses colonies (`targetOwnerUid`), **dès sa création**.
  Abonnement temps réel : `subscribeFleets` (`src/services/playerService.ts`).
- **Notification au décollage** : `launchFleet` (`src/game/fleets.ts`) rend une notification « Flotte hostile en approche ! » avec le
  nombre de vaisseaux et le délai d'impact ; `launchFleetRequest` (`cosmic_db.js`) l'envoie au défenseur (`db.notify`).
- **Départ programmé** (5.23, `fleetDelayMs`, jusqu'à 720 min) : la flotte est créée tout de suite avec `departAtMs` dans le futur ; la
  règle d'accès ne filtre pas sur `departAtMs`, donc le défenseur la voit **jusqu'à 12 h avant son décollage**.
- **Puissance et verdict** : `attackPowerShown` fixe `fleet.power` au lancement ; `threatEstimate` (`src/game/threat.ts`) rejoue le
  combat en tours et donne un verdict (« sûr », « serré », « danger »), affiché par `ThreatGauge`.
- **Alertes** : puce « Flotte hostile » dans la barre (`FleetsPanel.tsx`, `isHostile`) pendant tout le trajet ; alerte plein écran à
  **5 min** de l'impact (`RaidAlert.tsx`, `RAID_ALERT_MS`), avec « Fuir en patrouille ».
- Il n'existe aucun type `IncomingThreat` dans le moteur : seul le composant 3D `IncomingThreat3D` (`src/components/fx/`) porte ce nom.

Conclusion : **une alerte plus précoce n'apporte rien**. La phalange doit donner autre chose : ce que le défenseur ne voit pas encore.

### 2.2 Ce que le défenseur ne voit pas (sûr)

| Angle mort | Où dans le code | Conséquence |
|:--|:--|:--|
| **Vraie composition d'une flotte leurrée** | brouilleur d'approche (`decoyUnits`, `takeLaunchCapsules`, `src/game/synthesis.ts`) ; `launchFleetRequest` écrit la fausse composition dans `units` et la vraie dans `trueUnits` (champ **caché** du schéma) ; `fleetFromRecord(rec, publicView)` | le verdict de `threatEstimate` est calculé sur la fausse composition (`power` aussi) |
| **Capsules embarquées** (stimulant d'assaut) | champ `boosts`, **caché** ; seule l'Espionne en poste peut flairer une « anomalie » (`anomaly`, `anomalyChance`) sans le chiffre | la défense est sous-estimée d'autant |
| **Attaques visant un allié** | la règle d'accès ne montre une flotte qu'à sa cible : aucune alerte d'alliance n'existe (aucune occurrence dans `src/game`, `cosmic_db.js`, `AlliancePage.tsx`) | une garnison (`launchGarrison`, 1 à 24 h, `ALLIANCE_RULES.garrisonPower` 0,5) part rarement à temps |
| **Ce que fait l'agresseur** | seul l'espionnage de palier 4 (`buildSpyReportData`, « Files et flottes en vol ») le montre, avec des sondes qui voyagent et peuvent être détectées | pas de riposte informée |

### 2.3 Ce que le défenseur peut faire (sûr)

- **Fuir** : `launchPatrol` (30 min à 8 h, énergie d'entretien payée au départ ; rappel jusqu'à mi-parcours, `recallFleet`). Une flotte
  partie en patrouille **ne défend plus** jusqu'à son retour.
- **Encaisser** : posture (`postureEffects`), Carapace réactive (`armor`), bouclier, garnisons alliées déjà en place.
- **Rapatrier** : `recallFleet` fait demi-tour en mettant **autant de temps qu'à l'aller** ; une garnison ou une base avancée
  (`launchColonyBase`, `COLONY_BASE_RULES`) rentre au rythme d'un trajet. Rien n'est instantané.

Le cœur du problème : face à une attaque vue 25 à 55 min à l'avance (trajet `attackTravelSeconds` : 5 min + 3 min × distance ÷ vitesse,
plafonné à `FLEET_RULES.maxAttackMinutes` = 90 ; distance moyenne ≈ 52 sur une carte de 100), le défenseur n'a que deux réponses,
**partir ou subir**, et toutes deux font perdre quelque chose. Il n'a aucun moyen de **rendre le coup plus coûteux** à l'attaquant.

### 2.4 La lune existe, mais ne fait rien jouer (sûr)

- `src/game/moon.ts` : `MOON_RULES` (naissance 1 % par 100 000 de débris, 20 % au plus ; +3 % de bouclier, +2 % par niveau ; +5 %
  d'entrepôt à l'abri ; niveaux 1 à 5), `MoonState` (`name`, `level`, `bornAtMs`, `fromDebris`), `playerMoon`, `moonLevel`,
  `moonEffects` (source « Lune », couche empire). Achat de niveau : `upgradeMoon` (`moonUpgrade.ts`, action `moonUpgrade`).
- Naissance : `rollMoon`, appelé par `performAttack` (`src/game/attack.ts`) à la fin d'un combat sur la planète mère.
- La lune est publique : `cosmic_db.js` recopie `moonName` dans le profil public, la Galaxie l'affiche (`GalaxyPage.tsx`, 6.13.3).
- Champ `players.moon` : JSON libre ; on peut y ranger des recharges sans changer le schéma.
- Le retour d'une flotte côté serveur passe par une seule fonction, `resolveFleetReturn(txApp, game, rec, now)` (`cosmic_db.js`), qui
  appelle `performFleetReturn`, `clearDecoy` et `dockAutoOnReturn` (invariant I8) : un rapatriement instantané peut la réutiliser telle quelle.

### 2.5 La lune est rare (probable)

Avec 2,1 combats JcJ par jour, dont une petite part laisse 100 000 de débris, la naissance d'une lune est un événement de quelques fois
par mois au mieux. Un système réservé aux lunes ne toucherait d'abord qu'une poignée de joueurs (risque R1, question Q36).

## 3. Benchmark

| Question (grille §3) | OGame | Clash of Clans | Gestion mobile (Lords Mobile, Rise of Kingdoms) |
|:--|:--|:--|:--|
| Ce qu'on voit | **Phalange de capteur** (bâtiment lunaire) : mouvements de flotte d'une planète dans sa portée (niveau² − 1 systèmes), 5 000 deutérium par balayage, indétectable. Sert surtout à l'**attaquant** (intercepter un retour) | rien avant l'attaque ; **replays** de défense après | **tour de guet** : plus elle monte, plus l'alerte est précise (nombre, types, commandant de l'attaquant) |
| Ce qu'on fait | **Porte de saut** : vaisseaux d'une lune à une autre lune du même joueur, instantané, recharge (1 h au niveau 1, réduite par niveau dans les versions récentes) ; défense groupée (« stationner » chez un allié) | **château de clan** : troupes données par le clan, qui défendent ; bouclier après une défaite | renforts d'alliance, téléportation (objet rare), bouclier payant |
| Que perd le joueur, quand le sait-il | il voit l'attaque à l'arrivée de l'alerte ; perd ce qui reste à quai | il le sait après coup | il le sait dès l'alerte |
| Plafond et sortie | portée et recharge par niveau ; deutérium | un renfort par don | niveau de la tour, coût des objets |
| Leçon | la phalange ouverte à tous aide surtout l'attaquant : la nôtre doit être **défensive** | la défense par l'alliance retient les joueurs | **l'information se gagne par paliers** : modèle de nos niveaux de lune |

## 4. Options

### 4.1 Phalange

| | Option | Ce que ça règle | Ce que ça coûte | Risque |
|:--|:--|:--|:--|:--|
| P1 | Alerte plus précoce (prémisse de Q31) | rien : le défenseur voit déjà tout dès le décollage (§2.1) | faible | aucun gain ; il faudrait d'abord cacher les flottes aux joueurs sans lune (recul pour 86 % des joueurs) : **écartée** |
| P2 | **Balayage libre** d'un joueur à portée (OGame) | renseigne sur n'importe qui | une route, une recharge | aide l'attaquant à viser une flotte absente : **aggrave** le 74 % |
| **P3** | **Phalange défensive à paliers** : (a) **radar d'alliance** : les attaques qui visent un allié dans la portée de ta lune te sont signalées ; (b) **perce-brouillard** : vraie composition (niveau 2) puis capsules (niveau 4) des flottes qui te visent ; (c) **balayage de l'agresseur** : flottes en vol d'un joueur qui t'attaque ou attaque un allié couvert | les trois angles morts du §2.2, sans rien donner à l'attaquant | deux routes, une notification au lancement, une recharge dans `moon` | dévalue le brouilleur d'approche contre une lune de niveau 2+ (Q38) |

### 4.2 Porte de saut

| | Option | Ce que ça règle | Ce que ça coûte | Risque |
|:--|:--|:--|:--|:--|
| **J1** | **Rapatriement instantané** : une de tes flottes en patrouille, en garnison ou en base avancée rentre d'un coup à la planète mère | « fuir » ne veut plus dire « perdre » : la flotte revient défendre à la dernière minute ; ruse possible (quai vide espionné, flotte revenue) | une route qui réutilise `resolveFleetReturn` ; une recharge | une embuscade par jour au plus (recharge) ; l'attaquant voit la lune et son niveau sur la Galaxie |
| J2 | Saut de la planète mère vers une colonie (base avancée instantanée) | défense des colonies | dépend de `COLONY_BASE_RULES.defendsColony` (faux par défaut) | peu d'effet tant que la base ne défend pas |
| J3 | Saut de garnison vers un allié qui a aussi une lune (OGame, lune à lune) | défense d'alliance instantanée | deux lunes nécessaires (rare) | garnison invisible jusqu'à l'impact : très fort ; à garder pour la signature du niveau 5, **désactivée par défaut** (Q35) |

### 4.3 Accès (la lune est rare)

| | Option | Pour | Contre |
|:--|:--|:--|:--|
| A1 | Rien ne change (lune OGame, rare) | aucun risque | système presque invisible au départ (R1) |
| **A2** | **Pitié lunaire** : chaque combat subi sur la planète mère sans lune ajoute 5 % à une réserve, en plus du tirage ; la lune naît au plus tard à 100 % | **les plus attaqués** gagnent les outils pour se défendre ; garantie au 20e combat subi | un champ joueur (`moonPity`) ; I21 change |
| A3 | Baisser `debrisPerPercent` (réglage seul) | aucun code | profite surtout aux gros combats, pas aux victimes de petits pillages |

## 5. Recommandation : P3 + J1 (+ J3 désactivée) + A2

### 5.1 Paliers par niveau de lune

| Niveau de lune | Phalange | Porte de saut |
|:--|:--|:--|
| 1 | radar d'alliance, portée **15** ; balayage de l'agresseur, recharge **30 min** | — |
| 2 | portée **30** ; **perce-brouillard** : vraie composition et vraie puissance des flottes qui te visent ; recharge 25 min | — |
| 3 | portée **45** ; recharge 20 min | **porte de saut** : rapatriement instantané, recharge **24 h** |
| 4 | portée **60** ; **capsules révélées** (stimulant d'assaut chiffré, verdict exact) ; recharge 15 min | recharge 22 h |
| 5 | portée **75** ; recharge 10 min | recharge 20 h ; saut de garnison vers un allié à lune (J3), **désactivé par défaut** |

Portée en unités de la carte (côté 100, `FLEET_RULES.mapSize`, diagonale ≈ 141 ; distance moyenne entre deux joueurs ≈ 52), mesurée
depuis la planète mère jusqu'à la planète visée (mère ou colonie : `distanceBetween`). Au niveau 1, la lune couvre ≈ 7 % de la carte ;
au niveau 5, la plupart des alliés.

### 5.2 Règles

**Radar d'alliance (passif).** Au lancement d'une attaque de joueur (`mission = "attack"`, pas les raids pirates ni les seigneurs), le
serveur cherche les membres de l'alliance de la cible qui ont une lune et dont la portée couvre la planète visée. Chacun reçoit :
« Phalange : {attaquant} vise {allié} ({planète}), impact dans {n} min. Envoie une garnison ! » (au plus `radarMaxNotified` = 10). La page
Alliance liste les « Alliés menacés » avec le bouton « Envoyer une garnison ». L'allié voit la composition affichée à la cible (leurre
compris) ; le perce-brouillard ne vaut que pour ses propres flottes entrantes (Q34).

**Perce-brouillard (passif).** Pour une flotte qui te vise, la route de phalange rend `trueUnits` au niveau 2 et `boosts` au niveau 4 ;
`threatEstimate` est recalculé sur ces valeurs, `ThreatGauge` porte la mention « Percé par la phalange ». Rien n'est écrit dans la flotte.

**Balayage de l'agresseur (actif).** Cible permise : un joueur qui a une flotte d'attaque en approche vers toi, une de tes colonies, ou un
allié dans ta portée. Résultat : ses flottes en vol (mission, cible, heure d'arrivée ou de retour, composition affichée) et le nombre de
vaisseaux à quai (total seul, pas le détail). Indétectable. Coût : **30 min de production d'énergie** (1 000 au moins). Le résultat
s'enregistre dans une notification (Journal).

**Porte de saut (actif).** Missions permises : `patrol`, `garrison` (en route, stationnée ou au retour), `colonybase`. Interdites :
`attack` et tout retour de raid (pas de pillage « aller simple »), `transport` et `delivery` (pas de convoi instantané), `expedition`, `spy`,
`recycle`, boss, primes, flotte en statut `decision`. La flotte rentre **tout de suite** par `resolveFleetReturn` (mêmes notifications,
leurre effacé, remise en service automatique, I8). Gratuit ; la recharge est la limite. L'énergie d'une patrouille ou d'une garnison
n'est pas rendue.

**Pitié lunaire.** Après chaque combat subi sur la planète mère par un joueur sans lune : `moonPity += pityPerDefense` (5 %), en plus du
tirage habituel. La chance du combat vaut `min(1, moonChance(débris) + moonPity)` ; une lune née remet la réserve à 0. Les PNJ et les
colonies restent exclus.

### 5.3 Effets sur l'équilibre JcJ

- **Ce qui change pour l'attaquant** : une cible à lune de niveau 3+ peut avoir une flotte « absente » qui revient à l'impact. La lune et
  son niveau sont publics (Galaxie) : le risque est **visible avant d'attaquer**. Un leurre est percé par une lune de niveau 2+ ;
  l'écran de lancement le dit (« Ta cible a une lune niveau 2 : ton brouilleur sera percé »), donc aucune capsule n'est gâchée sans le
  savoir.
- **Ce qui change pour le défenseur** : fuir ne coûte plus la défense (J1) ; l'alliance devient un bouclier (radar + garnison) ; le
  verdict est exact (P3b).
- **Ce qui ne change pas** : aucun chiffre de combat, aucun plafond d'effet. Le joueur sans lune garde tout ce qu'il a (§2.1).
- **Cible** : 60 à 65 % de victoires de l'attaquant **contre une cible à lune** après 30 jours de production (aujourd'hui 74 % tous
  défenseurs confondus). Mesure ajoutée à la santé de l'équilibre (`balance/health.ts` : part de victoires de l'attaquant, avec et sans
  lune chez le défenseur). Garde-fou : sous 50 %, recharge de la porte à 36 h et perce-brouillard au niveau 3 (réglages seuls).

### 5.4 Réglages (règle n° 2)

Deux objets de règles du moteur, déclarés dans `src/game/ruleRegistry.ts`, éditables dans **Admin → Règles → Lunes** (section dédiée de
`panels.tsx`, à côté de `MOON_RULES`) et dans « Tous les réglages (avancé) ». Valeurs JSON pures.

```ts
// src/game/phalanx.ts — registre : phalanx: { label: "Lunes : phalange", target: () => PHALANX_RULES }
export const PHALANX_RULES = {
  enabled: true,
  rangePerLevel: 15,            // unités de carte par niveau de lune
  radar: true,                  // alerte d'alliance au lancement
  radarMaxNotified: 10,
  revealDecoyLevel: 2,          // 0 = jamais
  revealBoostLevel: 4,          // 0 = jamais
  scanCooldownMinutes: 30,      // au niveau 1
  scanCooldownCutPerLevel: 5,   // minutes de moins par niveau
  scanCooldownMinMinutes: 5,
  scanCostHours: 0.5,           // heures de production d'énergie
  scanCostMin: 1000,
};
// src/game/jumpGate.ts — registre : jumpGate: { label: "Lunes : porte de saut", target: () => JUMP_GATE_RULES }
export const JUMP_GATE_RULES = {
  enabled: true,
  minMoonLevel: 3,
  cooldownHours: 24,
  cooldownCutPerLevel: 2,       // heures de moins par niveau au-delà du minimum
  cooldownMinHours: 6,
  missions: ["patrol", "garrison", "colonybase"],
  allyJump: false,              // J3 (niveau 5)
  allyJumpMinMoonLevel: 5,
  allyJumpArrivalMinutes: 5,
};
// src/game/moon.ts — deux champs ajoutés à MOON_RULES
  pityPerDefense: 0.05,         // 0 = pas de pitié
```

Nouvelles stats d'effet (maillon 4, `EFFECT_STATS`, couche empire, lues dans `Modifiers`, I9) : `phalanxRange` (+ % de portée, plafond
empire 50 %) et `jumpGateCooldown` (− % de recharge, plafond empire 30 %). Plafonds dans `EFFECT_CAP_RULES` ; `derived.test.ts` vérifie le
maximum théorique.

### 5.5 Textes joueurs clés

- Lune niveau 1 : « Ta phalange veille : les attaques sur tes alliés à moins de 15 de distance te sont signalées. »
- Radar : « Phalange : Krax vise Mira (planète mère), impact dans 23 min. Envoie une garnison ! »
- Perce-brouillard : « Percé par la phalange : 42 croiseurs, pas 30. +15 % d'attaque (stimulant). »
- Balayage : « Balayage de Krax : 2 flottes en vol, 118 vaisseaux à quai. Prochain balayage dans 25 min. »
- Porte : « Saut réussi : ta patrouille est à quai. Prochain saut dans 24 h. »
- Refus : « Ta porte de saut se recharge : encore 6 h 12 min. » ; « La porte ne ramène que les patrouilles, garnisons et bases avancées. »
- Pitié : « Les débris s'accumulent en orbite : 35 % de chance de lune au prochain combat. »

### 5.6 Écrans touchés (maquette)

- **Statistiques → ligne Lune** (`MoonLine.tsx`) devient un panneau `HudPanel` « Lune {nom} » : niveau, trois `StatTile` (portée,
  recharge du balayage, recharge de la porte), paliers à venir, bouton « Améliorer » existant. Sans lune : jauge de pitié.
- **Alerte et jauge de menace** (`RaidAlert.tsx`, `ThreatGauge`) : `HudChip` « Percé par la phalange », bouton « Balayer l'agresseur ».
- **Flottes** (`FleetsPanel.tsx`) : bouton « Saut » à côté de « Rappel » sur les flottes permises, `askConfirm`, recharge affichée.
- **Alliance** (`AlliancePage.tsx`) : carte « Alliés menacés » (impact en direct, `useNowTicker`), bouton « Envoyer une garnison ».
- **Galaxie** : cercle de portée de la phalange autour de la planète mère ; niveau de lune dans l'infobulle publique.
- **Lancement d'attaque** : avertissement si la cible a une lune de niveau 2+ et qu'un brouilleur est embarqué.

## 6. Invariants

| | Règle | Test |
|:--|:--|:--|
| **I21** (modifié) | Lune : au plus une par joueur ; ne naît que d'un combat sur la planète mère (jamais colonie ni PNJ) ; chance = `min(1, moonChance(débris) + moonPity)`, `moonChance` ≤ `maxChance` ; une naissance remet la pitié à 0 | `lunes.test.ts` (modifié dans le même commit) |
| **I22** (nouveau) | Phalange : rend une flotte cachée (`trueUnits`, `boosts`) seulement à sa cible et seulement au niveau requis ; signale une attaque seulement aux alliés de la cible dont la portée la couvre ; un balayage ne vise qu'un agresseur (flotte d'attaque en approche vers soi ou un allié couvert) et respecte sa recharge | `phalange.test.ts` |
| **I23** (nouveau) | Porte de saut : ne fait que rapatrier une flotte du joueur vers sa planète mère, pour les missions permises seulement, une fois par recharge ; unités conservées (I1) ; aucune ressource créée | `porteSaut.test.ts`, `attack.test.ts` (I1) |
| I1, I3, I8 | inchangés : le rapatriement passe par `resolveFleetReturn` (retour de flotte, remise en service avec `awayKnown`) | intégration `itest` |
| I9, I14 | nouvelles stats lues dans la couche empire, sous plafond | `effectsRead.test.ts`, `derived.test.ts` |
| I12 | inchangé : le saut libère un emplacement de flotte, n'en prend jamais | `fleetSlots.test.ts` |

## 7. Plan de lots

### É30-1a : moteur pur et tests (S à M)
- `src/game/phalanx.ts` : `PHALANX_RULES`, `phalanxRange(player)` (stat `phalanxRange` comprise), `phalanxFeatures(level)`,
  `alliesCovered(moonOwner, targets)`, `revealIncoming(fleet, hidden, level)`, `canScan(player, aggressorFleets, now)`,
  `scanCost(player)`, `buildScanReport(target, fleets, now)`.
- `src/game/jumpGate.ts` : `JUMP_GATE_RULES`, `gateCooldownMs(level, player)`, `checkJump(player, fleet, now)` (refus en tutoiement,
  `GameActionError`), `markJump(player, now)` (`moon.gateReadyAtMs`).
- `src/game/moon.ts` : `MoonState` reçoit `scanReadyAtMs?`, `gateReadyAtMs?` (absents = prêts) ; `MOON_RULES.pityPerDefense` ; `rollMoon`
  lit `moonPity` ; `attack.ts` (`performAttack`) incrémente la pitié.
- `effects.ts` (`EFFECT_STATS` : `phalanxRange`, `jumpGateCooldown`), `modifiers.ts`, `EFFECT_CAP_RULES`.
- `ruleRegistry.ts` (deux groupes), `content.ts` (`RULE_GROUP_LABELS`, fusion champ par champ dans `applyGameContent`).
- Compteurs `stats` : `phalanxScans`, `gateJumps`, `gateSaves`. Champ `moonPity` : `GAME_FIELDS` (`playerFields.ts`), `PlayerState`.
- `hooksEntry.ts` : exports pour `cosmic_db.js`. Pas de lecture de constante importée dans un objet de règles (piège d'import circulaire).
- Tests : `phalange.test.ts` (I22), `porteSaut.test.ts` (I23), `lunes.test.ts` (I21), `ruleRegistry.test.ts`, `rulesAdmin.test.ts`,
  `reglages671.test.ts`, `effectsRead.test.ts`, `derived.test.ts`, `serverSafe.test.ts`. Simulation : `threatEstimate` sur une flotte
  leurrée (verdict faux puis juste) et sur un défenseur dont la patrouille rentre (verdict « danger » → « sûr »).

### É30-1b : serveur (M)
- `cosmic.pb.js` : `POST /api/cosmic/moon/phalanx` (lecture : flottes qui te visent, percées selon le niveau ; alliés menacés dans la
  portée ; recharges), `POST /api/cosmic/moon/scan { targetUid }`, `POST /api/cosmic/fleet/jump { fleetId }`.
- `cosmic_db.js` : handlers en transaction ; le saut appelle `resolveFleetReturn` puis `markJump` ; radar dans `launchFleetRequest`
  (après `txApp.save(rec)`, membres de l'alliance de la cible avec lune, `db.notify`) ; profil public : `moonLevel` à côté de `moonName`.
- `pocketbase/pb_schema.json` : `players.moonPity` (nombre) ; `profiles.moonLevel` (nombre). Aucune collection nouvelle.
- `npm run build:hooks` ; intégration (`scripts/itest-local.sh`) : « phalange : radar et perce-brouillard », « porte de saut : patrouille
  rapatriée, recharge, mission refusée » ; `ensureAB()`, `forceArrival(id)`, reconnexion en B à la fin.

### É30-1c : interface (M)
- `MoonLine.tsx` (panneau Lune), `RaidAlert.tsx`, `ThreatGauge`, `FleetsPanel.tsx` (bouton « Saut »), `AlliancePage.tsx` (« Alliés
  menacés »), `GalaxyPage.tsx` (cercle de portée, niveau public), dialogue de lancement (avertissement leurre).
- `src/services/playerService.ts` : `fetchPhalanx`, `scanAggressor`, `jumpFleet`.
- Ctrl+K (« Phalange », « Porte de saut »), page Formules (portée, recharges, coût du balayage), Journal (`timeline.ts` : balayages,
  sauts, alertes d'alliance), guide avancé (`advancedGuide.ts`) : étape « Ta lune veille ».
- Audit `docs/DESIGN.md` des fichiers touchés et vérification à 375 px ; ouvrir l'appli dans un navigateur (moteur touché).

### É30-1d : admin et chaîne de contenu (M)
| # | Maillon | Contenu |
|:--|:--|:--|
| 2 | Réglages et admin | section « Phalange » et « Porte de saut » sous Lunes (`panels.tsx`), champ « pitié » ; rapport d'impact (`impact.ts`) pour les deux stats |
| 3-4 | Effets | stats `phalanxRange`, `jumpGateCooldown` ; préréglages « +20 % de portée de phalange », « −15 % de recharge de la porte » (`EFFECT_PRESETS`) |
| 5 | Porteurs | reliques « Lentille de Séléné » (+20 % de portée) et « Clé du seuil » (−15 % de recharge) dans `DEFAULT_RELICS` + `appendFromDefaults` (`CONTENT_MIGRATIONS`) ; talent ou officier Logisticien : −10 % de recharge (option) |
| 6 | Succès | « Œil de la lune » (premier balayage) et « Vigie » (50 balayages) ; « Saut de l'ange » (premier saut) et « Maître du seuil » (25 sauts) ; secret « Retour fracassant » : repousser une attaque avec une flotte rapatriée par la porte moins de 10 min avant l'impact (`gateSaves`) |
| 7 | Codex | « Phalange » et « Porte de saut » dans les Légendes, à côté de « Lunes », débloquées au premier usage |
| 8 | Titre | « Gardien du seuil » (maîtrise de la porte) |
| 9 | Défis et missions | défi hebdo d'alliance « 3 garnisons arrivées avant l'impact » (radar) ; **pas** d'objectif lunaire dans le passe ni les Chroniques (tout le monde n'a pas de lune, I18-I19) |
| 10 | Butin | les deux reliques au Comptoir et dans la table des boss d'alliance |
| 11 | Équilibre | mesure « victoires de l'attaquant avec et sans lune » dans `balance/health.ts` ; scénario « et si » (porte à 12 h, 36 h) |
| 13 | Illustrations | lignes `scripts/illustrations.json` (prompts ci-dessous), images provisoires générées par script |
| 14 | Joueurs | `changelog/2026-10-xx-phalange-porte-de-saut.md` ; billet `content/blog/NN-ta-lune-veille.md` ; annonce (`ANNOUNCEMENTS`, `artSlot`, `pendingArt: true`) |

Prompts Midjourney (format des lignes existantes, 512 × 512, sans détourage) :
- `phalanx` « Phalange » (`public/assets/moon/phalange.webp`) : `a colossal sensor array dish built into a grey moon crater, made of salvaged starship hull plates, faint cyan scanning beam sweeping toward distant fleet silhouettes, dark planet on the horizon, cinematic sci-fi concept art, centered, square composition, muted palette, high detail --ar 1:1 --style raw --v 6`
- `jumpgate` « Porte de saut » (`public/assets/moon/porte-de-saut.webp`) : `a massive ring-shaped jump gate anchored on a wreckage moon, violet energy membrane rippling inside the ring, a small fleet emerging in a flash of light, dark planet below, cinematic sci-fi concept art, centered, square composition, muted palette, high detail --ar 1:1 --style raw --v 6`
- `relic-lentille-selene` « Lentille de Séléné » (`public/assets/relics/lentille_selene.webp`) : `an ancient cracked crystal lens set in a moon-rock frame, faint cyan glow refracting star points, floating above a dark pedestal, salvaged-tech relic, cinematic sci-fi concept art, centered, square composition, muted palette, high detail --ar 1:1 --style raw --v 6`
- `relic-cle-seuil` « Clé du seuil » (`public/assets/relics/cle_seuil.webp`) : `an ornate key made of warped hull metal with a tiny violet energy ring at its bow, floating above a dark pedestal, salvaged-tech relic, cinematic sci-fi concept art, centered, square composition, muted palette, high detail --ar 1:1 --style raw --v 6`
- `announce-phalange` (annonce, 16:9) : `a grey wreckage moon orbiting a dark planet, a sensor dish and a glowing violet jump gate on its surface, a defensive fleet emerging from the gate to face incoming attackers, cinematic sci-fi key art, wide composition, muted palette, high detail --ar 16:9 --style raw --v 6`

### É30-1e : pré-prod, audit et livraison (S)
- Déploiement sur `test.fs0ciety.org` : santé, version des hooks, deux comptes de test d'une même alliance (lune donnée par l'admin de
  la pré-prod), essai du radar, du perce-brouillard, du balayage et du saut ; captures en thème Constellation.
- Fiches `docs/changes/` de chaque lot, report GDD (§4 I21 à I23, §7 fiche Lunes, §8 journal), `docs/systems/combat-jcj.md` et
  `flottes.md`, `constats-ouverts.md` (AU28-3 fermé), statut « livrée » ici, `QUESTIONS.md` et `decisions-a-valider.md`.

## 8. Questions ouvertes (notées Q33 à Q41 dans `docs/QUESTIONS.md`, option recommandée appliquée)

| | Question | Choix recommandé | Revenir en arrière |
|:--|:--|:--|:--|
| Q33 | La prémisse « voir l'attaque plus tôt » est caduque (§2.1). Que donne la phalange ? | radar d'alliance, perce-brouillard, balayage de l'agresseur (P3) ; on ne cache rien aux joueurs sans lune | P1 (cacher les flottes aux joueurs sans lune) : changement de la règle d'accès de `fleets`, déconseillé |
| Q34 | Balayage : n'importe quel joueur à portée (OGame) ou l'agresseur seulement ? | l'agresseur seulement (défensif) | élargir la cible dans `canScan` (réglage `scanAnyone` à ajouter) |
| Q35 | Porte de saut : rapatriement seul, ou aussi saut de garnison vers un allié à lune ? | rapatriement (patrouille, garnison, base avancée) ; saut d'allié livré mais `allyJump: false` | `JUMP_GATE_RULES.allyJump` |
| Q36 | La lune est rare (0 en production) : faut-il un chemin garanti ? | pitié : +5 % par combat subi sur la planète mère, lune garantie au 20e | `MOON_RULES.pityPerDefense = 0` (la réserve reste en base, sans effet) |
| Q37 | Coûts et recharges | balayage : 30 min de production d'énergie, recharge 30 → 10 min ; porte gratuite, 24 h → 20 h | Admin → Règles → Lunes |
| Q38 | Le brouilleur d'approche est percé par une lune de niveau 2+ : compenser l'attaquant ? | non ; l'écran de lancement prévient avant d'embarquer la capsule | `revealDecoyLevel` (0 = jamais) |
| Q39 | Rapatrier une garnison alors que l'hôte va être attaqué : autorisé ? | oui (c'est ta flotte) ; la notification de l'hôte le dit | bloquer à moins de N min de l'impact (réglage à ajouter) |
| Q40 | Objectifs lunaires dans le passe ou les Chroniques ? | non (pas de lune pour tous) ; succès, Codex et défi d'alliance seulement | ajouter l'action aux poids de `chronicleGen` quand ≥ 30 % des actifs auront une lune |
| Q41 | Niveau de lune public ? | oui (Galaxie, profil) : le risque se voit avant d'attaquer | ne pas recopier `moonLevel` dans le profil public |

## 9. Risques et données des joueurs

| | Risque | Parade |
|:--|:--|:--|
| R1 | Peu de lunes : système invisible au départ | pitié (Q36) ; mesure à J+30 de la mise en production (part des actifs avec lune) |
| R2 | Embuscade trop forte (patrouille revenue à l'impact) | recharge 24 h, lune publique, garde-fou de 50 % (§5.3) |
| R3 | Brouilleur d'approche dévalué | avertissement au lancement ; percé seulement contre une lune de niveau 2+ |
| R4 | Fuite d'information cachée (`trueUnits`, `boosts`) | jamais par la règle d'accès ; seulement par la route, pour la cible, au niveau requis (I22, test d'intégration) |
| R5 | Charge serveur du radar | une requête `players` par alliance de la cible (6 membres au plus aujourd'hui), au lancement seulement ; `radarMaxNotified` |
| R6 | Saut pendant le traitement d'une arrivée | route en transaction sur la fiche de la flotte ; refus si `status` n'est plus permis ou si `done` |

**Données touchées** (aucune migration destructrice, rien de transformé) :
- `players.moon` (JSON existant) : clés optionnelles `scanReadyAtMs`, `gateReadyAtMs` ; absentes = prêtes.
- `players.moonPity` : nouveau champ numérique, absent = 0 (synchronisation du schéma au démarrage).
- `players.stats` : trois compteurs nouveaux, absents = 0.
- `profiles.moonLevel` : nouveau champ, recopié comme `moonName`.
- `fleets` : aucun champ nouveau ; un saut met `status = "done"` comme un retour normal.
- Contenu : deux reliques par `appendFromDefaults`.

**Désactiver** : `PHALANX_RULES.enabled = false` (routes refusées, radar coupé, interface masquée), `JUMP_GATE_RULES.enabled = false`,
`MOON_RULES.pityPerDefense = 0`, depuis Admin → Règles → Lunes. Les champs ajoutés restent inertes ; aucune donnée à reprendre.
