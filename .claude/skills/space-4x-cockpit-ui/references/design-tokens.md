# Design tokens

## Couches
1. **Primitifs** : échelle brute (space-950…500, text-100…600, accent).
2. **Sémantiques** : `--accent`, `--ok`, `--warn`, `--danger`, `--gold`, `--surface`, `--border`.
3. **Composants** : `--panel-bg`, `--panel-border`, `--glow`.
Les thèmes ne redéfinissent que les couches 1-2 via `html[data-theme="..."]`.

## Exemple Tailwind v4
```css
@import "tailwindcss";
@theme inline {
  --font-display: var(--th-font-title);
  --font-sans: var(--th-font-body);
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --color-space-950: var(--th-space-950);
  --color-space-900: var(--th-space-900);
  --color-space-800: var(--th-space-800);
  --color-accent: var(--th-accent);
  --color-ok: var(--th-ok);
  --color-warn: var(--th-warn);
  --color-danger: var(--th-danger);
  --radius-md: 2px;
}
html[data-theme="frontier"] {
  --th-space-950: #05080f; --th-space-900: #0b1220; --th-space-800: #121c2f;
  --th-accent: #38e1ff; --th-ok: #3dffa8; --th-warn: #ffb020; --th-danger: #ff4d5e;
  --th-font-title: "Chakra Petch", sans-serif; --th-font-body: "Inter", sans-serif;
}
```

## Autres tokens
- **Espacement** : base 4px ; panneaux padding 12/16/24.
- **Durées** : micro 120ms, standard 220ms, entrée de panneau 450ms, ambiance 6-30s.
- **Easings** : `cubic-bezier(.2,.8,.2,1)` (sortie douce), `cubic-bezier(.7,0,.3,1)` (entrée/sortie nette).
- **Z-index** : fond 0, contenu 10, HUD 20, overlays 30, modales 40, toasts 50.
- **Breakpoints** : 390 / 768 / 1024 / 1440.
