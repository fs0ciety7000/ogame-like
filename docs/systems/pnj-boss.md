# Menaces PNJ : pirates, seigneurs, primes, boss

## Pirates et factions (6)
Confrérie du Vide, Syndicat Gravhorn, Inquisition de l'Aube Blanche, Cartel Néon, Meute d'Ysgrim, Chœur Silencieux.
Ultimatum → tribut ou raid ; notoriété ; repaire attaquable ; traités (pacte 2 h, escorte 4 h, embargo) de 7 jours.
Raids adaptatifs : +4 % par raid repoussé, −10 % par défaite (×0,9 à ×1,5), cible ≈ 70 % repoussés.

## Seigneurs de guerre
Puissance visée : faibles 0,3–0,5 × médiane, moyens 0,6–0,9, forts 1,0–1,3 × meilleur ; croissance 8 %/j ; jamais plus de 1,5 × la meilleure défense.
Attaque toutes les 48 h ± 6 h, cible protégée 72 h, butin ≤ 6 h de production. Rangs I à V (menace), traits, coalitions (seuil ×1,5),
vendettas (6 h de production, 72 h), unités d'élite.

## Primes Kesh'Vaar
4 par jour, rafraîchies toutes les 8 h ; 4 paliers (10 à 120 Ambre) ; rangs de Larve à Main de la Reine ; proie d'élite hebdo (assaut toutes les 12 h).

## Boss
| Boss | Rythme | Points de structure |
|:--|:--|:--|
| Boss mondiaux (6 en rotation : Léviathan, Matriarche, Titan de rouille, Spectre du Chœur, Cométophage, Abyssal) | hebdo, 72 h | 4 × puissance d'attaque des actifs |
| Boss de saison | mensuel (Chroniques) | réglable |
| Boss d'alliance | appelé (3 h de production), 24 h | 2,5 × puissance des membres |
Phases : riposte sous 50 %, bouclier et faiblesse sous 25 %. Pertes 8 % par assaut (réparables).

## Code et admin
`pirates.ts`, `warlords.ts`, `warlordRanks.ts`, `coalition.ts`, `bounties.ts`, `leviathan.ts`, `worldBosses.ts`, `allianceBoss.ts`, `chronicles.ts`.
Admin : Factions, Seigneurs, Boss mondiaux, Boss de saison, Boss d'alliance, Planificateur.

## État (audit 2026-10-06)
- Système riche, beaucoup de rendez-vous simultanés (boss hebdo + saison + alliance + élite + vendettas + raids) : charge mentale élevée (audit Q1).

## Revue AU1 (2026-10-06)
Constats PNJ-1 à PNJ-9 dans `docs/audit/2026-10-06-au1-menaces-pnj.md` : attaque non plafonnée de la techno admin `tech19_2`,
Traqueur Kesh au-delà de son niveau maximal, aucun repaire ouvert (raids trop rares), unités d'élite jamais débloquées. Décisions :
`docs/proposals/menaces-pnj.md`.

## Revue AU2 (2026-10-06)
Constats BOSS-1 à BOSS-5 dans `docs/audit/2026-10-06-au2-boss.md` : structure des boss gonflée par `tech19_2`, taux de boss tués non
mesuré, calendrier chargé en fin de semaine (lot V) ; décompte de la page Boss corrigé sur mobile.
