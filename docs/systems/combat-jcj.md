# Combat et JcJ

## Rôle
Résout attaques entre joueurs, raids PNJ, boss. Moteur en tours (5.18), dégâts persistants (5.20).

## Règles et chiffres
| Élément | Valeur |
|:--|:--|
| Tours | 8 au plus ; PV = résistance × 30 ; retraite à 50 % de PV perdus (30 % en Prudente) |
| Victoire | défenseur sous 20 % de ses PV, ou +30 % d'avance au dernier tour |
| Défenseur | +25 % de puissance (6.14.72, +15 % avant) ; bouclier 0,75 %/niv. de hangar de défense (max 15 %) + générateur ; vaisseaux à quai engagés à 75 % (6.14.72, 50 % avant ; Riposte 100 %, Bunker 0 %). À budget égal, un défenseur moitié défenses, moitié vaisseaux tient jusqu'à ×0,90 de sa dépense (×0,75 avant), des défenses seules jusqu'à ×2,35 (`pvpBudget.ts`, invariant I29) |
| Formations | Assaut (+10 % ATK, +15 % pertes), Prudente (−10 % ATK, −25 % pertes), Raid (−15 % ATK, +30 % soute) |
| Butin | 30 % des communes (6.2), 8 % des rares, sur le stock exposé (hors part à l'abri) ; soute de pillage = 2 × la soute des survivants (6.2) ; match nul 30 % du butin |
| Pertes | défenses reconstruites à 60 % (70 % avec les Casemates, palier 20 du hangar de défense, planète mère, 6.14.145) ; vaisseaux sauvés par l'Atelier (jusqu'à 85 % avec bonus depuis la 6.2, 95 % avant) ; débris 30 % du coût, 48 h |
| Protections | 2 h entre deux attaques sur la même cible ; bouclier 3 h après une défaite (6.14.72, 1 h avant) ; débutant 72 h (levée si on attaque) ; écart d'XP : butin et XP dégressifs dès ×3, attaque refusée à ×10 (6.14.72, ×12 avant ; Q100) ; **4 défaites en défense sur 24 h** (toutes planètes, tous attaquants) : plus aucune attaque, joueur ou seigneur, jusqu'à ce que la plus ancienne ait 24 h ; décollage refusé, flotte en vol renvoyée sans combat avec la notification « Cible protégée » ; la notification de la 4e défaite le dit au défenseur (6.14.106, `pvp.maxDefeatsPer24h`, 0 = sans limite, invariant I33) |
| XP | perte en défense plafonnée à 60 par 24 h |
| Lune (6.13) | un combat sur la planète mère laissant au moins 100 000 de débris : 1 % de chance par tranche de 100 000, 20 % au plus ; une lune par joueur, permanente : +3 % de bouclier, +5 % d'entrepôt à l'abri (couche empire) ; 6.14 : niveaux 1 à 5, +2 % de bouclier par niveau (11 % au niveau 5), 500 k ferraille + 250 k énergie ×2 par niveau (dès la bascule du rythme, 1er novembre 2026, 6.14.88 : **20 M + 10 M ×3** par niveau et **2 M** de débris pour 1 % de chance, AE-9) ; 6.14.3 : succès « Clair de lune » et « Lune pleine » ; 6.14.44 : pitié lunaire, +5 % par combat subi sur la planète mère sans lune (attaquant joueur), lune garantie au 20e (`moonPity`, `MOON_RULES.pityPerDefense`) |
| Phalange (6.14.44, moteur) | radar d'alliance, perce-brouillard (vraie composition au niveau 2, stimulant au niveau 4, pour la cible seulement), balayage de l'agresseur (30 min d'énergie, 1 000 au moins ; recharge 30 → 10 min) ; portée 15 par niveau, + `phalanxRange` (plafond 50 %) ; invariant I22. 6.14.48 (serveur) : `POST /api/cosmic/moon/phalanx` (état, flottes percées, alliés menacés), `moon/scan` (balayage), radar au lancement d'une attaque de joueur ; 6.14.49 : interface (panneau Lune, Alliés menacés, Galaxie) ; 6.14.69 : relique **Lentille de Séléné** (+20 % de portée en épique, × 2 le bonus de rareté), succès « Œil de la lune » (1 balayage) et « Vigie » (50), Codex `legend:phalange`, défi d'alliance « Les vigies » (garnisons + balayages) |
| Porte de saut (6.14.44, moteur) | dès le niveau 3 : rapatriement instantané d'une patrouille, garnison ou base avancée ; recharge 24 h, 22 h, 20 h (6 h au moins), − `jumpGateCooldown` (plafond 30 %) ; invariant I23. 6.14.48 : `POST /api/cosmic/fleet/jump { fleetId }` (retour par `resolveFleetReturn`) ; sauvetage `gateSaves` si une attaque de joueur est repoussée sur la planète mère moins de `saveWindowMinutes` (10) après le saut ; 6.14.69 : relique **Clé du seuil** (−15 % de recharge en épique, × 1,5), succès « Saut de l'ange » (1 saut), « Maître du seuil » (25, titre « Gardien du seuil »), secret « Retour fracassant » (1 sauvetage), Codex `legend:porte_saut`, recharge dans « Prochaines fins ». 6.14.70 : essai réel sur la pré-prod (`scripts/preprod-essai-lune.mjs`) ; écran Flottes : vraie composition d'une attaque percée. 6.14.77 : après un saut, une seule notification (« Saut réussi ») : le retour habituel est tu (`resolveFleetReturn(…, quiet)`), les remises en service automatiques restent notifiées |

- Paliers des hangars (6.14.145, mesure `pvpBudget`) : Casemates sans effet sur l'issue (seuils ×0,90 et ×2,35 inchangés) ; part de la
  dépense en défenses perdue pour de bon −25 % (défenses seules au seuil 17,8 → 13,4 %, mixte à dépense égale 20,4 → 15,3 %). Hors
  modèle : Réacteurs (−5 % de vol), +1 emplacement de flotte, baies modulaires (10 % de places), Entretien réduit ; à suivre après la
  mise en production (victoires de l'attaquant, raids repoussés).

## Code et admin
`combat.ts`, `attack.ts`, `pvp.ts`, `formations.ts`, `debris.ts`, `moon.ts`, `phalanx.ts`, `jumpGate.ts`. Admin : Règles → Combat, JcJ, Lunes ; groupes `phalanx` (« Lunes : phalange ») et `jumpGate` (« Lunes : porte de saut ») dans Règles → Lunes (sections dédiées depuis la 6.14.69, `MoonRulesFields.tsx`) et Tous les réglages ; santé des lunes dans Équilibrage (part des actifs avec lune, nées par pitié, balayages, sauts, sauvetages ; 6.14.77 : victoires de l'attaquant contre une cible avec ou sans lune sur 30 jours, `moonPvpHealth`, d'après `battle_reports.defenderMoonLevel` : niveau de la lune du défenseur avant le combat, 0 sans lune, vide pour un rapport plus ancien, écarté des deux taux) ; simulateur « et si ».

## État (AU27, 2026-10-07)
- AE-6 à AE-8 (lot AE-L1, 6.14.72) : défense à domicile renforcée, bouclier de 3 h, écart d'XP ×10. À mesurer 30 jours après la mise en
  production : victoires de l'attaquant (74 %, cible 55 à 65 %), combats JcJ par jour (2,1), raids de faction repoussés (79 %, cible 60 à
  80 % : les vaisseaux à quai défendent aussi contre les PNJ). Défaites par 24 h livrées en 6.14.106 (`pvp.maxDefeatsPer24h` = 4, lot AE-L3, Règles → Protections), à mesurer avec le reste.
  Proposition : `docs/proposals/equilibrage-au27.md`.

## État (audit 2026-10-06)
- Attrition : sauvetage plafonné à 85 % (6.2). Butin : 30 % du stock exposé, soute ×2 (6.2), avec l'abri limité à 8 h de production (5.32). À suivre dans Admin → Équilibrage → Santé de l'équilibre (audit E1, E2).
