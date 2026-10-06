# Proposition : alliances plus grandes (lot G)

Statut : **livrée (5.33.0)** : option B, base 8, +4 places par niveau de « Quartiers fédérés » (3 niveaux, 20 membres au plus). Décision du
2026-10-06 (« fais ce qu'il y a de mieux »). Fiche : `docs/changes/5.33.0-alliances-grandes.md`.
Constat : E5 de `docs/audit/2026-10-06-audit-global.md`. Lot G de `docs/proposals/feuille-de-route-2026-q4.md`.

## 1. Constat

> « Mon alliance est pleine à 6 alors que le contenu d'alliance est pensé pour beaucoup plus. » (audit E5)

Production, 2026-10-06, en lecture seule : **2 alliances**, de 6 et 4 membres. L'une est pleine. Le contenu collectif (24 secteurs, guerres,
boss d'alliance, sagas, coffre de guerre) demande plus de bras.

## 2. Diagnostic

- `ALLIANCE_RULES.maxMembers = 6`, fixe, sans aucun levier pour grandir (`addMember`).
- Le boss d'alliance est **déjà proportionnel** à la taille : PV = puissance d'attaque des membres actifs (`allianceBossHp`), coût = heures de
  production de chaque membre (`allianceBossCost`). Agrandir l'alliance ne le rend ni trivial ni hors de portée.
- Les recherches d'alliance coûtent 50 M par ressource commune et 1 M par rare au niveau 1, ×2 par niveau, 12 h × niveau. Une seule à la fois.
- Points à surveiller : territoires (somme des niveaux des membres présents dans un secteur) et classement de saison (5 meilleurs membres,
  inchangé : la taille n'achète pas le classement).

## 3. Benchmark

| Jeu | Règle |
|:--|:--|
| OGame | alliances sans plafond strict ; la taille se paie en coordination |
| Clash of Clans | clans de 50, dès la création ; le niveau de clan débloque des avantages, pas des places |
| Mobiles de gestion (Rise of Kingdoms, etc.) | 100+ membres ; places parfois liées au niveau de l'alliance |

Sur un serveur de 16 comptes, 50 places n'auraient pas de sens : le plafond doit rester une décision collective.

## 4. Options

| Option | Règle | Effet | Risque |
|:--|:--|:--|:--|
| A | Plafond fixe à 12 | simple | aucune progression, aucune décision |
| B | **Base 8, +4 par niveau de « Quartiers fédérés »** (3 niveaux : 12, 16, 20) | grandir est un projet commun, payé par le trésor ; l'alliance pleine aujourd'hui gagne 2 places tout de suite | une alliance de 20 sur 16 comptes : possible en théorie, à surveiller pour les territoires |
| C | Places liées au niveau d'alliance (XP de saison cumulée) | automatique | invisible, pas de choix |

## 5. Recommandation

**Option B.**
- Règles (réglables dans l'admin, Règles → Alliances) : `maxMembers = 8`, `membersPerQuarter = 4`. Recherche `quartiers`, 3 niveaux, même
  coût que les autres recherches d'alliance (50 M, 100 M, 200 M par ressource commune ; 12 h, 24 h, 36 h).
- Recherche ajoutée aux serveurs dont l'admin a modifié la liste des recherches (fusion dans `content.ts`).
- Écrans : « n / max membres » partout (Alliance, fiche publique, classement), message de refus qui nomme la recherche.
- Aucune donnée joueur modifiée : le plafond monte (6 → 8), il ne baisse jamais.

## 6. Invariants

- Places d'une alliance = base + niveau de Quartiers fédérés × 4, borné au niveau maximum. Test : `alliances.test.ts`.

## 7. Plan de lots

1. G.1 (5.33.0) : règle, recherche, écrans, admin, tests.
2. G.2 (si une alliance dépasse 12) : relever les territoires et la saison d'alliance, puis ajuster.

## 8. Questions ouvertes

1. Faut-il un coût propre à Quartiers fédérés (plus cher que les autres recherches) ? Aujourd'hui : même courbe.
