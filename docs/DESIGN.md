# Design system — Cosmic Empires

Direction : un cockpit de vaisseau, pas un site. Un centre vivant (planète, galaxie, boss) entouré d'instruments.
Référence complète : skill `.claude/skills/space-4x-cockpit-ui`.
Tout lot qui touche le front a sa fiche dans `docs/changes/` (section « Design ») ; un nouveau composant ou une nouvelle règle visuelle est ajouté ici dans le même commit (voir `CLAUDE.md`, règle n° 1).

## Jetons

Tout passe par les variables `--th-*` de `src/index.css`, redéfinies par `html[data-theme]`
(Tactique, Holo, Cockpit, Netrunner, Aurora, Signal, Voyageur, Omni, Spartan, Constellation, Ishimura, Atlas, Matrice). En Tailwind : `cyan-glow` (accent), `mint-glow`,
`ember-glow`, `danger-glow`, `gold-glow`, `violet-glow`, `space-*`, `slate-*`, `font-display`, `font-mono`.
Texte clair : `text-slate-100` (le « blanc » du thème : ivoire en Voyageur, os en Constellation), jamais `text-white`.
Transparence d'un accent : `color-mix(in srgb, var(--color-cyan-glow) 35%, transparent)`, jamais `rgba(…)` en dur.
Ne jamais écrire une couleur en dur dans un composant : un thème ne pourrait plus la changer
(un test échoue sur toute couleur hex dans un `.tsx`, scènes dessinées exceptées).
Médailles : `--th-medal-gold|silver|bronze`. Raretés : `--th-rarity-common|rare|epic|legendary|mythic`.
Transparence d'une couleur (hex ou jeton) : `alpha(couleur, 30)` de `@/lib/utils` (jamais `${couleur}55`).
Les couleurs choisies et enregistrées par les joueurs (rangs d'alliance…) restent des données hex, rangées dans `src/game`.
Texte secondaire : `text-slate-500` (`--th-text-500`) atteint **4,5:1** sur `--th-space-600` (fond réel des panneaux, 6.14.96) dans chaque thème ;
`text-slate-600` est réservé au décor (filets, séparateurs, icônes inactives), jamais à un texte qui porte une information (6.14.55) ;
un texte, un `placeholder`, une heure ou un rang en gris passe en `text-slate-500` (garde, 6.14.83).
**Plancher de 11 px** : aucun texte sous 11 px hors admin (`text-[11px]` au plus petit, pastilles `hud-chip` comprises) ; seuls les
libellés d'un dessin SVG (`<text>`, en unités du dessin) y échappent (6.14.83).
`--th-danger` se lit aussi comme texte (« Zone dangereuse ») : ≥ 4,5:1 sur `--th-space-600` dans chaque thème (6.14.148 ; `space-700` avant) ; un bouton survolé
garde une encre lisible (`--th-btn-ink` sur un fond clair ou saturé, jamais `--th-text-100` sur l'orange ou le magenta) (6.14.90).
Audit des 13 thèmes : `scripts/theme-audit.mjs` (captures et mesures, revue AU28).
Garde : `src/lib/themeTokens.test.ts` (contraste, hiérarchie 400 > 500 > 600, danger lisible, écart entre couleurs de sens).
Un état (verrouillé, réclamé, en attente, manque) se marque par l'icône, la bordure (pointillés pour « pas encore », menthe pour
« fait » ou « possédé ») et la couleur du texte, **jamais par l'opacité d'un bloc qui porte du texte** (6.14.97, TH-L1 : 3,9:1 à 75 %).
Garde : `verrousSansOpacite.test.ts` (10 fichiers depuis la revue AU28, 6.14.148). Une image, un portrait ou un décor peut rester
atténué (`opacity-… grayscale`) : il ne porte pas de texte.

## Couleurs = sens

| Ton (`HudTone`) | Sens | Exemple |
|---|---|---|
| `accent` | interactif, sélection | onglet actif, lien d'action |
| `mint` | positif, réussi | liaison stable, contrat récupéré |
| `ember` | attention | entrepôt presque plein, vacances |
| `danger` | danger, perte | flotte hostile, panne d'énergie |
| `gold` | prestige, récompense | série à réclamer, rang |
| `violet` | second accent (événements) | événement du week-end, agenda |
| `neutral` | information sans enjeu | puissance, compteurs |

Dans un thème, deux couleurs de sens restent distinctes : écart CIEDE2000 ≥ 15 entre accent, violet (`--th-accent2`), mint, danger,
or et ember, et ≥ 12 entre l'accent et le texte (`--th-text-100`). **Constellation**, thème des captures, respecte tout (6.14.55) :
accent sable `#d6c49a` (le texte reste os), violet bleu acier `#5b8fd6`, ember orange `#e0802c` (celui de la bande), danger rouge,
or ambre. Les thèmes monochromes (Cockpit, Holo…) gardent leurs confusions voulues, listées dans la garde, qui échoue si une
nouvelle apparaît ou si l'une d'elles se resserre. Un décor propre au thème passe par ses jetons de décor (`--th-stripe-*`), pas par
une couleur de sens. L'accent se marque aussi par la forme : soulignement de l'onglet actif (`TabsTrigger`), liseré, pastille.
Ne pas décorer avec une couleur sémantique. Un même cas garde la même couleur partout :
un chantier à l'arrêt (bâtiment, labo, chantier naval, missions) est une **action à mener**, donc `accent`,
sur l'accueil comme dans la file des chantiers ; un entrepôt plein est une **attention** (`ember`). Une info ne passe jamais par la couleur seule (texte ou icône en plus).
Dans un thème où l'ember se confond avec l'accent (écart < 15 : Cockpit, Omni, Ishimura), l'attention porte une forme : « ! » devant
une pastille sans icône, double liseré sur un encadré (6.14.101, garde dans `themeTokens.test.ts`).
Une **catégorie** (type d'unité, classe de combat, tempérament, rubrique de l'agenda) n'a pas d'enjeu : `HudTag` sans ton (neutre,
c'est son défaut depuis 6.14.82) et une icône. Une valeur ne prend la couleur de son sens que si elle porte un enjeu : « Défaites »
en `danger` seulement au-dessus de 0, « Victoires » en `mint` seulement au-dessus de 0 ; le tempérament Agressif en `ember`, les
autres en neutre. L'agenda est tout en `violet` (événements) et chaque rubrique a son icône (`agendaStyle.tsx`). Une puissance, une
production, un compteur restent neutres ; le rang garde l'or (prestige).

## Composants (`src/components/ui/hud.tsx`)

- **`HudChip`** : toute pastille d'état (en-tête, carte, liste). Capitales mono, coin coupé, bordure 1px.
  `tone`, `size="md"` (en-tête) ou `"sm"` (dans une carte), `alert` (point qui clignote : état en cours),
  `asChild` pour un `Link` ou un `button`. `HudTag` = `HudChip` statique en petite taille.
- **`HudCallout`** (ou classes `hud-callout hud-tone-*`) : encadré dans un panneau (menace, conseil, notice).
  Liseré gauche coloré, coin coupé ; `alert` pour une menace en cours.
- **`HudToaster`** (`src/components/ui/hud-toast.tsx`) : toasts sonner au style du HUD (coin coupé, liseré et icône
  de la couleur sémantique, titre en capitales, action en pastille). `toast.success/error/warning` prennent mint / danger /
  ember ; une notification de jeu passe `className: "hud-tone-…"` (ton de son type, `notificationStyle(kind, n).tone`).
  Une notification de flotte n'est rouge que pour une menace (`isHostileFleetNotification` : flotte hostile, raid, ultimatum,
  garnison au combat) ; un retour ou un saut réussi prend le ton courant, et INFO au Journal système (`systemLogStyle`, 6.14.77).
- **`askConfirm`** (`src/components/ui/confirm-dialog.tsx`) : toute confirmation, jamais `window.confirm` / `alert` / `prompt`
  (boîte grise du navigateur, hors thème ; un test échoue). `await askConfirm({ title, message, details, confirmLabel, tone })` rend
  `true` si le joueur confirme. Titre = la question courte ; `message` = la conséquence ; `details` = coût, solde (`CostPill`).
  `tone` : `accent` (courant), `ember` (attention, bouton orange), `danger` (perte, suppression : bouton rouge), `gold` (dépense).
  Le verbe du bouton dit l'action (« Acheter », « Supprimer »), pas « OK ». Hôte unique `<ConfirmHost />` monté dans `App`.
- **`DialogContent`** (`src/components/ui/dialog.tsx`) : fenêtre modale (coin coupé, sans ombre ni arrondi), tiroir sur mobile.
- **`TooltipCard`** (`src/components/ui/tooltip.tsx`), dans un `TooltipContent` : infobulle structurée. Titre en capitales mono
  (+ icône), lignes `{ label, value, tone? }` alignées (valeurs en mono tabulaire), `sections` séparées par un filet, `note`.
  Une infobulle qui contient des chiffres passe par elle plutôt que par une phrase.
  **`TapTooltip` / `TapTooltipTrigger`** (6.14.164) : même infobulle, ouverte aussi au toucher (une infobulle Radix ne s'ouvre qu'au
  survol ou au focus). Obligatoire quand l'élément n'a pas de libellé visible sur téléphone (icône et nombre de l'en-tête).
- **Bandeau du serveur** (`ServerDownBanner`, 6.14.164) : pastille fixe en bas (au-dessus de la barre d'onglets sur téléphone ; les toasts occupent le haut), liseré `ember` (attention : rien n'est perdu), texte
  court et icône qui tourne ; montée une fois dans `AppShell`. Une panne de serveur ne se dit jamais en `danger`.
- **Carte visée** (`useFocusCard`, 6.14.164) : un lien qui mène à une carte précise passe `?focus=<id>` ; la carte porte
  `data-focus-id`, défile au centre et prend un contour `outline-cyan-glow` 2,5 s.
- **`HudSwitch`** : interrupteur on/off (réglages, vue cockpit). Les cases à cocher restent pour les sélections multiples.
- **Champ de réglage de l'admin** (`AllRulesEditor`, 6.14.95) : libellé clair, nom technique en petit (mono 10 px, admin), défaut et
  bornes en `tabular-nums`, unité en suffixe du champ ; `HudChip size="sm" tone="accent"` « modifié » et bouton `ghost` « Défaut »
  quand la valeur diffère du défaut ; `HudCallout tone="danger"` hors bornes (refusé), `tone="ember"` au-delà de ×2 ou ÷2 du défaut.
- **Pages longues sur téléphone (375 px)** : viser moins de 5 000 px pour un joueur neuf comme avancé (`pagelen.mjs`). Ne rien retirer :
  une section à la fois (onglets ou puces `aria-pressed`), sections secondaires repliées (`FoldSection`, `aria-expanded`), « Afficher plus »,
  ou vue « liste » (une ligne par élément, la carte s'ouvre au toucher, bascule mémorisée par appareil : Bâtiments 6.12.0).
  Un graphe (arbre du Labo) a toujours une vue liste, par défaut sous 768 px (Labo 6.14.162) : lignes rangées par état, ce qu'on peut
  lancer d'abord, ce qui est loin replié ; un graphe qu'on fait glisser coupe la sélection de texte pendant le geste (`select-none`).
- **Chrome mobile (6.14.62)** : au-dessous de 768 px, le haut de page tient en environ 200 px. Un bandeau du haut (maintenance,
  vacances, annonce, boss) porte `data-strip` et vit dans `StripStack` (`AppShell`) : seul le premier s'affiche, une ligne « +N bandeaux »
  déplie les autres ; le serveur de test devient une pastille de l'en-tête (`PreprodTag`). Les 4 ressources communes tiennent sur une ligne,
  les pastilles sur une seconde ligne qui défile. L'en-tête ne répète pas le titre d'une page qui a son `PageHeader`.
- **Astuce de page** (`PageTip`, 6.14.62) : rendue par `PageHeader`, sous le titre, en `HudCallout tone="neutral"` (jamais l'or, qui
  promet une récompense), deux lignes et « Lire la suite », croix de 44 px. Sa vue est gardée sur le compte (`tip:<page>` dans
  `announcementsSeen`).
- **Pastilles de navigation** (6.14.86) : le ton suit le sens de la page (`BADGE_TONE`, `NavBar.tsx`) : récompenses prêtes (Ordres
  du jour) en `gold`, Léviathan en `violet` (événement), signalements à traiter en `ember` ; un compteur de lectures (messages,
  alliance, notes de version, bouton « Plus ») est neutre. Le rouge (`danger`) reste aux menaces : la cloche n'est rouge que pour une
  attaque subie ou un espion détecté non lus. Un groupe replié prend le ton le plus fort de ses pages ; les points (barre réduite,
  liens du pied) suivent le même ton. Pastilles de 16 px, chiffre à 11 px. Le chiffre de la cloche ne compte pas la routine (fins
  de chantier, de recherche, d'unités, de mission : un point seul, 6.14.165), et les succès comme les « Nouveau : … » comptent pour 1
  chacun quel que soit leur nombre (`badgeCount`, 6.14.166).
- **Ctrl+K** (6.14.86) : les actions faisables d'abord, les impossibles (ressources, prérequis) en fin de liste, grisées, la raison
  sous le libellé ; le niveau visé (« → niv. 3 ») reste visible, c'est le nom qui se tronque. Une forme d'icône par type de contenu,
  en accent (or pour une récompense à réclamer), `text-slate-500` si l'action est impossible.
- **Menu progressif (6.14.75, I30)** : une page pas encore ouverte est **cachée** (groupe vide caché aussi), jamais affichée avec un
  cadenas, sauf réglage `navUnlock.style = "locked"` (grisée comme le Planificateur, condition dans le `title` et l'`aria-label`). Une
  page qui vient de s'ouvrir porte `HudChip size="sm" tone="accent"` « Nouveau » jusqu'à la première visite (losange accent en barre
  réduite) : c'est une invitation, pas une récompense (jamais l'or) ni une menace (jamais le rouge). Sous le menu, une seule ligne
  grisée `text-slate-500` « Prochaine ouverture : … · 40 / 100 XP » (trois noms au plus, le reste dans le `title`). Dans Ctrl+K, une
  page fermée reste trouvable : icône et libellé `text-slate-500`, sa condition à la place de « Navigation ». Un lien vers une page
  fermée (défi du passe, des Chroniques) dit « Ouvre : … » (`ObjectiveGoLink`, `HudChip asChild`) ; une étape du tutoriel dit
  « Débloque : … ». Tout ce qui pousse vers une page (carte, raccourci, rappel, suggestion, monnaie de la barre des ressources) suit le
  menu : lire `useHiddenRoutes()` ou `useNavUnlock().closed`, jamais une liste à part (6.14.81). Une monnaie déjà possédée reste
  affichée. Un succès d'une page fermée dit « À découvrir : Galaxie. S'ouvre à … » (cadenas `text-slate-500`, sans barre ni
  compteur). L'ouverture est annoncée par une notification de genre `system` (« Nouveau : … »), jamais par une nouvelle pastille.
- **Hiérarchie d'une page (6.14.67)** : l'action principale de la page vient juste sous l'en-tête (la grille des Missions, les
  paliers du Passe, « Rejoindre » pour un joueur sans alliance) ; l'explication et les compteurs secondaires passent dessous ou
  se replient (`FoldSection`). Une carte n'a qu'un bouton plein (`primary`) : le premier pas sûr (Espionner un seigneur) ; une
  action coûteuse ou risquée est `warn` (Vendetta). Une page n'a qu'une navigation entre ses sections : des tuiles qui filtrent
  (`aria-pressed`) **ou** des onglets, jamais les deux. Une autre page résumée tient en une ligne-lien (Chroniques sur le Passe).
- **Cibles tactiles (6.14.68, Q-AD-5)** : sur écran tactile (`@media (pointer: coarse)`), toute cible fait au moins 44 × 44 px de
  zone sensible, sans rien changer à la souris. `Button`, `TabsTrigger` et `HudChip` cliquable portent `hud-hit` (pseudo-élément
  invisible centré, coin coupé étendu autour de la boîte) ; un lien ou un bouton fait main l'ajoute aussi. Dans un conteneur qui
  défile (`overflow-x-auto`), la zone est coupée au bord : `TabsList` prend 8 px de marge verticale au toucher. Les icônes de
  l'en-tête passent à 44 px au toucher (`pointer-coarse:h-11`). Jamais `before:-inset-*` pour ça (il agit aussi à la souris).
- **Noms et raisons** : un bouton ou un onglet à icône seule a un `aria-label` (le `title` seul ne s'affiche pas au toucher) ;
  un bouton grisé dit pourquoi en texte visible (une ligne sous le bouton, ou une fois en tête de page si la raison vaut pour
  toutes les cartes), le `title` ne fait que doubler. Garde : `src/lib/accessibilite.test.ts`.
- **`StatTile`** (`tone` = `HudTone`), **`StatBar`**, **`HudMeter`**, **`LevelTicks`**, **`EmptyState`**, **`CostPill`** : jauges et chiffres.
  Pas de tuile, de barre ou de pastille de coût refaite dans une page (`HeroTile`, `Bar`, `CostChips` sont devenus `StatTile`,
  `HudMeter`, `CostPills` en 6.14.83). Un état vide de section (« Aucun… », « Pas encore… ») est un `EmptyState size="sm"` avec une
  icône lucide ; une valeur absente dans une ligne (« Aucune perte ») reste du texte.
- **Titres** : un titre de panneau est `HudPanel` (eyebrow mono) ou `hud-title` (`CardTitle`, `h2/h3 className="hud-title text-sm"`),
  jamais `font-display` en casse mixte ; le nom d'un objet (unité, annonce, chapitre) reste en `font-display`.
- **Onglets** : `Tabs` / `TabsList` / `TabsTrigger` (Journal 6.14.82, Réglages, Codex), jamais de boutons `role="tab"` faits main.
  La rangée défile quand elle dépasse ; quatre onglets qui ne tiennent pas à 375 px passent en grille 2 × 2 sous 640 px
  (`grid w-full grid-cols-2 sm:inline-flex sm:w-auto`, Réglages 6.14.86) plutôt que de cacher le dernier hors de l'écran.
- **Icônes** : lucide ou `GameIcon`, jamais un emoji écrit dans un `.tsx` (rendu différent selon le système, hors thème). Les emoji
  saisis par l'admin (titres, bannières, événements) ou envoyés par le serveur restent des données (Q-AD-6). ★ et ↔ sont des signes
  typographiques, permis.
- **`Button`** (`variant="primary" | "outline" | …`) : toute action, `asChild` pour un lien.
- **`PageHeader`** : en-tête de chaque page. `backdrop="/assets/…"` pose une illustration discrète derrière
  (fondue vers la gauche et le bas, opacité réduite) : à réserver aux pages « lieu » (Casino…), le texte reste prioritaire.
- Panneaux : `Card` / classe `glass-panel` ; formes : `hud-cut` (12 px) et `hud-cut-sm` (5 px).
- **D'où vient ce chiffre** (5.31) : une valeur calculée (durée, coût, production) porte une infobulle `TooltipCard`
  « D'où vient ce … » : une ligne par multiplicateur (`factorRows` : réduction en mint, hausse en ember), note « Les bonus se multiplient ».
  Le détail vient du moteur (`*Breakdown`) et un test vérifie que son produit égale la valeur affichée.
- **Liste de contrôle** (Ordres du jour, 5.30) : une ligne = un `Link` `glass-panel hud-cut-sm`, liseré gauche de la couleur d'état,
  libellé + rythme (mono), une phrase de détail, valeur mono, `HudChip` d'état, chevron. États : mint = à réclamer, accent = à faire,
  neutre et opacité réduite = fait. La ligne mène à l'écran qui agit ; la réclamation groupée reste dans l'en-tête de page.

## Retour visuel (GSAP, `src/lib/fx`)

Animer pour **répondre** au joueur ou **signaler un état**, jamais pour décorer. Tout passe par `src/lib/fx/uiFx.ts`
(GSAP et ses plugins SplitText, ScrambleText, Text, Flip, chargés à la demande) : rien ne bouge si le joueur coupe
« Animations de l'interface » (Réglages) ou si son système demande de réduire les animations.

| Effet | Quand | Où |
|---|---|---|
| `glitch` (RVB 140 ms) | tout clic sur un bouton, un onglet | global (`installUiFx`), rien à écrire |
| `laserScan` | action principale confirmée dans un panneau | bouton `.hud-btn-primary` (ou `data-fx-scan`) dans un `glass-panel` |
| `lightUp` (lettres qui s'allument) | arrivée sur une page | titre de `PageHeader` |
| `scramble` (texte décodé) | libellé qui apparaît | fil d'Ariane, titre de `HudPanel`, titre de fenêtre, survol du menu |
| `typewrite` (frappe terminal) | texte produit par la machine | rapports, journaux de bord |
| `unfold` | ouverture d'une fenêtre | `DialogContent` |
| `cascade` | nouvelle page d'une liste | `PagedList` |
| `alarmGlitch` | danger imminent (seul usage du glitch en boucle) | alerte d'attaque |
| `interference`, `bootSequence` | changement de page, ouverture de session | `PageTransition`, `AppShell` |

- Durées courtes : 150 à 600 ms ; seul l'amorçage dépasse la seconde (une fois par session, un clic le passe).
- Une seule lueur forte par vue ; les couleurs viennent des jetons (`token("--th-accent")`), jamais en dur.
- `data-fx="none"` sur un conteneur coupe le glitch de ses boutons (jeu en cours, glisser-déposer…).
- Un texte animé doit être du texte seul (pas d'icône dedans) ; donner une `key` liée au texte pour que React le remonte.

## À faire / à éviter

- Faire : nombres en `font-mono` tabulaire (gros chiffres compris : `StatTile`, niveaux, compteurs, gains, rangs, décomptes ;
  `font-mono font-bold tabular-nums`, jamais `hud-title` qui impose la police de titre), formatés par `formatNumber` / `formatDecimal` / `formatCompact` (`@/lib/utils`),
  ou `formatHud` (3 chiffres au plus, 6 caractères : cases étroites de l'en-tête, 6.14.164), jamais
  `toLocaleString` sur un nombre ; trois niveaux de texte maximum par panneau ; coins coupés ou droits. Ces fonctions séparent les
  milliers par une espace insécable U+00A0 : l'espace fine U+202F de fr-FR manque à toutes les polices de titre (6.14.54).
- Faire : un texte qui cite un chiffre de règle (astuce, toast, aide) le lit dans la règle en vigueur (`ALLIANCE_RULES.maxMembers`,
  accesseur `get` pour une liste fixe), jamais écrit en dur ; une aide dit « Touche ou survole », jamais « Survole » seul (6.14.54).
- Faire : accueil public et pages mobiles vérifiés à 375 px sans défilement horizontal **ni élément coupé** : `scrollWidth` ne voit
  pas un enfant caché par un parent en `overflow-hidden` ; `scripts/preprod-capture.mjs` liste les éléments dont le bord droit
  dépasse la fenêtre. Une grille mobile a `grid-cols-1` et ses enfants `min-w-0` (6.14.53).
- Faire (6.14.116, stabilité) : un bloc de la coque (en-tête, barres) qui attend des données réserve sa hauteur pendant le chargement
  (`ResourceHud` : 78 / 125 / 89 px ; carte du commandant du menu : 105 px) au lieu de rendre `null` puis d'apparaître ; une liste d'images se charge au défilement
  (`loading="lazy"`, `decoding="async"`) ; une scène 3D ne télécharge que ce qui est à l'écran (`HoloCylinder` : la carte de face et
  7 de chaque côté) et n'est pas la vue par défaut sur téléphone ; une animation décorative s'arrête quand rien ne bouge
  (`ParallaxStars`). Mesure : `scripts/preprod-perf.mjs` (`PERF_SHIFTS=1`, `PERF_LCP=1`).
- Faire (6.14.152, démarrage) : la coque ne rend que la navigation de la largeur courante (barre latérale dès 768 px, barre d'onglets
  au-dessous) ; les groupes du menu apparaissent en une fois, à l'arrivée de la fiche du joueur (le pied de barre reste), et la place
  du rang de la barre réduite est réservée ; une fenêtre rare montée dans `AppShell` (annonce, bilan, Ctrl+K…) se monte après le
  premier rendu de la page (`useDeferredExtras`), en lisant son état dans son magasin. Le contenu du jeu et la fiche du joueur sont
  demandés par `index.html` (`earlyData.ts`) et le code de la page ouverte y est préchargé (`page-preload-plugin.ts`) : une
  nouvelle page du jeu s'ajoute à `GAME_ROUTE_PAGES` (`src/lib/gameRoutes.ts`). Mesure : `PERF_TRACE=1`.
- Faire : libellés en capitales en `font-mono` (ou `hud-eyebrow`) ; les titres en `hud-title`, les boutons et onglets en `font-display`.
- Faire : `prefers-reduced-motion` est respecté partout (`MotionConfig reducedMotion="user"` dans `App`, pulsations Tailwind coupées).
- Faire : animer pour signaler un état (alerte qui clignote, balayage = chargement) et respecter `prefers-reduced-motion`.
- Éviter : `rounded-lg border px-2 py-1 text-[11px]` écrits à la main → `HudChip`.
- Éviter : encadrés `rounded-lg border bg-x/10 p-3` → `HudCallout`.
- Éviter : gros arrondis, ombres douces, pilules, plusieurs glows forts dans une même vue. Les cercles restent pour ce qui est
  rond par nature (planètes, radar, halos, points d'état, particules).
- Faire : une date ou une heure par `formatDateTime(ms, style, zone)` (`@/lib/utils`), jamais `toLocale*String` dans un composant.
  `zone = "server"` (heure de Paris) pour un rendez-vous fixé par le serveur (boss, maintenance, casino, Chroniques, Gazette,
  agenda, guerre de territoire) ; `"local"` (défaut) pour un moment propre au joueur (arrivée de flotte, message, journal, historique).
- Faire : un décompte en direct lit `useNowTicker()` ; un état qui change à la minute lit `useNowEvery(30_000)` (même horloge,
  rendu seulement au changement de pas). Une animation qui suit le temps (flottes de la Galaxie, 6.14.86) lit `useNowEvery(1000)`
  et lisse le pas par une transition CSS d'une seconde, linéaire. Un `setInterval` reste permis pour recharger des données
  (classement, statut).
- Garde-fous (`src/lib/designSystem.test.ts`) : couleurs hex, pastilles arrondies, `rounded-2xl/3xl` et (6.14.83) `rounded-md/lg/xl`,
  `shadow-lg/xl/2xl`, pilules `rounded-full` + `px-*`, capitales hors mono, `toLocaleString` sur un nombre, boîtes natives du
  navigateur ; (6.14.82-83) emoji dans un `.tsx`, texte sous 11 px hors admin, `text-slate-600` sur un texte, `toLocale*String`
  hors `formatDateTime`, `setInterval(() => setNow(…))`, `useEffect` sans accolades (aussi la règle eslint `no-restricted-syntax`,
  en erreur partout depuis 6.14.86) ; (6.14.156) plancher de 11 px aussi dans `index.css` (décor du thème Signal excepté). Un fichier
  pas encore repris peut devenir une exception comptée (cliquet : le compte ne peut que baisser) ; depuis 6.14.156 (admin, vue cockpit,
  accueil, Succès repris), il n'y en a plus. Restent des exceptions par fichier, raison écrite dans le test : scènes dessinées en SVG
  ou canvas, rapport imprimé, logo Google, aperçu d'e-mail. Un emoji qui est une donnée de l'admin (palette, valeur par défaut) se
  range dans un `.ts` (`src/pages/admin/emojiData.ts`).
