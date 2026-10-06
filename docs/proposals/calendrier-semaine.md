# Proposition : rendez-vous étalés sur la semaine (lot V, constat Q4)

Statut : **livrée** (6.7.0, `docs/changes/6.7.0-calendrier-semaine.md`). Décision : B avec les réglages de C. Lot V de `docs/proposals/feuille-de-route-2026-hiver.md` §7 ; constats Q4 (audit global), BOSS-3
(`docs/audit/2026-10-06-au2-boss.md`).

## 1. Le problème vu par le joueur
« Le week-end, tout tombe en même temps ; du lundi au jeudi, il ne se passe rien. »

## 2. Calendrier actuel (heure de Paris)

| Rendez-vous | Quand | Durée |
|:--|:--|:--|
| Événement du week-end (bonus) | vendredi 18 h → dimanche | ~54 h |
| Boss mondial | serveur : vendredi 18 h, un week-end choisi du mois (`bossWeekend`) ; par défaut dans le code : rotation hebdomadaire, un jour différent chaque semaine | 72 h |
| Boss de la chronique | serveur : dernier week-end du mois ; en rotation : lendemain du boss mondial | 48 h |
| Tournoi du casino | à chaque ouverture du casino : le week-end (samedi et dimanche) | 48 h |
| Guerre de territoire | un week-end sur deux, fin dimanche 22 h | ~54 h |
| Proie d'élite (primes) | lundi 0 h → dimanche | 7 jours |
| Boss d'alliance | à la demande | 24 h |

Jusqu'à 4 rendez-vous se chevauchent le samedi ; aucun ne commence entre le lundi et le jeudi.

## 3. Benchmark
- Clash of Clans : un temps fort par week-end (raids de la capitale), le reste réparti (ligues, guerres) sur la semaine.
- Jeux mobiles de gestion : un événement « milieu de semaine » (mardi à jeudi) pour garder les joueurs actifs entre deux week-ends.

## 4. Options

| | Option | Effet | Pour | Contre |
|:--|:--|:--|:--|:--|
| A | Statu quo | rien | aucun code | creux du lundi au jeudi |
| B | **Déplacer deux rendez-vous en semaine** : tournoi du casino **mercredi 18 h → jeudi 23 h 59** ; boss de la chronique **mardi 18 h → jeudi 18 h** | le week-end garde événement, boss mondial et territoire ; la semaine gagne deux temps forts | changement lisible, pas d'effet sur les gains | annonce nécessaire (habitudes) |
| C | Rendre chaque jour et heure réglables dans l'admin, sans changer les défauts | souplesse | aucun changement immédiat | ne règle pas le problème |

## 5. Recommandation : **B, avec les réglages de C dans l'admin**
- Défauts : tournoi mercredi 18 h (30 h), boss de la chronique mardi 18 h (48 h).
- Admin : jour et heure de départ de chaque rendez-vous (planificateur existant).
- Gains inchangés (mêmes récompenses, mêmes durées) ; changelog et bannière la semaine de la bascule.
- Mesure : boss tués, joueurs actifs par jour de semaine (avec BOSS-2, ajout à la santé de l'équilibre).

## 6. Invariants
- Deux rendez-vous serveur (hors proie d'élite) ne commencent jamais le même jour (test du planificateur).

## 7. Livraison (6.7.0)
- Casino : rendez-vous de la semaine, mercredi 18 h pour 30 h, week-ends décochés ; anciens réglages convertis à la lecture.
- Boss de la chronique : jour de départ réglable, mardi 18 h pour 48 h. En mode mensuel : dernier mardi du mois. En alternance : premier
  mardi qui tient entre deux boss mondiaux, sinon le placement d'avant, pour garder le même nombre de combats (une semaine sautée aurait
  retiré des points de passe).
- Mesure BOSS-2 reportée (voir la fiche).
