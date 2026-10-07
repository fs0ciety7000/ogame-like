# Décisions à valider (synthèse de `docs/QUESTIONS.md`)

Lot H29-4 (6.14.28), constat AU29-5. Le 2026-10-07, 24 questions étaient ouvertes. Pour chacune, le choix fait seul (règle n° 3), son
effet et ma recommandation. Réponse rapide possible : « je valide tout sauf Qx, Qy ». Une décision changée devient un lot. Une décision
validée passe au statut « validée » dans `QUESTIONS.md`.

Page de réponse : **`/decisions`** dans le jeu (`test.fs0ciety.org/decisions`, `empire.fs0ciety.org/decisions` après la mise en
production), réservée aux admins du jeu. Elle lit `QUESTIONS.md` et ce fichier au build. Les réponses sont gardées dans la collection
`decision_answers` ; Claude les relit avec `node scripts/decisions.mjs`. **Chaque nouvelle question ouverte ajoute sa ligne ici**
(groupe, effet, conseil) : un test l'exige. L'artifact « Décisions à valider » de 6.14.28 est remplacé par cette page.

## 1. Bloquante

| Q | Décision | Effet | Recommandation |
|:--|:--|:--|:--|

## 2. Joueurs et équilibre (chiffres réglables dans l'admin)

| Q | Décision appliquée | Effet pour les joueurs | Recommandation |
|:--|:--|:--|:--|
| Q82 | Les 47 paliers de succès auto déjà créés (pré-prod, donc production) : **garder** (données des joueurs, récompenses déjà versées) et brider la suite (AP-L4) | Revue AU27 (contenu procédural) | Valider (option recommandée par l'audit) |
| Q83 | Brouillon de novembre écrit par l'ancien générateur : **régénérer automatiquement** tant que le mois n'a pas commencé (AP-L2), noté au journal | Revue AU27 (contenu procédural) | Valider (option recommandée par l'audit) |
| Q84 | Action dont la médiane du serveur est 0 : dans les défis du passe ? : **exclure** du passe (un défi bloque les suivants) ; la variété passe par les Chroniques (épisode 3, à quantité faisable) | Revue AU27 (contenu procédural) | Valider (option recommandée par l'audit) |
| Q85 | Épisode 3 des Chroniques (« rebondissement ») : **peu pratiquée mais faisable** | Revue AU27 (contenu procédural) | Valider (option recommandée par l'audit) |
| Q86 | Après 36 saisons (novembre 2029) : **générer puis relire dans l'admin** (même circuit que le brouillon du passe) | Revue AU27 (contenu procédural) | Valider (option recommandée par l'audit) |
| Q87 | « Repousser une attaque » dans les objectifs du jour : **compter aussi les raids de faction repoussés** et poids 0,5 | Revue AU27 (contenu procédural) | Valider (option recommandée par l'audit) |
| Q88 | Faction des Chroniques : **table par thème et par année** (3 tables, une par année du catalogue) | Revue AU27 (contenu procédural) | Valider (option recommandée par l'audit) |
| Q89 | Succès auto : qui fait monter un palier ? : **3 joueurs ou 10 % des actifs**, un palier par mesure et par mois | Revue AU27 (contenu procédural) | Valider (option recommandée par l'audit) |
| Q90 | Onglets mobiles par défaut : **(b)**. Le Passe reste à un toucher par la ligne d'Ordres du jour. Les choix déjà enregistrés par les joueurs (`localStorage`) ne bougent pas | Revue AU27 (design UI/UX) | Valider (option recommandée par l'audit) |
| Q91 | Corriger Constellation ou changer de thème de référence pour les captures : **(a)**. C'est un thème proposé aux joueurs, et le défaut doit y être corrigé | Revue AU27 (design UI/UX) | Valider (option recommandée par l'audit) |
| Q92 | Teinte du violet en Constellation : **(a)**, qui reste dans la palette du thème | Revue AU27 (design UI/UX) | Valider (option recommandée par l'audit) |
| Q93 | Mémoire des astuces de page : **(b)**, sur le modèle d'`announcementsSeen` : nouveau champ du profil, `GAME_FIELDS` et schéma | Revue AU27 (design UI/UX) | Valider (option recommandée par l'audit) |
| Q94 | Cibles de 44 px : **(b)** : aucune mise en page ne bouge au bureau | Revue AU27 (design UI/UX) | Valider (option recommandée par l'audit) |
| Q95 | Emoji dans les textes saisis par l'admin (bannières, événements) : **(b)** : la garde vise les `.tsx` seulement | Revue AU27 (design UI/UX) | Valider (option recommandée par l'audit) |
| Q96 | Masquer la Prise en main : **(b)** : une ligne « Prise en main 0/10 → » reste, sans perte possible | Revue AU27 (design UI/UX) | Valider (option recommandée par l'audit) |
| Q97 | Quand appliquer le second palier ×4, alors qu'un joueur a déjà fait son Ascension avec les anciens coûts ? : Au début d'un mois, avec Z0 et une annonce une semaine avant ; seuls les niveaux futurs coûtent plus, rien n'est retiré ni remboursé | Revue AU27 (équilibrage) | Valider (option recommandée par l'audit) |
| Q98 | Rareté : baisser le taux du comptoir ou le plafonner ? : Les deux, dans cet ordre : taux à 1 pour 250 (réglage), puis plafond hebdomadaire (moteur) | Revue AU27 (équilibrage) | Valider (option recommandée par l'audit) |
| Q99 | Coffre du 7e jour : bornes fixes réduites ou indexation sur la production ? : Bornes [2 M, 12 M] tout de suite, indexation [6, 18] h ensuite | Revue AU27 (équilibrage) | Valider (option recommandée par l'audit) |
| Q100 | `pvp.hardXpRatio` 12 → 10 réduit les cibles sur un serveur de 14 actifs : on le fait ? : Oui, à 10 (le premier quartile est hors de portée de la médiane) ; on mesure le nombre de combats par jour (2,1 aujourd'hui) | Revue AU27 (équilibrage) | Valider (option recommandée par l'audit) |
| Q101 | Boss : renforcer tout de suite ou attendre 8 semaines (Q21) ? : Attendre, en mesurant d'abord le temps avant la mort (AE-L4) | Revue AU27 (équilibrage) | Valider (option recommandée par l'audit) |
| Q102 | Ambre : réduire les primes des paliers 3 et 4 ou ajouter des dépenses ? : Réduire les gains futurs d'un tiers (soldes intacts), après une mesure par source | Revue AU27 (équilibrage) | Valider (option recommandée par l'audit) |
| Q103 | Menu progressif : quels comptes voient tout ? : Tout compte existant au-delà de Fer II, et tout compte qui a déjà ouvert la page ; seuls les nouveaux comptes ont l'ouverture par rang | Revue AU27 (équilibrage) | Valider (option recommandée par l'audit) |
| Q56 | Panneau Lune : remplace-t-il la ligne `MoonLine` de la carte Planète mère ? : Non, il s'ajoute à côté (Statistiques, ancre `#lune`) | Interface de la phalange et de la porte de saut | Valider (option prudente) |
| Q57 | Bouton « Saut » pendant la recharge : Visible, grisé, avec le décompte ; cliquable seulement porte prête | Interface de la phalange et de la porte de saut | Valider (option prudente) |
| Q58 | Balayer depuis l'alerte d'attaque : Lien vers le panneau Lune (l'alerte couvrirait la confirmation) | Interface de la phalange et de la porte de saut | Valider (option prudente) |
| Q59 | Toast de réussite du balayage et du saut : Pas de toast côté client : la notification du serveur en affiche un (sinon en double) | Interface de la phalange et de la porte de saut | Valider (option prudente) |
| Q60 | « Envoyer une garnison » depuis les alliés menacés : Seulement quand l'allié est visé sur sa planète mère | Interface de la phalange et de la porte de saut | Valider (option prudente) |
| Q61 | Guide avancé et frise « Prochaines fins » (fichiers du moteur) : Reportés au lot É30-1d | Interface de la phalange et de la porte de saut | Valider (option prudente) |
| Q62 | Changelog joueur et billet : Annoncés avec le lot É30-1d (tout ensemble) | Interface de la phalange et de la porte de saut | Valider (option prudente) |
| Q63 | Fréquence de lecture de la phalange : Au plus une fois par minute sur Lune et Alliance, et à chaque attaque entrante ; lectures `moon/phalanx` à surveiller sur la pré-prod | Interface de la phalange et de la porte de saut | Valider (option prudente) |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
| Q104 | Campagne d'e-mails : comment protéger la fiche du joueur ? : Jetons de désinscription créés avant l'envoi (transaction, seul champ écrit) ; aucune migration des jetons sur la production | Valider (option prudente) |
| Q105 | Envoi « à blanc » de l'admin : Il crée les jetons manquants (seul champ touché) et en rend le nombre ; pause `holdMs` (5 s au plus, admin) pour les tests | Valider (option prudente) |
| Q106 | Destinataire supprimé pendant une campagne : Il ne reçoit rien et compte comme un échec | Valider (option prudente) |
| Q107 | Livreur qui abandonne un contrat de commerce : Son rattrapage n'est pas sauvé, donc pas notifié (sinon notifié deux fois au rattrapage suivant) | Valider (option prudente) |
| Q108 | Texte « Enchère annulée » (vendeur supprimé par l'admin) : Sur le modèle d'« Enchère dépassée » | Valider (option prudente) |
| Q64 | La règle n° 4 exige-t-elle un succès **propre** à chaque unité et bâtiment, ou une mesure de type suffit-elle ? : Propre : succès dérivés générés (comme `derivedAchievements`), activables par contenu dans l'admin ; la garde exige « propre ou dérogation notée » | Valider (option recommandée par l'audit) |
| Q65 | Un porteur d'effet par unité : relique ou plan de module ? : Plan de module « signature » (une famille par unité, rare et plus) : le système de modules vise déjà les classes, et un plan dilue moins que 24 reliques de plus | Valider (option recommandée par l'audit) |
| Q66 | Objectifs liés à un contenu dans le passe et les Chroniques ? : Oui, poids 0 par défaut, activés par le thème du mois (« chantiers » → `build:*`, « colonies » → route) et pour le contenu nouveau du mois | Valider (option recommandée par l'audit) |
| Q67 | Reliques liées à une source ? : Oui, × 3 de chance depuis la source, champ optionnel (rien ne change sans lui) | Valider (option recommandée par l'audit) |
| Q68 | Colonies : catégorie de Codex propre, ou fiches dans « Légendes » ? : Catégorie « Colonies » (biomes et spécialisations), récompense de catégorie comme Unités, Bâtiments et Technologies | Valider (option recommandée par l'audit) |
| Q69 | Paliers lisibles (§5.4) : les appliquer aux 11 autres bâtiments, ou limiter la règle aux bâtiments « de capacité » ? : Limiter, puis l'appliquer à l'entrepôt, l'Atelier et aux hangars ; réécrire la règle (« corriger plutôt qu'empiler ») | Valider (option recommandée par l'audit) |
| Q70 | Où vivent les libellés des réglages : un `*_RULES_META` à côté de chaque objet du moteur, ou un dictionnaire central dans l'admin (comme `FI : **À côté de l'objet, dans le moteur** : le libellé naît avec le champ, la garde le vérifie, et les bornes servent aussi à la validation serveur (AA-25) | Valider (option recommandée par l'audit) |
| Q71 | Talents, classes, mutateurs, modules : chiffres seulement dans le registre (petit), ou sections de contenu complètes (ajout et retrait) ? : **Chiffres d'abord (AA3)**, sections ensuite (AA7, AA9). Les ids restent stables, il n'y a rien à migrer chez les joueurs | Valider (option recommandée par l'audit) |
| Q72 | Tutoriel, accueil, guide avancé, annonces de version : réglables dans l'admin ? : **Non pour l'instant** : ce sont des textes d'interface livrés avec une version (et l'admin crée déjà des annonces personnalisées). À revoir si l'équipe veut éc | Valider (option recommandée par l'audit) |
| Q73 | Bornes des effets de techno (`EFFECT_MAX_PER_LEVEL`) et plafonds : réglables ? : **Plafonds oui** (déjà dans `effectCaps`), **bornes de validation non** : elles protègent les invariants I9 et `TECH_COMBAT_CAP` contre une erreur de saisie | Valider (option recommandée par l'audit) |
| Q74 | Rôles d'unités (AA-16) : drapeau `roles` dans la fiche d'unité, ou ids dans un groupe de règles (`SPY_RULES.probeUnitId`, `debris.recyclerUn : **Drapeau dans la fiche** : une unité ajoutée prend son rôle d'une case à cocher, et les deux champs actuels deviennent des valeurs de repli | Valider (option recommandée par l'audit) |
| Q75 | Validation renforcée (AA1) : refuser, ou seulement avertir, les valeurs hors bornes ? : **Refuser** les types et formes invalides ; **avertir** (sans bloquer) au-delà de ×2 / ÷2 du défaut. C'est le plus prudent pour les données des joueurs, sans br | Valider (option recommandée par l'audit) |
| Q76 | Quelle trace au Journal pour les réclamations ? : **B**, en `read: true` (pas de toast ni de pastille en plus, comme le défi hebdomadaire) | Valider (option recommandée par l'audit) |
| Q77 | Que deviennent les échéances pendant une maintenance ? : **B** : les flottes continuent (sinon un afflux à la réouverture), les rendez-vous collectifs sont décalés | Valider (option recommandée par l'audit) |
| Q78 | Suppression de compte par le joueur : **A** maintenant (ferme le contournement d'AC-3) ; B plus tard si des joueurs le demandent | Valider (option recommandée par l'audit) |
| Q79 | Que permet-on en vacances ? : **A**, liste blanche = les 8 actions actuelles + lecture (phalange sans balayage, Codex consultable) | Valider (option recommandée par l'audit) |
| Q80 | Clé d'idempotence pour les envois non répétables ? : **B** pour l'instant (aucun incident relevé), à rouvrir si un double envoi est signalé | Valider (option recommandée par l'audit) |
| Q81 | Rythme du heartbeat : mesurer d'abord (Z6), puis **C** si l'écriture domine | Valider (option recommandée par l'audit) |
