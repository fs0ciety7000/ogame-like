---
version: 5.14.0
iteration: 81
date: 2026-10-04
title: Six boss mondiaux, sept officiers rares, trois ans de passes
---
Un boss mondial différent chaque semaine, sept nouveaux rôles d'officiers à débloquer, un catalogue de 36 saisons de passe écrit d'avance, du butin en plus sur tous les combats, et un seul circuit pour tous les bonus de l'empire.

## Boss mondiaux
- [Nouveau] **Six boss mondiaux, un par semaine** à la place du Léviathan mensuel : **le Léviathan**, **la Matriarche**, **le Titan de rouille**, **le Spectre du Chœur**, **le Cométophage** et **l'Abyssal**. Chacun a son histoire, sa résistance, ses pertes, ses faiblesses, ses trois phases et son titre.
- [Nouveau] **Un jour différent chaque semaine** : jamais le même jour que le boss précédent, au moins quatre jours entre deux apparitions, 72 heures de combat. Les événements du week-end continuent à côté.
- [Nouveau] **Bestiaire** : une bannière de profil par boss abattu, et les succès « Chasseur de colosses » (trois boss différents) et « Bestiaire complet » (les six).
- [Amélioration] La page, la bannière d'accueil, l'agenda, le calendrier d'alliance et le Hall of fame affichent le boss de la semaine.
- [Amélioration] Le boss de saison des Chroniques reste à part, au dernier week-end du mois.

## Officiers
- [Nouveau] **Sept rôles rares**, chacun avec ses propres effets : **Logisticienne** (temps de vol, soute), **Mécanicien** (réparation, chantiers d'unités), **Gouverneure** (production et entrepôt des colonies), **Corsaire** (butin pillé), **Gardienne** (entrepôt à l'abri, contre-espionnage), **Diplomate** (taxe du marché et des cadeaux) et **Chasseur de colosses** (dégâts contre les boss).
- [Nouveau] Les officiers rares **ne se recrutent pas**. Leur rôle se débloque au **dernier palier d'un passe** (commandant de saison) ou, très rarement, sur un **boss abattu** (0,2 % par participant, 0,5 % sur le podium).
- [Nouveau] Chaque rôle progresse avec ses propres actions : flottes envoyées, unités construites, bâtiments de colonie, attaques gagnées, défenses tenues, échanges et cadeaux, assauts sur les boss.
- [Nouveau] **Onglet « Effets » de l'État-major** : chaque bonus de l'empire, son total, d'où il vient (technologie, officier, relique, talent, territoire, capsule) et les plafonds atteints.

## Passe de saison
- [Nouveau] **36 saisons écrites d'avance**, sur trois ans : douze thèmes en rotation, un par mois. Quatre nouveaux thèmes s'ajoutent : **Le Rempart**, **Nouveaux Mondes**, **L'Arsenal** et **La Grande Moisson**.
- [Nouveau] Chaque saison a son nom, son accroche, son scénario et son **commandant**. Celui-ci prend le rôle du thème et un second rôle propre à l'année : les 36 commandants ont tous des effets différents.
- [Nouveau] Chaque rôle d'officier est le rôle principal d'un thème : chaque rôle rare se débloque trois fois en trois ans.
- [Nouveau] Succès « Fin de saison », « Une année de passes » et « Trois ans de campagne » ; les bannières des passes terminés prennent la couleur du thème.

## Butin
- [Nouveau] **Tables de butin des combats**, en plus des récompenses habituelles : une relique (rareté minimale selon la source) et/ou une capsule de synthèse. Les sources sont les boss mondiaux, de saison et d'alliance, les expéditions, les seigneurs de guerre (vendettas, coalitions, attaques), les menaces (raids repoussés, repaires pris) et, très rarement, les attaques contre d'autres joueurs. Le podium d'un boss a plus de chances.

## Moteur
- [Amélioration] **Un seul circuit d'effets** : technologies, officiers, reliques, talents, territoires et capsules déclarent leurs effets dans un même vocabulaire, et un seul calcul les applique. Ajouter une technologie ou une relique se répercute automatiquement sur la production, le combat, les durées, les flottes et les colonies. Les valeurs de tous les bonus existants sont inchangées (vérifié sur 24 empires de référence).

## Administration
- [Admin] **Boss mondiaux** : rotation hebdomadaire activable (onglet Règles), heure et durée réglables (l'écart minimal suit la durée), boss au choix pour un lancement manuel, prochaines apparitions nommées. Le rendez-vous mensuel reste disponible en option.
- [Admin] **Tables de butin** réglables par source dans les réglages des reliques : chance de relique, rareté minimale, chance et niveaux de capsule, bonus du podium.
- [Admin] **Passes** : aperçu du catalogue des 36 saisons et prompt Midjourney de l'illustration, à copier comme celui du portrait.
- [Admin] **Rapport d'impact** (onglet Équilibrage) : pour chaque grandeur, toutes les sources que le contenu peut donner, à leur maximum, et le total théorique plafonds compris.
- [Admin] Prompts Midjourney des sept officiers rares, des cinq nouveaux boss et des 36 saisons : `docs/prompts-5.14.md`.
