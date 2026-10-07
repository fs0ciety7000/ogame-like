# Revues AU9 (unités : hangars, Atelier, Cale sèche, modules) et AU10 (flottes : missions, expéditions, emplacements, « Relancer »)

Date : 2026-10-07. Lots AU9 et AU10 de `docs/proposals/feuille-de-route-2026-hiver.md`.
Sources : code (`hangar.ts`, `workshop.ts`, `modules.ts`, `cancel.ts`, `missions.ts`, `expeditions.ts`, `fleets.ts`, `CancelJobButton.tsx`,
`DockPanel.tsx`, `ModulesTab.tsx`) ; interface (Unités, Bâtiments, Atelier, Missions, Expéditions) à 375 px et 1 400 px, Constellation ;
données de production non relues (Q3).

## Constats

| # | Gravité | Constat | Preuve | Suite |
|:--|:--|:--|:--|:--|
| UNI-1 | 🟡 | Fenêtre d'annulation : le texte dit « dans la première minute » alors que le délai de grâce est réglable (`cancel.graceMs`) | `CancelJobButton.tsx` | **corrigé en 6.9.6** (durée calculée) |
| UNI-2 | ℹ️ | Cale sèche, modules (fusion, préréglages) et annulations : confirmations en place | `DockPanel.tsx`, `ModulesTab.tsx`, `CancelJobButton.tsx` | rien |
| UNI-3 | ℹ️ | Invariants I1 à I5 et I8 tenus (tests `caleSeche`, `workshop`, `actions`) ; règles des modules, de la Cale sèche et de l'annulation réglables (registre 6.9.1) | tests | rien |
| FLO-1 | ℹ️ | XP des missions : chaque mission a la sienne (onglet Missions) ; `MISSION_XP_PER_HOUR` ne sert qu'à la suggestion de l'éditeur | `forms.tsx` | rien |
| FLO-2 | ℹ️ | Emplacements de flotte (I12), expéditions, rappel confirmé (6.9.4) : en place | `fleetSlots.test.ts` | rien |
| FLO-3 | ℹ️ | 5 pages sans défilement horizontal ni erreur | captures | rien |

## Décisions
Aucune.
