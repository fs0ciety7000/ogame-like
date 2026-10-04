---
version: 5.10.0
iteration: 75
date: 2026-10-04
title: Titres, pot commun et Hall of fame des boss
---
Une version pour tout ce qui se gagne et se partage : un vrai catalogue de titres, un pot commun pour les concours, un Hall of fame pour les colosses, et des cartes à partager.

## Titres
- [Nouveau] **Catalogue de titres** : chaque titre a une icône, une description et une **rareté** qui fixe sa couleur (commun, rare, épique, légendaire, mythique). Il s'affiche en couleur à côté du pseudo : classement, fiche, galaxie, profil.
- [Nouveau] Des titres se **débloquent seuls** quand une mesure atteint un seuil : *Mécène* (10 cadeaux offerts), *Marchand des étoiles*, *Éclaireur*, *Chasseur d'épaves*… Une notification « Nouveau titre ! » les annonce.
- [Nouveau] La carte **Titres** du profil montre les titres encore à débloquer et ta progression.
- [Admin] Onglet **Titres** : création et modification (libellé, icône, rareté, description, déblocage sur une mesure). Un succès choisit maintenant son titre dans ce catalogue.

## Pot commun « Serveur »
- [Nouveau] Les **taxes du marché** et la part perdue des **cadeaux hors alliance** ne disparaissent plus : elles vont au pot commun du serveur, visible sur la page Marché.
- [Admin] Onglet **Pot commun** : solde, provenance, mouvements, et versement à un joueur avec un motif (concours, événement). Le joueur reçoit une notification.

## Cadeaux
- [Équilibrage] Un compte doit avoir **3 jours** pour envoyer ou recevoir un cadeau (contre les doubles comptes).
- [Équilibrage] **Hors alliance**, 20 % d'un cadeau se perdent en route et vont au pot commun. Entre membres d'une même alliance, tout arrive.
- [Amélioration] La fenêtre d'envoi annonce ces règles avant l'envoi, et les notifications indiquent ce qui est vraiment arrivé.

## Boss
- [Nouveau] **Hall of fame des boss** (Grands ennemis) : chaque combat archivé, les records (plus gros total de dégâts, victoire la plus rapide), les n° 1 et les **coups de grâce**. Les boss d'alliance n'y sont visibles que pour leur alliance.
- [Nouveau] Le **coup de grâce** est enregistré : on sait enfin qui a abattu le colosse.
- [Amélioration] Dans le bilan, les récompenses sortent d'un **coffre**, une à une.
- [Nouveau] **Partager ma carte** depuis le bilan : une image du combat avec ton rang et tes dégâts.
- [Admin] Pages Léviathan et Boss de saison : tableau des récompenses versées par joueur, et relance d'une distribution bloquée. Une distribution ne peut jamais être relancée deux fois.

## Récompenses et notifications
- [Nouveau] **Défi de la semaine** : la récompense se **récupère** sur l'accueil. Non récupérée, elle est versée d'office à la fin du défi suivant. Le titre du meilleur contributeur reste remis tout de suite.
- [Nouveau] **Résumé de la semaine** chaque lundi (victoires, butin, missions, XP, succès, contrats), sur l'accueil et à partager en carte.
- [Nouveau] Notification quand un **palier du passe** est prêt à récupérer.
- [Amélioration] Les notifications de **combat** mènent directement au rapport. C'est le cas pour les attaques entre joueurs, les raids, les repaires et les primes.
- [Fix] Un **raid de faction perdu** compte maintenant comme une défaite, comme un raid repoussé compte comme une victoire.
- [Amélioration] La prime d'un raid repoussé s'affiche en pastilles.
- [Fix] Les notifications ne peuvent plus être créées que par le serveur (impossible de fabriquer un faux « Succès débloqué »).
