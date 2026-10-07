# AU27 : audit d'équilibrage du jeu complet (ni trop facile, ni trop compliqué)

Date : 2026-10-07. Branche de travail (6.14.48). Périmètre : progression, combat (JcJ et PvE), économie et récompenses, complexité.
Les audits jeu, design, actions, illustrations, admin et procédural sont faits à part.

Sources :
- **simulations** sur le moteur pur `src/game` (vitest ad hoc, hors dépôt) : progression d'un joueur actif, moyen et occasionnel sur
  90 jours, combats JcJ à budget égal, budget d'Ambre (`amberBudget.ts`) ;
- **mesures** de la copie de la production du 2026-10-07 (`docs/audit/2026-10-07-z1-mesures.md`, 14 actifs) ;
- rapport d'équilibrage du dépôt (`BALANCE_REPORT=1 npx vitest run src/game/balance/report.test.ts`) ;
- GDD §1, §2 et §4, WORKFLOW §4, fiches `docs/systems/*.md`, `docs/audit/constats-ouverts.md`.

Rien n'est changé dans le jeu par ce rapport. Les réglages proposés passent par une proposition puis des lots (CLAUDE.md, règle n° 1).

## 1. Méthode et limites de la simulation

**Joueur simulé.** Il est glouton : à chaque session, il réclame la série et les objectifs du jour, puis relance les missions débloquées,
3 expéditions par jour (valeur moyenne) et ses 6 chantiers. Il lance aussi ses 4 recherches, chaque fois la moins chère abordable
(rares comptées 50). Il passe par le comptoir (1 rare pour 100 communes, taxe 5 %) quand seules les rares manquent. La prise en main
est versée à J0. Production, entrepôt, coûts, durées, échelle des rares (`rareRewardScale`) et récompenses des missions sont lus dans
le moteur.

| Profil | Sessions | Objectifs du jour | Série |
|:--|:--|:--|:--|
| Actif | 8 par jour (7 h à 21 h, toutes les 2 h) | 4 | complète |
| Moyen | 3 par jour (8 h, 13 h, 20 h) | 4 | complète |
| Occasionnel | 1 par jour (20 h), un jour sur trois manqué | 2 | jamais au 7e jour |
| Quotidien | 1 par jour sans manquer (contrôle du coffre du 7e jour) | 2 | complète |

**Hors modèle** (tous ces points accélèrent le vrai jeu ou lui donnent d'autres choses à faire) :
- achats d'unités et de défenses ;
- pertes au combat et pillage ;
- événements, reliques, officiers, talents, alliance, classes d'empire ;
- primes et raids PNJ.

Les unités demandées par une mission sont supposées construites dès que leur techno est là. Les résultats sont des ordres de
grandeur, pas des dates exactes.

**Recoupement avec la production.** Un joueur a déjà fait une Ascension, après environ 9 jours de jeu (AU3, Z1). Il faut pour cela tous
les bâtiments au niveau 20. Le profil « actif » y arrive à J10 : la simulation est crédible.

## 2. Tableau des cibles

| Indicateur | Mesure | Cible | Verdict |
|:--|:--|:--|:--|
| 1re Ascension possible (actif / moyen / occasionnel) | J10 / J18 / J46 (sim.) ; 1 Ascension en prod. après ≈ 9 jours | J35–50 / J60–90 / > J120 (GDD §2 : méta sur plusieurs mois) | **trop facile** (AE-1, AE-2) |
| Arbre de recherche complet (288 niveaux) | J14 / J30 / J90 (sim.) | > J60 pour l'actif | **trop facile** (AE-1) |
| Sessions sans rien à lancer (chantier ou labo libre, rien d'abordable) | 0 % J1–7 ; 6 % J8–30 (actif) | < 15 % | bon |
| Rythme de J1 | extracteurs niv. 8 / 4 / 2 à J1 ; niveaux 2–10 remboursés en < 2,5 h | une montée rapide le premier jour | bon (AE-16) |
| Production perdue (entrepôt plein), cumul à J90 | 71 % / 61 % / 41 % | < 20 % | **trop-plein** (AE-5) |
| Coffre du 7e jour (joueur quotidien à J7) | ≈ 650 M de communes, soit 240 h de sa production | 8 à 16 h de production | **trop généreux** (AE-3) |
| Part des missions dans les gains (actif, J14+) | 35 % | 15 à 25 % | élevé (AE-4) |
| Victoires de l'attaquant (JcJ, 30 j) | 74 % (prod.) | 55 à 65 % | **trop facile pour l'attaquant** (AE-6) |
| Seuil de victoire contre un défenseur mixte | ×0,75 de sa dépense (sim.) | ×1,0 au moins | défaveur du défenseur (AE-6) |
| Joueurs pillables | 86 % (prod.) | 50 à 70 % | élevé (AE-5, AE-6, voir E1) |
| Défaites en 24 h sur une même cible | sans limite ; bouclier 1 h | 4 au plus | **absent** (AE-7) |
| Q1 de l'XP attaquable par la médiane | oui (écart ×11,3 < 12) | non | **à protéger** (AE-8) |
| Raids de faction repoussés (7 j) | 79 % | 60 à 80 % | bon |
| Boss abattus (56 j) | 3 sur 3, 100 % des dégâts | 60 à 80 % | trop peu de combats (AE-10, Q21) |
| Lune niveau 5 (coût total) | 7,5 M ferraille + 3,75 M énergie, < 20 min de production d'un moyen à J7 | environ 1 jour de production en milieu de partie | **trivial** (AE-9) |
| Ambre par mois (régulier / très actif) | 2 785 / 9 155 ; Comptoir à usage unique : 2 210 | Comptoir unique fini en 4 à 6 semaines par le régulier ; très actif ≤ 2 × régulier | inflation (AE-11) |
| Succès après 1 semaine | 39 % (médiane 70 sur 178) | 15 à 25 % | trop vite (AE-12, suit AE-1) |
| Écart de production actif / occasionnel | ×11,7 à J14, ×4,2 à J30, ×1 à J90 | ≤ ×5 à J14 | effet boule de neige au début (AE-15) |
| Entrées de menu visibles à J1 | ≈ 40 en 6 groupes ; 14 monnaies et jauges | 12 à 15 à J1, puis ouverture par rang | **trop chargé** (AE-13) |

## 3. Courbes de progression (réglages actuels, comptoir utilisé)

| Profil | Jour | Extracteurs | Entrepôt | Technos (niveaux / types) | Production commune | Stock commun | Production perdue (cumul) |
|:--|:--|:--|:--|:--|:--|:--|:--|
| Actif | J1 | 8 | 5 | 29 / 9 | 2,7 M/h | 11 M | 0 % |
| | J7 | 16–18 | 18 | 188 / 24 | 74 M/h | 3,2 Md | 0 % |
| | J14 | 20 | 20 | 287 / 30 | 134 M/h (maximum) | 6,5 Md | 0 % |
| | J30 | 20 | 20 | 288 / 30 (tout) | 134 M/h | 93 Md | 5 % |
| | J90 | 20 | 20 | tout | 134 M/h | 260 Md | **71 %** |
| Moyen | J1 | 4 | 4 | 9 / 6 | 0,2 M/h | 1,7 M | 0 % |
| | J7 | 14 | 14 | 76 / 16 | 28 M/h | 1,6 Md | 0 % |
| | J30 | 20 | 20 | 284 / 30 | 134 M/h | 44 Md | 0 % |
| | J90 | 20 | 20 | tout | 134 M/h | 170 Md | **61 %** |
| Occasionnel | J1 | 2 | 2 | 2 / 2 | 0,1 M/h | 0,4 M | 0 % |
| | J7 | 6 | 5 | 17 / 7 | 0,8 M/h | 33 M | 0 % |
| | J14 | 10–11 | 8 | 37 / 10 | 11,5 M/h | 240 M | 60 % (entrepôt en retard) |
| | J30 | 14–15 | 15 | 77 / 17 | 32 M/h | 3,9 Md | 42 % |
| | J90 | 20 | 20 | 236 / 30 | 134 M/h | 100 Md | 41 % |

Origine des gains (actif, de J14 à J90) : production 52 %, missions 35 %, série 5 %, expéditions 5 %, coffre du 7e jour 1 à 3 %,
objectifs du jour moins de 1 %.

Premier mur (au moins 3 chantiers vides, faute de rares) :
- sans le comptoir : J2,7 (actif), J6,8 (moyen), J33 (occasionnel) ;
- avec le comptoir : le mur disparaît (aucun pour l'actif, J7,8 pour le moyen, J46 pour l'occasionnel).

Le comptoir supprime donc la rareté (AE-2).

Le mur d'entrée vient du **second palier** des bâtiments (niveaux 11 à 20). Le niveau 11 d'un extracteur coûte 9 M de communes et 20 000
rares, contre 4,3 M sans rares au niveau 10. Il ne rapporte que +25 % de production : 625 contre 500 par seconde.

### Variantes testées (Ascension possible, en jours)

| Variante | Actif | Moyen | Occasionnel | Sessions sans action (actif, J8–30) |
|:--|:--|:--|:--|:--|
| Réglages actuels | 10 | 18 | 46 | 6 % |
| Coffre ramené à 12 h de production | — | 18 | — | — |
| A : missions (`missionProductionMultiplier` 0,5, `missionRareProductionRef` 600 000) | 15 | 19 | 46 | 19 % |
| C : comptoir à 1 rare pour 250 | 11 | 21 | 47 | 8 % |
| F : comptoir à 1 pour 500, plus A | 18 | 26 | 50 | 24 % |
| G : second palier ×4 (coût de départ et coût maximal) | 29 | 45 | 88 | 43 % |
| H : second palier ×10 au niveau maximal seulement | 39 | 59 | > 90 | 58 % |
| **I : second palier ×4, plus comptoir à 1 pour 250** | **32** | **50** | **> 90** | 48 % |
| Sans comptoir (réglages actuels) | 17 | 35 | > 90 | 60 % |

Seule une hausse des coûts du second palier repousse la fin de partie. Les leviers missions et comptoir pèsent peu seuls : la
production commune grimpe trop vite (×1,8 par niveau jusqu'au 10, ×600 entre J1 et J14 pour le moyen). Un mur de rares sans
comptoir ferait passer le joueur actif à 60 % de sessions sans rien à lancer.

La variante I garde un mur raisonnable pour le moyen (0 % de sessions sans action de J8 à J30). Pour l'actif, elle compte sur les
autres boucles : combats, primes, boss, unités.

## 4. Constats

Gravité : **haute** (le jeu est trop facile ou injuste pour une partie des joueurs), **moyenne**, **basse**, **info**. Taille : S (réglage
seul), M (moteur et tests), L (moteur, serveur et interface).

| # | Gravité | Constat | Preuve | Réglage (champ exact) | Valeur proposée | Effet attendu | Taille |
|:--|:--|:--|:--|:--|:--|:--|:--|
| AE-1 | haute | **Fin de partie atteinte en 2 semaines** : tous les bâtiments au niveau 20 à J10 (actif) et J18 (moyen), tout l'arbre à J14 et J30. La boucle « méta » (Ascension, plusieurs mois) dure une semaine. Un niveau du second palier coûte 3 à 10 h de production (niveau 20 d'un extracteur : 900 M d'équivalent, pour 134 M/h) | §3 ; 1 Ascension en prod. après ≈ 9 jours | Admin → Contenu → Bâtiments → « Second palier (hauts niveaux) » : `upgrade.tier2.baseCost` et `upgrade.tier2.maxCost` des 9 bâtiments qui en ont un (4 extracteurs, 2 hangars, Atelier, Cale sèche, Entrepôt) | **×4**. Extracteurs : départ 5 M → 20 M ferraille, 3 M → 12 M énergie, 20 000 → 80 000 rares ; maximum 500 M → 2 Md, 300 M → 1,2 Md, 2 M → 8 M rares (même facteur pour les autres) | Ascension à J29 / J45 / J88 (variante G), J32 / J50 / > J90 avec AE-2 | M (valeurs par défaut, migration du contenu personnalisé, simulateur en garde) |
| AE-2 | haute | **Le comptoir annule la rareté** : 1 rare pour 100 communes, sans plafond. Les communes débordent, si bien que l'actif convertit 6,5 Md de communes en ≈ 60 M de rares dès J14 et que le mur des rares disparaît (Ascension J17 → J10). De plus, `RARE_VALUE` (50, analyse) ne suit pas le taux d'achat (100) | §3 ; `EXCHANGE_RULES` | Admin → Règles → Comptoir d'échange : `exchange.commonToRare` | 0,01 → **0,004** (1 rare pour 250) ; au lot suivant, un plafond hebdomadaire `exchange.weeklyRareCap` (nouveau champ) | avec AE-1 : le comptoir reste un appoint et ne contourne plus le second palier | S, puis M (plafond) |
| AE-3 | haute | **Coffre du 7e jour fixe** : 45 M à 280 M par ressource commune (≈ 650 M au total), sans lien avec la production. Pour un joueur quotidien à J7 (2,7 M/h), c'est 240 h de production. Il arrive au-delà de l'entrepôt (33 M), ce qui **arrête la production** (`addCapped`) et expose ≈ 690 M au pillage | sim. « quotidien » : stock à J7 727 M (102 M avec un coffre de 12 h) ; production perdue à J14 96 % (67 %) | Admin → Règles → Série de connexion : `streak.chest.common` | [45 000 000, 280 000 000] → **[2 000 000, 12 000 000]** tout de suite ; au lot suivant, nouveau champ `streak.chest.commonHours` [6, 18] (indexé sur la production, comme `streak.hours`) | coffre ≈ 8 à 16 h de production ; plus de production gelée ni de cible offerte au pillage à J7 | S, puis M |
| AE-4 | moyenne | **Missions trop rentables** : communes = 1,5 × durée × production, rares sur production / 150 000, toutes en parallèle et versées sans plafond. Elles font 35 % des gains de l'actif. Une mission d'élite rapporte 248 000 rares en 2 h à J7 | rapport d'équilibrage (0,36 à 0,75 h de production par heure de mission) ; §3 | Admin → Règles → Économie : `economy.missionProductionMultiplier`, `economy.missionRareProductionRef` | 1,5 → **0,75** ; 150 000 → **400 000** | part des missions 35 % → environ 20 % (estimation : la variante A, plus forte, donne 15 %) ; l'écart actif / moyen se resserre | S |
| AE-5 | moyenne | **Trop-plein et rien à acheter** : tout est au maximum à J14 (actif), la production perdue atteint 71 % à J90 et le stock 260 Md. Ce stock oisif est la matière du pillage : 86 % de joueurs pillables, 64 h de stock pour 8 h à l'abri | §3 ; Z1 | aucun réglage seul : AE-1 retarde le trop-plein ; puits de dépense à concevoir (projets de prestige, Ascension) | proposition : un puits ouvert en permanence, payé en heures de production (à chiffrer dans la proposition) | production perdue < 20 % à J90 ; moins de stock exposé | L |
| AE-6 | haute | **Le défenseur mixte perd à budget égal** : avec moitié défenses et moitié vaisseaux à quai, il perd dès que l'attaquant dépense 0,75 fois ce qu'il a investi. À dépense égale, il perd 93 % de ce qui combat, et l'attaquant 23 %. Les vaisseaux à quai comptent à 50 %. Le bouclier de 15 % ne change aucune issue. Des défenses seules tiennent jusqu'à ×2 | sim. JcJ (techno 50 %, unités niv. 6) ; 74 % de victoires de l'attaquant en prod. | Admin → Règles → Combat : `combat.homeFleetDefenseFactor`, `combat.homeDefenseBonus` | 0,5 → **0,75** ; 0,15 → **0,25** | seuil ×0,75 → ×0,90 ; baisse attendue des victoires de l'attaquant de 74 % vers la cible (55 à 65 %), à mesurer 30 jours après | S |
| AE-7 | moyenne | **Frappes répétées sans limite** : le bouclier après défaite (1 h) est plus court que le délai entre deux attaques d'un même joueur (2 h). À plusieurs, on peut frapper une cible toutes les heures, et rien ne compte les défaites sur 24 h | `PVP_RULES` | Admin → Règles → JcJ : `pvp.shieldAfterDefeatMs` ; nouveau champ `pvp.maxDefeatsPer24h` | 3 600 000 → **10 800 000** (3 h) ; nouveau champ à **4** | 8 défaites par 24 h au plus tout de suite, 4 au plus ensuite | S, puis M |
| AE-8 | moyenne | **Le bas du classement reste attaquable** : la médiane d'XP (19 539) peut attaquer le premier quartile (1 730, écart ×11,3), sous le refus fixé à ×12. Elle garde 25 % du butin | Z1 ; `PVP_RULES.hardXpRatio` | Admin → Règles → JcJ : `pvp.hardXpRatio` | 12 → **10** | le premier quartile est hors de portée de la médiane ; les cibles restent nombreuses entre pairs | S (question AE-Q4) |
| AE-9 | moyenne | **Lune triviale à l'échelle de l'économie** : les niveaux 2 à 5 coûtent 7,5 M de ferraille et 3,75 M d'énergie, moins de 20 min de production d'un moyen à J7. La chance maximale (20 %) est atteinte dès 2 M de débris, soit 6,7 M de vaisseaux détruits. Sur un serveur mûr, chaque combat aura sa chance pleine, et le succès « Lune pleine » ne coûte rien | `MOON_RULES` ; §3 | Admin → Règles → Tous les réglages → Lunes : `moon.upgradeCost`, `moon.costGrowth`, `moon.debrisPerPercent` | { ferraille 500 000, énergie 250 000 } → **{ 20 000 000, 10 000 000 }** ; 2 → **3** (total 1,2 Md) ; 100 000 → **2 000 000** | lune pleine ≈ 10 h de production à J30, 2 jours à J7 ; 20 % de chance pour un vrai combat (≥ 40 M de débris) | S |
| AE-10 | moyenne | **Boss probablement faciles** : structure = 4 × la puissance d'attaque des actifs, et chaque assaut retire la puissance de la flotte. Sur 72 h, avec un assaut toutes les 4 h, il suffit qu'un quart des actifs fasse ses 9 assauts (rythme d'un joueur moyen). 3 boss sur 3 abattus. Le jeu ne mesure pas le temps avant la mort | `LEVIATHAN_RULES`, `ALLIANCE_BOSS_RULES` ; Z1 | Admin → Règles → Léviathan : `leviathan.hpFactor` ; Boss d'alliance : `allianceBoss.hpFactor` | **inchangés** jusqu'à 8 semaines de mesure (Q21) ; si plus de 85 % sont abattus avant 36 h : 4 → 6 et 2,5 → 3,5 | 60 à 80 % abattus, mort entre 36 et 60 h | S (mesure dans la santé : M) |
| AE-11 | moyenne | **Inflation d'Ambre chez les plus actifs** : 9 155 par mois (dont 79 % de primes), contre 2 785 pour un régulier, alors que tout le Comptoir à usage unique coûte 2 210. Le plus actif le vide en une semaine ; ensuite il ne reste que des consommables (30 à 150) | `amberMonth` (profils de l'admin) | Admin → Règles → Primes Kesh'Vaar : `bounties.tiers.3.amber`, `bounties.tiers.4.amber`, `bounties.amberPerRank` | 60 → **40** ; 120 → **80** ; 0,1 → **0,05** | très actif ≈ 6 750 par mois (2,4 × régulier) ; gains futurs seulement, soldes intacts | S (et mesure de l'Ambre gagnée par source : M) |
| AE-12 | basse | **Succès débloqués vite** : 39 % en une semaine. C'est surtout la conséquence d'AE-1 (paliers de bâtiments et de technos atteints en 2 semaines) | Z1-a, PRG-5 | aucun avant AE-1 ; puis seuils procéduraux | — | 15 à 25 % la première semaine une fois AE-1 appliqué ; mesure à reprendre | — |
| AE-13 | moyenne | **Charge cognitive à J1** : 6 groupes et environ 40 entrées de menu visibles dès l'inscription (seuls Ascension, Casino fermé et Concours sont cachés), 14 monnaies et jauges, 6 rendez-vous PNJ (boss mondial, boss de saison, boss d'alliance, élite, vendettas, raids). La prise en main n'a que 10 objectifs. OGame montre une douzaine d'entrées ; Clash of Clans ouvre ses bâtiments par niveau d'hôtel de ville | `NavBar.tsx` ; `commerce-monnaies.md` | nouveau groupe de règles `navUnlock` (rang requis par page), Admin → Règles | Bronze III : Missions, Galaxie, Combats ; Argent III : Seigneurs, Boss, Commerce, Casino ; Or III : Guerre de territoire, Colonies, Classe | 12 à 15 entrées à J1 ; les pages s'ouvrent avec une annonce « Nouveau : … » | L |
| AE-14 | basse | **Gains versés au-delà de l'entrepôt sans le dire** : coffre, missions et série dépassent la capacité. Le stock reste, mais la production s'arrête jusqu'à ce qu'on dépense. Le pilier « perdre sans choix » est fragile | `economy.ts` (`addCapped`), `flush.ts` | aucun réglage ; interface (Ressources, Ordres du jour) | phrase « Au-delà de l'entrepôt : la production de X est arrêtée » et sortie (dépenser, échanger) | plus de perte silencieuse | S |
| AE-15 | moyenne | **Effet boule de neige au début** : la production de l'actif vaut 11,7 fois celle de l'occasionnel à J14, puis 4,2 fois à J30 (tous convergent au plafond à J90). Le rattrapage (+25 % sous 10 % de la médiane) ne couvre qu'une petite part de l'écart | §3 ; `CATCHUP_RULES` | Admin → Règles → Rattrapage : `catchup.maxBonus`, `catchup.fullBelow` | 0,25 → **0,5** ; 0,1 → **0,2** | écart à J14 réduit (à chiffrer par le simulateur d'AE-L0) ; le plafond des bonus (I14) reste respecté | S (vérifier `derived.test.ts`) |
| AE-16 | info | **J1 réussi** : niveaux 2 à 10 des extracteurs remboursés en moins de 2,5 h, aucune session sans action de J1 à J7. Premier vaisseau après 4 technos (≈ 21 000 ferraille, 34 min de recherche) | rapport d'équilibrage ; §3 | rien | — | — | — |
| AE-17 | info | **Raids PNJ dans la cible** (79 % repoussés). Passe (PRG-1) et casino (0 gros lot en une semaine) attendent les mesures après Z0 | Z1 | rien | — | — | — |

## 5. Lots proposés

Ordre : réglages sûrs d'abord, sans toucher aux données des joueurs (soldes, niveaux et unités restent, seules les dépenses et gains
futurs changent). Chaque lot a sa fiche et ses entrées dans `QUESTIONS.md` et `decisions-a-valider.md` (CLAUDE.md, règle n° 3).

| Lot | Contenu | Constats | Taille | Prérequis |
|:--|:--|:--|:--|:--|
| **AE-L0** | Proposition `docs/proposals/equilibrage-au27.md` (plan WORKFLOW §2), entrées des questions AE-Q1 à AE-Q7. Simulateur de progression versé dans le dépôt : `src/game/balance/progressionSim.ts` et un test, avec bornes d'Ascension par profil (garde de l'équilibre) | tous | M | — |
| **AE-L1** | Réglages seuls, essayés sur la pré-prod : `streak.chest.common` [2 M, 12 M], `combat.homeFleetDefenseFactor` 0,75, `combat.homeDefenseBonus` 0,25, `pvp.shieldAfterDefeatMs` 3 h, `pvp.hardXpRatio` 10, `moon.upgradeCost` / `costGrowth` / `debrisPerPercent`, `catchup.maxBonus` 0,5 / `fullBelow` 0,2. Valeurs par défaut du code alignées dans le même lot. Changelog (« la défense à domicile compte davantage ») | AE-3, 6, 7, 8, 9, 15 | S | Z0 pour la production |
| **AE-L2** | Progression : second palier ×4 (valeurs par défaut, et migration `CONTENT_MIGRATIONS` qui multiplie seulement les bâtiments non modifiés par l'admin), `exchange.commonToRare` 0,004, `economy.missionProductionMultiplier` 0,75, `missionRareProductionRef` 400 000. Test : simulateur dans ses bornes. Billet de devblog (le pourquoi, chiffres de §3) | AE-1, 2, 4 | M | AE-L0 ; annonce une semaine avant (comme l'abri en 5.32) |
| **AE-L3** | Moteur : `streak.chest.commonHours` (coffre indexé), `exchange.weeklyRareCap`, `pvp.maxDefeatsPer24h`, avec leurs éditeurs dans l'admin (règle n° 2) | AE-2, 3, 7 | M | AE-L1 |
| **AE-L4** | Santé de l'équilibre : Ambre gagnée par source et par semaine, temps avant la mort des boss, jour de la 1re Ascension, production perdue (entrepôt plein), écart de production entre quartiles | AE-5, 10, 11, 15 | M | — |
| **AE-L5** | Ouverture progressive du menu (`navUnlock`, rang requis par page), comptes existants au-delà de Fer II tout ouverts, annonce à chaque ouverture | AE-13 | L | AE-L0 |
| **AE-L6** | Puits de dépense permanent (projets de prestige payés en heures de production) : proposition puis lots | AE-5 | L | AE-L2 mesuré |
| **AE-L7** | Après Z0 et 8 semaines de mesures : boss (`hpFactor`), Ambre des primes, seuils des succès | AE-10, 11, 12 | S | AE-L4 |

Effet attendu d'AE-L1 et AE-L2 réunis (simulation, variante I) : 1re Ascension à J32 (actif), J50 (moyen), après J90 (occasionnel).
Production perdue à J90 : 36 % (au lieu de 61 %) pour le moyen. Coffre ≈ 12 h de production. Seuil JcJ ×0,90.

## 6. Questions (option recommandée : la plus prudente pour les données des joueurs)

| # | Question | Option recommandée | Autre option | Revenir en arrière |
|:--|:--|:--|:--|:--|
| AE-Q1 | Quand appliquer le second palier ×4, alors qu'un joueur a déjà fait son Ascension avec les anciens coûts ? | Au début d'un mois, avec Z0 et une annonce une semaine avant ; seuls les niveaux futurs coûtent plus, rien n'est retiré ni remboursé | tout de suite, sans annonce | remettre les coûts dans Admin → Contenu → Bâtiments |
| AE-Q2 | Rareté : baisser le taux du comptoir ou le plafonner ? | Les deux, dans cet ordre : taux à 1 pour 250 (réglage), puis plafond hebdomadaire (moteur) | plafond seul, taux inchangé | `exchange.commonToRare` à 0,01 |
| AE-Q3 | Coffre du 7e jour : bornes fixes réduites ou indexation sur la production ? | Bornes [2 M, 12 M] tout de suite, indexation [6, 18] h ensuite | indexation seule (attendre le moteur) | `streak.chest.common` aux anciennes bornes |
| AE-Q4 | `pvp.hardXpRatio` 12 → 10 réduit les cibles sur un serveur de 14 actifs : on le fait ? | Oui, à 10 (le premier quartile est hors de portée de la médiane) ; on mesure le nombre de combats par jour (2,1 aujourd'hui) | 8 (plus protecteur, moins de JcJ) | valeur 12 |
| AE-Q5 | Boss : renforcer tout de suite ou attendre 8 semaines (Q21) ? | Attendre, en mesurant d'abord le temps avant la mort (AE-L4) | `hpFactor` 4 → 6 tout de suite | valeur 4 |
| AE-Q6 | Ambre : réduire les primes des paliers 3 et 4 ou ajouter des dépenses ? | Réduire les gains futurs d'un tiers (soldes intacts), après une mesure par source | ajouter des achats au Comptoir | valeurs 60, 120 et 0,1 |
| AE-Q7 | Menu progressif : quels comptes voient tout ? | Tout compte existant au-delà de Fer II, et tout compte qui a déjà ouvert la page ; seuls les nouveaux comptes ont l'ouverture par rang | ouverture par rang pour tous | `navUnlock.enabled` à faux |

## 7. Reproduire

Les simulations de cet audit tournent sur le moteur pur avec un `vitest.config` ad hoc (racine du dépôt, alias `@`, fichiers hors de
`src/`). Elles restent dans le scratchpad de la session, comme demandé. Le lot AE-L0 les verse dans le dépôt
(`src/game/balance/progressionSim.ts` et son test) pour que chaque réglage d'équilibre se vérifie avant d'être appliqué.

- Progression : profils du §1, pas de 10 min, jalons J1, J3, J7, J14, J30, J60 et J90. Variantes : `EXCHANGE_RULES`, `ECONOMY_RULES` et le
  `tier2` des bâtiments modifiés en mémoire.
- JcJ : `simulateSandbox`, techno à 50 % (`techProfile(0.5)`), unités niv. 6, budget 20 M, attaquant frégates, chasseurs et croiseurs de
  raid (30 / 40 / 30 %). Défenseur : défenses seules, ou moitié défenses et moitié vaisseaux à quai ; boucliers 0, 7,5 et 15 % ; postures.
- Ambre : `amberMonth(defaultAmberProfiles())`, `shopOneTimeCost()`.
