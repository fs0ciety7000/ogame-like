# Plan : où on en est, ce qui reste, dans quel ordre

Mis à jour le 2026-10-09. **C'est le document à lire en premier pour savoir quoi faire.** Les feuilles de route
(`docs/proposals/feuille-de-route-*.md`) restent en place comme historique détaillé : leurs noms de saison (« hiver 2026 » à
« hiver 2031 ») sont des **étapes de travail**, pas un calendrier ; elles ont toutes été écrites entre le 6 et le 8 octobre 2026.

## Où on en est

| | Version | Contenu |
|:--|:--|:--|
| Production (`empire.fs0ciety.org`) | 5.27.0 | 16 comptes, 14 actifs (relevé du 2026-10-06) |
| Pré-prod (`test.fs0ciety.org`) | 6.14.159 | 158 lots 6.14.x livrés depuis la 5.27 (index : `docs/changes/README.md`) |
| PR de mise en production | à ouvrir | texte prêt : `docs/release/pr-5.27-6.14.md` |

## Décision du 2026-10-09 (l'utilisateur)

> On arrête d'ajouter des nouveautés. On stabilise, on joue, on met en production, puis on reprend les nouveautés une à une.

Tant que l'étape 3 n'est pas faite, **aucun nouveau système** : seulement des corrections trouvées en jouant. La règle n° 3 de
`CLAUDE.md` (« enchaîner les lots sans pause ») s'applique à ce plan, dans cet ordre.

## Étapes

| # | Étape | Contenu | État |
|:--|:--|:--|:--|
| 1 | **Stabilisation** | Parcours d'un nouveau joueur joué sur la pré-prod (Claude : compte `Testeur_Claude` ; l'utilisateur : compte `Marsupial`) : première heure, premier jour. Liste des irritants (`docs/audit/2026-10-09-parcours-nouveau-joueur.md`), corrections par petits lots, nouveau passage. Déjà fait : départ rapide des bâtiments (6.14.159, RD-1). | en cours |
| 2 | **Décision sur la prod** | Recommandé : **nouvel univers** (comptes et identifiants gardés, parties remises à zéro, titre ou bannière « Fondateur » pour les comptes existants, annonce avant). Alternative : migration des parties 5.27 (plus risquée). Script, annonce et procédure préparés par Claude ; lancement par l'utilisateur (écriture en production). | à décider |
| 3 | **Mise en production** | PR `claude/hiver-k-s` → `main` (ouverte par l'utilisateur ou à sa demande), fusion, « Mettre à jour les hooks » dans l'admin, vérification. | après 1 et 2 |
| 4 | **Nouveautés, une à la fois** | Les 18 lots H31 validés (`feuille-de-route-2031-hiver.md`, ordre de sa table), R4c si Q397 est validée. Chaque lot est **joué** sur la pré-prod avant le suivant. | après 3 |
| — | Mesures datées | R10 à R13 (après le 1er novembre, après la mise en production, après Z6). | à leur date |

## Leçons (pour ne pas recommencer)

- Une simulation ne remplace pas une partie jouée : les audits mesuraient le rythme sur des mois, personne ne mesurait la première
  heure (10 min pour le niveau 2, corrigé en 6.14.159). Chaque étape se termine par un parcours joué.
- Le procédural (Chroniques, passe, succès générés) reste tel quel : on n'y ajoute plus rien avant d'avoir des joueurs pour en
  mesurer l'intérêt.
- Un seul plan court (ce fichier) plutôt qu'une nouvelle feuille de route par étape.
