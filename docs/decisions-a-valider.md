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
