---
slug: passkeys-google-et-classement
title: "Entrer sans clé, monter sur le podium : la 5.9"
excerpt: "Fini les mots de passe oubliés : passkeys et connexion Google arrivent. Et le classement fait peau neuve, avec un podium et ton insigne de rang enfin à l'honneur."
category: mises-a-jour
tags: [connexion, passkeys, google, classement, rangs]
version: "5.9"
cover: /assets/blog/articles/5-9/passkey-commandant.webp
---
> [!LORE] Journal de bord, poste de commandement
> Le scanner reconnaît la main avant même qu'elle le touche. Pas de code à réciter, pas de carte magnétique oubliée dans une autre combinaison. La porte s'ouvre, la galaxie attend.

Cette mise à jour s'occupe de deux moments que vous vivez tous les jours : **le moment où vous entrez dans le jeu**, et **le moment où vous regardez où vous en êtes face aux autres**. Le premier devient plus rapide et plus sûr, le second plus lisible et plus vivant.

## Pourquoi on s'attaque aux mots de passe

Le mot de passe est le maillon faible de n'importe quel compte. On l'oublie, on le réutilise d'un site à l'autre, on le tape sur une fausse page sans s'en rendre compte. Côté support, les demandes « je n'arrive plus à me connecter » font partie des plus fréquentes.

Nous voulions une façon d'entrer qui soit à la fois **plus simple pour vous** et **plus difficile à voler**. Elle existe, et votre téléphone la connaît déjà : la passkey.

## La passkey, comment ça marche

Une passkey, c'est une clé numérique que **votre appareil garde pour vous**. Pour vous connecter, il vous demande simplement de prouver que c'est bien vous, de la même façon que pour le déverrouiller : empreinte, Face ID, code du téléphone, ou une clé de sécurité USB.

![Le scanner reconnaît le commandant](/assets/blog/articles/5-9/passkey-commandant.webp "Une main sur le scanner, et la porte s'ouvre")

Ce qui se passe en coulisses :

- À l'ajout, votre appareil crée une **paire de clés**. La partie secrète ne le quitte jamais. Le jeu ne reçoit que la partie publique.
- À chaque connexion, le jeu envoie un **défi unique**, valable cinq minutes et utilisable une seule fois. Votre appareil le signe avec la clé secrète, et le serveur vérifie la signature.
- Votre empreinte ou votre visage restent **sur votre appareil**. Le jeu ne les voit jamais et ne les stocke pas.
- Une passkey est liée à **empire.fs0ciety.org**. Sur une fausse page qui imiterait le jeu, elle ne fonctionne tout simplement pas : impossible de se la faire dérober par hameçonnage.

> [!TIP] Ajouter ta passkey en trente secondes
> Va dans **Réglages → Méthodes de connexion**, puis clique sur **Ajouter une passkey** et suis les indications de ton appareil. À ta prochaine visite, clique sur **« Se connecter avec une passkey »** sous le formulaire : c'est tout.

Quelques précisions :

- **Jusqu'à 10 passkeys** par compte : une pour le téléphone, une pour l'ordinateur du bureau, une clé de sécurité en secours…
- Chaque passkey porte un **nom** (par défaut, l'appareil et le navigateur) que tu peux modifier. Tu vois aussi **quand elle a servi pour la dernière fois**, et tu peux la supprimer d'un clic.
- **Ton mot de passe reste valable.** La passkey s'ajoute à tes moyens de connexion, elle ne remplace rien.
- Sur la plupart des téléphones et ordinateurs récents, les passkeys se synchronisent avec le gestionnaire de mots de passe du système. Changer de téléphone ne veut donc pas dire perdre ta clé.

## Se connecter avec Google

Deuxième nouveauté : le bouton **Google** sur la page de connexion. Un clic, tu choisis ton compte Google, et tu es dans ton empire.

![Le poste de commandement face à la galaxie](/assets/blog/articles/5-9/poste-commandement.webp "Un clic, et tu reprends ton poste")

- **Tu as déjà un empire** avec la même adresse e-mail que ton compte Google ? Il y est rattaché automatiquement.
- **Ton adresse est différente** ? Connecte-toi comme d'habitude, puis lie ton compte Google dans **Réglages → Méthodes de connexion**. Tu peux le délier à tout moment.
- **Tu découvres le jeu** ? Google crée ton compte, puis le jeu te demande de **choisir ton pseudo** avant de fonder ton empire. Ton nom Google n'apparaît jamais dans le jeu.

Le jeu ne reçoit de Google que ton adresse e-mail et un identifiant de compte. Il ne voit ni ton mot de passe Google, ni tes contacts, ni tes fichiers. Pour être transparents sur ce que nous gardons et pourquoi, une **[politique de confidentialité](https://empire.fs0ciety.org/confidentialite.html)** est désormais liée en bas de la page de connexion.

## Le classement fait peau neuve

Le classement est l'une des pages les plus visitées du jeu. Pourtant, votre rang n'y était qu'une **petite pastille** collée au coin de l'avatar, presque invisible. Pour des insignes qui demandent des semaines d'efforts, c'était dommage.

![Trois podiums sous les étoiles](/assets/blog/articles/5-9/podium-piliers.webp "Le podium des commandants")

### Un podium pour les trois premiers

En haut de la page, les trois premiers ont maintenant **leur podium**. Grands insignes, halo **or, argent ou bronze**, et le premier qui trône un cran plus haut avec un insigne qui flotte doucement et un reflet qui passe de temps en temps. Leur XP défile à l'arrivée sur la page. Un clic ouvre leur fiche.

Le podium suit l'onglet choisi : sur **Saison en cours**, ce sont les meilleurs de la saison qui y montent.

![Les insignes des meilleurs commandants](/assets/blog/articles/5-9/podium-or.webp "Or, argent, bronze")

### Ton insigne, enfin à l'honneur

Chaque ligne a maintenant une **colonne dédiée au rang**, juste à côté de l'XP :

- l'**insigne en grand**, avec le nom du rang ;
- ton **XP** ;
- une **barre de progression** qui montre où tu en es vers le rang suivant. Passe la souris dessus pour voir le pourcentage exact.

![Un insigne de rang](/assets/blog/articles/5-9/insigne-aile.webp "Chaque rang a son insigne")

Sur mobile, l'insigne se place sous le pseudo pour garder une ligne lisible.

### Plus vivant, sans en faire trop

- Les lignes **apparaissent en cascade** quand tu arrives sur la page ou changes d'onglet.
- **Ta ligne** est mise en avant et sa bordure **respire doucement** : impossible de te perdre.
- Le bouton **« Ma position »** fait défiler le classement jusqu'à toi, même si tu es loin du sommet.
- Les places 1, 2 et 3 gardent leurs couleurs dans la liste.
- Onglet **Alliances** : chaque alliance a une barre qui compare son XP à celle de l'alliance en tête. On voit d'un coup d'œil qui talonne qui.

> [!NOTE] Accessibilité
> Si ton appareil demande de **réduire les animations** (réglage d'accessibilité du système), le classement le respecte : tout s'affiche directement, sans mouvement.

![L'insigne au cœur du classement](/assets/blog/articles/5-9/insigne-noyau.webp)

## Et maintenant ?

Ajoute ta passkey, passe voir le podium, et dis-nous ce que tu en penses dans le canal d'alliance ou via la page **Signaler un problème** du jeu. On lit tout.

Bon jeu, commandants. On se retrouve au sommet. :rocket:
