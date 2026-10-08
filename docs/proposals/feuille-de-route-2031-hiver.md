# Proposition : feuille de route d'hiver 2031 (nouveautés, références Clash of Clans, OGame et jeux mobiles)

Statut : **en cours** (2026-10-08, ouverte par la revue AU28 qui clôt la feuille d'automne 2030 :
`docs/changes/6.14.148-revue-au28.md`, rapport `docs/audit/2026-10-08-au28-revue.md`). Les 18 lots H31-* ont été validés sur
`/decisions` le 2026-10-07 (Q241 à Q258) ; les lots L reçoivent d'abord leur proposition détaillée (`docs/proposals/<système>.md`,
plan de `docs/WORKFLOW.md` §2) avant tout code. En tête (§0) : les lots nouveaux de la revue AU28 et les lots reportés de l'automne,
dont ceux qui attendent des mesures (après la bascule du rythme du 1er novembre 2026 ou après la mise en production). Chaque lot se
valide, se modifie ou s'ajoute dans l'onglet « Feuille de route » de `/decisions`.

## 0. Lots de la revue AU28 et lots reportés de l'automne 2030

Règle de `WORKFLOW.md` §5 : un constat « faisable seul » ne reste pas ouvert plus d'une feuille de route ; ceux de l'automne passent donc
avant les nouveautés (lots R1 à R9). Les lots qui attendent une mesure (R10 à R13) et les illustrations (R14) restent visibles ici et se font à leur date.

| # | Lot | Contenu | Taille | État |
|:--|:--|:--|:--|:--|
| R1 | AP-L13 | Hygiène des générateurs : `month.pass` plus généré dès novembre 2026, mois de plus de 12 mois archivés, rotation des boss par identifiant, `contracts.seededRandom` renommé, reste du budget du passe réparti, chapitre, succès et passe dans trois transactions, bibliothèque (saison, rebudget, titres comptés) ; constats AP-12, AP-13, AP-15, AP-16 | S | livré (6.14.149) |
| R2 | AP-L15 | Rythme du plus actif au passe (AP-11 : dernier palier au jour 10 sur le profil réel, 13 sur le profil typique, 24 mois sur 24 avant la cible du jour 15) : paliers de prestige cosmétiques après le 30, sans budget ; proposition `rythme-du-passe.md` | M | livré (6.14.150) |
| R3 | IT-L1 | Fiabilité de l'intégration (constat RV-6) : une écriture de section de contenu coûte 0,7 à 2,2 s (garde serveur) ; délai explicite pour chaque test qui écrit plus de 3 sections, mesure de durée par test dans `itest-local.sh`, rattrapage avant toute mesure d'écart d'XP ou de ressources ; trouver le test qui supprime en route l'enregistrement des règles rapides de la suite (404 en fin de suite) ; 14 routes du joueur sans intégration (reste d'AC-22) | S | livré (6.14.151) |
| R4 | É30-5b | Performance (constat RV-7) : LCP mobile au-dessus de 4 s sur Galaxie (7,7 s), Commerce (8,1 s) et Alliance (9,7 s) sur la pré-prod, élément peint au rendu de la page (≈ 8 s) : page affichée avant la fin de la synchronisation de l'état, menu rendu en une fois (question 2 de 6.14.116) | M | en partie (6.14.152) : données du démarrage et code de la page demandés par `index.html`, menu en une fois, fenêtres rares différées ; en local, prêt mobile Galaxie 6,0 → 5,4 s, CLS bureau 0,03 → 0,01 ; reste : mesure de la pré-prod après le push, puis, si le LCP mobile dépasse encore 4 s, découpage du bloc d'entrée (taille L, question 4 de la fiche) |
| R4b | É30-5c | Découpage du bloc d'entrée (381 Ko compressés, moteur `src/game` chargé par `applyGameContent`) : le LCP mobile reste à 5,7 à 8,6 s sur Galaxie, Commerce et Alliance après 6.14.152 (prêt −2,3 à −3,2 s) ; cible sous 4 s (Q379) | L | à faire |
| R5 | AJ27-11 | Ménage du moteur : exports morts (15 relevés en AU27) ; le retrait des missions du jour attend Z0 + 30 jours | S | livré (6.14.153) pour les exports : 21 retirés, 164 rendus non exportés, outil `scripts/dead-exports.mjs` et garde `deadExports.test.ts` ; reste : missions du jour, 30 jours après Z0 |
| R6 | AA-L10 | Reste de l'évolutivité AU27 : surcharge du temps de recherche par techno (AA-12), défis d'alliance, réserve des missions du jour et archétypes des Chroniques en sections (reste d'AA-23), origine d'un seigneur (reste d'AA-20), exclusion des statistiques d'équilibre réglable (AA-31), aperçu avant / après d'un coût ou d'une durée (AA-28) | M | livré (6.14.154, [fiche](../changes/6.14.154-admin-evolutif-suite.md)) |
| R7 | UX-13 | Restes de l'hygiène du design (UX-10) : arrondis, emoji et dates de l'admin ; exceptions de l'accueil public, du cockpit et des Succès retirées de `designSystem.test.ts` | S | à faire |
| R8 | AE-L8 | Gains versés au-delà de l'entrepôt dits au joueur (AE-14) : coffre, missions et série au-dessus de la capacité, ligne « au-delà de l'entrepôt » dans la notification et la carte « Ce que tu risques » | S | livré (6.14.155, [fiche](../changes/6.14.155-au-dela-entrepot.md)) |
| R9 | UX-12 | Chargement de Commerce et d'Alliance (AD-30) : mesuré par la revue AU28 (LCP mobile 8,1 et 9,7 s, même cause que la Galaxie) ; correction avec R4, puis nouvelle mesure | S | en partie (6.14.152), avec R4 : en local, prêt mobile Commerce 5,7 → 5,7 s, Alliance 5,5 → 5,6 s (gain attendu sur la pré-prod, où la fiche du joueur arrivait à 7,6 s) ; reste : nouvelle mesure sur la pré-prod après le push |
| R10 | RL-4 | Mesures après la bascule du rythme : sessions bloquées, production perdue, jour des Ascensions (`progression-sim.mjs` comparé à la santé de l'équilibre) | S | après le 1er novembre 2026 |
| R11 | RL-5 | Réglage fin après 8 semaines ; échelle des rangs au-delà de J90 (le réglage d'avant bascule est fait, 6.14.89) | S | après RL-4 et 8 semaines |
| R12 | AE-L7 | Boss (`hpFactor`), Ambre des primes, seuils des succès, d'après 8 semaines de santé de l'équilibre en production (AE-10, AE-11, AE-12) | S | après la mise en production (Z0) |
| R13 | AC-I | Battement de présence à 60 s et `sync` sans écriture inutile (AC-17), après la mesure Z6 | M | après Z6 |
| R14 | É30-3 | Illustrations au fil des envois sur `/img` (89 emplacements attendus le 2026-10-08 : 33 portraits, 24 thèmes d'année, 21 icônes de palier, 7 seconds boss, 3 talents, 1 module) | selon envois | en continu |

## 1. Pourquoi ces lots

Ce que disent les mesures (copie de la production, Z1, `docs/proposals/prochain-systeme.md`) et les audits AU27 et AU28 :

| Constat | Mesure | Ce qu'il manque au joueur |
|:--|:--|:--|
| Le défenseur subit | l'attaquant gagne **74 %** des combats JcJ ; **86 %** des joueurs ont du stock pillable | une défense qui se joue, une réponse après une attaque |
| Le commerce et l'entraide dorment | **1,1** échange par joueur et par semaine ; pot commun alimenté à 96 % par l'admin | des raisons d'aider les autres membres de son alliance |
| L'exploration ne retient pas | 46 expéditions en 30 jours, dont **1** profonde (2 %) | un but partagé, une carte à conquérir |
| Le jeu se joue sur des mois (rythme de 6.14.88) | 1re Ascension vers J91 à J133 | des rendez-vous qui reviennent, des choses à faire entre deux chantiers longs |
| Rien ne rappelle le joueur hors du jeu | aucune notification hors de l'onglet ouvert | savoir qu'il est attaqué ou que son chantier est fini |

Ce qui existe déjà (inventaire du 2026-10-07) et n'est donc **pas** proposé : guerres d'alliance avec préparation (`wars.ts`), Jeux de
clan (saga, défi et objectifs du jour d'alliance), passe de saison, lunes, phalange, débris, expéditions, simulateur, classes,
boucliers, succès, Codex, casino, enchères, marché, reliques, officiers, modules, talents, Ascension, prestige.

## 2. Règles que chaque lot respecte

Toutes les instructions de `CLAUDE.md` s'appliquent ; en particulier :
- **Tout réglable dans l'admin** (règle n° 2) : chaque chiffre ci-dessous est une valeur par défaut d'un objet de règles déclaré dans
  le registre, avec ses libellés, bornes et aides (format de 6.14.95).
- **Contenu complet** (règle n° 4) : chaque lot coche la chaîne de contenu (succès d'entrée et de maîtrise, Codex, effets et porteurs :
  reliques, plans, officiers ; défis, missions, primes ; Formules, Ctrl+K, Journal ; illustration et prompt sur `/img` ; changelog,
  billet ; essai sur la pré-prod).
- **Jamais payant pour gagner** : pas de VIP, aucun avantage vendu ; l'Ambre se gagne en jouant.
- **Prudence pour les données des joueurs** : rien n'est retiré à un joueur sans règle claire ; une fonction qui peut faire perdre (lune,
  missiles) part avec la variante la plus douce.
- **Arrivée progressive** (DP, invariant I30) : chaque nouveauté se débloque avec la progression, pas dès le premier jour.
- **Rythme long terme** (I29) : aucune nouveauté ne raccourcit la 1re Ascension de plus de 5 jours (simulateur à 365 jours).
- **Serveur qui fait autorité**, mobile à 375 px, textes en français et au tutoiement.

## 3. Les lots proposés

Taille : S (un lot court), M (quelques lots), L (une proposition détaillée d'abord). Priorité : ★★★ recommandé en premier.

### A. Alliance et entraide (référence Clash of Clans, Lords Mobile, Rise of Kingdoms)

**H31-1 · Aide d'alliance** ★★★ — S — Q241
*Référence* : bouton « Aide » de Lords Mobile et Rise of Kingdoms. *Problème* : les chantiers durent des jours depuis le rythme sur des
mois, et rien ne pousse à aider ses alliés.
*Proposition* : sur un chantier ou une recherche en cours, un membre clique « Aider » : −1 % du temps restant (au moins 3 min) ; 10 aides
au plus par chantier ; 30 aides données par jour et par joueur. Celui qui aide gagne des points d'alliance et de l'XP d'officier (montants
à régler dans l'admin) ; celui qui reçoit voit « 7 aides reçues » dans son Journal. Une case « Aider tout » sur la page Alliance.
*Base existante* : `buildPlan.ts`, file des recherches, `pendingClaims`. *Risque* : faible ; la réduction totale est plafonnée (10 %).

**H31-2 · Demande de renforts** ★★ — S — Q242
*Référence* : demande de troupes de Clash of Clans. *Problème* : les garnisons d'alliance existent, mais personne ne sait qui en a besoin.
*Proposition* : un joueur publie « J'ai besoin de renforts » (une demande toutes les 8 h) ; ses alliés voient la demande dans le salon
d'alliance et envoient une garnison en un clic. Pas de don d'unités : les vaisseaux restent à leur propriétaire (invariant I1).
*Base* : garnisons de `alliances.ts`, `globalChat.ts`. *Risque* : faible.

**H31-3 · Ligue des alliances** ★★ — M — Q243
*Référence* : ligue de guerre de clans (CWL). *Problème* : les guerres de saison donnent un classement, pas de rendez-vous mensuel.
*Proposition* : chaque mois, groupes de 8 alliances de niveau proche ; 7 manches d'un jour (un adversaire par jour, 1 attaque par
membre inscrit) ; médailles de ligue échangées dans une boutique de ligue (reliques, plans de modules, capsules). Montée et descente
entre ligues Bronze → Mythique.
*Base* : `wars.ts`, `seasonWars.ts`, `leagues.ts`. *Risque* : moyen (calendrier, invariant I16).

**H31-4 · Opérations d'alliance (raids du week-end)** ★★★ — L — Q244
*Référence* : opérations de Boom Beach, raids de la capitale de clan. *Problème* : l'exploration et le PvE à plusieurs manquent
(2 % d'expéditions profondes).
*Proposition* : du vendredi au dimanche, une base pirate générée (5 à 9 avant-postes, chacun avec ses défenses) que l'alliance attaque
ensemble ; chaque avant-poste détruit ouvre le suivant ; récompense selon le nombre d'avant-postes tombés. Générée chaque semaine
(graine), donc renouvelée sans travail manuel.
*Base* : `allianceBoss.ts`, `coalition.ts`, générateurs à graine. *Risque* : moyen (équilibrage, calendrier). Remplace la piste C de
`prochain-systeme.md` (expéditions profondes à plusieurs).

**H31-5 · Annuaire des alliances** ★ — S — Q245
*Référence* : recherche de clan. *Proposition* : liste filtrable (langue, taille, niveau, recrutement ouvert, activité de la semaine),
avec bouton « Postuler ». *Base* : `allianceProfile.ts`. *Risque* : faible.

**H31-6 · Comptoir d'alliance** ★ — M — Q246
*Référence* : échanges internes de clan ; piste B de `prochain-systeme.md`. *Proposition* : un marché réservé aux membres, sans taxe,
avec des commandes (« je cherche 2 M de Ferraille ») que les autres remplissent. *Risque* : faible ; plafonds pour éviter le transfert
d'un compte à l'autre.

### B. Défense et combat (référence OGame, Clash of Clans)

**H31-7 · Revanche** ★★★ — S — Q247
*Référence* : revanche de Clash of Clans. *Problème* : l'attaquant gagne 74 % des combats, et la victime n'a aucune réponse.
*Proposition* : après une attaque subie, un bouton « Revanche » dans le rapport pendant 24 h : une attaque contre l'agresseur, qui ignore
l'écart d'XP et le délai entre attaques (pas son bouclier). Butin +20 % sur cette attaque.
*Base* : `pvp.ts`. *Risque* : faible.

**H31-8 · Rediffusion du combat** ★★ — M — Q248
*Référence* : rediffusions de Clash of Clans. *Proposition* : le rapport de combat se rejoue en tours animés (vaisseaux, tirs, pertes),
partageable comme aujourd'hui. *Base* : combat en tours de `combat.ts`, `CombatLogPage`. *Risque* : faible (interface seulement),
attention au poids sur mobile.

**H31-9 · Plans de défense enregistrés** ★ — S — Q249
*Référence* : plans de base de Clash of Clans. *Proposition* : 3 préréglages de posture et de formation par planète, changés en un clic
(par exemple « nuit », « guerre »). *Base* : `formations.ts`, préréglages de `modules.ts`. *Risque* : faible.

**H31-10 · Missiles interplanétaires et anti-missiles** ★ — L — Q250
*Référence* : OGame. *Problème* : la défense planétaire ne peut que subir. *Proposition* : un Silo à missiles (bâtiment) ; missiles
anti-missiles qui arrêtent les tirs ; missiles interplanétaires qui détruisent des **défenses** seulement (jamais des vaisseaux ni des
ressources), portée en systèmes. Variante douce recommandée : les défenses détruites sont réparées à 70 % par l'Atelier.
*Risque* : élevé pour l'équilibre ; proposition chiffrée et simulation obligatoires avant le code.

**H31-11 · Porte de saut de lune à lune** ★ — S — Q251
*Référence* : OGame. *Proposition* : la porte de saut envoie aussi une flotte vers une autre lune du joueur (ses colonies), pas seulement
vers la planète mère. *Base* : `jumpGate.ts`. *Risque* : faible.

**H31-12 · Destruction de lune (variante douce)** — M — Q252
*Référence* : Étoile noire d'OGame. *Proposition prudente* : l'Étoile noire peut **mettre une lune hors service 48 h** (phalange et porte
coupées), avec un risque de perdre l'Étoile noire ; la lune n'est jamais détruite. *Risque* : moyen ; recommandé **après** la mise en
production et 8 semaines de mesures des lunes (Q18).

### C. Progression et économie (référence Clash of Clans, OGame)

**H31-13 · Apprenti constructeur** ★★★ — S — Q253
*Référence* : apprenti constructeur et potion de constructeur de Clash of Clans. *Problème* : avec des chantiers de 36 h et plus, le
joueur attend. *Proposition* : un objet « Apprenti » (+1 chantier pendant 24 h, ou −1 h par heure sur un chantier choisi), gagné au
passe, au coffre du 7e jour et en ligue ; jamais vendu contre de l'argent. *Base* : `buildPlan.ts`, circuit d'effets (nouvelle stat lue
par l'empire, invariant I9). *Risque* : faible si le gain reste sous le plafond de rythme (simulateur).

**H31-14 · Marchand ambulant** ★★ — S — Q254
*Référence* : marchand de Clash of Clans et d'OGame. *Proposition* : toutes les 8 h, 3 offres tirées au sort (ressources rares,
capsules, plans de modules) contre des ressources ou de l'Ambre gagnée ; un tirage par joueur, graine du jour. *Base* : `weeklyStock.ts`,
Comptoir. *Risque* : faible.

**H31-15 · Position des planètes** ★ — M — Q255
*Référence* : OGame (taille et température selon la position). *Proposition* : à la fondation d'une **nouvelle** colonie, sa position
dans le système donne un bonus (proche de l'étoile : +énergie ; loin : +ressource froide) et un nombre de cases. Les colonies déjà
fondées gardent leurs valeurs. *Base* : `galaxy.ts`, `planetLook.ts`, biomes de `colonies.ts`. *Risque* : moyen (équilibre des colonies).

**H31-16 · Équipement des officiers** ★★ — L — Q256
*Référence* : équipement des héros de Clash of Clans. *Proposition* : chaque officier a 2 emplacements d'équipement ; des pièces (gagnées
en opérations, ligue, primes) donnent des effets composés ; elles montent de niveau avec des fragments. *Base* : `commanders.ts`,
effets composés, plafonds de `effectCaps`. *Risque* : moyen (empilement des bonus, `derived.test.ts`).

### D. Confort et rappel (référence jeux mobiles)

**H31-17 · Notifications hors du jeu** ★★★ — M — Q257
*Référence* : tous les jeux mobiles. *Problème* : rien ne prévient le joueur quand l'onglet est fermé. *Proposition* : application
installable (PWA) et notifications web, chacune activable dans les Options : attaque en approche, chantier ou recherche fini, flotte
rentrée, boss d'alliance, fin de passe. Aucune notification la nuit (heures réglables), pas plus de 6 par jour.
*Risque* : faible ; demande la mise en production pour un effet réel (service worker sur le domaine du jeu).

**H31-18 · Semaine éclair** ★ — S — Q258
*Référence* : univers rapides d'OGame, événements de Clash of Clans. *Proposition* : un mutateur ponctuel (une semaine par saison au
plus) : chantiers et recherches ×2 plus rapides jusqu'au niveau 10, annoncé 7 jours avant dans l'agenda. *Base* : `mutators.ts`,
calendrier. *Risque* : faible si limité aux bas niveaux (n'avance pas la 1re Ascension de plus de 5 jours).

## 4. Ordre recommandé

| # | Lot | Contenu | Taille | État |
|:--|:--|:--|:--|:--|
| 1 | H31-1 | Aide d'alliance | S | validé (Q241) |
| 2 | H31-7 | Revanche | S | validé (Q247) |
| 3 | H31-13 | Apprenti constructeur | S | validé (Q253) |
| 4 | H31-17 | Notifications hors du jeu (PWA) | M | validé (Q257) |
| 5 | H31-4 | Opérations d'alliance du week-end | L | validé (Q244) |
| 6 | H31-2 | Demande de renforts | S | validé (Q242) |
| 7 | H31-14 | Marchand ambulant | S | validé (Q254) |
| 8 | H31-8 | Rediffusion du combat | M | validé (Q248) |
| 9 | H31-3 | Ligue des alliances | M | validé (Q243) |
| 10 | H31-16 | Équipement des officiers | L | validé (Q256) |
| 11 | H31-5 | Annuaire des alliances | S | validé (Q245) |
| 12 | H31-9 | Plans de défense enregistrés | S | validé (Q249) |
| 13 | H31-11 | Porte de saut de lune à lune | S | validé (Q251) |
| 14 | H31-6 | Comptoir d'alliance | M | validé (Q246) |
| 15 | H31-15 | Position des planètes | M | validé (Q255) |
| 16 | H31-18 | Semaine éclair | S | validé (Q258) |
| 17 | H31-10 | Missiles interplanétaires et anti-missiles | L | validé (Q250) |
| 18 | H31-12 | Lune hors service (variante douce) | M | validé (Q252), après mesures en production |

Logique : d'abord ce qui répond aux mesures (entraide, défense, attente des chantiers, rappel hors du jeu), en petits lots ; puis les
grands systèmes partagés (opérations, ligue) ; enfin ce qui touche l'équilibre du combat, après une proposition chiffrée et des mesures.

## 5. Ce que je te demande

Sur `/decisions`, pour chaque question Q241 à Q258 :
- **valide** : le lot entre dans la prochaine feuille de route, à sa place ;
- **changer** avec une note : je réécris le lot (chiffres, variante, ordre) ;
- une note seule (« détails ? ») : j'écris la proposition détaillée du lot (benchmark, options chiffrées, effets sur les joueurs) et je te
  la soumets avant de coder.

Tu peux aussi ajouter une idée à toi dans l'onglet « Feuille de route » (bouton d'ajout) : elle sera chiffrée de la même façon.
