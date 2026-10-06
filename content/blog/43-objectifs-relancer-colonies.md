---
slug: objectifs-relancer-colonies
title: "6.2.1 à 6.4 : moins de corvées, plus de choix"
excerpt: "4 objectifs du jour au lieu de deux listes, « Relancer » pour toutes les missions, l'Intercepteur recalé et des colonies qu'on ravitaille enfin."
category: mises-a-jour
tags: [quotidien, flottes, unites, colonies, performance, qol]
version: "6.4.0"
---
> [!LORE] Registre de l'Empire
> « Un bon intendant ne court pas après ses convois. Il les regarde partir. »

## Un seul quotidien : 4 objectifs du jour (6.2.1)

Tu avais deux listes chaque jour : 3 contrats tirés pour toi, et 3 missions communes. Elles avaient deux heures de remise à zéro et deux
récompenses différentes. Il n'en reste qu'une.

- **4 objectifs** par jour, tirés pour toi parmi 10 types (les contrats, plus « lancer des sondes » et « acheter au marché »).
- Chacun rapporte des ressources rares, **15 XP** et **1 jeton**. Les 4 faits : **+1 jeton**.
- Remise à zéro à **minuit, heure de Paris**, avec le décompte affiché.

| Par jour (base) | Avant | Après |
|:--|:--|:--|
| Ressources rares | 360 × échelle | 360 × échelle |
| XP | 60 | 60 |
| Jetons | 5 | 5 |

Tu gagnes autant, en faisant moins d'allers-retours. Ta série, ton coffre du 7e jour et ta relance quotidienne ne changent pas. Une mission
du jour terminée mais pas réclamée au moment de la bascule t'est versée automatiquement.

## « Relancer » marche partout (6.3.0)

Le bouton « Relancer » du panneau Flottes ne connaissait que les attaques. Il relance maintenant ta dernière mission, quelle qu'elle soit :
prime, proie d'élite, boss mondial, boss de saison, boss d'alliance, transport de colonie ou livraison. Même flotte, mêmes options, un clic.
Le serveur revérifie tout : une prime déjà remplie ou un boss en recharge te le dit, comme avant.

## Vaisseaux et défenses (6.3.1)

Les onglets d'Unités s'appelaient « Attaque » et « Défense ». Le Bastion, un tank qui tire peu, se retrouvait sous « Attaque ». En réalité,
l'onglet dit seulement si l'unité **vole** ou **reste sur ta planète**. Ils s'appellent donc **Vaisseaux** et **Défenses**.

En vérifiant, on a trouvé un piège : l'**Intercepteur** affichait une vitesse et une soute qu'il n'utilisait jamais (une défense ne part pas
en flotte). Sans elles, la Batterie AA, moins chère, faisait mieux par place. L'Intercepteur devient une vraie tourelle :

| Intercepteur | Avant | Après |
|:--|--:|--:|
| Attaque | 255 | **320** |
| Défense | 60 | **80** |
| Valeur par place | 416 | **503** (Batterie AA : 492) |

Il redevient le choix « plus cher, mais meilleur ». Tes unités ne changent pas de hangar.

## Un jeu plus léger à recharger (6.3.2)

À chaque mise à jour, ton navigateur retéléchargeait tout le cœur du jeu, y compris les briques d'interface qui ne changent presque jamais.
Elles sont maintenant à part et restent en cache : le bloc de démarrage passe de **297 à 245 Ko** compressés. Prochaine étape : charger le
contenu du jeu (succès, saisons, Chroniques) à la demande.

## Colonies : ravitailler et mettre en file (6.4.0)

Les routes logistiques ne marchaient que dans un sens : de la colonie vers ta planète mère. Pour monter une colonie neuve, il fallait donc
envoyer des cargos à la main.

- **Ravitailler** : choisis le sens de la route. Ta planète mère remplit l'entrepôt de la colonie à **25, 50 ou 80 %**, toutes les 6, 12 ou
  24 h. Elle garde toujours **30 %** de son propre entrepôt. **10 %** sont perdus en route, comme dans l'autre sens.
- **File de défense** : un lot en construction et jusqu'à **5 en attente**, payés tout de suite. Les places du hangar sont réservées dès la
  commande. Un lot en attente annulé t'est remboursé en entier.

## Et ensuite

Chaque classe d'empire aura son vaisseau : le Récolteur pour l'Industriel, le Croiseur de raid pour le Seigneur de guerre, l'Éclaireur
lointain pour l'Explorateur. Les chiffres sont proposés, les illustrations sont en préparation.
