# Proposition : feuille de route d'automne 2027

Statut : **close** (2026-10-07, AU16 : `docs/audit/2026-10-07-au16-automne.md`), suite dans `feuille-de-route-2027-hiver.md`. Ouverte à la clôture d'AU15. Règle n° 3 : les lots s'enchaînent sans attendre ; ceux qui demandent la production,
`main` ou une PR sont sautés et notés (Q12).

## Planning

| # | Lot | Contenu | Taille | État |
|:--|:--|:--|:--|:--|
| 1 | Z0 | Mise en production de `claude/hiver-k-s` (repris de l'été) | S | en attente de l'utilisateur (Q12) |
| 2 | Z1 | Mesures de production (reprises), plus les attaques de colonie bloquées avant la 6.11.1 (ET-2) | S | en attente d'un accès (Q12) |
| 3 | A2 | Formules et Statistiques sous 5 000 px à 375 px (ET-4) : sections repliées ou onglets | S | livré en 6.11.6 (1 265 et 4 215 px) |
| 4 | A3 | Seigneurs, Profil et Missions sous 5 000 px à 375 px (ET-4) | S | livré en 6.11.7 (3 114, 2 929 et 4 967 px) |
| 5 | Z6 | Performance selon les Web Vitals de production (Q8) | M | dépend de Z1 |
| 6 | AU16 | Revue d'automne, même grille | M | livré en 6.11.8 |

## Méthode des lots A2 et A3
- Mesure avant et après avec `pagelen.mjs` (joueur neuf, 375 px, Constellation).
- Ne rien retirer : replier ce qui sert peu (`FoldSection`), mettre en onglets ce qui se lit séparément (`Tabs`), compacter sous `sm`.
- Audit DESIGN.md des fichiers touchés, vérification sans défilement horizontal.
