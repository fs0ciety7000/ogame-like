# Questions et décisions prises seul

Règle n° 3 de `CLAUDE.md` : on ne s'arrête plus pour demander. Chaque question, doute ou choix que l'utilisateur pourrait vouloir trancher
est noté ici avec le choix fait, puis le travail continue. On revoit ensemble ; une décision changée devient un lot (fiche `docs/changes/`).

Statuts : **ouverte** (choix provisoire appliqué), **validée**, **changée** (renvoie au lot qui la corrige).

| # | Date | Lot | Question | Choix fait (provisoire) | Revenir en arrière | Statut |
|:--|:--|:--|:--|:--|:--|:--|
| Q1 | 2026-10-06 | 6.8.1 | Budget du passe : 120 h (proposition) ou valeur de l'ancien gabarit ? | 140 h, Ambre plafonné à 350, jetons à 6 (l'ancien passe valait ~140 h et ~350 Ambre) | Admin → Règles → Passe généré | ouverte |
| Q2 | 2026-10-06 | 6.8.1 | Raids repoussés dans les défis du passe ? | Non par défaut (poids 0) : un défi bloque les suivants et le joueur ne choisit pas d'être attaqué | Poids « Raids repoussés » dans Passe généré | ouverte |
| Q3 | 2026-10-06 | AU3 | PRG-1 : d'où venaient les 1 200 points d'octobre en 6 jours ? | Non tranché : le traçage par source (6.8.0) le dira en novembre ; la lecture de la production demande un nouvel accès | — | ouverte |
| Q4 | 2026-10-06 | AU3 | PRG-2 : que gagner après le dernier palier (paliers bonus) ? | Rien de neuf pour l'instant : les points en trop restent convertis en Ambre (`PASS_OVERFLOW`) | — | ouverte |
| Q5 | 2026-10-06 | 6.8.2 | Faction du chapitre selon le thème du passe : suivre le rival du passe partout ? | 9 thèmes sur 12 suivent le rival ; bazar → Cartel, colonies → Meute, rempart → Inquisition (pas deux mois de suite la même faction, Meute et Inquisition reviennent) | Admin → Règles → Chroniques générées, faction par thème | ouverte |
| Q6 | 2026-10-06 | 6.8.2 | Budget des récompenses d'épisode ? | 10 h × difficulté (valeur de l'ancien gabarit) ; pas de jetons (déjà dans le bonus des Chroniques) | Admin → Règles → Chroniques générées | ouverte |
| Q7 | 2026-10-06 | 6.9.1 (avancée en 6.9.2 à 6.9.5) | 42 constantes numériques de règle restent dans le code (plafonds de la couche empire 50 % / 75 %, taxe du comptoir 5 %, 2 diplomates, 60 XP/h de mission, 300 Ambre du dernier palier…) | Converties domaine par domaine pendant les revues AU5 à AU12 (pas d'un bloc : chacune a des lecteurs à adapter) | — | ouverte |
