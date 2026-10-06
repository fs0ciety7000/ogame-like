# Game design : Cosmic Empires

Référence de conception. `DESIGN.md` dit à quoi le jeu ressemble ; ce document dit **comment il fonctionne et pourquoi**.
Toute proposition (`docs/proposals/`) s'appuie dessus. Une règle qui change ici change aussi dans le moteur et ses tests.

## 1. Piliers

| Pilier | Ce que le joueur ressent | Ce que ça interdit |
|:--|:--|:--|
| **Bâtir sans attendre devant l'écran** | je lance, je reviens, ça a avancé | une action qui exige d'être connecté à heure fixe pour ne rien perdre |
| **Perdre, oui ; perdre sans choix, non** | une défaite coûte, mais je savais et je peux réagir | une perte silencieuse, un plafond qui bloque sans dire pourquoi ni comment en sortir |
| **Chaque nombre s'explique** | je comprends d'où vient un chiffre (page Formules, infobulles) | un bonus caché, deux écrans qui affichent deux valeurs |
| **Le serveur fait foi** | ce que je vois est ce qui est | une règle appliquée par le client seul |
| **Social d'abord, payant jamais** | l'Ambre se gagne à la chasse, le prestige se voit | un avantage de combat achetable hors du jeu |

## 2. Boucles de jeu

| Boucle | Durée | Contenu | Récompense |
|:--|:--|:--|:--|
| Session | 2 à 10 min | relancer les files (bâtiments, labo, chantier), récolter, envoyer des flottes | progression visible, notifications |
| Journée | 24 h | contrats du jour, missions, série de connexion, raids pirates | ressources, jetons, Ambre (j6), coffre (j7) |
| Semaine | 7 jours | boss en rotation, défis hebdo, offre de la semaine, tournoi du casino | reliques, plans, titres |
| Saison | 1 mois | passe (30 paliers), Chroniques, guerres de saison, divisions | bannières, titres, Ambre |
| Méta | plusieurs mois | Ascension (bâtiments remis au niveau 1, talents), colonies, fin de partie | étoiles, talents, prestige |

Une boucle courte ne doit jamais casser une boucle longue. Exemple : une défaite (session) ne doit pas bloquer
le chantier naval pendant des jours (semaine). C'est le problème de la 5.20 à la 5.27 (voir `proposals/cale-seche.md`).

## 3. Carte des systèmes

```
Ressources ──► Bâtiments ──► Capacités (entrepôt, hangars, Atelier, bouclier)
     │             │
     ▼             ▼
Laboratoire ──► Unités ──► Flottes ──► Combats (JcJ, pirates, seigneurs, boss, primes, expéditions)
                  ▲                         │
                  │                         ├─► Pertes ─► Débris ─► Recyclage ─► Ressources
                  │                         ├─► Sauvées ─► Atelier ─► (retour au hangar)
                  │                         └─► Butin, XP, Ambre, reliques, plans
                  └──── Modules, officiers, reliques, technologies (effets : src/game/effects.ts)
```

Effets : toute source de bonus passe par le circuit unique de `effects.ts` (stat, cible, valeur).
**Une stat déclarée doit être lue par le moteur.** La grille d'audit (§6) vérifie ce point.

## 4. Invariants du moteur

Chaque invariant a (ou doit avoir) un test. Si une fonctionnalité doit en violer un, la proposition le dit explicitement.

| # | Invariant | Où | Test |
|:--|:--|:--|:--|
| I1 | Unités conservées : base + en vol + Atelier + pertes = avant combat | `attack.ts`, `pirates.ts`, `bounties.ts`, `workshop.ts` | `workshop.test.ts`, `attack.test.ts` |
| I2 | **Places de hangar** : base + en vol + Atelier + file ≤ capacité, **à chaque construction** | `actions.ts` (`buildUnits`) | `actions.test.ts` |
| I3 | Aucun ajout d'unités hors construction, retour de flotte ou fin de réparation | tout `src/game` + migrations | à écrire (voir `proposals/cale-seche.md`) |
| I4 | Capacité ne baisse jamais sous la flotte existante sans état « surcharge » explicite | `ascension.ts`, contenu admin | à écrire |
| I5 | Une même grandeur se calcule par **une seule** fonction (client, serveur, statistiques) | `hangarUsed`, `getUnitCapacity` | garde à écrire |
| I6 | Le butin et les livraisons arrivent même entrepôt plein (choix assumé) | `fleets.ts` | `fleets.test.ts` |
| I7 | Rien dans `src/game` n'utilise `Intl` / `localeCompare` / `toLocaleString` | tout `src/game` | `serverSafe.test.ts` |

## 5. Règles de conception

1. **Un plafond a toujours une sortie visible.** Hangar plein : améliorer, recycler, envoyer en mission. Entrepôt plein : dépenser, échanger.
   Le plafond s'affiche avec la sortie (`HudCallout` ember + boutons), jamais seul.
2. **Un état bloquant porte un compte à rebours ou une action.** « Atelier : 3 h 12 » ou « Réparer maintenant (40 Ambre) ».
3. **Le joueur choisit ce qu'il perd.** Quand le moteur doit trancher (place manquante, ressource insuffisante), il propose un choix par défaut
   réglable plutôt que de détruire en silence.
4. **Paliers lisibles.** Un bâtiment gagne un effet nouveau aux niveaux 5, 10, 15, 20 (voir `WORKFLOW.md` §4), pas seulement +x %.
5. **Pas de double peine.** Une défaite coûte une fois : pertes OU immobilisation longue, pas les deux à pleine force.
6. **Les migrations sont du game design.** Rendre 10 000 vaisseaux d'un coup change l'équilibre autant qu'un patch. Elles respectent les plafonds.

## 6. Grille d'audit d'un système

À dérouler pour chaque système touché (et en entier une fois par version mineure) :

- [ ] Chaque stat d'effet déclarée est-elle lue ? (`grep` de la stat hors `effects.ts`)
- [ ] Chaque plafond est-il vérifié **partout** où la grandeur augmente (construction, retour, réparation, récompense, migration, admin) ?
- [ ] Client, serveur et page Statistiques affichent-ils le même nombre ?
- [ ] Le rapport ou la notification dit-il au joueur ce qui s'est passé et quoi faire ?
- [ ] Un PNJ (seigneur, pirate) suit-il les mêmes règles, ou l'écart est-il documenté ?
- [ ] Les colonies suivent-elles la règle de la planète mère, ou l'écart est-il documenté ?
- [ ] Un test couvre-t-il l'invariant ?

## 7. Journal des audits

| Date | Version | Constat | Suite |
|:--|:--|:--|:--|
| 2026-10-06 | 5.27.1 | Hangars en surcharge : migration 5.22 sans plafond, Ascension qui remet les hangars au niveau 1, stat `hangarCapacity` jamais lue, tech « Extension des hangars » sans effet sur les colonies | `proposals/cale-seche.md` |
