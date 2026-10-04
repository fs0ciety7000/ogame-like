---
version: 5.13.0
iteration: 80
date: 2026-10-04
title: Passes de saison thématiques, jetons partout, économie assainie
---
Les jetons du Casino orbital se gagnent maintenant dans tout le jeu, chaque ouverture devient un tournoi, le marché redevient 100 % joueurs, le passe se mérite au combat, et le Léviathan récompense mieux tous ses gros participants.

## Passes de saison
- [Nouveau] **Un passe différent chaque mois** : un thème (huit univers : Marée d'Acier, Forge Stellaire, L'Ombre des Archives, Hiver galactique, Comète écarlate, Saison des chasseurs, Le Grand Bazar, L'Appel du Vide…), son illustration et sa couleur, et un **scénario en quatre temps** qui se dévoile aux paliers 10, 20 et 30.
- [Nouveau] **Prérequis aux paliers 10, 20 et 30** : une action à accomplir dans le mois (combats gagnés, raids repoussés, primes, contrats, espionnage…), avec la progression affichée sur le palier. Les objectifs sont calibrés sur l'activité réelle du serveur.
- [Nouveau] **Dernier palier : un commandant de saison inédit** qui rejoint l'état-major (le bonus d'un rôle, plus la moitié d'un second), avec **300 Ambre**. Il n'existe que dans ce passe ; s'il sert déjà, 2 Dossiers d'entraînement à la place.
- [Amélioration] L'état-major présente les commandants de saison (débloqués ou à venir), leur histoire et leur passe d'origine.

## Casino orbital
- [Nouveau] **Des jetons à gagner partout** : paliers 7, 17 et 27 du **passe de saison**, **défi de la semaine** réussi (1 ou 2 jetons selon le palier), **boss abattus** (Léviathan, boss de saison, boss d'alliance : 1 jeton chacun, 3 pour le premier en dégâts).
- [Nouveau] **Tournoi du casino** : chaque tirage rapporte des points (7-7-7 : 100, trois étoiles : 30…). Classement en direct sur la page avec le compte à rebours de la fermeture ; à la fermeture, le podium gagne 5, 3 et 2 jetons, et le premier porte le titre **« As du casino »** jusqu'au tournoi suivant.
- [Nouveau] **Titre « Main d'or »** pour qui aligne trois 7, à vie.
- [Nouveau] **Bandeau d'accueil** quand le casino est ouvert : heure de fermeture, jetons en réserve, place au tournoi, rappel du jeton du jour.
- [Nouveau] **Ma semaine au casino** : jetons joués, gains, points et ressources gagnées depuis lundi.
- [Amélioration] **Suspense** : quand les deux premiers rouleaux montrent un 7, le dernier ralentit et s'éclaire en or.
- [Amélioration] **Vrais jetons** : le jeton illustré apparaît dans le solde de la machine, la carte « Jeton du jour », les gains et la pluie du gros lot ; la page du casino a son décor (la salle aux trois 7).

## Économie et équilibrage
- [Équilibrage] **Le marché redevient 100 % joueurs** : le Courtier du Comptoir et les ventes automatiques des seigneurs de guerre disparaissent (ils faussaient les prix). Leurs offres encore ouvertes sont retirées.
- [Équilibrage] **Passe de saison** : les missions ne rapportent plus de points (le passe avançait trop vite). Le combat devient la voie royale : combat gagné 5 → 8 points, raid de faction repoussé 6 → 8. Contrats, primes, boss, Chroniques, vendettas et coalitions ne changent pas.
- [Équilibrage] **Léviathan, des gains mieux répartis** : le bonus suit la racine de vos dégâts comparés au premier (avec 25 % de ses dégâts, vous touchez déjà la moitié du bonus), base 2 → 3 h et bonus 10 → 12 h. S'il tombe : +6 / 4 / 2 h pour le podium, une **relique épique pour les 3 premiers** (rare pour les autres) et, si votre collection de reliques est pleine, de l'Ambre à la place au lieu de rien. Le premier garde sa relique mythique et son titre.
- [Équilibrage] Jetons du casino des boss : le 2e et le 3e reçoivent aussi un bonus (la moitié de celui du premier).
- [Amélioration] Les **concours** du pot commun ne sont plus montrés aux joueurs (page réservée à l'équipe, lien retiré du menu, de l'accueil et de l'agenda).

## Interface
- [Amélioration] **Toutes les couleurs suivent votre thème** : médailles, raretés, commandants, capsules, Hall of fame, podium, rangs… plus aucune couleur figée. Les statistiques de l'empire passent aux jauges droites du cockpit.
- [Amélioration] **Illustrations d'en-tête** : État-major, Palmarès et Hall of fame des boss ont leur décor.
- [Amélioration] **Notifications illustrées** (gros lot, ouverture du casino) et pastille des jetons gagnés ; le bilan d'un boss affiche aussi les jetons.
- [Fix] Au-delà de deux jours, les durées s'affichent en jours (« 27j 11h » au lieu de « 659h ») : Palmarès, boss, chantiers…
- [Fix] État-major sur mobile : les cartes des commandants ne débordent plus de l'écran.

## Administration
- [Admin] **Jetons gagnés en jeu** (onglet Pot commun → Casino) : jetons par palier du défi hebdo, par boss abattu ou retiré, bonus du premier, jetons du podium du tournoi, libellés des titres « As du casino » et « Main d'or ».
- [Admin] **Passe de saison** : nouveau type de récompense « Jetons du casino » (le total des jetons s'affiche à côté de l'Ambre). Les missions ne figurent plus dans les points réglables (toujours 0).
- [Admin] **Passes de saison générés** (onglet Passe) : le générateur écrit chaque mois un brouillon complet (thème, scénario, 30 paliers, prérequis, commandant de saison avec son prompt Midjourney) ; l'équipe le relit, modifie tout (textes, couleurs, illustration, paliers, prérequis, rôles et portrait du commandant), puis le **publie**. « Régénérer » propose un autre tirage. Un brouillon oublié est publié d'office au début de son mois, et chaque nouveau passe est annoncé aux joueurs.
- [Admin] **Marché** : réglages du Courtier du Comptoir retirés. **Concours** : la page reste accessible aux administrateurs.
