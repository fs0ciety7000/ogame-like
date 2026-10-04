# Animations

## Catalogue
| Nom | Usage | Technique | Durée |
|---|---|---|---|
| Boot sequence | connexion / entrée dans le hub | stagger Framer Motion : panneaux apparaissent bord → centre, lignes qui se tracent | 1.2-2s, une fois |
| Panel enter | ouverture d'un MFD | opacity + translate 8px + clip-path qui s'ouvre | 350-450ms |
| Scan sweep | chargement, sélection | gradient linéaire qui traverse | 1.6s loop, local |
| Decode text | nouvelle donnée, titres | caractères aléatoires qui se résolvent | 400-700ms |
| Number tick | ressources | interpolation `requestAnimationFrame`, police tabulaire | 600ms |
| Pulse alert | danger, attaque entrante | halo/opacité 1.8s ease-out | loop tant qu'actif |
| Glitch | erreur, transition de faction | 2-3 frames de décalage RGB / clip | < 250ms |
| Parallaxe verrière | mouvement souris/gyro | translate par couches (3 max) | continu, throttlé |
| Star drift | fond | CSS transform lent / canvas | 20-60s |

## Code de base
```tsx
const panel = {
  hidden: { opacity: 0, y: 8, clipPath: "inset(0 0 100% 0)" },
  show: { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)",
          transition: { duration: .4, ease: [.2,.8,.2,1] } },
};
```
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
```

## Garde-fous
- Animer `transform` et `opacity` uniquement ; éviter width/height/top.
- Pas plus de 3 animations en boucle simultanées visibles ; mettre en pause hors écran (`IntersectionObserver`) et onglet masqué.
- Tout effet décoratif doit être désactivable (réduction des animations) ; le glitch ne doit jamais rendre un texte illisible > 250ms.
- Mesurer : 60 fps desktop, pas de long task > 50ms au chargement du hub.
