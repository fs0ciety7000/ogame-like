# Unités, chantier et hangars

## Rôle
Puissance militaire (attaque, défense) et logistique (cargo, drones, sondes). Bornée par les hangars.

## Règles et chiffres
- 24 unités par défaut : 17 de base, le Traqueur kesh, 3 d'élite (contre les seigneurs seulement) et 3 de classe ; classes Faible / Moyen / Fort / Soutien calculées (√(ATK × PV)) ;
  Fort > Moyen > Faible > Fort (±20 % de dégâts).
- Places : de 1 (roquette, frégate) à 80 (Étoile noire) ; capacité = hangars × tech × effets d'empire (`hangar.ts`).
- Revente au hangar : 50 % du prix ; démantèlement en Cale sèche : 60 % (chaque ressource du coût, 6.14.123).
- Coût : ferraille et énergie, plus toute ressource réglée dans l'admin (6.14.123) ; temps de construction par défaut et débris : ferraille + énergie.
- Rôles (6.14.123, I39) : sonde, recycleur, transport, soutien, faiblesse de boss, contre-espionnage, lus à la place des identifiants.
- Une file par catégorie (attaque, défense).

## Code et admin
`units.ts`, `unitClasses.ts`, `hangar.ts`, `eliteUnits.ts`, `UnitsPage.tsx`. Admin : Contenu → Unités ; Équilibrage (audit des unités).

## Invariants
I2, I3, I4, I5, I39 (GDD §4).

## État (audit 2026-10-06)
- Épave d'expédition : corrigée en 5.28.1 (C1), les vaisseaux trouvés passent par les « prêts ».
- Catégorie = vole ou non (6.3.1, audit C4) : « Vaisseaux » (`attack`, hangar d'attaque, partent en flotte) et « Défenses » (`defense`, restent sur la planète). Le Bastion est un vaisseau-forteresse ; l'Intercepteur une tourelle (sans vitesse ni soute, attaque 320, défense 80). Les effets `cat:attack` et `cat:defense` ne changent pas.
- Vaisseaux de classe (6.5) : Récolteur (Industriel), Croiseur de raid (Seigneur de guerre), Éclaireur lointain (Explorateur). Construits seulement
  dans leur classe, niveau = techno de référence (`classTech` : tech9, tech13, tech20), gardés après un changement de classe (`classUnits.ts`).
  Récolteur : unité de soutien, recycle avec +25 % ; Éclaireur : expédition −15 %.

## 6.14.123 (revue AU27, lot AA5 : rôles d'unités)
Constats AA-16 à AA-18 (`docs/audit/2026-10-07-au27-admin-evolutif.md`). Fiche du lot : `docs/changes/6.14.123-roles-unites.md` ; GDD §7.14.

| Rôle (`UnitDef.roles`) | Unités par défaut | Ce que le jeu en lit |
|:--|:--|:--|
| `probe` (sonde) | Sonde d'espionnage | seule à espionner (`isProbeUnit`) ; jamais en combat contre un boss, une proie, un repaire, en expédition, en transport, en livraison, en base avancée ; repli `spy.probeUnitId` |
| `recycler` | Drone récupérateur | recycle (sa soute = capacité de ramassage) ; jamais dans les flottes des seigneurs ; repli `debris.recyclerUnitId` (le Récolteur recycle par sa règle de classe) |
| `transport` | Cargo | jamais dans les flottes des seigneurs ; hors des comparaisons de l'outil Équilibrage |
| `support` | Sonde, Drone, Traqueur Kesh, Vaisseau-atelier, Récolteur | hors des comparaisons d'équilibrage par coût (`combatUnits`) |
| `bossWeakness` | Frégate, Chasseur, Intercepteur, Croiseur Nova, Lance gravitationnelle, Étoile Noire | faiblesse de phase 3 d'un boss sans faiblesse propre (vaisseaux seulement, du moins cher au plus cher) |
| `counterSpy` | Sentinelle | chaque unité à quai compte dans le contre-espionnage ; repli `spy.sentinelUnitId` |

- Admin → Contenu → Unités : cases « Rôles » (une unité ajoutée n'en a aucun ; une unité livrée garde les siens tant qu'on n'y touche
  pas) et « Autres ressources » dans le coût. Une fiche enregistrée avant la 6.14.123 reçoit les rôles par défaut (migration
  `unit-roles-6.14.123`, et même repli à la lecture).
- Préréglages d'effets générés pour une unité ajoutée (« Armement », « Blindage ») : le maillon « préréglage » de la chaîne de contenu
  est rempli sans code.
- Identifiants d'unités en dur restants, justifiés (garde `unitRoles.test.ts`) : définitions (`units.ts`), faiblesses propres des boss
  (`worldBosses.ts`), cibles des technos, préréglages écrits, unités d'élite et de classe (listes fixes), replis des règles,
  tutoriel, émojis, simulateur, migrations historiques.
