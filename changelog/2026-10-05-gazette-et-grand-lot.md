---
version: 5.16.0
iteration: 101
date: 2026-10-05
title: Gazette repensée et grand lot d'ajouts
---
La Gazette ne répète plus les mêmes nouvelles d'un numéro à l'autre et s'enrichit de nouvelles rubriques.

## Gazette
- Un numéro couvre la période depuis le numéro précédent, et non plus les sept derniers jours d'office. Une publication manuelle suivie de celle du lundi ne raconte donc plus deux fois la même semaine.
- Une rubrique identique mot pour mot au numéro précédent n'est pas reprise, et la manchette change.
- « Le seigneur à surveiller » devient « Le seigneur qui monte » : celui dont la puissance a le plus grandi depuis le numéro précédent.
- Nouvelles rubriques : ascensions, rempart (défenses tenues), place du marché, entraide (dons), nouvelles bannières (alliances fondées), pillard le plus actif et agenda de la semaine qui vient.
- Les chiffres de la semaine (combats, butin, échanges, commandants actifs) sont comparés au numéro précédent.
- Mise en page alignée sur le design system : manchette, tuiles de chiffres et une couleur par rubrique.

## Expéditions en chaîne
- Au dernier secteur, la flotte ne rentre plus d'office : tu choisis de rentrer (cale sécurisée) ou de pousser plus loin, jusqu'à 3 fois. Chaque étape dure la moitié de la durée choisie.
- Chaque profondeur multiplie le butin des événements suivants (×1,25, ×1,5, ×1,75), et l'XP de fin gagne +50 % par profondeur. Les chances de jetons augmentent aussi.
- En contrepartie, les embuscades et les passages forcés sont 20 % plus durs par profondeur, et une embuscade perdue en profondeur fait perdre 30 % de la cale.
- Sans réponse dans les 30 minutes, la flotte rentre. Le journal de l'expédition indique la profondeur de chaque événement.

## Traités avec les factions
- Sur la page Menaces, chaque faction propose trois traités de 7 jours, un seul à la fois :
  - Pacte de péage : 2 h de production, notoriété ≤ 3. Pas d'ultimatum ni de raid de leur part, et passage libre face à leurs patrouilles en expédition.
  - Contrat d'escorte : 4 h de production, notoriété ≤ 1. Deux fois moins d'embuscades en expédition.
  - Embargo : gratuit. Leurs raids sont 25 % plus forts, mais les repousser rapporte 50 % de plus, et la notoriété monte de 1.
- On ne peut pas signer pendant un ultimatum ou un raid en cours de la faction.

## Mutateur de saison
- Chaque mois, une règle spéciale s'applique à tout le serveur. Dix sont possibles : +10 % de production, −15 % de construction, −15 % de recherche, −15 % de temps de vol, saison de guerre (+10 % d'attaque, +20 % de butin), saison des remparts, foire des marchands (−50 % de taxe), cadence des arsenaux, grandes soutes, grande chasse aux boss.
- Elle est tirée automatiquement, jamais deux mois de suite la même, et annoncée sur l'accueil et dans les Chroniques avec l'aperçu du mois suivant. Elle apparaît dans la fiche des effets (source « Mutateur de saison »).
- Administration (Règles) : imposer un mutateur pour un mois, n'en mettre aucun, ou tout désactiver.

## Spectateur de boss
- Le fil du combat (boss mondial, boss de saison, boss d'alliance) devient un fil de spectateur : réagis aux assauts des autres avec 🔥 💥 👏 😱 🫡. Une seule réaction par ligne : clique à nouveau pour la retirer, ou choisis-en une autre pour la remplacer. On ne réagit pas à son propre assaut.
- Les assauts de ton alliance sont soulignés d'un trait violet, et le bouton « Mon alliance » ne garde que les assauts de tes alliés.

## Planète personnalisable
- Dans Profil, choisis la palette de ta planète, son anneau, son atmosphère et une lune. L'aperçu se met à jour en direct.
- Options offertes : Océan, Dunes, Glacier, anneau fin ou sans anneau, atmosphère claire ou aucune, lune grise.
- Options à débloquer :
  - Canopée : 10 expéditions.
  - Magma : un boss mondial abattu.
  - Cristal : une Ascension.
  - Double anneau : un passe de saison terminé.
  - Ceinture de débris : un recyclage.
  - Halo pirate : un repaire tombé.
  - Aurore : 20 succès.
  - Brume dorée : 25 échanges au marché.
  - Braise : 1 M de ressources pillées.
  - Lunes jumelles : un filleul.
  - Station orbitale : 1 000 unités construites.
  - Éclat de boss : 3 boss mondiaux différents.
- Ta planète apparaît sur l'accueil, sur ta fiche publique et dans la galaxie quand on te sélectionne. Elle reprend les couleurs du thème de celui qui la regarde. C'est purement cosmétique : aucun effet sur le jeu.

## Thèmes et transitions
- Quatre nouveaux thèmes dans Réglages :
  - Voyageur (esprit Destiny) : ivoire et gris perle, violet légendaire, titres fins très espacés.
  - Omni (esprit Mass Effect) : hologramme orange sur bleu nuit.
  - Spartan (esprit Halo Infinite) : visière bleu-vert, crochets d'angle sur les panneaux.
  - Constellation (esprit Starfield) : os et graphite, bandes rouge-orange-jaune-bleu.
- Chaque thème a sa propre ambiance sonore.
- Chaque thème a sa façon de changer de page : hologramme qui se matérialise, saut de signal, découpe nette, interface qui s'ouvre depuis le centre… Si tu as demandé de réduire les animations, c'est un simple fondu.
- Signal va plus loin :
  - Grands numéros de section en filigrane sur les panneaux.
  - Étiquette code-barres sous le titre de chaque page.
  - Barre oblique magenta devant les surtitres.
  - Filet vert et magenta sous l'en-tête.

## Fiches techniques et mode photo
- Chaque carte d'unité a un bouton « Fiche technique ». La fiche est présentée comme un plan d'ingénieur (désignation, silhouette sur trame) et indique :
  - attaque, défense, vitesse et soute à ton niveau actuel et au maximum, technos comprises ;
  - le rang de l'unité face aux autres sur chaque caractéristique ;
  - le coût et le temps de construction ;
  - le gain par niveau et l'efficacité (attaque et défense pour 1 000 ressources, puissance et soute par place de hangar) ;
  - un tableau niveau par niveau.
- Mode photo de la planète (accueil, sous la légende) : plein écran sans interface, cadrage réglable, légende facultative, export en PNG 1200 × 1200 aux couleurs de ton thème.

## Confort
- Présence : une pastille verte qui pulse montre qui est en ligne (actif depuis moins de 5 minutes). Elle apparaît à côté des pseudos partout dans le jeu, sur les avatars du classement et du podium, et dans la fiche du joueur, qui indique aussi « Vu il y a… ». Les membres de l'alliance utilisent la même pastille, et l'écho se coupe si tu as demandé de réduire les animations.
- Ctrl+K fait aussi des actions : « Tout réclamer », « Réclamer la série du jour », « Améliorer » un bâtiment (avec le niveau visé et l'état des ressources), « Rechercher » une technologie, et « 10 chasseur » pour lancer 10 unités. Le serveur vérifie tout, comme pour un clic.
- Rappels personnels (Réglages → Rappels, ou bouton « Me prévenir quand il se connecte » sur la fiche d'un joueur) : alerte quand l'entrepôt atteint 75, 90 ou 100 %, ou quand un joueur suivi se connecte. Une seule alerte tant que la condition dure, avec notification du navigateur si elle est autorisée.
- Comparateur au survol de « Améliorer » : production, entrepôt, réparation ou hangar avant et après, durée, coût total, et temps pour que le gain de production rembourse l'amélioration.


## Administration
- Planificateur : un événement ajouté peut se répéter (chaque semaine ×4, toutes les 2 semaines ×4, toutes les 4 semaines ×6). Le bouton « Copier ce mois vers le suivant » reprend les dates précises et les événements programmés au même jour de la semaine et au même rang (« 2e samedi » → « 2e samedi »).
- Agenda des joueurs : le bouton « Mon agenda » télécharge les rendez-vous des 30 prochains jours (.ics) avec un rappel 30 minutes avant. Il fonctionne avec Google Agenda, Outlook et Calendrier.
- E-mails : choix des destinataires (tous, actifs, inactifs depuis 7 ou 30 jours, nouveaux, sans alliance, une alliance), avec le nombre visé. L'envoi peut être programmé : le serveur l'envoie à l'heure dite, à 5 minutes près, et on peut l'annuler.
- Suivi des campagnes : taux d'ouverture (image invisible) et de clic (liens suivis et signés, aucune redirection détournable) pour les 20 dernières campagnes. Seuls des identifiants hachés sont conservés.

## Équilibre
- Rattrapage des petits empires : chaque nuit, le serveur compare le développement de chaque joueur actif (niveaux de bâtiments et de technologies cumulés) à la médiane des joueurs actifs. Sous 10 % de la médiane, la production gagne +25 %. Le bonus baisse ensuite en ligne droite et disparaît à 50 %. Il est figé pour la journée et apparaît dans le détail de la production. Tout se règle dans Règles → Rattrapage.
- Plafond hebdomadaire des jetons de butin : les jetons tirés en combat (boss, seigneurs, menaces, joueurs, expéditions) s'arrêtent à 25 par semaine, réglables dans les réglages des reliques. Le jeton du jour, la série, les défis, le passe et les récompenses fixes des boss n'y comptent pas. La jauge est affichée au casino.

## Correctifs
- Couleurs du thème respectées partout : l'habillage du mois (et le boss de saison en cours) n'impose plus sa teinte orange. Il se mêle désormais à la couleur du thème, et l'image du boss en fond n'apporte plus que du relief, sans couleur. Les nébuleuses de chaque page, la frise de l'agenda, les badges du changelog et les quelques couleurs fixes restantes (violet, cyan) suivent le thème choisi. Un test empêche leur retour.
- Recyclage : la capacité affichée et appliquée est désormais la cargaison (CAP) du Drone récupérateur, exactement comme sur sa fiche (CAP × niveau, technologies de cale et officiers compris). L'ancien réglage fixe « 250 par niveau », qui donnait 2 500 par drone au niveau 10 quelle que soit la fiche, est retiré.
