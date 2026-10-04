---
name: space-4x-cockpit-ui
description: Conçoit une interface complète de jeu 4X / conquête spatiale façon cockpit de vaisseau - design system, tokens (palettes, typos, espacements), composants React, animations, HUD, écrans hub, dans l'esprit des sites Cyberpunk 2077, Star Citizen, GTA VI. À utiliser dès que l'utilisateur parle de design system de jeu, HUD, cockpit, interface sci-fi, UI de jeu spatial/4X/OGame, direction artistique gaming, animations de jeu, palette néon ou composants "futuristes", même sans citer le mot "skill".
---

# Space 4X Cockpit UI

Objectif : produire une interface de jeu qui donne l'impression d'être aux commandes d'un vaisseau, pas de naviguer sur un site web. Le hub est un cockpit : un centre vivant (la galaxie, l'empire) entouré d'instruments qui donnent de l'information et réagissent.

## Pourquoi ces références

- **Cyberpunk 2077** : contraste extrême (noir + un accent saturé), typographie condensée en capitales, glitch, coins coupés, bruit/scanlines, micro-texte technique en décoration.
- **Star Citizen** : HUD holographique crédible, panneaux translucides à bordures fines, données denses mais hiérarchisées, teinte froide, MFD (écrans multifonction) à onglets.
- **GTA VI** : gradients chauds saturés, grosse typo éditoriale, cinéma plein cadre, parallaxe, rythme de scroll/révélation.

Ne copie jamais logos, polices propriétaires ni visuels : extrais les principes (voir `references/direction-artistique.md`) et crée une identité propre au jeu.

## Workflow

1. **Cadrer** (poser au plus 3 questions, sinon choisir un défaut et le dire) : nom/ton du jeu, faction ou ambiance dominante, stack existante. Si un repo est présent, lire d'abord ses tokens, composants UI et `package.json` : étendre l'existant plutôt que le doubler.
2. **Choisir la direction** : une accroche en une phrase (ex. « cockpit militaire froid, un accent ambre d'alerte ») et UNE palette dominante + un accent. Trop d'accents = perte du côté cockpit.
3. **Poser les fondations** dans cet ordre : tokens (`references/design-tokens.md`) → primitives (panel, bouton, jauge, badge, onglets) → composants de jeu (ressources, file de construction, flotte, carte) → hub → écrans secondaires.
4. **Construire le hub cockpit** (`references/hub-cockpit.md`).
5. **Animer avec parcimonie** (`references/animations.md`).
6. **Vérifier** : lancer l'app, capturer le hub en 1440px et 390px, contrôler contraste, lisibilité des nombres, `prefers-reduced-motion`, performance. Corriger avant de livrer.

## Principes non négociables (et pourquoi)

- **Un centre, des instruments** : le regard doit avoir un point focal (carte, planète, vaisseau). Sans lui, c'est un dashboard.
- **Densité hiérarchisée** : un 4X est un jeu d'information. Trois niveaux typographiques max par panneau (valeur, libellé, micro-texte). Les nombres sont toujours en police mono tabulaire pour ne pas sauter à l'actualisation.
- **La couleur porte du sens** : accent = interactif, vert = positif, ambre = attention, rouge = danger, or = prestige. Ne jamais décorer avec une couleur sémantique.
- **Forme = identité** : coins coupés ou quasi droits, bordures 1px, pas de gros arrondis ni d'ombres douces de SaaS.
- **Le mouvement signale un état** : pulsation = alerte, balayage = chargement/scan, décodage de texte = arrivée d'une donnée. Pas d'animation gratuite en boucle sur beaucoup d'éléments.
- **Accessibilité** : contraste texte ≥ 4.5:1 même sur fond translucide, focus visible stylé, `prefers-reduced-motion` respecté, ne jamais encoder une info par la couleur seule.
- **Responsive** : le cockpit se replie en pile de panneaux + barre de navigation basse sur mobile ; ne pas tout cacher, hiérarchiser.

## Stack par défaut

React + TypeScript, Tailwind v4 (tokens via `@theme` et variables CSS, thèmes par `data-theme`), Radix UI pour l'accessibilité (dialog, tabs, tooltip), CVA + `tailwind-merge` pour les variantes, Framer Motion pour les transitions, Canvas/SVG/CSS pour l'ambiance (étoiles, grille, scanlines). Si le projet utilise autre chose, s'y adapter.

## Livrables attendus

- Fichier de tokens (couleurs, typos, rayons, ombres/glows, durées/easings) avec au moins 2 thèmes si demandé.
- Composants documentés par une page de démo (`/design-system` ou équivalent) montrant tous les états : normal, hover, focus, actif, désactivé, chargement, erreur.
- Hub cockpit responsive et animé.
- Court `DESIGN.md` : direction, règles d'usage des couleurs, do/don't.

## Références

- `references/direction-artistique.md` : principes extraits des références, typos, palettes prêtes à l'emploi.
- `references/design-tokens.md` : structure de tokens et exemple CSS/Tailwind v4.
- `references/hub-cockpit.md` : anatomie du hub et composants à construire.
- `references/animations.md` : catalogue d'animations, durées, code et garde-fous.
