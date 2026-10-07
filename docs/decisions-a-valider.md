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
| Q138 | Carte des Chroniques sur le Passe : Remplacée par une ligne-lien vers la page des Chroniques (`ChroniclesCard.tsx` supprimé, la page garde sa frise et la réclamation) | Hiérarchie des pages | Valider (option prudente) |
| Q139 | Tête du Passe : Les 3 tuiles (palier, points, fin de saison) restent en tête, avant la grille des paliers | Hiérarchie des pages | Valider (option prudente) |
| Q140 | Codex : filtre unique : Les tuiles (avec « Tout ») plutôt que la barre d'onglets | Hiérarchie des pages | Valider (option prudente) |
| Q141 | Tons du tempérament des seigneurs : Inchangés (leur sens relève d'UX-9) | Hiérarchie des pages | Valider (option prudente) |
| Q142 | Tri des alliances à rejoindre : Par mode de recrutement seulement (ouvertes, sur candidature, fermées ou complètes) | Hiérarchie des pages | Valider (option prudente) |
| Q143 | Zone élargie de « Lire la suite » et « Tout masquer » (astuces) : Sur écran tactile seulement (`hud-hit`), plus à la souris | Tactile et accessibilité | Valider (option prudente) |
| Q144 | Facteurs des reliques de la lune : Lentille de Séléné × 2 (+20 % de portée en épique), Clé du seuil × 1,5 (−15 % de recharge en épique), sous les plafonds 50 % et 30 % | Lune : reliques, succès, Codex, défi, Carnet | Valider (option prudente) |
| Q145 | Défi d'alliance de la lune : « Les vigies » (garnisons envoyées + balayages, jouable sans lune) ; un 7e défi décale la rotation des semaines suivantes | Lune : reliques, succès, Codex, défi, Carnet | Valider (option prudente) |
| Q146 | Étape « Ta lune veille » du Carnet du commandant : Dernier chapitre, faisable sans lune (lune, réserve de pitié ou garnison) ; rouvre le Carnet de ceux qui l'avaient fini, titre gardé | Lune : reliques, succès, Codex, défi, Carnet | Valider (option prudente) |
| Q147 | Déblocage des fiches du Codex de la lune : Phalange au premier balayage, porte au premier saut (Légendes : 2 → 4 fiches) | Lune : reliques, succès, Codex, défi, Carnet | Valider (option prudente) |
| Q148 | Rapport d'impact et reliques composées : Comptées, sauf celles liées à un mode de combat (JcJ, PNJ, seigneurs) | Lune : reliques, succès, Codex, défi, Carnet | Valider (option prudente) |
| Q149 | Lunes nées par pitié (santé de l'équilibre) : `moon.byPity` posé seulement sur les lunes nées à partir de 6.14.69 | Lune : reliques, succès, Codex, défi, Carnet | Valider (option prudente) |
| Q150 | Recharge du balayage et de la porte au Journal : Rien d'ajouté : les notifications disent déjà « Prochain … dans … » ; la frise « Prochaines fins » les affiche | Lune : reliques, succès, Codex, défi, Carnet | Valider (option prudente) |
| Q151 | Reportés (talent ou officier de recharge, offre du Comptoir, scénario « et si », victoires avec ou sans lune) : À É30-1e ou plus tard (le préréglage d'effet est prêt) | Lune : reliques, succès, Codex, défi, Carnet | Valider (option prudente) |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
