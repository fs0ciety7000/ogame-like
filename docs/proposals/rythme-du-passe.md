# Proposition : rythme du plus actif au passe (paliers de prestige)

Statut : **livrée** (6.14.150, fiche [`docs/changes/6.14.150-rythme-du-passe.md`](../changes/6.14.150-rythme-du-passe.md)), branche de
travail, 2026-10-08. Lot R2 (AP-L15) de la feuille d'hiver 2031 (`feuille-de-route-2031-hiver.md` §0), constat AP-11 (revue AU27,
`docs/audit/2026-10-07-au27-procedural.md` §2.2 ; revue AU28, `docs/audit/2026-10-08-au28-revue.md`). Recommandation appliquée sans
attendre (règle n° 3) ; questions proposées au §8 (option la plus prudente retenue).

## 1. Constat

- Vu par le joueur le plus actif : « J'ai fini le passe le 10, et après plus rien ne bouge pendant trois semaines. »
- Mesure (`node scripts/procedural-sim.mjs --profile all --months 24`, 2026-10-08, avant le lot) :

| Profil | Points par jour (médian / plus actif) | Médian au palier 30 | Plus actif au palier 30 | Mois où le plus actif finit avant le jour 15 |
|:--|:--|:--|:--|:--|
| Réel (pré-prod, 7 octobre 2026) | 63 / 171 | jour 27 | **jour 10** | 24 / 24 |
| Typique (serveur calme) | 50 / 110 | jour 28 | **jour 13** | 24 / 24 |
| Vide (aucune mesure) | profils par défaut | jour 27 | jour 18 | 0 / 24 |

- Après le palier 30, le plus actif ne reçoit que les paliers bonus (1 jeton de casino par 120 points, 10 au plus : épuisés vers le
  jour 17 sur le profil réel) et l'Ambre de dépassement des grosses sources (`PASS_OVERFLOW`). Rien ne se voit sur la page du passe
  de jour 17 à la fin du mois.

## 2. Diagnostic

1. **Contrainte impossible à tenir sur une seule piste (sûr, calcul).** Les points par palier sont communs à tous. Le médian finit au
   jour `30 × ppt / médian`, le plus actif au jour `30 × ppt / top`. Avec `latestMedianDay` = 28 et `targetTopDay` = 15, il faudrait
   `top / médian ≤ 28 / 15 = 1,87`. Mesuré : **2,71** (réel), **2,2** (typique). `computePointsPerTier` donne la priorité au médian
   (`passGen.ts`, raison « Le plus actif va beaucoup plus vite que le médian ») : c'est voulu, et le plus actif finit au jour
   27 / 2,71 = 10.
2. **La piste après le palier 30 est courte et payée en ressources (sûr, code).** `PASS_BONUS_RULES` : 10 × 120 = 1 200 points, soit
   7 jours à 171 points par jour. L'allonger verserait plus de jetons, hors du budget de 140 h du passe.
3. **Allonger le passe pour tous pénaliserait le médian (sûr, simulation AU27).** Monter les points par palier repousse le médian
   au-delà du jour 28 (sonde AU27 : 143 serveurs bruités sur 200 après le jour 28 avant 6.14.58).

## 3. Benchmark

| Jeu | Après le dernier palier | Ce qu'on en retient |
|:--|:--|:--|
| Clash of Clans (Gold Pass) | les points en plus remplissent une réserve de bonus, payée en ressources, plafonnée | une piste après la fin, mais en ressources : non (budget) |
| Fortnite (Passe de combat) | niveaux au-delà du dernier palier, récompenses **cosmétiques** (styles, variantes dorées) | piste cosmétique longue, pour les plus actifs seulement |
| Brawl Stars (Brawl Pass) | récompenses bonus répétables après le dernier palier | répétable, mais la valeur s'ajoute à l'économie : plafond nécessaire |
| Rocket League (Rocket Pass) | « paliers pro » après le dernier palier, cosmétiques | une marque visible qui dit « j'ai été au bout » |

Règle commune : ce qui vient après la fin du passe est **cosmétique** (ou plafonné serré) et visible.

## 4. Options

| Option | Ce que ça règle | Ce que ça coûte | Risque |
|:--|:--|:--|:--|
| A. Points par palier montés pour le plus actif | plus actif au jour 15 | médian au jour 41 (réel) | casse la cible du médian (I17, `latestMedianDay`) : **rejetée** |
| B. Paliers bonus en ressources allongés (30 au lieu de 10) | piste jusqu'à la fin du mois | +20 jetons par mois au plus actif, hors budget de 140 h | inflation des jetons, écart riche / médian : rejetée |
| C. Gains dégressifs pour le plus actif (plafond de points par jour) | le plus actif finit plus tard | punit l'engagement, invisible, frustrant | perte des plus actifs : rejetée |
| **D. Paliers de prestige cosmétiques** (taille fixe : `tierFactor` × points par palier) | piste visible du jour 10 au jour 23 à 29 | une carte sur la page, une bannière par saison, un succès | aucun pour l'économie ; rythme dépend du profil (réglable) |
| E. Paliers de prestige à taille adaptative (calée sur le jour de fin simulé du plus actif) | fin du prestige toujours vers le jour 28 | logique de plus dans le générateur, taille différente chaque mois, illisible | un passe écrit à la main sans mesure n'a pas de taille : repli nécessaire |

## 5. Recommandation (option D)

- **10 paliers de prestige** après le palier 30, chacun valant **4 paliers du passe du mois** (240 points pour un passe à 60 points
  par palier ; 180 à 45). Tout point gagné au-delà du maximum (le même surplus que les paliers bonus) avance le prestige ; la
  connexion du jour ne compte pas (comme les paliers bonus). Points plafonnés à la valeur des 10 paliers, remis à zéro chaque mois.
- **Sans budget** : rien à réclamer, aucune ressource, Ambre, jeton ni titre. Les 10 atteints : la saison entre dans
  `seasonPass.prestiged` (gardé) et donne la bannière « Prestige « thème » » (couleur du thème, bord or, sans image) ; succès
  « Au-delà du passe » (palier argent : 25 XP, aucune ressource).
- Les paliers bonus (jetons) restent tels quels : les deux pistes avancent ensemble.
- Chiffres simulés (24 mois, `topPrestigeDay`) selon la taille d'un palier :

| `tierFactor` | Réel : dernier prestige | Typique | Lecture |
|:--|:--|:--|:--|
| 3 | jour 20 | jour 25 | fini trop tôt sur le profil réel |
| **4** | **jour 23** | **jour 29** | retenu : piste jusqu'à la dernière semaine, atteignable dans le mois |
| 4,5 | jour 25 | jour 31 | hors du mois sur un serveur calme (mois de 30 jours) |
| 5 | jour 26 | jour 33 | hors du mois sur un serveur calme |

  Médian : fin du passe au jour 27 à 28, au plus un palier de prestige les mois de 31 jours.
- Textes joueurs : « Prestige · après le palier 30 » ; « Après le palier 30, chaque point gagné fait monter ton prestige. » ;
  « 120 / 240 points vers le prestige 4 » ; « Cosmétique : rien à réclamer, aucune ressource. »
- Maquette (page du passe, sous la grille des paliers) :

```
┌ PRESTIGE · APRÈS LE PALIER 30 ─────────────── 3 / 10 ┐
│ ★ ★ ★ ☆ ☆ ☆ ☆ ☆ ☆ ☆                                   │
│ ▓▓▓▓▓▓▓▓░░░░░░░░                                      │
│ 120 / 240 points vers le prestige 4                   │
│ Cosmétique : rien à réclamer, aucune ressource. …     │
└───────────────────────────────────────────────────────┘
```

- Réglages : groupe `passPrestige` (`enabled`, `tiers`, `tierFactor`) dans le registre (`ruleRegistry.ts`), section « Passe : paliers
  de prestige » d'Admin → Règles → Passe généré, et Tous les réglages.

## 6. Invariants

- **I48** (nouveau) : prestige cosmétique et sans budget (aucune ressource, Ambre, jeton ni titre ; rien à réclamer) ; seul le surplus
  au-delà du maximum compte, plafonné, remis à zéro chaque mois ; état entier dans `seasonPass` (les routes qui ne sauvent que ce
  champ ne perdent rien). Test : `passPrestige6150.test.ts`.
- Inchangés : I17 (un passe par mois), budget de 140 h du passe généré, `targetMedianDay` / `latestMedianDay`.

## 7. Plan de lots

Un seul lot (R2, 6.14.150) : moteur (`seasonPass.ts`, `profile.ts`, `achievements.ts`, `passSeasons.ts` : `prestigeDay`), page du
passe, admin, simulation (`procedural-sim.mjs` : `topPrestigeDay`), docs (GDD §4, §7.24, §8 ; `docs/systems/progression.md`),
changelog. Pas de serveur à changer : le prestige avance dans `addPassPoints`, déjà appelé par le serveur, et vit dans `seasonPass`.

## 8. Questions proposées (option la plus prudente retenue)

1. **Récompense du prestige complet** : bannière seule (sans image) et succès argent, ou aussi un titre « Astre de <mois> » ?
   Choix fait : pas de titre. Un titre s'écrit dans `player.titles`, champ que plusieurs routes (assauts de boss, coalitions) ne
   sauvent pas avec `seasonPass` : il pourrait se perdre. Pour l'ajouter : l'écrire au moment d'une route qui sauve la fiche entière
   (réclamation du palier, synchronisation) et le tester.
2. **Taille fixe ou adaptative** (options D et E) : fixe, 4 paliers du passe. Plus lisible, et un passe écrit à la main en a une
   aussi. Pour revenir : `passPrestige.tierFactor` dans l'admin, ou l'option E en lot à part.
3. **Notification au passage d'un palier de prestige** : aucune (la page le montre ; pas de bruit dans le Journal pour du
   cosmétique). À ajouter si les joueurs ne le remarquent pas (mesure après un mois : part des plus actifs au prestige ≥ 1).
4. **Illustration** : aucune (étoiles en icône, bannière en dégradé). Une icône de prestige propre pourrait venir plus tard par `/img`.
