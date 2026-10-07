# Revue AU27 : tout est réglable dans l'admin, le jeu est évolutif

Date : 2026-10-07. Consigne de l'utilisateur : « tout le jeu doit être ajustable via l'admin et évolutif » (CLAUDE.md, règle n° 2).
Périmètre : `src/game/**` (moteur), `pocketbase/pb_hooks/cosmic_db.js`, `src/pages/admin/**`, gardes `rulesAdmin.test.ts`,
`reglages671.test.ts`, `ruleRegistry.test.ts`. Hors périmètre : interface lune / phalange (autre agent), audits jeu, design, actions,
illustrations (menés en parallèle).

Méthode :
- balayage des constantes du moteur : `export const X = <nombre>` (84) et `export const X = { … } | [ … ]` (272) non cités par
  `content.ts` ni `ruleRegistry.ts`. Chaque entrée est classée : règle de jeu, constante technique, ou défaut déjà surchargé ;
- recherche des identifiants de contenu (bâtiments, unités, technos, reliques, factions) écrits en dur hors de leurs fichiers de définition ;
- couverture de l'admin : pour chaque groupe de `GameRules`, part des champs cités par une section dédiée de `src/pages/admin/`
  (hors `AllRulesEditor`). Mesure par recherche de nom (approximative à ±10 %), script gardé hors du dépôt.

## Synthèse

- Le socle est sain. Il y a 102 groupes de règles, dont 68 dans le registre (6.9.1). `ruleRegistry.test.ts` garantit que chaque
  `*_RULES` est relié. Le contenu par listes (unités, bâtiments, technos, missions, factions, rangs, succès, reliques, titres, boss
  mondiaux, officiers, seigneurs, passe, Chroniques) s'ajoute depuis l'admin, avec image téléversée et journal de versions (30 par section).
- Ce qui reste en dur se range en trois familles :
  1. **listes de contenu « système »** jamais passées en section : talents, classes d'empire, spécialisations de colonie, modules,
     divisions, mutateurs, objets du Comptoir de la Ruche, fugitifs, défis, recherches d'alliance… Leurs chiffres d'équilibre
     (`perRank`, `weight`, `price`…) ne se règlent pas ;
  2. **rôles portés par des identifiants** (`"sonde_espionnage"`, `"logistique"`, `WEAKNESS_POOL`, préréglages d'effets par unité). Un
     contenu ajouté dans l'admin ne prend pas ces rôles ;
  3. **textes de règle figés** (« 24 h », « 48 h », « 4 contrats toutes les 8 h », « +20 % ») à côté d'un réglage qui, lui, bouge.
- Ergonomie : 56 des 68 groupes du registre (≈ 320 champs) ne s'éditent que dans « Tous les réglages (avancé) ». Les champs y portent
  leur nom technique (19 libellés en tout), sans unité, sans aide ni bornes. Les listes d'objets s'y éditent en JSON brut, sans contrôle
  de forme.

## Constats

Gravité : 🔴 bloque l'évolution ou peut casser le jeu, 🟠 réglage de jeu inaccessible, 🟡 ergonomie ou désynchronisation, ℹ️ information.
Taille : S (≤ ½ j), M (1 à 2 j), L (3 j et plus).

| # | Gravité | Constat | Preuve | Pour le rendre réglable | Taille |
|:--|:--|:--|:--|:--|:--|
| AA-1 | 🟠 | **Comptoir de la Ruche** : 23 objets, prix en dur (30 à 600 Ambre). Les descriptions figent des chiffres (« 1 h », « +20 % », « 6 h », « +200 XP », « 2 h ») alors que `acceleratorMinutes`, `keshBoostPct`, `shieldHours`, `dossierXp` et `painkillerHours` sont réglables : un réglage changé rend le texte faux | `bounties.ts:536-561` ; `BOUNTY_SHOP_RULES` `bounties.ts:515` ; `ECONOMY_RULES.keshBoostPct` `economy.ts:24` | `BOUNTY_SHOP_RULES.prices` (par id), liste lue par accesseur `get price()` (modèle 6.9.0 des offres de la semaine) ; descriptions en accesseur lisant la règle | S |
| AA-2 | 🟠 | **Talents d'Ascension** : 15 talents, `perRank: 0.02` (0,2 pour le réseau) en dur, liste et branches fixes. `TALENT_RULES` ne règle que les points et le rang maximal | `talents.ts:39-55` | groupe `talents.perRank` (par id) ; à terme, section de contenu `talents` (id, branche, effet composé `stat`/`target`, valeur par rang) | S (chiffres), M (section) |
| AA-3 | 🟠 | **Classes d'empire** : effets (+10 % production, +5 % attaque…) et avantages (`buildSlots`, `fleetSlots`) en dur. `EMPIRE_CLASS_RULES` ne couvre que le changement et deux bonus de vaisseaux de classe | `empireClass.ts:34-70`, `:73` | `classes.defs[id].effects` / `perks` éditables (effets composés, déjà typés `EffectGrant`) | M |
| AA-4 | 🟠 | **Spécialisations de colonie** : multiplicateurs (production 1,25, gisement 1,6, hangar 1,5, défense 0,7, entrepôt 1,6) et résumés chiffrés en dur | `colonies.ts:242-247` | `colonySpec.specs[id]` dans le registre ; résumé généré depuis les chiffres | S |
| AA-5 | 🟠 | **Modules de vaisseaux** : poids de rareté (60/28/10/2), Ambre de recyclage, valeurs par famille et rareté (+4 % à +18 %), 7 modèles en dur. `MODULE_RULES` et `MODULE_BUILD_COST` sont réglables, pas le tirage ni la puissance | `modules.ts:55-78` | `modules.rarities`, `modules.familyValues` dans le registre ; modèles en section (`MODULE_TEMPLATES`) | S (chiffres), M (modèles) |
| AA-6 | 🟠 | **Mutateurs de saison** : 10 mutateurs, valeurs (`grants`) et descriptions chiffrées en dur. L'admin choisit un mutateur par mois (`overrides`) mais ne règle ni sa force ni la liste | `mutators.ts:21-32` | `mutators.defs` (id, nom, emoji, effets composés) ; description générée par `describeEffect` | M |
| AA-7 | 🟠 | **Divisions** : jetons par division (1 à 4) et part de placement (25 % à 5 %) en dur. `LEAGUE_RULES` ne règle que montée et descente | `leagues.ts:31-38` | `leagues.tiers[id] = { tokens, placementPct }` | S |
| AA-8 | 🟠 | **Défi de la semaine** : objectif par joueur actif (`perActive` : 3 raids, 25 missions, 400 unités, 2 M au marché, 6 expéditions, 8 primes) en dur ; liste des types fixe | `challenges.ts:18-25` | `weeklyChallenge.perActive[type]` | S |
| AA-9 | 🟠 | **Mécènes** : seuils du badge (25, 100, 500, 2 000 Ambre) en dur | `bounties.ts:1032-1037` | `patrons.tiers` (à côté de `top`) | S |
| AA-10 | 🟠 | **Offre de la semaine, sac de jetons** : 25 jetons donnés en dur, et répétés dans la description | `weeklyStock.ts:47`, `:120` | `weeklyStock.tokensBag` ; description en accesseur | S |
| AA-11 | 🟠 | **Passe** : Ambre rendue à la place d'une capsule, réserve pleine (15) | `seasonPass.ts:170` | champ de `passOverflow` (ou `PASS_RULES`) | S |
| AA-12 | 🟠 | **Technos** : croissance du temps de recherche `TIME_GROWTH = 1.67` commune à toutes, sans surcharge par techno. `costGrowth`, lui, existe par techno | `technologies.ts:287-311` | `research.timeGrowth` dans le registre + champ `timeGrowth?` par techno (onglet Technologies) | S |
| AA-13 | 🟡 | **Barèmes des préréglages d'effets** (relique 2,5 / techno 0,03 / officier 0,01 par cible d'unité, etc.) : ils guident l'admin quand il compose un effet | `effectCatalog.ts:36-41` | `effectPresets.budgets` dans le registre | S |
| AA-14 | 🟡 | Bornes de validation des effets de techno (`EFFECT_MAX_PER_LEVEL`, 0,5 par niveau, 10 en contre-espionnage) en dur. C'est un garde-fou d'équilibre, pas une règle | `technologies.ts:346-357` | les laisser au code (garde I9) ou les mettre dans `effectCaps` ; voir AA-Q4 | S |
| AA-15 | 🔴 | **Recherches et projets d'alliance** : l'effet est lié à l'identifiant (`"logistique"` → vitesse, `"industrie"` → production, `"brouillage"`, `"quartiers"`, `"siege"`…). Une recherche ajoutée dans l'admin (JSON de `alliances.researches`) n'a **aucun effet**. Elle n'a pas de champ d'effet et passe hors du circuit d'effets | `alliances.ts:64-81`, `:125-200` | champ `effect` (effet composé `stat`/`target`/`scope`) sur chaque recherche ou projet, lu par `empireEffects` ; `alliances.researches` en éditeur de liste dédié | M |
| AA-16 | 🔴 | **Rôles d'unités par identifiant** : la sonde est exclue des boss et des expéditions par `"sonde_espionnage"` en dur, à côté de `SPY_RULES.probeUnitId` (réglable). Les faiblesses de boss par défaut viennent de `WEAKNESS_POOL` (6 ids). `SUPPORT_UNITS` de l'équilibrage est une liste d'ids. Un vaisseau ajouté dans l'admin n'est jamais une faiblesse de boss et n'est pas classé « soutien » | `fleets.ts:497,506,516` ; `expeditions.ts:157,171` ; `leviathan.ts:312,325-326` ; `balance/analysis.ts:85` | lire `SPY_RULES.probeUnitId` ; drapeaux d'unité `roles?: ("probe" \| "recycler" \| "support" \| "bossWeakness")[]` dans `UnitDef`, éditables dans l'onglet Unités | M |
| AA-17 | 🟠 | **Unités : coût limité à ferraille et énergie** (`cost: { scrap; energy }`). Une unité de fin de partie ne peut pas coûter une ressource rare depuis l'admin | `units.ts:21` | `cost: ResourceMap` (migration de type, `getUnitCost`, formulaire) | M |
| AA-18 | 🟠 | **Préréglages d'effets écrits par unité** (`unit:sentinelle`, `unit:fregate`…) : une unité ajoutée dans l'admin n'en a pas. Le maillon « préréglage » de la chaîne de contenu manque alors, sans alerte (la garde `contentChain.test.ts` ne voit que le contenu par défaut) | `effectCatalog.ts:45-60` | préréglages générés pour chaque unité du registre (attaque et PV, barème selon la classe) | S |
| AA-19 | 🟡 | **Chaîne de contenu invisible dans l'admin** : `contentChainRows` (Codex, succès, préréglage, porteur d'effet) n'est affiché nulle part. L'admin qui ajoute une unité ne voit pas ce qui manque | `contentChain.ts` ; aucun import dans `src/pages/admin/` | carte « Chaîne de contenu » (onglet Équilibrage, ou bandeau de la fiche) qui liste les maillons manquants par contenu | S |
| AA-20 | 🟠 | **Factions** : une faction ajoutée dans l'admin n'a ni fugitifs (`FUGITIVES`, 4 par faction, par `factionId` en dur), ni archétype de chapitre généré (`ARCHETYPES`, `AUTO_ART`, `AUTO_SEALS`, `themeArchetypes`), ni origine de seigneur (`WarlordOrigin` fermé) | `bounties.ts:80-104` ; `procedural.ts:272-276` ; `warlords.ts:31,130` | fugitifs dans la fiche de faction (`FactionDef.fugitives`) ; archétype générique de repli pour une faction inconnue | M |
| AA-21 | 🟡 | **Textes de règle désynchronisés** : un chiffre réglable est recopié en dur dans un texte joueur | `referral.ts:52` (« 48 h » ↔ `linkWindowHours`) ; `dailyOrders.ts:97` (« 4 contrats toutes les 8 h » ↔ `BOUNTY_RULES.dailyLimit/refreshHours`) ; `cosmic_db.js:8370,8372` et `allianceCalendar.ts:51` (« 24 h », « un assaut toutes les 4 h » ↔ `ALLIANCE_BOSS_RULES.durationHours/cooldownHours`) ; AA-1, AA-6, AA-10 | texte construit depuis la règle ; garde : test qui fait varier la règle et compare le texte | S |
| AA-22 | 🟡 | **Barème doublé côté serveur** : `keshFeats` recopie les rangs de l'Essaim (`[0, 10, 30, 70, 150]`) au lieu de lire `BOUNTY_RULES.ranks` | `cosmic_db.js:336` | `game.bountyRank(rep)` exporté par `hooksEntry.ts` | S |
| AA-23 | 🟠 | **Listes « système » fixes** : défis d'alliance (`ALLIANCE_CHALLENGES`), réserve des missions du jour (`POOL`, quantités 1 à 2), types d'objectifs du jour, catalogue des saisons (`SEASON_CATALOG`), thèmes du passe (`PASS_THEMES`), archétypes des Chroniques. Leurs chiffres (quantités, poids) ne sont pas réglables | `allianceChallenge.ts:17` ; `dailyMissions.ts:19-25` ; `contracts.ts:76` ; `seasonCatalog.ts:61` ; `passSeasons.ts:232` ; `procedural.ts:276` | quantités dans les groupes existants (`dailyMissions.pool`, `allianceChallenge.list`) ; catalogues en section plus tard (AA-Q3) | M |
| AA-24 | 🔴 | **Admin : 56 groupes sur 68 du registre** (≈ 320 champs, dont `phalanx`, `jumpGate`, `effectCaps`, `warlords`, `commanderXp`, `bounties`, `dailyContracts`, `vacation`, `ascension`, `bossPhases`, `synthesis`, `referral`) n'ont **aucune section dédiée**. On les règle seulement dans « Tous les réglages (avancé) », sous leur nom technique (`attackJitterHours`, `scanCostMin`…). Pour les groupes historiques, la couverture est de ≈ 85 % des champs ; pour le registre, ≈ 9 % | mesure ; `AllRulesEditor.tsx:17-37` (19 libellés) | métadonnées de champ **à côté de l'objet de règles** (`*_RULES_META = { champ: { label, unit, min, max, hint } }`) déclarées dans le registre ; `AllRulesEditor` les affiche (libellé, unité, aide, bornes) ; garde : tout champ du registre a un libellé | M |
| AA-25 | 🔴 | **Validation faible** : `validateRules` ne contrôle que le premier niveau (type et signe). Aucune borne haute générique. Les objets imbriqués et les listes d'objets (édités en JSON : `bounties.tiers`, `alliances.researches`, `weeklyChallenge.tiers`…) ne sont contrôlés que comme « une liste ». Une recherche d'alliance sans `perLevel` donne `NaN` en production. `mergeRuleGroup` garde un `null` saisi (« Vide = comportement par défaut ») et remplace alors un nombre par `null` | `content.ts:468-488` ; `ruleRegistry.ts:152` ; `AllRulesEditor.tsx:52,83-106` | validation récursive selon la forme du défaut (chaque élément d'une liste comparé au premier élément par défaut) ; `null` refusé là où le défaut est un nombre ; bornes `min`/`max` des métadonnées (AA-24) | M |
| AA-26 | 🟠 | **Seule la section « rules » est vérifiée par le serveur** (`guardRulesConfig`). Unités, bâtiments, technos, reliques… ne sont validés que par le navigateur (`ContentEditor`). Un appel direct à l'API, ou un brouillon resté invalide, peut enregistrer un contenu que `applyGameContent` applique ensuite à chaque action | `cosmic_db.js:99-104` ; `cosmic.pb.js:766-780` | `guardContentConfig` : `validateGameContent` sur la section modifiée, refus si erreur | S |
| AA-27 | 🟡 | **Historique** : `content_versions` garde 30 versions par section, avec retour arrière. Mais « rules » est une seule section : revenir en arrière annule **tous** les groupes à la fois. Aucune vue « ce qui a changé » (différence champ par champ). Les réglages hors `CONTENT_SECTIONS` (`casino`, `procedural`, `announcements`, `banners`, `emojis`, `staff`) n'ont pas d'historique | `cosmic_db.js:8912-8950` ; `ContentHistoryPanel.tsx` | différence champ par champ dans le journal ; retour arrière d'un seul groupe ; instantanés étendus aux clés de réglage du serveur | M |
| AA-28 | 🟡 | **Aperçu de l'effet** : le « Et si ? » (`WhatIfPanel`) ne couvre que la puissance des seigneurs et les unités ; le rapport d'impact couvre les effets. Changer un coût, une durée ou une récompense n'affiche ni avant / après ni ordre de grandeur | `WhatIfPanel.tsx` ; `ImpactReportPanel.tsx` | dans `AllRulesEditor` : écart à la valeur par défaut (badge « modifié », bouton « défaut »), et alerte au-delà de ×2 / ÷2 | S |
| AA-29 | 🟡 | **Groupes historiques sans champ dédié** (rares, mais centraux) : `economy.keshBoostPct`, `economy.missionProductionMultiplier`, `fleets.mapSize`, `fleets.delayMaxMinutes`, `expeditions.durations/maxDepth/deep*`, `colonies.levelsRequired/foundation*`, `alliances.researches/projects/maxDiplomats`, `auctions.maxStart`, `moon.pityPerDefense` | mesure | à ajouter aux sections existantes de `panels.tsx` | S |
| AA-30 | ℹ️ | Bien en place : Codex généré depuis le contenu (`codex.ts:90-260` : factions, seigneurs, boss, reliques, officiers, unités, bâtiments, technos) ; succès d'entrée et de maîtrise par mesures en pourcentage (`unitTypesPct`, `buildingsUnlockedPct`…) ; effets composés (grandeur × cible × portée) sur reliques, technos et officiers ; images téléversées (`ImageField`) ; contenu ajouté conservé par `withFixedUnits` / `appendFromDefaults` | code | rien |
| AA-31 | ℹ️ | Pseudos en dur : `DEFAULT_STAFF_BY_PSEUDO`, `BALANCE_EXCLUDED_PSEUDOS`, `BLOG_DEFAULT_AUTHORS`. Ce n'est pas une règle de jeu, mais l'exclusion des statistiques d'équilibre devrait se régler (onglet Administrateurs) | `staff.ts:18,22` ; `cosmic_db.js:7000` | case « exclu de l'équilibrage » dans la liste du staff | S |
| AA-32 | ℹ️ | Seuil d'alerte des seigneurs (`WARLORD_ALERT_RATIO = 1.5`), seuils de diagnostic (`PVP_ATTACK_HIGH/LOW`), `RARE_VALUE = 50` : réglages de l'outil d'équilibrage, pas du jeu | `warlords.ts:944` ; `balance/diagnostics.ts:275` ; `balance/analysis.ts:20` | à mettre dans `unitAudit` (déjà dans le registre) | S |

## Valeurs en dur à migrer

Ce tableau ne liste que les règles de jeu. Les constantes techniques sont exclues : `HOUR`, `DAY`, tailles d'historique (`FEED_MAX`,
`MAX_ENTRIES`, `MAIL_HISTORY_MAX`), limites de saisie (`MAX_QTY`, `BANNER_MAX_LENGTH`), WebAuthn, clés `*_KEY`.
Les défauts déjà surchargés par une règle sont exclus aussi : `TECH_REDUCTION_CAP` et `EMPIRE_*_CAP` (→ `effectCaps`),
`TECH_COMBAT_CAP` (→ `combat.techCombatCap`), `DEFAULT_LOOT_TOKEN_CAP` (→ `relicSettings.lootTokenCap`), `UNIT_LEVEL_BONUS_DEFAULT`
(→ `levelBonus` par unité), `PRODUCTION_TABLE` (→ onglet Bâtiments), `PASS_POINTS` / `PASS_TIERS` (→ section `seasonPass`),
`ROLE_EFFECTS` (→ section `officers`), `RARITIES` des reliques (→ `relicSettings`), `DEFAULT_RANK_RULES` (→ section `warlords`).

| Fichier:ligne | Valeur | Nature | Cible proposée | Constat |
|:--|:--|:--|:--|:--|
| `bounties.ts:536-561` | prix des 23 objets (30 à 600 Ambre) | coût | `bountyShop.prices` | AA-1 |
| `economy.ts:24` + `bounties.ts:538` | Gelée +20 % (réglable, texte figé) | texte | description en accesseur | AA-1 |
| `talents.ts:40-55` | `perRank` 0,02 (×14), 0,2 | bonus | `talents.perRank` | AA-2 |
| `empireClass.ts:34-70` | effets 0,05 à 0,15, `buildSlots: 1`, `fleetSlots: 2`… | bonus | `classes.defs` | AA-3 |
| `colonies.ts:243-246` | 1,25 / 0,8 / 0,9 / 1,6 / 1,5 / 0,7 / 1,6 | multiplicateurs | `colonySpec.specs` | AA-4 |
| `modules.ts:55-60` | poids 60/28/10/2, recyclage 1/3/8/20 | probabilités, Ambre | `modules.rarities` | AA-5 |
| `modules.ts:62-68` | valeurs 0,03 à 0,18, voile 1 à 4 | bonus | `modules.familyValues` | AA-5 |
| `mutators.ts:21-32` | 0,1 à 0,5 par mutateur | bonus | `mutators.defs` | AA-6 |
| `leagues.ts:31-38` | jetons 1 à 4, placement 0,25 à 0,05 | récompenses | `leagues.tiers` | AA-7 |
| `challenges.ts:18-25` | `perActive` 3 à 2 000 000 | objectifs | `weeklyChallenge.perActive` | AA-8 |
| `bounties.ts:1032-1037` | 25 / 100 / 500 / 2 000 | paliers | `patrons.tiers` | AA-9 |
| `weeklyStock.ts:120` | `grantTokens(player, 25)` | récompense | `weeklyStock.tokensBag` | AA-10 |
| `seasonPass.ts:170` | `CAPSULE_AMBER = 15` | conversion | `passOverflow.capsuleAmber` | AA-11 |
| `technologies.ts:288` | `TIME_GROWTH = 1.67` | durée | `research.timeGrowth` + `timeGrowth?` par techno | AA-12 |
| `effectCatalog.ts:36-41` | barèmes 2,5 / 0,03 / 0,01… | aide à l'édition | `effectPresets.budgets` | AA-13 |
| `alliances.ts:125-200` | effet par id de recherche | effets | champ `effect` par recherche | AA-15 |
| `leviathan.ts:312` | 6 ids de faiblesse | contenu | rôle `bossWeakness` d'unité | AA-16 |
| `fleets.ts:497,506,516`, `expeditions.ts:157,171` | `"sonde_espionnage"` | rôle | `SPY_RULES.probeUnitId` | AA-16 |
| `bounties.ts:80-104` | 24 fugitifs par faction | contenu | `FactionDef.fugitives` | AA-20 |
| `dailyMissions.ts:19-25` | quantités 1 à 2 | objectifs | `dailyMissions.pool` | AA-23 |
| `referral.ts:52` | « 48 h » | texte | `linkWindowHours` | AA-21 |
| `dailyOrders.ts:97` | « 4 contrats toutes les 8 h » | texte | `BOUNTY_RULES` | AA-21 |
| `cosmic_db.js:8370,8372`, `allianceCalendar.ts:51` | « 24 h », « toutes les 4 h » | texte | `ALLIANCE_BOSS_RULES` | AA-21 |
| `cosmic_db.js:336` | `[0, 10, 30, 70, 150]` | paliers en double | `BOUNTY_RULES.ranks` | AA-22 |
| `warlords.ts:944`, `balance/diagnostics.ts:275-276`, `balance/analysis.ts:20` | 1,5 ; 65 / 40 ; 50 | seuils d'outil | `unitAudit` | AA-32 |

## Contenu ajoutable sans code ?

« Oui » : ajout, modification et retrait depuis l'admin, effets compris. « Partiel » : la fiche s'ajoute, mais un maillon demande du code.

| Type | Ajouter | Modifier | Retirer | Ce qui exige encore du code | S'enchaîne (Codex, succès, effets, butin) |
|:--|:--|:--|:--|:--|:--|
| Unités | oui | oui | oui | coût hors ferraille / énergie (AA-17) ; rôles sonde, recycleur, soutien, faiblesse de boss (AA-16) ; préréglage d'effet (AA-18) | Codex oui, succès oui (pourcentages), préréglage **non**, butin sans objet |
| Bâtiments | oui | oui | oui | effets limités à 5 types (`repair`, `hangar`, `storage`, `shield`, `dock`) ; Atelier (`workshop.ts:86`) et Cale sèche liés à leur id | Codex oui, succès oui |
| Technologies | oui | oui | oui | types d'effets fermés, mais l'effet composé `stat` couvre la plupart des besoins ; image par défaut si absente | Codex oui, succès oui |
| Reliques | oui | oui | oui (désactiver) | effets historiques fermés ; effet composé disponible | Codex oui, butin oui (par rareté), succès oui |
| Plans / modules | **non** | chiffres partiels (coût, emplacements) | non | modèles, familles, valeurs, tirage en dur (AA-5) | non |
| Talents | **non** | non | non | liste et valeurs en dur (AA-2) | non |
| Officiers | non (12 rôles fixes) | oui (noms, effets par niveau, recrutement) | non | `COMMANDER_ROLES`, `COMMANDER_SOURCES` | Codex oui |
| Classes d'empire | non | 4 chiffres | non | effets et avantages en dur (AA-3) | sans objet |
| Boss mondiaux | oui | oui | oui | faiblesse par défaut (AA-16) | Codex oui, succès oui |
| Boss d'alliance | oui (catalogue en règles) | oui | oui | — | Codex oui |
| Boss de saison / Chroniques | oui (mois, bibliothèque) | oui | oui | archétypes du générateur (AA-23) | Codex oui |
| Seigneurs | oui | oui | oui | origine fermée (`WarlordOrigin`) | Codex oui |
| Factions | oui | oui | oui | fugitifs, archétypes, origine (AA-20) | Codex oui ; primes **non** |
| Missions | oui | oui | oui | — | — |
| Succès | oui | oui | oui | nouvelle **mesure** = code (normal) | — |
| Titres | oui | oui | oui | — | — |
| Rangs | oui | oui | oui | — | — |
| Défis de la semaine | non | 5 chiffres + paliers | non | types et objectifs en dur (AA-8) | — |
| Missions du jour / objectifs du jour | non | chiffres de récompense | non | réserve et types en dur (AA-23) | — |
| Primes Kesh'Vaar | non (fugitifs) | chiffres (paliers, rangs) | non | fugitifs en dur (AA-20) | — |
| Comptoir de la Ruche | non | durées seulement | non | prix et objets en dur (AA-1) | — |
| Offre de la semaine | non | prix, quantités | non | liste fixe, sac de jetons (AA-10) | — |
| Recherches / projets d'alliance | JSON seulement | chiffres (JSON) | JSON | **effet lié à l'id** (AA-15) | non |
| Mutateurs | non | choix du mois | non | liste et valeurs (AA-6) | — |
| Divisions | non | montée, descente | non | jetons, placement (AA-7) | — |
| Passe / saisons | oui (générateur, brouillons) | oui | oui | thèmes et catalogue des saisons en dur (AA-23) | — |
| Annonces plein écran | oui (personnalisées) | oui | oui (couper) | annonces de version dans `Announcement.tsx` (voulu) | — |
| Bandeaux, emojis | oui | oui | oui | — | — |
| Événements programmés | oui | oui | oui | — | — |
| Casino | réglages | oui | — | symboles fixes (voulu) | — |
| Textes de règle | partiel | partiel | — | textes chiffrés figés (AA-21) | — |
| Tutoriel, accueil, guide | non | non | non | `story.ts`, `onboarding.ts`, `advancedGuide.ts` (voulu : AA-Q3) | — |

## Lots proposés

Ordre proposé : sûreté d'abord (AA-25, AA-26), puis ergonomie (AA-24), puis contenu.

| Lot | Contenu | Constats | Taille |
|:--|:--|:--|:--|
| **AA1 : garde-fous** | `guardContentConfig` côté serveur ; validation récursive selon la forme du défaut ; `null` refusé pour un nombre ; test : une liste d'objets mal formée est refusée | AA-25, AA-26 | M |
| **AA2 : métadonnées des réglages** | `*_RULES_META` (libellé, unité, min, max, aide) déclarées dans le registre ; `AllRulesEditor` affiche libellé, unité, aide, bornes, badge « modifié » et bouton « défaut » ; garde `ruleRegistry.test.ts` : tout champ a un libellé. Priorité aux groupes `phalanx`, `jumpGate`, `effectCaps`, `warlords`, `commanderXp`, `bounties`, `dailyContracts`, `vacation`, `ascension` | AA-24, AA-28 | M |
| **AA3 : chiffres en dur → registre** | prix du Comptoir, `perRank` des talents, spécialisations, modules (raretés, valeurs), divisions, `perActive`, mécènes, sac de jetons, `CAPSULE_AMBER`, `TIME_GROWTH`, barèmes des préréglages, seuils d'outil. Accesseurs pour garder les ids en dur (modèle 6.9.0) | AA-1 à AA-13, AA-29, AA-32 | M |
| **AA4 : textes de règle vivants** | textes construits depuis la règle (parrainage, primes, boss d'alliance, Comptoir, mutateurs) ; `keshFeats` lit `BOUNTY_RULES.ranks` ; test de garde (règle modifiée → texte modifié) | AA-21, AA-22 | S |
| **AA5 : rôles d'unités** | `UnitDef.roles` (sonde, recycleur, soutien, faiblesse de boss), lus à la place des ids ; préréglages d'effets générés par unité ; coût d'unité en `ResourceMap` | AA-16, AA-17, AA-18 | M |
| **AA6 : recherches d'alliance par effets** | champ `effect` composé par recherche et par projet, lu par `empireEffects` (I9) ; éditeur de liste dédié ; migration des 5 + 3 entrées | AA-15 | M |
| **AA7 : listes système éditables** | classes d'empire et mutateurs en effets composés ; fugitifs dans la fiche de faction ; archétype de repli pour une faction ajoutée | AA-3, AA-6, AA-20 | L |
| **AA8 : chaîne et historique dans l'admin** | carte « Chaîne de contenu » (maillons manquants) ; différence champ par champ et retour arrière par groupe ; instantanés des réglages serveur (`casino`, `procedural`…) | AA-19, AA-27 | M |
| AA9 (plus tard) | talents, modules et catalogues (saisons, thèmes du passe) en sections de contenu | AA-2, AA-5, AA-23 | L |

Chaque lot suit la règle n° 1 (fiche, GDD, fiches systèmes) et la règle n° 2 (éditeur dans le même lot). Pour AA3, AA5, AA6 et AA7, les valeurs par défaut restent **identiques** : aucun changement d'équilibre, aucune migration de données joueurs.

## Questions

| # | Question | Option recommandée | Pour revenir en arrière |
|:--|:--|:--|:--|
| AA-Q1 | Où vivent les libellés des réglages : un `*_RULES_META` à côté de chaque objet du moteur, ou un dictionnaire central dans l'admin (comme `FIELD_LABELS`) ? | **À côté de l'objet, dans le moteur** : le libellé naît avec le champ, la garde le vérifie, et les bornes servent aussi à la validation serveur (AA-25) | déplacer les métadonnées vers l'admin, sans effet sur le jeu |
| AA-Q2 | Talents, classes, mutateurs, modules : chiffres seulement dans le registre (petit), ou sections de contenu complètes (ajout et retrait) ? | **Chiffres d'abord (AA3)**, sections ensuite (AA7, AA9). Les ids restent stables, il n'y a rien à migrer chez les joueurs | retirer les champs du registre : les défauts du code reprennent |
| AA-Q3 | Tutoriel, accueil, guide avancé, annonces de version : réglables dans l'admin ? | **Non pour l'instant** : ce sont des textes d'interface livrés avec une version (et l'admin crée déjà des annonces personnalisées). À revoir si l'équipe veut écrire sans déployer | — |
| AA-Q4 | Bornes des effets de techno (`EFFECT_MAX_PER_LEVEL`) et plafonds : réglables ? | **Plafonds oui** (déjà dans `effectCaps`), **bornes de validation non** : elles protègent les invariants I9 et `TECH_COMBAT_CAP` contre une erreur de saisie | les ajouter à `effectCaps` si l'équipe le demande |
| AA-Q5 | Rôles d'unités (AA-16) : drapeau `roles` dans la fiche d'unité, ou ids dans un groupe de règles (`SPY_RULES.probeUnitId`, `debris.recyclerUnitId`) ? | **Drapeau dans la fiche** : une unité ajoutée prend son rôle d'une case à cocher, et les deux champs actuels deviennent des valeurs de repli | revenir aux ids des règles, toujours lus en repli |
| AA-Q6 | Validation renforcée (AA1) : refuser, ou seulement avertir, les valeurs hors bornes ? | **Refuser** les types et formes invalides ; **avertir** (sans bloquer) au-delà de ×2 / ÷2 du défaut. C'est le plus prudent pour les données des joueurs, sans brider l'équilibrage | passer l'avertissement en refus, ou l'inverse, dans `validateRules` |
