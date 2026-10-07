# Proposition : feuille de route, hiver 2026-2027 (lots K à S)

Statut : **en cours** sur la branche `claude/hiver-k-s` (2026-10-06 : « on code on build, on ajustera sur le long terme »). Lot K livré en 6.0.1 (`docs/changes/6.0.1-sante-equilibre.md`), lot L en 6.1.0 (`docs/changes/6.1.0-lisibilite-suite.md`), lot M en 6.2.0 (`docs/changes/6.2.0-pillage.md`), lot N (fusion) en 6.2.1 (`docs/changes/6.2.1-quotidien-fusion.md`, lissage Q4 à décider), lot O en 6.3.0 (`docs/changes/6.3.0-relancer.md`, emplacements à débloquer selon les relevés), lot R en 6.3.1 (`docs/changes/6.3.1-categories-unites.md`), lot S en 6.3.2 (`docs/changes/6.3.2-bundle-ui.md`, en partie), lot Q en 6.4.0 (`docs/changes/6.4.0-colonies-suite.md`). Lot P décalé en 6.5.0 : prompts (`docs/prompts-6.5.md`) et proposition (`unites-classe.md`) prêts, code après les illustrations. Décisions déjà prises : classes à 100 Ambre (validé) ; classe affichée sur la fiche publique et dans le classement (fait, part de L) ; fusion contrats et missions du jour (validée, chiffrée dans `quotidien-fusion.md`).
Elle prend la suite de `docs/proposals/feuille-de-route-2026-q4.md` (lots A à J, tous livrés sauf J.2).

Sources :
- les suites notées dans les fiches `docs/changes/5.28.1` à `6.0.0` ;
- les constats encore ouverts de `docs/audit/2026-10-06-audit-global.md` : C4, E1 (option B), E2, Q1 (fusion), Q3 (production et combat),
  Q4 (lissage), P1 ;
- les questions ouvertes des propositions livrées (`alliances-grandes`, `flottes-emplacements`, `routes-logistiques`, `classes-empire`).

Objectif de l'utilisateur, inchangé :
> « améliorer ce jeu, le développer, le rendre performant avec une bonne QoL, que les gens prennent du plaisir »

## 1. Où on en est

| Lot | Version | Livré |
|:--|:--|:--|
| A | 5.28.1 | correctifs de cohérence |
| B | 5.29.0 | performance |
| C | 5.30.0 | Ordres du jour |
| D | 5.31.0 | Portefeuille, glossaire, durées expliquées |
| E + F | 5.32.0 | abri ≤ 8 h de production (dès le 13/10), 6 chantiers |
| G, H, I | 5.33.0 | alliances 20, emplacements de flotte + « Relancer », routes logistiques |
| J.1 | 6.0.0 | classes d'empire |

Toutes ces versions sont sur la PR fs0ciety7000/ogame-like#144, **pas encore fusionnée** : rien n'est encore en production.

## 2. Principes de priorisation

1. **Mesurer avant d'équilibrer.** Quatre changements d'équilibre arrivent en même temps (abri, chantiers, emplacements, classes). On les
   regarde vivre avant d'en empiler d'autres.
2. **Rendre les mesures autonomes.** Aujourd'hui, chaque relevé demande un accès super-utilisateur à la production. Un tableau dans l'admin
   évite de partager des identifiants.
3. Ensuite, ce qui se ressent à chaque session (QoL, lisibilité), puis l'équilibre, puis le contenu.
4. Inchangés : un lot = une fiche `docs/changes/` ; équilibre ou nouveau système = proposition d'abord ; rien ne retire du progrès sans
   annonce (règle 3 du GDD).

## 3. Les lots

| Lot | Version | Thème | Contenu | Origine | Taille | Proposition avant ? |
|:--|:--|:--|:--|:--|:--|:--|
| **K** | 6.0.1 | Tableau de bord d'équilibre | dans Admin → Équilibrage, les relevés faits à la main jusqu'ici, avec historique quotidien :<br>– part pillable médiane, butin moyen par attaque, combats JcJ par jour ;<br>– taux de sauvetage effectif (moyenne, max) ;<br>– chantiers et flottes en parallèle (médiane, max) ;<br>– taille des alliances ;<br>– colonies avec route, convois par jour ;<br>– répartition des classes, production et butin moyens par classe | suites E, F, G, H, I, J ; principe 2 | M | non (outil admin, aucun effet joueur) |
| **L** | 6.1.0 | Lisibilité, suite | « d'où vient ce chiffre » sur la production (par ressource) et sur la puissance de combat (attaque, défense, PV) ; classe affichée sur la fiche publique et dans le classement | Q3 ; question J | M | oui, courte (où afficher quoi) |
| **M** | 6.2.0 | Le JcJ qui rapporte | simulation de 100 raids sur les profils réels (moteur `resolveCombat` + butin) ; puis butin borné par le stock exposé plutôt que par la soute seule (option B de E), et décision sur l'attrition de fin de partie (plafond de sauvetage 95 % → 80–85 % ?) | E1 option B ; E2 | M | **oui**, avec la simulation et les chiffres de K |
| **N** | 6.2.x | Quotidien, suite | fusionner contrats du jour et missions du jour (une seule liste de 4 à 5 tâches) ; étaler les rendez-vous du week-end (boss mondial, guerre de territoire, tournoi du casino, élite) sur la semaine | Q1 ; Q4 | M | **oui** (touche les récompenses quotidiennes) |
| **O** | 6.3.0 | Flottes, suite | « Relancer » pour les primes, les boss et les transports ; « relancer à l'identique » depuis un rapport ; emplacements à débloquer (technologie ou bâtiment) **seulement si** K montre que la limite de 10 ne crée pas de choix | suites H | M | oui, si emplacements à débloquer ; non pour « Relancer » |
| **P** | 6.4.0 | Unités de classe (J.2) | un vaisseau par classe :<br>– récolteur (Industriel) ;<br>– croiseur de raid (Seigneur de guerre) ;<br>– éclaireur longue portée (Explorateur).<br>Prompts Midjourney, puis illustrations fournies, puis statistiques simulées | J.2 | L | **oui** (stats, coût, déblocage) |
| **Q** | 6.5.0 | Colonies, suite | route inverse (planète mère → colonie) ; file de défense coloniale (plusieurs lots en attente) ; plus tard, flotte basée sur une colonie | I.2 | L | **oui** |
| **R** | 6.x | Unités : catégories | Bastion classé en attaque malgré un profil défensif ; Intercepteur en défense malgré sa mobilité : trancher, puis migrer le contenu et les effets ciblés (`cat:attack`, `cat:defense`) | C4 | S | **oui** (touche des bonus ciblés) |
| **S** | 6.x | Performance, suite | découpe du moteur par page (le moteur est encore dans le bundle d'entrée), mesure avant/après dans les métriques | P1 | M | non (technique) |

Conditionnel, seulement si K le montre :
- **G.2** : une alliance dépasse 12 membres → recaler territoires et garnisons ;
- **J.3** : une classe dépasse 50 % des choix ou rapporte nettement plus → ajuster ses chiffres.

Taille : S ≤ 1 jour, M 2 à 3 jours, L ≈ 1 semaine.

## 4. Ordre recommandé

**Fusion de la PR #144 → K → L**, puis **M** dès que K a deux semaines de données. **N** et **O** s'intercalent. **P** démarre quand les
images sont prêtes (les prompts peuvent partir tout de suite). **Q**, **R** et **S** ensuite.

Pourquoi cet ordre :
- K ne change rien pour les joueurs et rend tous les lots suivants mesurables, sans accès à la production.
- L est de la lisibilité pure : sans risque, utile à chaque session.
- M est le plus gros levier pour que le JcJ compte, mais il touche l'économie de tous : il lui faut les chiffres de K.
- N et Q touchent des récompenses ou des stocks : proposition d'abord.

## 5. Calendrier des relevés

| Date | Quoi | Sert à |
|:--|:--|:--|
| Fusion + 1 jour | les hooks sont à jour (champ `players.empireClass` créé) | tout |
| 13 octobre | l'abri ≤ 8 h s'active | M |
| ~20 octobre | part pillable, butin moyen, combats JcJ par jour (une semaine après) | M |
| Fusion + 2 semaines | taille des alliances, emplacements utilisés, colonies avec route, répartition des classes | G.2, O, Q, J.3 |

Avec K, ces relevés se lisent dans l'admin ; sans K, ils demandent encore un accès en lecture à la production.

## 6. Questions à trancher

1. Valides-tu l'ordre **K → L → M** ?
2. **N** : fusion contrats et missions du jour **validée** (2026-10-06) ; chiffres dans `quotidien-fusion.md`, 4 ordres par jour, totaux inchangés.
3. **M** : jusqu'où rendre le JcJ payant ? Piste : un raid réussi prend 30 % du stock exposé, borné par la soute ×2.
4. **P** : je prépare les prompts des trois vaisseaux de classe maintenant ?
5. Classes : 100 Ambre pour changer, **validé** (2026-10-06).

## 7. Suite (décidée le 2026-10-06)

> « Ajoute chaque tâche (lot) sur le plan » ; « Audit et review de tout ce qui a été fait » ; « Ok, go, ajoute tout au plan et on commence »

Tout reste sur `claude/hiver-k-s` ; une seule mise en production vers `main` à la fin.
Décisions déléguées : lot P, soute du Croiseur de raid 150 et un bonus de rôle par vaisseau (voir `unites-classe.md`) ; Q4 (V) et flotte
basée sur une colonie (Y) acceptés.

### Méthode des revues (lots AU)
Chaque revue passe la même grille sur un domaine : règles et chiffres (moteur, tests, invariants) ; serveur (tâches, sécurité, performance) ;
admin (chaque réglage existe, est validé, prend effet) ; interface (DESIGN.md, 375 px, captures en Constellation) ; données de production
(lecture seule, agrégats anonymes). Livrables : rapport `docs/audit/` à constats numérotés, fiche système créée ou mise à jour, petits
correctifs dans le lot, propositions chiffrées regroupées pour l'équilibre.

### Planning

| # | Lot | Contenu | Taille | État |
|:--|:--|:--|:--|:--|
| 1 | T | Prise en main à jour (classes, routes, objectifs du jour) | S | livré 6.4.1 |
| 2 | U | Santé de l'équilibre, suite (sens des routes, défenses par type, emplacements, courbes) | S | livré 6.5.1 |
| 3 | AU1 | Revue Menaces PNJ : pirates et factions, seigneurs de guerre, primes et Comptoir | M | livré : rapport + décisions A à D en 6.6.0 |
| 4 | AU2 | Revue Boss : mondiaux, saison, alliance, Hall of fame | M | rapport livré (`2026-10-06-au2-boss.md`) |
| 5 | V | Rendez-vous de la semaine (Q4) : proposition à partir d'AU1 et AU2, puis implémentation | M | livré 6.7.0 (mesure BOSS-2 reportée) |
| 6 | AU3 | Revue Progression : Passe, Chroniques, Codex, succès et titres, défis hebdo, série, objectifs du jour, saisons, divisions, palmarès | M | rapport livré (`2026-10-06-au3-progression.md`) ; 6.8.0, 6.8.1 et 6.8.2 livrés (passe et Chroniques génératifs) ; PRG-2 en question (`QUESTIONS.md` Q4) |
| 7 | AU4 | Revue Commerce : marché, ordres d'achat, contrats, enchères, PNJ marchand, pot commun, concours, casino et tournoi | M | livré : rapport (`2026-10-06-au4-commerce.md`) + 6.9.0 (COM-1) |
| 8 | AU5 | Revue Alliances : membres et rôles, trésor, recherches, guerres, guerre de territoire, projets, saga, diplomatie, calendrier | M | livré : rapport (`2026-10-07-au5-alliances.md`) + 6.9.2 |
| 9 | AU6 | Revue Communications : messages, canal global, salons, modération, annonces, sondages, gazette, notifications | M | à faire |
| 10 | AU7 | Revue Galaxie et combat : carte, joueurs et classement, espionnage, rapports, journal, simulateur | M | à faire |
| 11 | AU8 | Revue État-major et bonus : officiers, reliques, talents, Ascension, classes, circuit d'effets | M | à faire |
| 12 | P | Vaisseaux de classe, dès réception des illustrations (peut passer avant) | M | livré 6.5.0 |
| 13 | AU9 | Revue Unités : hangars, Atelier et Cale sèche, modules | M | à faire |
| 14 | AU10 | Revue Flottes : missions, expéditions, emplacements, « Relancer » | M | à faire |
| 15 | AU11 | Revue Économie : ressources, bâtiments, Labo, planificateur, portefeuille | M | à faire |
| 16 | AU12 | Revue Colonies : routes, spécialisations, file de défense | S | à faire |
| 17 | Y | Flotte basée sur une colonie (Q.3) : proposition, puis implémentation | L | à faire |
| 18 | W | Lisibilité : puissance d'une flotte entière détaillée dans la fenêtre d'attaque | S | à faire |
| 19 | X | Performance : contenu (succès, saisons, Chroniques) chargé à la demande | M | à faire |
| 20 | AU13 | Revue transverse et clôture : admin, sécurité serveur, tâches planifiées, accessibilité, blog, statut ; synthèse et feuille de route suivante | M | à faire |
| — | G.2, J.3, O.2, M.2 | Conditionnels, déclenchés par les relevés de U | — | conditionnel |
| fin | Mise en production | PR `claude/hiver-k-s` → `main`, puis « Mettre à jour les hooks » | — | à faire |

Ordre : les revues commencent par les systèmes les plus joués et les moins audités ; les plus récents (unités, flottes, économie,
colonies) ensuite ; la revue transverse clôt la série.

### Constats préalables transmis pour les revues

- **AU11 (Labo) et AU1 (Traqueur Kesh)** : technologie `tech19_2` « Traqueur Kesh », ajoutée en production par le panneau admin (transmise le
  2026-10-06). Effets : `unlock_next_level` → `traqueur_kesh`, `unit_attack` 0,07 par niveau, `fleet_speed` sans valeur ; niveau max 20 ;
  10 Ambre ; prérequis tech1 19, tech16 5, tech18 5, tech22 3. À vérifier :
  - le Traqueur Kesh a `maxLevel: 1` : la techno monte à 20 mais l'unité ne dépasse pas le niveau 1 ; la description promet
    « +1 700 attaque et +1 700 défense par niveau » ;
  - `unit_attack` 0,07 × 20 = +140 % d'attaque de **toutes** les unités : plafonds de la couche techno et `derived.test.ts` ;
  - `fleet_speed` sans `value` : effet nul ou valeur par défaut ? ;
  - le plan du Comptoir (`blueprint`) et cette techno se recoupent-ils ?
