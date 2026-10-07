# Atelier et Cale sèche

Référence complète : GDD `docs/GAME_DESIGN.md` §7.2 et §7.3, proposition livrée `docs/proposals/cale-seche.md`.

## En bref
- Atelier : sauve 5 %/niv. des unités détruites (70 % au niv. 20, plafond global 85 % avec les bonus, réglable : `combat.repairCap`) ; répare 30 PV/s au niv. 1, +25 %/niv.
- Cale sèche : 1 000 postes/niv. hors hangar ; prêts remis en service selon la place ; paliers Triage (5), remise automatique (10), priorités (15), Cale orbitale (20).
- Accélérations : Nanoréparation, Mécanicien, Clé de soudure, Vaisseaux-ateliers, Ambre (1 Ambre / 10 min), Analgésique.

## Code et admin
`workshop.ts`, `hangar.ts`, `WorkshopPanel.tsx`, `DockPanel.tsx`. Admin : Règles → Combat (Atelier, Cale sèche) ; Contenu → Bâtiments.

## État (audit 2026-10-06)
- Livré en 5.28.0. À suivre : taux de hangars en surcharge, usage du Triage.
- 5.28.1 : remise automatique aussi au retour des flottes (C2) ; les « prêts » existent sans Cale sèche (épave d'expédition, C1) et s'affichent dans l'onglet Atelier.
- Le taux de sauvetage très haut en fin de partie pose une question d'équilibre (voir `combat-jcj.md`, audit E2).
