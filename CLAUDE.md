# CLAUDE.md : guide de travail sur Cosmic Empires

Ce fichier est lu en premier par tout agent qui travaille sur le dépôt. Il dit **comment on travaille** ici.
Le reste est dans `docs/` :

| Document | Sert à |
|:--|:--|
| `docs/DESIGN.md` | toute modification du front (jetons, composants HUD, couleurs = sens, animations) |
| `docs/GAME_DESIGN.md` | **GDD** : piliers, boucles, carte des systèmes, **invariants du moteur**, règles de conception, fiches systèmes, grille et journal d'audit |
| `docs/WORKFLOW.md` | chaîne complète d'une fonctionnalité : brief → benchmark → chiffres → moteur → serveur → UI → audit → livraison ; méthode de level design |
| `docs/systems/*.md` | **une fiche par domaine du jeu** (règles et chiffres en vigueur, code, admin, état) : à lire avant de toucher un système |
| `docs/audit/*.md` | rapports d'audit datés (constats C, E, Q, P, D numérotés, réutilisés par les propositions) ; **`constats-ouverts.md`** : inventaire tenu à jour |
| `docs/proposals/*.md` | propositions chiffrées (une par système), dont la feuille de route |
| `docs/QUESTIONS.md` | **journal des questions et décisions prises seul** (règle n° 3), à revoir avec l'utilisateur |
| `docs/changes/*.md` | **une fiche par lot livré** (fonctionnalité, ajout, rework, ajustement, correctif, refactoring, docs), modèle et index dans `docs/changes/README.md` |
| `changelog/*.md`, `content/blog/*.md` | notes de version (joueurs) et billets du devblog |

## Règle n° 1 : chaque changement a son .md, et les docs s'auto-alimentent

Valable pour toute la session et tout le projet, à chaque demande :

1. **Avant de coder** un système, de l'équilibre ou ce qui touche les données des joueurs : une proposition `docs/proposals/<système>.md`
   (plan de `docs/WORKFLOW.md` §2), puis appliquer la recommandation sans attendre (règle n° 3) en notant le choix dans `docs/QUESTIONS.md`.
2. **Pour chaque lot**, même petit (ajout, rework, ajustement, correctif, refactoring, docs) : une fiche `docs/changes/<version>-<slug>.md`
   selon le modèle de `docs/changes/README.md`, ajoutée à l'index. Pas de fiche, pas de commit.
3. **Report dans les documents de référence**, dans le même commit :
   - règles de jeu → GDD (`docs/GAME_DESIGN.md`) : invariants §4, fiches systèmes §7, journal §8, et fiche du domaine dans `docs/systems/` ;
   - règles visuelles → `docs/DESIGN.md` ;
   - méthode → `docs/WORKFLOW.md` ;
   - règles de travail, pièges, conventions → ce fichier.
4. **Corriger plutôt qu'empiler** : une règle devenue fausse est réécrite, pas complétée par une exception. Une proposition livrée passe au
   statut « livrée » et renvoie à sa fiche.
5. Ces fichiers sont la mémoire du projet : les relire en début de session et avant chaque lot, ne jamais repartir de zéro.

## Règle n° 2 : tout est réglable dans le panel admin

> **Instructions : tout ce qui est dans GameRules etc pour les fonctionnalités existantes et futures doivent pouvoir être gérées dans le panel admin !**

- Chaque chiffre de jeu (stats, effets, coûts, durées, plafonds, bonus, calendriers, textes de règle) vit dans un contenu réglable :
  unités, technos, bâtiments, factions… dans leur onglet ; le reste dans `GameRules` (`content.ts`), avec un libellé dans `RULE_GROUP_LABELS`.
- Une nouvelle fonctionnalité ajoute ses réglages à `GameRules` (ou à une section de contenu) **et** son éditeur dans l'admin, dans le même lot.
  Un champ sans section dédiée reste éditable dans **Admin → Règles → Tous les réglages (avancé)** (`AllRulesEditor`), qui affiche chaque champ
  automatiquement ; une section dédiée avec libellés clairs reste la règle pour les chiffres courants.
- Une constante par défaut peut rester dans le code ; la valeur en vigueur vient toujours des règles. Une valeur réglable doit être JSON pur
  (pas de fonction, de `Date`, de `undefined`).
- Un nouvel objet de règles du moteur (`export const X_RULES = { … }`) se déclare dans le **registre** `src/game/ruleRegistry.ts` (libellé +
  accesseur) : il devient un groupe de `GameRules`, fusionné, appliqué et éditable sans autre code. Une constante numérique de règle devient
  un champ d'un objet de règles (pas de `export const MAX_X = 3`).
- Garde : `rulesAdmin.test.ts` (libellé de chaque groupe, valeurs éditables sans perte, éditeur monté), `reglages671.test.ts` (réglages appliqués)
  et `ruleRegistry.test.ts` (tout `*_RULES` du moteur relié à l'admin, sauf exceptions justifiées).

## Règle n° 3 : travailler en continu, noter les questions

> **Instructions : N'attends plus que je te dise de passer à la suite. Travaille automatiquement. Si tu as des questions ou besoin de
> précisions. Note et log les, on ajustera ensemble.**

- Un lot fini (fiche, validation, commit, push), on enchaîne sur le suivant de la feuille de route (`docs/proposals/feuille-de-route-*.md`),
  sans demander. Une feuille de route terminée : on écrit la suivante et on la commence aussitôt, sans attendre qu'elle soit validée
  (consigne redonnée le 2026-10-07, deux fois). Un lot qui demande la production, `main` ou une PR est sauté et noté ; on passe au suivant.
- **Jamais de pause** : quand la suite dépend d'une question ouverte (orientation, ergonomie, équilibre), on prend l'option recommandée,
  on la note et on avance. Une feuille de route sans lot faisable seul se remplit en tranchant ces questions, pas en s'arrêtant
  (pause d'AU18 annulée le 2026-10-07, Q17).
- **Tâches longues en parallèle** (consigne du 2026-10-07) : mesures de performance, tests d'intégration, déploiement, détourage… se
  lancent en arrière-plan, et on avance sur autre chose pendant ce temps (jamais de boucle d'attente). Un message de l'utilisateur arrivé
  en cours de travail se lit et se traite aussitôt : il peut être important.
- Une question, un doute, un choix de conception ou d'équilibre que l'utilisateur pourrait vouloir trancher : on prend l'option
  recommandée (la plus prudente pour les données des joueurs), on l'écrit dans `docs/QUESTIONS.md` (date, lot, question, choix fait,
  comment revenir en arrière) et on continue. La fiche du lot renvoie à l'entrée.
- **Décisions à valider** (consigne du 2026-10-07) : chaque question ouverte de `QUESTIONS.md` apparaît sur la page `/decisions`
  (`test.fs0ciety.org/decisions`, `empire.fs0ciety.org/decisions`, admins) au déploiement ; on ajoute aussi sa ligne (groupe, effet,
  conseil) dans `docs/decisions-a-valider.md` (un test l'exige). Les réponses (collection `decision_answers`) se relisent par
  `node scripts/decisions.mjs` en début de session et à chaque passage de la routine horaire : « valide » → statut « validée » ;
  « changer » → lot de changement et règle réécrite (instructions, GDD, WORKFLOW) ; un « changer » sans note se précise d'abord avec
  l'utilisateur (6.14.35). Une question traitée quitte la page.
- > **Instructions (2026-10-07) : la liste de tes plans et feuille de route également sur la page décisions pour voir la roadmap et
  > valider, modifier ou ajouter des actions.**

  Onglet « Feuille de route » de `/decisions` (6.14.41), construit depuis `docs/proposals/` : la feuille de route en cours (la plus
  récente au statut « **en cours** »), ses lots au format `| # | Lot | Contenu | Taille | État |`, les plans et les feuilles passées.
  Les réponses `R:<lot>` (valider, modifier) et `A…` (action ajoutée) se traitent en citant leur identifiant dans la feuille de route :
  « validé (R:É30-5) », ou un nouveau lot chiffré qui cite « A… ». Tant qu'il n'est pas cité, `decisions.mjs` les montre à traiter.
- > **Instructions (2026-10-07) : dans la page décisions, quand tu présentes un choix appliqué, mets un lien vers le .md concerné qui
  > présente le choix.** — **Mets à jour automatiquement img et décision lorsque tu push des nouvelles décisions et quand tu as besoin
  > d'illustrations.**

  Une question ouverte cite son document (`docs/…md` dans sa ligne, ou une version du lot présente dans l'index des fiches) : la page
  affiche les liens, et `decisions.test.ts` échoue sans document. Une question, avec sa ligne dans `decisions-a-valider.md`, et une
  image, avec sa ligne dans `illustrations.json`, s'ajoutent **dans le push même qui les crée**.
- > **Instructions (2026-10-07) : une route API pour lire et envoyer les décisions et plans / feuilles de route (les .md) sans push
  > GitHub ni redéploiement Coolify ; pareil pour /img (envoi d'images, nouveaux prompts).**

  `/decisions` et `/img` lisent d'abord la collection `live_docs` (6.14.42), puis la version du build. Après **toute** modification
  d'une question, d'un conseil, d'une proposition, d'une feuille de route ou de `illustrations.json` : `node scripts/live-docs.mjs push`
  (seuls les fichiers changés partent ; `status` pour comparer). Les pages sont à jour en quelques secondes. Le commit suit au lot,
  car le dépôt reste la mémoire. La production garde son build (lecture seule). Une image intégrée au jeu (`public/assets`) demande
  toujours un commit et un redéploiement.
- Restent hors du travail automatique : écrire en production, pousser sur `main`, ouvrir une PR, tout secret. Ces points se notent aussi
  dans `docs/QUESTIONS.md`.

## Règle n° 4 : un contenu ajouté est un contenu complet (chaîne de contenu)

> **Instructions : Pour chaque ajout de contenu, il faut créer succès, alimenter codex, etc.**
> **Instructions : quand il y a besoin, écris les prompts Midjourney pour la génération d'illustrations.**
> **Instructions (2026-10-07) : pour chaque ajout de contenu et fonctionnalités / systèmes : création de nouveaux effets (sur base du
> système, tech, bâtiments, unités créés ou déjà présents), effets utilisables sur reliques, plans, etc. ; ajout de succès, codex ; ajout de
> reliques, plans et autres ; ajout dans le panel admin ; création de défis, missions ; workflow complet. L'idée est que si on veut ajouter
> un nouveau vaisseau, une nouvelle tech, un nouveau bâtiment, tout s'enchaîne.**

> **Instructions (2026-10-07) : petite cron pour check les nouvelles illustrations envoyées via img -> détourage webp, copy to assets
> etc automatiquement.**

Une routine claude.ai horaire (`trig_01YYCSf7tQdBikosym8habog`, minute 57) réveille la session de travail. Elle lance
`node scripts/preprod-illustrations.mjs check` et, s'il y a des envois sur `test.fs0ciety.org/img`, déroule `docs/illustrations.md` :
reconnaissance, détourage, WebP, branchement, validation, push et résumé à l'utilisateur. Une nouvelle session vérifie que la routine
existe et vise la bonne session (`get_trigger`, sinon la recrée) : sans session vivante, les envois attendent.

> **Instructions (2026-10-07) : pour /img, check toutes les 2 min ; quand tu vois des nouvelles images, lance une tâche parallèle pour
> process. Pareil pour décision : check toutes les 2 min ou à chaque modification, tâche parallèle et process.**

La routine horaire reste un filet. En session, la veille rapide est `node scripts/preprod-watch.mjs` lancée **en arrière-plan** (tour de
2 min, état dans `.pb/preprod-watch.json`) : elle se termine dès qu'un envoi `/img` ou une réponse `/decisions` est nouveau et dit
lequel. On lance alors un agent parallèle (images : `docs/illustrations.md` ; réponses : report dans `QUESTIONS.md` et lot), sans commit
de sa part (la session committe), puis on **relance la veille aussitôt**. Une nouvelle session la relance au démarrage.

La liste complète, avec les fichiers de chaque maillon, est la **chaîne de contenu** de `docs/WORKFLOW.md` §7. En bref :
- contenu et migration ;
- réglages et admin ;
- effets donnés et effets reçus (cibles, préréglages, nouvelle stat si besoin) ;
- porteurs d'effets : relique, plan ou module, talent, officier, techno ;
- succès (entrée et maîtrise), Codex, titre ou bannière ;
- défis, missions, primes ; butin ;
- équilibre (simulateur) et interface (Ctrl+K, Formules, Journal) ;
- illustration : image provisoire, puis une ligne dans `scripts/illustrations.json` (prompt, format, détourage), qui apparaît sur
  `test.fs0ciety.org/img` au push ; l'utilisateur y envoie ses rendus par lot, Claude les reconnaît et les intègre (`docs/illustrations.md`) ;
- changelog et billet ;
- essai sur la pré-prod.

La fiche du lot coche chaque maillon : fait, sans objet, ou reporté au lot X de la feuille de route. La garde `contentChain.test.ts` (6.14.11)
vérifie Codex, succès et effets de chaque unité, bâtiment, techno, relique et boss : un contenu ajouté sans eux la fait échouer.
Un test qui lit les succès les recharge (`setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS))`) : `src/test/setup.ts` les vide avant chaque test. La revue de fin de feuille de route
vérifie la chaîne pour chaque contenu livré, et l'audit suivant reprend une image provisoire tant que la définitive n'est pas arrivée.

## Reprendre dans une nouvelle session

La mémoire du projet est dans le dépôt, pas dans la conversation. Une nouvelle session sur la branche de travail relit, dans l'ordre :
1. ce fichier ;
2. `docs/QUESTIONS.md` (décisions en attente) ;
3. la feuille de route en cours (`docs/proposals/feuille-de-route-*.md`, statut « en cours ») ;
4. les dernières fiches de `docs/changes/README.md` ;
5. `docs/audit/constats-ouverts.md` (ce qui reste, et pourquoi).

Puis elle reprend le premier lot « à faire ». Rien d'utile ne doit rester seulement dans le scratchpad : un outil réutilisable va dans
`scripts/`.

## Langue et ton

- Tout en **français** : code commenté, textes du jeu, commits, PR, docs.
- Textes joueurs : tutoiement, phrases courtes, le chiffre avant l'adjectif (« +25 % d'XP pendant 24 h »).

## Architecture en une minute

- `src/game/` : **moteur pur** (TypeScript sans DOM ni réseau). Il est empaqueté pour PocketBase
  (`pocketbase/pb_hooks/cosmic_game.js`) via les exports de `src/server/hooksEntry.ts`. Toute règle de jeu vit ici.
- `pocketbase/pb_hooks/cosmic_db.js` (écrit à la main) : routes, tâches planifiées (`timedCron`), transactions.
  `cosmic.pb.js` déclare les routes et les `cronAdd`. Une nouvelle tâche à la minute, aux 5 ou aux 10 min devient une étape de `CADENCES`
  (`cosmic_db.js`), pas un nouveau `cronAdd`. Le serveur fait autorité : le client n'applique jamais une règle seul.
  Une route `/api/cosmic/admin/…` vérifie `isGameAdmin` (dans la route ou la fonction appelée) : `adminRoutes.test.ts` échoue sinon.
- `src/services/` : appels au serveur et abonnements temps réel ; `src/store/` : état zustand ; `src/pages/`, `src/components/` : interface.
- `game_config` (lisible par tous) : `weekly_stock`, `patrons`, `server_pot`, etc.

## Règles du moteur (`src/game`)

- Pas de `localeCompare`, `Intl`, `toLocaleString` (un test de garde échoue) : goja ne les a pas tous.
- Pas de `matchAll` ni de `\p{L}` dans le code empaqueté pour goja : boucle `exec` et classe explicite (`[0-9A-Za-z_À-ɏ-]`).
- Toute nouvelle fonction appelée par `cosmic_db.js` doit être **exportée dans `hooksEntry.ts`**.
- Un invariant de `docs/GAME_DESIGN.md` qui change = un test qui change dans le même commit.
- Places et capacité des hangars : uniquement `hangarLoad` / `playerUnitCapacity` (`src/game/hangar.ts`). Un test interdit `getUnitCapacity(` ailleurs.
- Une récompense quotidienne ou à réclamer s'ajoute à `pendingClaims` (`claimAll.ts`) : elle est alors couverte par « Tout réclamer »
  et par la pastille unique d'Ordres du jour (`ordersReadyCount`). Pas de nouvelle pastille dans la barre latérale. Une récompense qui
  dépend de données du serveur n'y entre que si le joueur seul suffit à la vérifier, sinon elle reste sur sa page (Codex : seigneurs, boss, 6.14.17).
- Une récompense en vaisseaux (épave, coffre…) passe par `addReady` (`workshop.ts`), jamais directement dans `units` ou une flotte : invariant I3.
- Nouveau champ du profil joueur : l'ajouter à `GAME_FIELDS` (`playerFields.ts`), au type `PlayerState` et à `pocketbase/pb_schema.json`
  (le serveur crée le champ au démarrage par la synchronisation du schéma). Un nouveau bonus passe par une source du circuit d'effets
  (`empireEffects`) et reste sous les plafonds : `derived.test.ts` échoue si un maximum théorique les dépasse.
- Technos de combat : la couche techno plafonne l'attaque et la défense des unités à +150 % (`TECH_COMBAT_CAP`) ; une techno ne dépasse pas
  +100 % à son niveau maximal ni le niveau maximal de l'unité qu'elle monte (`validateTechEffect`). Avant d'ajouter un bonus « contre les PNJ »,
  vérifier qu'il n'existe pas déjà dans l'unité (ex. `KESH_PVE_BONUS`) : incident `tech19_2`, revue AU1.
- Nouvelle stat d'effet : elle doit être lue dans la couche empire (champ de `Modifiers` consommé ou lecteur direct), sinon `effectsRead.test.ts` échoue (I9).
- Réglages : voir la règle n° 2 (tout `GameRules` dans le panel admin). Nouveau groupe de règles : fusion dans le bloc `rules` d'`applyGameContent` (chaque sous-objet
  fusionné champ par champ, sinon un réglage partiel efface les autres), `Object.assign` dans `applyGameContent`, libellé dans `RULE_GROUP_LABELS`, champs dans `panels.tsx` ou l'onglet du domaine.
- Contenu à liste fixe (offres de la semaine, alertes, historiques) : ses chiffres vivent dans un objet de règles et la liste les lit par
  accesseur (`get price() { … }`), ce qui garde les identifiants en dur et les valeurs dans l'admin (6.9.0).
- Initialisation des modules : un objet de règles au niveau du module ne lit jamais une constante importée d'un autre module du moteur
  (`keshPveBonus: KESH_PVE_BONUS` a planté le chargement du jeu dans le navigateur : import circulaire units ↔ combat, tests verts).
  Valeur littérale, ou accesseur (`get x() { … }`) lu à l'usage. Toujours ouvrir l'appli dans un navigateur après un changement du moteur.
- Calendrier : un rendez-vous serveur récurrent a un jour et une heure réglables dans l'admin (`BossSchedule.weekday`, `CasinoSettings.tournamentWeekly`) et
  ne démarre pas le même jour qu'un autre (invariant I16, `calendrier67.test.ts`). Un nouveau réglage optionnel lu depuis la base garde
  `null` pour « ancien comportement » : un champ absent reprend la valeur par défaut à la fusion des règles.
- Contenu généré (Chroniques, passe) : le serveur écrit un mois en **gardant le reste de la configuration**
  (`Object.assign({}, content.chronicles, { months })`), jamais `{ months }` seul (les récompenses réglées dans l'admin étaient effacées).
  Dès novembre 2026 les chapitres sont générés ; un chapitre écrit à la main va dans `chronicles.library` et n'entre dans un mois que par
  `applyLibraryChapter` (invariant I17). Un seul passe par mois (`activePass`).
- Une action serveur qui dépend des flottes en vol passe par `actionNeedsAway` (`cosmic.pb.js` lit alors les flottes).
- Un identifiant d'enregistrement PocketBase tient en 15 caractères `[a-z0-9]` : un identifiant de colonie (`<uid>-c<n>`, 18) ne sert jamais
  de clé tel quel. Dériver une clé (`debrisKey`, 6.11.4) et garder l'emplacement dans un champ à part (`locationId`).
- Un succès dont le palier dépend d'une règle (niveau maximal…) lit la règle **dans sa mesure** (`moonMaxed`, 0/1) : `setAchievements` passe
  avant les règles dans `applyGameContent`, un palier calculé à la génération garderait la valeur par défaut (6.14.3).
- Nouveau bâtiment, unité, techno ou relique par défaut : l'ajouter aussi au contenu personnalisé par une entrée `appendFromDefaults` de `CONTENT_MIGRATIONS` (`cosmic_db.js`), sinon il n'apparaît pas sur un serveur dont l'admin a modifié la liste.
- Une migration ponctuelle (`onBootstrap`) qui rend ou retire des unités, des ressources ou des niveaux **respecte les plafonds**
  (hangar, entrepôt) ou documente pourquoi elle les dépasse. Voir l'incident 5.22 dans `docs/proposals/cale-seche.md`.

## Règles du front

- Toujours suivre `docs/DESIGN.md` : `HudPanel`, `HudChip` (`asChild` + `button` si cliquable), `HudCallout`, `StatTile`, `CostPill`,
  `EmptyState`, `Button`. Pas de hex, pas de `text-white`, pas de `rgba(`, pas de `rounded-md/lg/xl`, pas de `shadow-lg`.
- Nombres en `font-mono tabular-nums` ; capitales seulement en `font-mono` ; confirmations par `askConfirm`.
- Corps de `useEffect` entre accolades.
- Un décompte en direct utilise `useNowTicker` (horloge partagée), jamais son propre `setInterval`. Il renvoie un compteur de ticks, pas l'heure :
  appeler `useNowTicker()` pour le rafraîchissement, puis lire `Date.now()` (6.10.0 : « 20746 j » affiché). Une fenêtre rare montée dans `AppShell` se charge en `lazyPage`.
- `manualChunks` (`vite.config.ts`) ne force que des paquets tiers chargés dès l'entrée (bloc `ui`, `vendor`) : jamais `src/game` ni `lucide-react`,
  sinon le code des pages paresseuses remonte dans un bloc chargé au démarrage.
- Ne pas lancer prettier sur le dépôt.
- Chaque lot front se termine par un audit DESIGN.md des fichiers touchés, plus une vérification mobile (largeur 375 px, sans défilement horizontal).
- Captures d'écran (vérifications, livrables, rapports) : toujours en thème **Constellation**. Le thème est gardé par appareil :
  `localStorage.setItem("cosmic-empires:theme", "constellation")` dans un `addInitScript` de Playwright, avant le chargement de la page.

## Valider avant de committer

```bash
npm run build:hooks      # le bundle des hooks inclut le changelog : à relancer après toute modif de src/game ou changelog/
npx tsc -b
npx eslint src           # 0 erreur
npx vitest run
npm run build
```

Puis le test d'intégration PocketBase quand le serveur est touché : `bash scripts/itest-local.sh` (base vierge dans `.pb/`, PocketBase
téléchargé au premier lancement ; `-t "<nom>"` pour un seul test).
`.env.local` peut pointer vers la production : pour tester l'interface en local, lancer Vite avec `VITE_POCKETBASE_URL=http://127.0.0.1:8090`.
Un test vérifie que le bundle des hooks est à jour : il échoue si `build:hooks` a été oublié.
Un test d'intégration qui lit les joueurs A ou B appelle d'abord `ensureAB()` : il doit pouvoir tourner seul (`-t "<nom>"`) pour qu'on l'étudie.
Un test qui se connecte en A rend la main à B avant de finir (`loginPlayer(B…)`) : les tests suivants agissent en B (6.14.0 : deux échecs en cascade).
Une arrivée de flotte se force par `forceArrival(id)`, jamais en mettant seulement `arriveAtMs` dans le passé : le retour serait dû
aussitôt et la tâche « à la minute » pourrait le traiter avant l'assertion (6.14.34 : échecs aléatoires v3.5 et v3.9). Une liste lue
par `[0]` a un `sort` (6.14.21).
Toujours lire le résultat de l'intégration **avant** de committer.

## Livrer

- Une branche de travail par session ; une PR **par lot terminé** (pas de PR intermédiaire).
- Chaque lot a sa fiche `docs/changes/` (règle n° 1) ; la PR liste les fiches qu'elle porte. Tant que la PR de mise en production attend, `python3 scripts/pr-text.py`
  régénère son texte (`docs/release/pr-5.27-6.14.md`) après chaque lot.
- Chaque lot visible par les joueurs a un fichier `changelog/AAAA-MM-JJ-slug.md` (frontmatter `version`, `iteration`, `date`, `title`).
- > **Instructions (2026-10-07) : à chaque grosse mise à jour -> nouveau billet devblog. Mise à jour du billet devblog « la grande mise
  > à jour » et autres en fonction des ajustements / nouveautés etc. Plusieurs billets créés si grosse maj (changelog).**

  Grosse mise à jour = lot important, ou mise en production qui groupe plusieurs versions. Elle a un billet récapitulatif et un billet
  par thème (`content/blog/NN-slug.md`, chiffres repris des changelogs). Tant qu'un billet n'est pas publié, chaque ajustement ou nouveauté
  du même ensemble le met à jour : récapitulatif `49-grande-mise-a-jour.md` et billets 50 à 52 pour la mise en production 5.27 → 6.14.
- > **Instructions (2026-10-07) : à l'arrivée d'un billet « grosse mise à jour », il faut créer une « annonce » avec la modale etc. La
  > modale ne s'ouvre qu'une fois par joueur (peu importe le navigateur etc). Les annonces peuvent se revoir sur /game/annonces.**

  Nouvelle entrée en tête de `ANNOUNCEMENTS` (`Announcement.tsx`), avec un identifiant inédit. La modale s'affiche une fois par compte :
  la vue est gardée côté serveur (`announcementsSeen`, action `seenAnnouncements`), quel que soit l'appareil. Elle reste consultable sur
  `/game/annonces`. Son illustration va dans `scripts/illustrations.json` (page `/img`).
- > **Instructions (2026-10-07) : image d'annonces (prompt Midjourney une fois poussé via /img, on publie seulement une fois l'asset img
  > est créé et poussé).**

  L'annonce porte `artSlot` et `pendingArt: true` : elle reste cachée jusqu'à l'intégration de son image, qui retire le drapeau
  (`docs/illustrations.md`). Jamais d'annonce publiée avec une image provisoire.
- Après la fusion d'une PR qui touche `pocketbase/pb_hooks`, rappeler à l'admin de cliquer « Mettre à jour les hooks ».
- Aucun secret (mot de passe, jeton) dans le dépôt, même temporaire.
- `.claude/settings.json` liste les commandes autorisées sans confirmation (build, tests, git sur `claude/*`, PocketBase local).
  Jamais de règle vers la production ni de push sur `main`.
- Données de production : lecture seule (GET), extraits gardés hors du dépôt (scratchpad). Seuls des agrégats anonymes entrent dans les docs.
- **Pré-prod** (`docs/preprod.md`) : `test.fs0ciety.org`, un seul conteneur (`Dockerfile.preprod`) que Coolify construit depuis la
  branche de travail à chaque push. **Tout passe par la pré-prod avant la production** : un lot qui touche le serveur ou l'interface est
  vérifié sur `test.fs0ciety.org` après le push (santé, version des hooks, pages touchées). Seule une PR fusionnée sur `main` atteint la prod.
  La pré-prod est une copie nettoyée de la prod (`scripts/preprod-scrub.mjs`) ; lectures, essais et écritures y sont permis. Accès par les
  variables d'environnement `PREPROD_PB_URL`, `PREPROD_PB_ADMIN_EMAIL`, `PREPROD_PB_ADMIN_PASSWORD`, jamais dans le dépôt. Un script qui
  écrit refuse toute adresse qui n'est pas un serveur de test (`isPreprodHost`). L'image coupe les e-mails (`COSMIC_MAIL_DISABLED=1`) et la
  mise à jour des hooks depuis GitHub (`COSMIC_HOOKS_AUTOUPDATE=0`).

## Méthode de game design

Avant d'écrire du code pour un système de jeu, suivre `docs/WORKFLOW.md` :

1. le problème vu par le joueur ;
2. le diagnostic dans le moteur (preuve par un test ou une simulation) ;
3. le benchmark (OGame, Clash of Clans, jeux de gestion mobiles) ;
4. au moins deux options comparées, puis une recommandation chiffrée ;
5. la recommandation appliquée (règle n° 3 : choix noté dans `docs/QUESTIONS.md`), puis l'implémentation par lots.

Ce qui change l'équilibre ou les données des joueurs passe d'abord par une proposition dans `docs/proposals/`.
Une fois livrée : statut « livrée » en tête de la proposition, règles reportées dans les fiches systèmes du GDD, ligne au journal d'audit.
Ces documents s'enrichissent à chaque lot : une règle apprise (incident, piège goja, convention) va dans CLAUDE.md le jour même.
