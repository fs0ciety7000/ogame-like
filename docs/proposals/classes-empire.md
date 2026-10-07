# Proposition : classes d'empire (lot J)

Statut : **livrée en partie (6.0.0)** : J.1, option B (trois classes, effets + un avantage propre, premier choix gratuit, changement à 100 Ambre
tous les 7 jours). J.2 (une unité propre par classe) **livrée en 6.5.0** (`unites-classe.md`). Décision du 2026-10-06 (« Go lot J », sur le même mandat
que les lots précédents). Fiche : `docs/changes/6.0.0-classes-empire.md`.
Lot J de `docs/proposals/feuille-de-route-2026-q4.md`.

## 1. Constat

> « Tous les empires se ressemblent : mêmes bâtiments, même ordre, mêmes flottes. »

Production (relevé du 2026-10-06, lecture seule) : trois façons de jouer déjà visibles dans les missions :
- recyclage et primes en tête (241 et 123) : joueurs de flotte ;
- espionnage et pirates (119 et 70) ;
- expéditions (59) et transports (17).

Mais rien dans le jeu ne récompense ce choix ni ne l'affiche.

## 2. Diagnostic

- Les bonus viennent tous de sources que tout le monde finit par avoir (technologies, officiers, reliques, talents) : pas d'identité.
- Le circuit d'effets (`effects.ts`, `modifiers.ts`) accepte une nouvelle source sans autre code (« une source se branche ici »).
- Plafonds de la couche empire : 50 % pour les durées. Les maxima théoriques actuels (officier 20 % + relique 15 % + talent 6 %) laissent 9 points
  de marge : une classe ne peut pas donner plus de 8 % sur les temps sans dépasser le plafond (test `derived.test.ts`).

## 3. Benchmark

| Jeu | Règle |
|:--|:--|
| OGame | 3 classes (Collecteur, Général, Explorateur) : bonus de production, de flotte ou de recherche et d'expédition, un vaisseau propre chacune ; changement payant |
| Clash of Clans | pas de classe, mais des héros au choix qui orientent le style |
| Mobiles de gestion | « civilisations » ou « commandants » au choix, changeables contre une monnaie premium |

## 4. Options

| Option | Règle | Effet | Risque |
|:--|:--|:--|:--|
| A | Classes purement cosmétiques (titre, couleur) | identité sans équilibre | aucun intérêt de jeu |
| B | **3 classes, 3 effets + 1 avantage propre chacune ; premier choix gratuit, changement payant** | un vrai choix, réversible | équilibre à suivre (taux de choix, gains) |
| C | B + une unité propre par classe | proche d'OGame | illustrations, équilibre du combat, hangars : gros lot |

## 5. Recommandation

**B maintenant (J.1), C ensuite (J.2).**

| Classe | Effets (couche empire) | Avantage propre |
|:--|:--|:--|
| Industriel | +10 % de production, −8 % de temps de construction, +10 % d'entrepôt | +1 chantier de bâtiments |
| Seigneur de guerre | +5 % d'attaque, +15 % de butin, −10 % de temps de production des unités | +2 emplacements de flotte |
| Explorateur | −8 % de temps de recherche, +15 % de soute, +1 niveau d'espionnage | +1 expédition par jour |

- Premier choix gratuit. Changer : 100 Ambre (prix du recrutement d'un officier : 150), une fois tous les 7 jours. Réglable (Règles → Classes
  d'empire).
- Les effets passent par le circuit : fiche d'effets, rapport d'impact et plafonds s'appliquent sans exception.
- Écran : page « Classe d'empire » (Empire), rappel sur l'accueil tant qu'aucune classe n'est choisie.
- Aucune donnée joueur modifiée : un joueur sans classe garde exactement ses chiffres.

## 6. Invariants

- I14 : au plus une classe active ; ses effets passent par la couche empire et ses plafonds ; aucun maximum théorique de la couche empire ne
  dépasse son plafond (rapport d'impact). Tests : `empireClass.test.ts`, `derived.test.ts`.

## 7. Plan de lots

1. J.1 (6.0.0) : classes, effets, avantages, page, admin, tests.
2. J.2 : une unité propre par classe (récolteur pour l'Industriel, croiseur de raid pour le Seigneur, éclaireur longue portée pour
   l'Explorateur), avec prompts Midjourney, puis illustrations fournies par toi.
3. J.3 : relevé après deux semaines (répartition des classes, production et butin par classe) et ajustement.

## 8. Décisions (2026-10-06)

1. 100 Ambre pour changer : **validé**.
2. Classe sur la fiche publique et dans le classement : **oui**, livré (puce de classe, champ public `profiles.empireClass`).
