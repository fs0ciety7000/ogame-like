# Unités, chantier et hangars

## Rôle
Puissance militaire (attaque, défense) et logistique (cargo, drones, sondes). Bornée par les hangars.

## Règles et chiffres
- 21 unités, dont 3 d'élite (contre les seigneurs seulement) ; classes Faible / Moyen / Fort / Soutien calculées (√(ATK × PV)) ;
  Fort > Moyen > Faible > Fort (±20 % de dégâts).
- Places : de 1 (roquette, frégate) à 80 (Étoile noire) ; capacité = hangars × tech × effets d'empire (`hangar.ts`).
- Revente au hangar : 50 % du prix ; démantèlement en Cale sèche : 60 %.
- Une file par catégorie (attaque, défense).

## Code et admin
`units.ts`, `unitClasses.ts`, `hangar.ts`, `eliteUnits.ts`, `UnitsPage.tsx`. Admin : Contenu → Unités ; Équilibrage (audit des unités).

## Invariants
I2, I3, I4, I5 (GDD §4).

## État (audit 2026-10-06)
- Épave d'expédition : corrigée en 5.28.1 (C1), les vaisseaux trouvés passent par les « prêts ».
- Catégorie = vole ou non (6.3.1, audit C4) : « Vaisseaux » (`attack`, hangar d'attaque, partent en flotte) et « Défenses » (`defense`, restent sur la planète). Le Bastion est un vaisseau-forteresse ; l'Intercepteur une tourelle (sans vitesse ni soute, attaque 320, défense 80). Les effets `cat:attack` et `cat:defense` ne changent pas.
