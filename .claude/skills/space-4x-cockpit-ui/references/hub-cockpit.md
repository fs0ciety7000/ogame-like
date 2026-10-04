# Hub cockpit

## Anatomie (desktop ≥ 1024px)
```
┌ barre supérieure : ressources (métal, cristal, deutérium, énergie) + horloge + alertes ┐
│ rail gauche      │   VERRIÈRE (centre)               │ rail droit        │
│ navigation       │   carte galaxie / planète /       │ MFD à onglets :   │
│ (icônes+libellés)│   vaisseau en 3D/parallaxe        │ flottes, file,    │
│                  │   réticules, marqueurs, scan      │ événements, chat  │
├ console basse : actions rapides, file de construction, minimap, statut vaisseau ──────┤
```
Mobile : verrière en haut (hauteur 40vh), MFD en onglets plein écran, nav en barre basse, console réduite en bottom sheet.

## Composants à construire
1. `Panel` (variantes : verre, plein, alerte ; coins coupés ; en-tête avec micro-texte).
2. `Button` (primary/ghost/danger, états hover/focus/active/disabled/loading, effet de balayage).
3. `ResourceCounter` (nombre mono animé, delta +/-, jauge de stockage, couleur d'alerte si plein).
4. `RadialGauge`, `BarGauge`, `Sparkline`.
5. `MfdTabs` (Radix Tabs, indicateur lumineux, transition de contenu).
6. `Viewport` (fond étoilé canvas/CSS, parallaxe souris, vignette, scanlines, marqueurs positionnés).
7. `TargetReticle` / `CornerBrackets` pour la sélection.
8. `QueueItem` (progression, temps restant, annulation).
9. `AlertToast` (Sonner) avec pulsation selon gravité.
10. `DecodeText` (texte qui se décode à l'arrivée), `StatusDot`, `Tooltip` techniques.
11. `BootSequence` : séquence d'allumage du cockpit à la connexion (voir animations).

## Règles de composition
- Un seul élément « héros » animé en continu (la verrière) ; le reste réagit aux événements.
- Alertes : toujours visibles sans masquer la verrière (rail ou toast), jamais uniquement par la couleur.
- Chaque panneau a un état vide, de chargement (squelette scanné) et d'erreur.
- Les actions critiques (attaque, destruction) demandent confirmation dans un dialog dédié rouge.
