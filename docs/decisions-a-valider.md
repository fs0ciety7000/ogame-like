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
| Q184 | Notification « Nouveau : … » : Une par ouverture (toutes les pages ouvertes au même moment citées ensemble, aucune annoncée deux fois) | Menu progressif des nouveaux joueurs | Valider (option prudente) |
| Q185 | Mémoire des pages annoncées : `stats.navAnnounced` (pas de nouveau champ de schéma ni de marque dans `announcementsSeen`) | Menu progressif des nouveaux joueurs | Valider (option prudente) |
| Q186 | Comptes d'avant le lot : Pages déjà ouvertes notées sans notification, comme une page déjà visitée | Menu progressif des nouveaux joueurs | Valider (option prudente) |
| Q187 | Danger lu par le serveur pour ouvrir une page : Celui de la fiche (combat, raid scripté, ultimatum) ; une flotte hostile en vol reste gérée par le client | Menu progressif des nouveaux joueurs | Valider (option prudente) |
| Q188 | Dons et objectifs d'un admin neuf : Dons rattachés à Commerce ; objectifs d'un admin neuf filtrés comme un joueur | Menu progressif des nouveaux joueurs | Valider (option prudente) |
| Q189 | Aperçu de l'admin : Par rang (pas par profil J0/J1/J7 : le simulateur ne donne pas encore le jour de chaque palier) | Menu progressif des nouveaux joueurs | Valider (option prudente) |
| Q190 | Succès « Tout l'empire » (toutes les pages ouvertes) : Non créé : il serait donné d'un coup, avec son XP, à tous les comptes existants | Menu progressif des nouveaux joueurs | Valider (option prudente) |
| Q191 | Ambre dans la barre des ressources : Affichée dès qu'il y a un solde, même si Primes est fermé | Menu progressif des nouveaux joueurs | Valider (option prudente) |
| Q192 | Billet du devblog pour le déblocage : Une ligne dans le billet récapitulatif (Q157), pas de billet dédié | Menu progressif des nouveaux joueurs | Valider (option prudente) |
| Q193 | Tempéraments des seigneurs : Seul « Agressif » reste coloré (orange), les autres neutres | Cohérence visuelle et lisibilité | Valider (option prudente) |
| Q194 | Agenda : Tout en violet avec une icône par rubrique ; l'export `.ics` perd l'emoji des concours et des salons | Cohérence visuelle et lisibilité | Valider (option prudente) |
| Q195 | Fuseau horaire : Rendez-vous du serveur à l'heure de Paris, le reste à l'heure de l'appareil (change l'heure affichée sur 6 écrans hors du fuseau de Paris) | Cohérence visuelle et lisibilité | Valider (option prudente) |
| Q196 | `HudTag` sans ton : Neutre par défaut (l'étiquette de version de la maintenance passe de l'accent au neutre) | Cohérence visuelle et lisibilité | Valider (option prudente) |
| Q197 | Plancher de 11 px : Pastilles comprises ; exemptés : libellés des dessins SVG, `.signal-tag`, classes `.ck-*` du cockpit | Cohérence visuelle et lisibilité | Valider (option prudente) |
| Q198 | Taille des gros chiffres de `StatTile` : `text-2xl` sous 640 px, `text-3xl` au-dessus | Cohérence visuelle et lisibilité | Valider (option prudente) |
| Q199 | Jauge de stock presque pleine (colonies) : Orange au lieu de l'or | Cohérence visuelle et lisibilité | Valider (option prudente) |
| Q200 | Gardes du design system : Cliquet par fichier (exceptions comptées qui ne peuvent que baisser) ; règle eslint `useEffect` en avertissement pour 3 fichiers de l'admin | Cohérence visuelle et lisibilité | Valider (option prudente) |
| Q201 | Notification du navigateur pour un événement : Sans emoji | Cohérence visuelle et lisibilité | Valider (option prudente) |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
