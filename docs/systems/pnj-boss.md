# Menaces PNJ : pirates, seigneurs, primes, boss

## Pirates et factions (6)
Confrérie du Vide, Syndicat Gravhorn, Inquisition de l'Aube Blanche, Cartel Néon, Meute d'Ysgrim, Chœur Silencieux.
Ultimatum → tribut ou raid ; notoriété ; repaire attaquable ; traités (pacte 2 h, escorte 4 h, embargo) de 7 jours.
Repaire : ouvert après **3 raids repoussés** (toutes les factions, 6.6), ou par **« Localiser »** dès 1 raid repoussé contre 12 h de
production (`locateLair`, `LAIR_LOCATE_RULES`).
Raids adaptatifs : +4 % par raid repoussé, −10 % par défaite (×0,9 à ×1,5), cible ≈ 70 % repoussés.

## Seigneurs de guerre
Puissance visée : faibles 0,3–0,5 × médiane, moyens 0,6–0,9, forts 1,0–1,3 × meilleur ; croissance 8 %/j ; jamais plus de 1,5 × la meilleure défense.
Attaque toutes les 48 h ± 6 h, cible protégée 72 h, butin ≤ 6 h de production. Rangs I à V (menace), traits, coalitions (seuil ×1,5),
vendettas (6 h de production, 72 h), unités d'élite.

## Primes Kesh'Vaar
Traqueur Kesh (plan du Comptoir) : +50 % d'attaque contre tous les PNJ (`KESH_PVE_BONUS`, attaque et défense), 20 niveaux par sa
technologie (+10 attaque et défense par niveau, 6.6). « Relancer » une prime remplie vise la suivante du même palier.
4 par jour, rafraîchies toutes les 8 h ; 4 paliers (10 à 120 Ambre) ; rangs de Larve à Main de la Reine ; proie d'élite hebdo (assaut toutes les 12 h).

## Boss
| Boss | Rythme | Points de structure |
|:--|:--|:--|
| Boss mondiaux (6 en rotation : Léviathan, Matriarche, Titan de rouille, Spectre du Chœur, Cométophage, Abyssal ; 6.14.149 : semaine au rang du catalogue entier, un boss désactivé laisse sa semaine au suivant activé sans décaler les autres) | hebdo, 72 h | 4 × puissance d'attaque des actifs |
| Boss de saison (chronique) | mardi 18 h, 48 h (6.7) : dernier mardi du mois si le boss mondial est mensuel, sinon chaque mardi libre entre deux boss mondiaux | réglable |
| Boss d'alliance | appelé (3 h de production), 24 h | 2,5 × puissance des membres |
Phases : riposte sous 50 %, bouclier et faiblesse sous 25 %. Pertes 8 % par assaut (réparables).

## Code et admin
`pirates.ts`, `warlords.ts`, `warlordRanks.ts`, `coalition.ts`, `bounties.ts`, `leviathan.ts`, `worldBosses.ts`, `allianceBoss.ts`, `chronicles.ts`.
Admin : Factions, Seigneurs, Boss mondiaux, Boss de saison, Boss d'alliance, Planificateur.

## État (audit 2026-10-06)
- Système riche, beaucoup de rendez-vous simultanés (boss hebdo + saison + alliance + élite + vendettas + raids) : charge mentale élevée (audit Q1).

## Revue AU1 (2026-10-06)
Constats PNJ-1 à PNJ-9 dans `docs/audit/2026-10-06-au1-menaces-pnj.md` : attaque non plafonnée de la techno admin `tech19_2`,
Traqueur Kesh au-delà de son niveau maximal, aucun repaire ouvert (raids trop rares), unités d'élite jamais débloquées. Décisions A à D
livrées en 6.6.0 (`docs/changes/6.6.0-menaces-pnj.md`).

## Revue AU2 (2026-10-06)
Constats BOSS-1 à BOSS-5 dans `docs/audit/2026-10-06-au2-boss.md` : structure des boss gonflée par `tech19_2`, taux de boss tués
(mesuré depuis la 6.14.6 : Admin → Équilibrage → Santé de l'équilibre, boss abattus par type sur 56 jours, participants et dégâts
médians, lus dans le Hall of fame), calendrier chargé en fin de semaine (lot V, livré en 6.7.0 : boss de la chronique le mardi, tournoi le mercredi) ; décompte de la
page Boss corrigé sur mobile.

6.14.107 (AE-L4, AE-10) : la santé de l'équilibre mesure aussi les **heures entre l'ouverture et la mort** des boss abattus
(médiane et quartiles, par type et tous types réunis, d'après `startMs` et `endedAtMs` du Hall of fame). Cible : 60 à 80 % abattus,
mort entre 36 et 60 h (seuils `balanceHealth.bossKillLow/High`, `bossKillHoursLow/High`) ; décision `hpFactor` en AE-L7 (Q101).

## 6.14.125 (revue AU27, lot AA7, AA-20)
- Fugitifs dans la fiche de faction (`FactionDef.fugitives`, Contenu → Factions → « Fugitifs (primes Kesh'Vaar) ») : le tableau des
  primes les lit dans l'ordre des factions (`bountyFugitives`) ; 22 fugitifs livrés, mêmes indices qu'avant ; une fiche enregistrée
  sans fugitifs prend ceux de la faction livrée (migration `faction-fugitives-6.14.125`) ; une faction ajoutée apporte les siens.
  Les fugitifs d'élite restent une liste du code (`ELITE_FUGITIVES`).
- Archétype de repli (`factionArchetype`, `chapterArchetypes`) : une faction active sans archétype de chapitre peut être l'antagoniste
  d'un chapitre ou d'une saga, et la faction d'un thème du passe. Reste fermé : l'origine d'un seigneur (`WarlordOrigin`).
