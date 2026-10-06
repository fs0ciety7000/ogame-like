# Docs : captures d'écran en thème Constellation

Type : docs
Statut : livré (branche `claude/hiver-k-s`)
Proposition : aucune

## Demande
> « Pour tous les futurs screenshots de sortie etc, appliquer le thème "Constellation" »

## Ce qui change
- CLAUDE.md (règles du front) : toute capture d'écran se fait en thème Constellation, posé par
  `localStorage.setItem("cosmic-empires:theme", "constellation")` dans un `addInitScript` de Playwright.

## Décisions et écarts
Le thème est un réglage par appareil (`src/lib/theme.ts`) : rien à changer dans le jeu, seulement dans les scripts de capture.
