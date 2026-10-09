# Économie et ressources

## Rôle
Tout ce que le joueur construit se paie en ressources. La production tourne hors ligne (rattrapée à la connexion par `flushState`).

## Règles et chiffres
| Élément | Valeur |
|:--|:--|
| Ressources communes | Ferraille, Énergie instable, Nanocomposants, Données anciennes |
| Ressources rares | Acier renforcé, Module cybernétique, Nanites synthétiques, Fragment d'IA |
| Production d'un extracteur | niv. 1 : 2/s, niv. 10 : 500/s, niv. 20 : 4 657/s (≈ 16,8 M/h) |
| Rares | bâtiments de fin de partie (1 à 10/s), gisements de colonie (0,1 à 3/s), missions, expéditions, pirates, primes, contrats |
| Entrepôt | capacité = 2 M × 1,6^niveau par ressource commune. À l'abri du pillage : 10 % de la capacité (+ technologies, Bastion, au plus 75 %) et, **à partir du 13 octobre 2026 (5.32)**, au plus 8 h de production de la ressource, avec un plancher de 500 k (réglages : Règles → Économie). **Paliers (6.14.143)** : ressource prioritaire au 5 (+4 h : 12 h), entrepôt orbital au 20 (+4 h pour les 4 ressources : 12 h, 16 h pour la prioritaire), toujours sous la règle de capacité ; tampon au 10 (2 h de production en trop gardées hors pillage, versées dès que la place se libère, aussi au rattrapage hors ligne et dans les compteurs du client) ; Négoce au 15 (taxe du comptoir 5 → 3 %) ou Convoi (soute +10 %, circuit d'effets) ; réglages : Règles → « Bâtiments : paliers » |
| Entretien de flotte | énergie : 0,015/s par place d'attaque, 0,0075/s par place de défense ; panne d'énergie = autres productions × 0,5 |
| Rattrapage | jusqu'à **+50 %** de production sous **20 %** de la médiane des actifs (6.14.106, AE-15 ; +25 % sous 10 % avant), dégressif, nul à partir de 50 % ; hors couche empire (I14 intact), validé à +100 % au plus ; migration `rules-6.14.106` des règles restées aux anciens défauts |
| Échange (comptoir) | taxe 5 % au pot commun ; 1 rare pour 100 communes, **1 pour 250** dès la bascule du rythme (1er novembre 2026, `rhythm.exchangeCommonToRare`, 6.14.88) |
| Missions (gains indexés) | 1,5 × durée × production (référence des rares 150 000), **0,75** et **400 000** dès la bascule du rythme ; 6.14.167 (I51) : missions du premier jour ouvertes avec les unités de la prise en main : Patrouille du périmètre (10 min, 10 roquettes), Collecte d'énergie (15 min, 6 drones), Forage profond (30 min, 8 drones) |
| Second palier des bâtiments (niveaux 11 à 20) | coûts ×4 dès la bascule du rythme (AE-L2, `rhythm.tier2CostFactor`) ; durées 36 h + 27 h par niveau pour les 8 bâtiments de l'Ascension (6.14.89) |
| Vacances | production × 0,25, 2 à 21 jours, 5 jours entre deux ; 6.14.112 (AC-F, I36) : rien qui rapporte ou dépense, une seule liste blanche pour l'action et les routes (`vacation.allowed` : les 8 gestes d'avant), lecture permise |

## Code et admin
`economy.ts`, `resources.ts`, `catchup.ts`, `flush.ts`, `vacation.ts`. Admin : Règles → Économie, Rattrapage ; Contenu → Bâtiments.

## Invariants
I6 (butin et livraisons arrivent même entrepôt plein ; le stock au-delà de la capacité est gardé, la production s'arrête) : testé depuis la
6.14.61 (`fleets.test.ts`, « I6 : entrepôt plein » : retour d'attaque, rapatriement, livraison rappelée, colonie, contrat). Les récompenses
suivent la même règle et, depuis 6.14.155, le disent au joueur (`storageOverflow.test.ts`).

## État (audit 2026-10-06)
- Entrepôt trop généreux (audit E1, confirmé en production : 115 h de production à l'abri contre 57 h de stock médian). Correctif 5.32 : 8 h à l'abri au plus, carte « Ce que tu risques » sur la page Ressources. Reste à voir (option B) : la soute de l'attaquant borne encore le butin (1,9 M par attaque en moyenne).
- Beaucoup de monnaies secondaires (voir `commerce-monnaies.md`).

## Revue AU11 (2026-10-07)
Recherches en parallèle réglables (`research.maxConcurrent`, 6.9.7).

## Revue AU27 (2026-10-07), lots AE-L0 et AE-L1
- Production perdue (entrepôt plein), mesurée par le simulateur de progression (`progressionSim.ts`, I29) : à J90, 70 % (actif), 60 %
  (moyen), 41 % (occasionnel), 55 % (quotidien), cible < 20 %. Cause : fin de partie atteinte en deux semaines (AE-1), rien à acheter
  ensuite (AE-5). Suite : projets de prestige (6.14.85), puis bascule du rythme au 1er novembre 2026 (6.14.88, AE-L2 compris : second
  palier ×4 et en jours, comptoir à 1 rare pour 250, missions à 0,75 × la durée) ; mesure sur 365 jours après la bascule : production
  perdue 2 / 1 / 10 / 9 % (actif, moyen, occasionnel, quotidien), contre 74 / 58 / 64 / 75 % avant.
- Coffre du 7e jour : 2 M à 12 M par ressource commune (6.14.72) ; l'ancien coffre (650 M) dépassait l'entrepôt d'un joueur de la première
  semaine et arrêtait sa production (I6). Proposition : `docs/proposals/equilibrage-au27.md`.

## 6.14.110 (revue AU27, lot AC-D) : un seul chemin de dépense
Toute dépense de ressources de la planète mère passe par `spendResources` (`spending.ts`) : vérification, débit, statistique `spent` et
objectif du jour « Dépenser ». La fondation d'une colonie, la lune, les capsules, les traités, la localisation d'un repaire, la file
planifiée et la vendetta y passent désormais (avant : débit à la main, dépense non comptée). Les transferts (marché, cargaison, dépôt,
mise, comptoir, butin, tribut, stock de colonie) restent à part, listés dans la garde `spending.test.ts` (invariant I34).

## 6.14.143 (PB-L2, `docs/proposals/paliers-batiments.md`) : paliers de l'entrepôt
- Tampon (palier 10) : `advanceEconomy` (economy.ts), même calcul au serveur (`flushState`, rattrapage hors ligne) et au client
  (`useLiveResources`, jauge « Tampon : 1 h 40 en attente » de la page Ressources). Le tampon n'est pas pillable et n'est pas compté
  comme production perdue (santé de l'équilibre) ; champ joueur `storageBuffer`. Un tampon gardé sans le palier (Ascension) se verse
  encore mais ne se remplit plus ; un réglage à 0 h ne le détruit pas (I46).
- Simulateur (`progressionSim.ts`, option `storageTiers`, préréglage `sans-paliers` de `progression-sim.mjs`) : production perdue
  7,2 / 2,7 / 13,6 / 14,1 % → 7 / 2,5 / 12,6 / 13,9 % (actif, moyen, occasionnel, quotidien, 365 jours après la bascule) ; aucune borne
  d'I29 ne bouge (pire mois de sessions bloquées de l'occasionnel 5 → 10 %, sous la borne de 15 %).

## 6.14.155 (R8, AE-L8, constat AE-14) : gains au-delà de l'entrepôt dits au joueur
- Règle inchangée (I6) : une récompense (série et coffre du 7e jour, mission, objectif du jour, passe, Chroniques, Codex, défi…) est
  versée en entier, même au-dessus de la capacité ; rien n'est perdu, la production de la ressource s'arrête tant que le stock dépasse.
  Le coffre se tire déjà dans la place libre (6.14.106), mais son plancher et la récompense du jour s'y ajoutent.
- La ligne du Journal (réclamation, `claimNote` d'`actions.ts` ; mission terminée, `flush.ts`) ajoute « Au-delà de l'entrepôt : … »
  quand une part du gain dépasse la capacité : min(gain, stock après − capacité), ressources communes seules (les rares n'ont pas de
  plafond) ; montant dans `data.overflow` (pastilles ember de la carte de notification).
- Carte « Ce que tu risques » (page Ressources) : « au-delà de l'entrepôt X (production arrêtée) » par ressource, et un rappel.
- Réglages : Admin → Règles → Tous les réglages, groupe « Entrepôt : gains versés au-delà » (`storageOverflow` : `enabled`,
  `minAmount` 1 000 par ressource, `journalText` avec `{list}`, `cardText`). Code : `storageOverflow.ts`.

## 6.14.163 (lot S3, NJ-4 et NJ-5) : récompenses du départ et goulot de ferraille
- Les quatre extracteurs produisent autant, mais les coûts du départ sont surtout en ferraille (extracteurs 2,3 : 1 face à l'énergie,
  entrepôt 2 : 1, unités 2 à 2,5 : 1 ; recherches du début : 50 à 300 de nano ou de données pour 300 à 800 de ferraille). Sur la première
  heure : ≈ 60 000 de ferraille, 30 000 d'énergie, moins de 1 000 de nano et de données. Le nano et les données servent plus tard
  (Atelier, Cale sèche, recherches de milieu de partie).
- La prime du raid d'initiation (4 h de chaque ressource, égale sur les quatre) faisait presque tout le surplus de nano et de données
  du parcours joué (450 000 à 40 min). Elle suit désormais les coûts : 30 min de ferraille, 15 d'énergie, 5 de nano et de données
  (`startRewards`, invariant I50). Le Carnet est plafonné à 60 min de production par ressource commune.
- Reste (lot RR-2, Q410) : livré en 6.14.165, voir ci-dessous.

## 6.14.165 (lot S6, RR-2, NJ-26) : surplus de nanocomposants et de données
- Le comptoir acceptait déjà l'échange commune ↔ commune (et rare ↔ rare) à 1 pour 1 avant la taxe, mais la page disait le contraire.
  Taux désormais réglables et affichés : `exchange.commonToCommon`, `exchange.rareToRare` (0 ferme l'échange, refusé au serveur).
- Conseil « Échange ton surplus » dans « Que faire maintenant ? » (règle de 6.14.166, S8, NJ-32) : chaque commune est comparée à son
  **besoin**, le plus gros coût parmi le niveau suivant de chaque bâtiment de production débloqué (après le chantier en cours), la file
  planifiée et l'objectif de prise en main en cours (`surplusNeeds`, `nextActions.ts`). Il faut une commune sous son besoin et une autre
  à ≥ `surplusAdviceRatio` (2) fois son besoin et ≥ `surplusAdviceMin` (20 000) au-dessus ; la quantité comble juste le manque (taxe
  comprise) sans passer la vendue sous son besoin ; jamais l'inverse d'un échange commune → commune fait il y a moins de
  `surplusReverseMinutes` (60) min (gardé dans `exchangeWeek.last`). Entrepôt non plein, `surplusAdviceDays` (3) premiers jours ;
  comptoir prérempli (`?vendre=…&recevoir=…&quantite=…`). Avant (6.14.165) : stocks comparés entre eux, d'où un aller-retour taxé
  (ferraille → nano à la 32e minute, nano → ferraille à la 42e).
- Comptoir (6.14.166) : la taxe s'affiche en pourcentage (« taxe 5 % : 5 ») ; la quantité proposée donne un brut d'au moins 100
  (dans la limite du stock), pour que la taxe arrondie au-dessus reste à un point du taux (avant : « brut 2 · taxe 1 »).
- Limité aux premiers jours : échanger tout le surplus toute la partie avance la 1re Ascension du profil moyen hors d'I29 (J14,8).
  Simulateur : `--surplus` (`docs/proposals/recompenses-du-depart.md` §10).
- Récompenses en heures d'un compte de moins de 24 h plafonnées à 60 min, reste en réserve du départ : voir `progression.md`.
