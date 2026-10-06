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

Ne pas décorer avec une couleur sémantique. Un même cas garde la même couleur partout :
un chantier à l'arrêt (bâtiment, labo, chantier naval, missions) est une **action à mener**, donc `accent`,
sur l'accueil comme dans la file des chantiers ; un entrepôt plein est une **attention** (`ember`). Une info ne passe jamais par la couleur seule (texte ou icône en plus).

## Composants (`src/components/ui/hud.tsx`)

- **`HudChip`** : toute pastille d'état (en-tête, carte, liste). Capitales mono, coin coupé, bordure 1px.
  `tone`, `size="md"` (en-tête) ou `"sm"` (dans une carte), `alert` (point qui clignote : état en cours),
  `asChild` pour un `Link` ou un `button`. `HudTag` = `HudChip` statique en petite taille.
- **`HudCallout`** (ou classes `hud-callout hud-tone-*`) : encadré dans un panneau (menace, conseil, notice).
  Liseré gauche coloré, coin coupé ; `alert` pour une menace en cours.
- **`HudToaster`** (`src/components/ui/hud-toast.tsx`) : toasts sonner au style du HUD (coin coupé, liseré et icône
  de la couleur sémantique, titre en capitales, action en pastille). `toast.success/error/warning` prennent mint / danger /
  ember ; une notification de jeu passe `className: "hud-tone-…"` (ton de son type, `notificationStyle(kind).tone`).
- **`askConfirm`** (`src/components/ui/confirm-dialog.tsx`) : toute confirmation, jamais `window.confirm` / `alert` / `prompt`
  (boîte grise du navigateur, hors thème ; un test échoue). `await askConfirm({ title, message, details, confirmLabel, tone })` rend
  `true` si le joueur confirme. Titre = la question courte ; `message` = la conséquence ; `details` = coût, solde (`CostPill`).
  `tone` : `accent` (courant), `ember` (attention, bouton orange), `danger` (perte, suppression : bouton rouge), `gold` (dépense).
  Le verbe du bouton dit l'action (« Acheter », « Supprimer »), pas « OK ». Hôte unique `<ConfirmHost />` monté dans `App`.
- **`DialogContent`** (`src/components/ui/dialog.tsx`) : fenêtre modale (coin coupé, sans ombre ni arrondi), tiroir sur mobile.
- **`TooltipCard`** (`src/components/ui/tooltip.tsx`), dans un `TooltipContent` : infobulle structurée. Titre en capitales mono
  (+ icône), lignes `{ label, value, tone? }` alignées (valeurs en mono tabulaire), `sections` séparées par un filet, `note`.
  Une infobulle qui contient des chiffres passe par elle plutôt que par une phrase.
- **`HudSwitch`** : interrupteur on/off (réglages, vue cockpit). Les cases à cocher restent pour les sélections multiples.
- **`StatTile`** (`tone` = `HudTone`), **`StatBar`**, **`HudMeter`**, **`LevelTicks`**, **`EmptyState`**, **`CostPill`** : jauges et chiffres.
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

- Faire : nombres en `font-mono` tabulaire, formatés par `formatNumber` / `formatDecimal` / `formatCompact` (`@/lib/utils`), jamais
  `toLocaleString` sur un nombre ; trois niveaux de texte maximum par panneau ; coins coupés ou droits.
- Faire : libellés en capitales en `font-mono` (ou `hud-eyebrow`) ; les titres en `hud-title`, les boutons et onglets en `font-display`.
- Faire : `prefers-reduced-motion` est respecté partout (`MotionConfig reducedMotion="user"` dans `App`, pulsations Tailwind coupées).
- Faire : animer pour signaler un état (alerte qui clignote, balayage = chargement) et respecter `prefers-reduced-motion`.
- Éviter : `rounded-lg border px-2 py-1 text-[11px]` écrits à la main → `HudChip`.
- Éviter : encadrés `rounded-lg border bg-x/10 p-3` → `HudCallout`.
- Éviter : gros arrondis, ombres douces, pilules, plusieurs glows forts dans une même vue. Les cercles restent pour ce qui est
  rond par nature (planètes, radar, halos, points d'état, particules).
- Garde-fous (`src/lib/designSystem.test.ts`) : couleurs hex, pastilles arrondies, `rounded-2xl/3xl`, `shadow-lg/xl/2xl`,
  pilules `rounded-full` + `px-*`, capitales hors mono, `toLocaleString` sur un nombre, boîtes natives du navigateur.
