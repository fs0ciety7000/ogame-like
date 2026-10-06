# Proposition : entrepôt, pillage et sauvetage (lot E)

Statut : **livrée en partie (5.32.0)** : options A et C, avec 8 h et une activation le 13 octobre 2026 (décision du 2026-10-06 : « fais ce qu'il y a de mieux »). Option B livrée en 6.2.0 sans attendre la simulation (décision du 2026-10-06 : « on code, on ajustera ») : butin 30 % du stock exposé, soute de pillage ×2, sauvetage plafonné à 85 % ; suivi dans la santé de l'équilibre (admin). Fiche : `docs/changes/6.2.0-pillage.md`. Fiche : `docs/changes/5.32.0-entrepot-chantiers.md`.
Constats : E1, E2 de `docs/audit/2026-10-06-audit-global.md`. Lot E de `docs/proposals/feuille-de-route-2026-q4.md`.

## 1. Constat

> « Une défaite ne coûte presque rien, une victoire ne rapporte presque rien. » (audit E1, E2)

Données de production relevées le 2026-10-06, en lecture seule :
- `players` et `queues`, recalculés avec le moteur (`economySnapshot`, `protectedAmount`) ;
- Admin → Équilibrage et Statistiques.

On a 16 comptes, dont 14 actifs dans les 7 derniers jours (11 actifs d'après Équilibrage). Chiffres en ressources communes, les quatre additionnées.

| Mesure | Médiane des actifs | Fin de partie (entrepôt 20, 7 joueurs) |
|:--|:--|:--|
| Production | — | 140 à 215 M/h |
| Stock | **57 h** de production | 8 à 125 Md |
| Part à l'abri du pillage | **115 h** de production | 21 à 23 Md, soit 110 à 165 h |
| Taux de sauvetage (Atelier + bonus) | 65 % | 70 à 80 % |

Combats sur 7 jours :
- 240 attaques ;
- 130 victoires de l'attaquant, 95 du défenseur, 15 nuls ;
- **butin moyen : 1,9 M par attaque**, soit moins d'une minute de production d'un joueur de fin de partie ;
- JcJ : 25 à 27 combats par jour du 3 au 5 octobre, 2 le 6.

## 2. Diagnostic

1. **La part à l'abri dépasse le stock.** `protectedAmount` = capacité × (10 % + technologie « stockage protégé » + Bastion), plafonnée à 75 %. Avec la
   technologie, un entrepôt de niveau 20 garde 64 à 70 % de 33 Md à l'abri. Résultat : 5 joueurs de fin de partie sur 7 n'ont **rien** de
   pillable.
   - Preuve : stock < part à l'abri pour 5 des 7 comptes à l'entrepôt 20 (analyse moteur sur les données de production, comptes anonymisés).
2. **La soute borne le butin.** Même avec du stock exposé, un raid rapporte 1,9 M en moyenne. Toucher seulement à la protection changerait peu
   de chose. Cause probable : soute des flottes JcJ et part du butin. À confirmer par simulation avant chiffrage final (voir §6).
3. **Le plafond de sauvetage n'est pas atteint.** Le plafond global est de 95 %, mais le maximum observé est de 80 %. Le baisser à 80 % ne
   changerait rien aujourd'hui (constat E2 à revoir à la baisse).

## 3. Benchmark

| Jeu | Règle | Effet |
|:--|:--|:--|
| OGame | 50 % des ressources pillables par attaque, sans abri (sauf classe Collecteur et cachettes de formes de vie) | le stock est un risque : on dépense ou on fait des envois de nuit (« fleet save ») |
| Clash of Clans | le butin dépend du niveau de l'hôtel de ville. Le Château du clan et la réserve sont partiellement protégés, environ 20 % du stock disponible au pillage | un plafond lisible, une part toujours prenable |
| Mobiles de gestion | « entrepôt protégé » qui grandit avec le bâtiment, mais très en dessous de la production d'une journée | se connecter pour dépenser reste payant |

## 4. Options

| Option | Règle | Ce que ça règle | Coût, risque |
|:--|:--|:--|:--|
| A | Part à l'abri = min(règle actuelle, **H heures** de production), H = 8 (réglable) | le stock au-delà de 8 h devient pillable | seul, peu d'effet tant que la soute borne le butin (§2.2) |
| B | A + butin borné par une part du stock exposé (ex. 30 %) au lieu de la soute seule, ou soute ×2 pour les vaisseaux de fret | le JcJ rapporte enfin | changement fort, à simuler ; risque de « farm » des petits : à coupler avec l'écart de force existant |
| C | Ne rien toucher, mais afficher « ce que tu risques » (stock exposé) sur la page Ressources | lisibilité | ne règle pas E1 |

Plafond de sauvetage (E2) : garder 95 % comme garde-fou théorique, et ajouter dans l'admin la mesure du taux effectif. Pas de baisse sans nouvelle
donnée.

## 5. Recommandation

**A + C maintenant, B après simulation.**
- A : `ECONOMY_RULES.protectedHours = 8`, réglable dans Règles → Économie. La règle actuelle reste la borne haute.
  - Message joueur : « 8 h de production à l'abri. Au-delà, ton stock est pillable : dépense-le ou mets-le en sécurité. »
- C : sur la page Ressources, une carte « Ce que tu risques » montre le stock exposé et la part à l'abri, en heures.
- B : proposition chiffrée séparée, après une simulation de 100 raids sur les profils de production réels (moteur `resolveCombat` + `loot`).
- Annonce : changelog et billet, une semaine avant l'activation. Dépenser son stock d'ici là reste possible (règle 3 du GDD).

Aucune donnée joueur n'est modifiée : c'est une règle de calcul, réglable et réversible dans l'admin.

## 6. Invariants

- I6 (le butin arrive même entrepôt plein) : inchangé.
- Nouveau test : part à l'abri ≤ max(H heures de production, plancher de départ), et jamais au-dessus de la règle actuelle.
- Plancher de départ pour les débutants : la règle actuelle s'applique tant que la production est faible (moins de 1 M/h), pour ne pas exposer
  un compte neuf.

## 7. Plan de lots

1. E.1 (5.32.0) : option A, réglage dans l'admin, carte « Ce que tu risques », tests. Activation par défaut une semaine après l'annonce.
2. E.2 : simulation du butin (option B), puis proposition chiffrée.

## 8. Questions ouvertes

1. Valides-tu A + C, avec **8 h** de production à l'abri ? Ou préfères-tu 12 h, plus doux ?
2. Faut-il annoncer une semaine avant, ou activer tout de suite ?
3. On simule B (butin borné par le stock exposé plutôt que par la soute seule) ?
