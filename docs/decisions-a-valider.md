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
| Q241 | Proposé (pas lancé) : Aide d'alliance, H31-1 (`docs/proposals/feuille-de-route-2031-hiver.md`) | −1 % du temps restant par aide (3 min au moins), 10 aides par chantier, 30 données par jour | ★★★ valider |
| Q242 | Proposé (pas lancé) : Demande de renforts, H31-2 (`docs/proposals/feuille-de-route-2031-hiver.md`) | une demande toutes les 8 h, garnison envoyée en un clic, pas de don d'unités | ★★ valider |
| Q243 | Proposé (pas lancé) : Ligue des alliances, H31-3 (`docs/proposals/feuille-de-route-2031-hiver.md`) | groupes de 8 alliances, 7 manches d'un jour par mois, médailles et boutique de ligue | ★★ valider |
| Q244 | Proposé (pas lancé) : Opérations d'alliance du week-end, H31-4 (`docs/proposals/feuille-de-route-2031-hiver.md`) | base pirate générée de 5 à 9 avant-postes, attaquée ensemble du vendredi au dimanche | ★★★ valider (proposition détaillée d'abord) |
| Q245 | Proposé (pas lancé) : Annuaire des alliances, H31-5 (`docs/proposals/feuille-de-route-2031-hiver.md`) | liste filtrable (langue, taille, niveau, recrutement, activité) et « Postuler » | ★ valider |
| Q246 | Proposé (pas lancé) : Comptoir d'alliance, H31-6 (`docs/proposals/feuille-de-route-2031-hiver.md`) | marché interne sans taxe, commandes à remplir, plafonds anti-transfert | ★ valider |
| Q247 | Proposé (pas lancé) : Revanche, H31-7 (`docs/proposals/feuille-de-route-2031-hiver.md`) | 24 h pour contre-attaquer l'agresseur sans écart d'XP ni délai, butin +20 % | ★★★ valider |
| Q248 | Proposé (pas lancé) : Rediffusion du combat, H31-8 (`docs/proposals/feuille-de-route-2031-hiver.md`) | rapport rejoué en tours animés, partageable | ★★ valider |
| Q249 | Proposé (pas lancé) : Plans de défense enregistrés, H31-9 (`docs/proposals/feuille-de-route-2031-hiver.md`) | 3 préréglages de posture et de formation par planète | ★ valider |
| Q250 | Proposé (pas lancé) : Missiles interplanétaires et anti-missiles, H31-10 (`docs/proposals/feuille-de-route-2031-hiver.md`) | Silo ; missiles qui ne détruisent que des défenses, réparées à 70 % par l'Atelier | ★ proposition chiffrée et simulation d'abord |
| Q251 | Proposé (pas lancé) : Porte de saut de lune à lune, H31-11 (`docs/proposals/feuille-de-route-2031-hiver.md`) | saut vers une autre lune du joueur, plus seulement vers la planète mère | ★ valider |
| Q252 | Proposé (pas lancé) : Lune hors service (variante douce), H31-12 (`docs/proposals/feuille-de-route-2031-hiver.md`) | l'Étoile noire coupe une lune 48 h, jamais de destruction | après la mise en production et 8 semaines de mesures |
| Q253 | Proposé (pas lancé) : Apprenti constructeur, H31-13 (`docs/proposals/feuille-de-route-2031-hiver.md`) | objet +1 chantier 24 h, gagné au passe, au coffre et en ligue, jamais vendu | ★★★ valider |
| Q254 | Proposé (pas lancé) : Marchand ambulant, H31-14 (`docs/proposals/feuille-de-route-2031-hiver.md`) | 3 offres tirées toutes les 8 h, payées en ressources ou en Ambre gagnée | ★★ valider |
| Q255 | Proposé (pas lancé) : Position des planètes, H31-15 (`docs/proposals/feuille-de-route-2031-hiver.md`) | bonus et cases selon la position, nouvelles colonies seulement | ★ valider |
| Q256 | Proposé (pas lancé) : Équipement des officiers, H31-16 (`docs/proposals/feuille-de-route-2031-hiver.md`) | 2 emplacements par officier, pièces à effets composés, montée par fragments | ★★ valider (proposition détaillée d'abord) |
| Q257 | Proposé (pas lancé) : Notifications hors du jeu (PWA), H31-17 (`docs/proposals/feuille-de-route-2031-hiver.md`) | appli installable, notifications choisies dans les Options, rien la nuit, 6 par jour au plus | ★★★ valider |
| Q258 | Proposé (pas lancé) : Semaine éclair, H31-18 (`docs/proposals/feuille-de-route-2031-hiver.md`) | ×2 sur chantiers et recherches jusqu'au niveau 10, une semaine par saison au plus | ★ valider |
| Q238 | Portraits de saison pour novembre, décembre, janvier seulement ; migration des saisons écrites (`docs/changes/6.14.93-illustrations-api-lot-2.md`) | Les commandants des mois suivants gardent le portrait du rôle principal | Valider |
| Q239 | En-têtes illustrés sur 8 pages (`docs/changes/6.14.93-illustrations-api-lot-2.md`) | Un visuel en haut de 8 pages, texte gardé lisible par le fondu | Valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
| Q233 | Séparer or/accent et violet/danger, la barre rouge devient un décor (lot TH-L5) ; thème gardé (`docs/audit/2026-10-07-au28-themes.md`) | valider |
| Q234 | Icône d'alerte obligatoire sur tout ember (lot TH-L6), sans casser le monochrome de Cockpit (`docs/audit/2026-10-07-au28-themes.md`) | valider |
| Q235 | Mesurer sur `space-600`, plus proche du fond réel des panneaux (lot TH-L4) (`docs/audit/2026-10-07-au28-themes.md`) | valider |
| Q236 | Rouge franc `#ff4433` au lieu du rose `#ff3d5a` (déjà appliqué) : ne se confond plus avec l'accent (`docs/audit/2026-10-07-au28-themes.md`) | valider |
| Q237 | Constellation pour les captures livrées ; audit des 13 thèmes (`scripts/theme-audit.mjs`) à chaque revue de fin de feuille de route (TH-L7) (`docs/audit/2026-10-07-au28-themes.md`) | valider |
| Q240 | Classes, modules, colonies : fichiers intégrés, affichage au lot suivant (`docs/changes/6.14.93-illustrations-api-lot-2.md`) | Valider |
