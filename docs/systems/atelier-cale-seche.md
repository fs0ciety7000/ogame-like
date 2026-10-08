# Atelier et Cale sèche

Référence complète : GDD `docs/GAME_DESIGN.md` §7.2 et §7.3, proposition livrée `docs/proposals/cale-seche.md`.

## En bref
- Atelier : sauve 5 %/niv. des unités détruites (70 % au niv. 20, plafond global 85 % avec les bonus, réglable : `combat.repairCap`) ; répare 30 PV/s au niv. 1, +25 %/niv.
- Cale sèche : 1 000 postes/niv. hors hangar ; prêts remis en service selon la place ; paliers Triage (5), remise automatique (10), priorités (15), Cale orbitale (20).
- Accélérations : Nanoréparation, Mécanicien, Clé de soudure, Vaisseaux-ateliers, Ambre (1 Ambre / 10 min), Analgésique.
- Paliers de l'Atelier (6.14.144, `docs/proposals/paliers-batiments.md`, réglables : Règles → « Bâtiments : paliers ») :
  5 · Cale sèche ouverte (prérequis de la Cale, affiché comme palier sur la carte de l'Atelier) ;
  10 · premiers soins (un lot dont la réparation restante tient en 15 min rentre aussitôt, au rattrapage suivant) ;
  15 · atelier spécialisé (une classe choisie, Faible, Moyen, Fort ou Soutien, réparée 50 % plus vite : file, délais affichés et coût
  en Ambre) ; 20 · réparation d'urgence (2 h de réparation offertes une fois par jour de Paris, bouton « Urgence » de la file, action
  `workshopFreeRush` ; rien n'est créé, les lots rentrent comme d'habitude). Le sauvetage ne monte pas (audit E2).

## Code et admin
`workshop.ts`, `hangar.ts`, `buildingTiers.ts`, `WorkshopPanel.tsx`, `DockPanel.tsx`. Admin : Règles → Combat (Atelier, Cale sèche),
Règles → « Bâtiments : paliers » ; Contenu → Bâtiments.

## État (audit 2026-10-06)
- Livré en 5.28.0. À suivre : taux de hangars en surcharge, usage du Triage.
- 5.28.1 : remise automatique aussi au retour des flottes (C2) ; les « prêts » existent sans Cale sèche (épave d'expédition, C1) et s'affichent dans l'onglet Atelier.
- Le taux de sauvetage très haut en fin de partie pose une question d'équilibre (voir `combat-jcj.md`, audit E2).
