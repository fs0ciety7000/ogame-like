# Revue AU13 : transverse et clôture de la feuille de route d'hiver

Date : 2026-10-07. Lot AU13 de `docs/proposals/feuille-de-route-2026-hiver.md` (dernière ligne).
Sources :
- code (`cosmic.pb.js`, `cosmic_db.js`, `balance/health.ts`, `ChangelogPage.tsx`) ;
- serveur local (intégration 77 sur 77, `admin/balance`) ;
- interface : 42 pages du jeu mesurées à 375 px (Constellation, joueur neuf).

Données de production non relues (Q3).

## Constats

| # | Gravité | Constat | Preuve | Suite |
|:--|:--|:--|:--|:--|
| SEC-1 | ℹ️ | 52 routes `/api/cosmic/admin/…` : toutes vérifient `isGameAdmin`, dans la route ou dans la fonction de `cosmic_db.js` appelée. Les routes publiques sans compte (statut, version, blog, passkeys, désabonnement, suivi des e-mails, carte de victoire, parrain) sont voulues | `adminRoutes.test.ts` | **test de garde ajouté en 6.10.1** |
| CRON-1 | ℹ️ | 17 `cronAdd` : 14 passent par `timedCron` ; les 3 cadences (minute, 5 min, 10 min) chronomètrent chaque étape (`CADENCES`) | `cosmic.pb.js` | rien |
| COM-3 | 🟡 | Volumes du commerce absents de la santé de l'équilibre (repris d'AU4) | `health.ts` | **corrigé en 6.10.1** : tuile « Commerce (7 j) » (marché, enchères, contrats, cadeaux ; marchand PNJ exclu) |
| UI-1 | 🟠 | Nouveautés : toutes les notes de version affichées d'un bloc (181 761 px de haut à 375 px, 148 itérations) | mesure | **corrigé en 6.10.1** : tranches de 10 (« Afficher plus »), 5 343 px ; image sans `rounded-lg` (DESIGN.md) |
| UI-2 | ℹ️ | 42 pages : aucune ne déborde à 375 px, aucune erreur de console | mesure | rien |
| UI-3 | 🟡 | Pages longues à 375 px : Menaces 9 463 px, Bâtiments 9 395 px, Unités 8 779 px, Formules 8 053 px (repris de COM-5 : Casino 3 305 px) | mesure | feuille de route suivante (onglets ou repli) |
| A11Y-1 | ℹ️ | Aucun bouton à icône seule sans `aria-label` ni `title` (balayage statique des `.tsx`) | balayage | rien |
| ADM-1 | ℹ️ | Règle n° 2 : registre de 60 groupes (6.9.1), tout `*_RULES` relié à l'admin (`ruleRegistry.test.ts`) ; 6.10.0 ajoute `colonyBase` (section Colonies) | tests | rien |
| PERF-1 | ℹ️ | Bloc de démarrage 276 Ko compressés, moteur ≈ 60 % ; chargement à la demande du contenu reporté | fiche 6.9.10 | Q8 |
| Q-OPEN | ℹ️ | Questions ouvertes Q1 à Q10 (`QUESTIONS.md`) : à revoir avec l'utilisateur | `QUESTIONS.md` | feuille de route suivante |

## Bilan de la feuille de route d'hiver
Les 20 lignes du planning sont livrées ou tranchées :
- AU1 à AU13 ;
- T, U, V, P, W, Y ;
- X : mesuré et reporté (Q8).

La suite est proposée dans `docs/proposals/feuille-de-route-2027-printemps.md`.
