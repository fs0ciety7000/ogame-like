# Revue AU14 : clôture de la feuille de route de printemps

Date : 2026-10-07. Dernière ligne de `docs/proposals/feuille-de-route-2027-printemps.md`.
Sources :
- code et tests ;
- intégration PocketBase (78 sur 78, plusieurs passages) ;
- pages touchées mesurées à 375 px (Constellation, joueur neuf).

Données de production non relues (Q3, Q12).

## Constats

| # | Gravité | Constat | Preuve | Suite |
|:--|:--|:--|:--|:--|
| SP-1 | ℹ️ | Lots livrés : Z2 (6.10.2), Z5 (6.10.3), Z3 (6.11.0), Z4 (6.11.1). Z0, Z1 et Z6 sautés : production, `main` ou PR (Q12) | fiches | feuille de route suivante |
| SP-2 | 🟡 | Test d'intégration « v4.2 warlords » : un échec (« resource wasn't found ») sur 7 passages complets, jamais reproduit ensuite. Isolé avec `-t`, il échoue toujours, mais pour une autre raison : il dépend des comptes créés par les tests précédents | passages du 2026-10-07 | **diagnostic ajouté en 6.11.2** (la liste des raids de Brannoc est affichée si A n'est pas visé) ; cause à confirmer au prochain échec |
| SP-3 | 🟡 | Combat sur une colonie avec des vaisseaux : le champ de débris prenait l'identifiant de la colonie (trop long) et faisait échouer la résolution | journal PocketBase | **corrigé en 6.11.1** (pas de débris sur colonie, Q13) ; vrai traitement à concevoir |
| SP-4 | ℹ️ | Pages à 375 px : Menaces 2 148, Passe 3 680, Colonies 1 565, Nouveautés 4 197, Bâtiments 5 456, Unités 5 651 px ; aucun débordement, aucune erreur | mesure | Unités légèrement au-dessus de la cible de 5 000 px, à suivre |
| SP-5 | 🟡 | Billet de devblog manquant pour les lots importants 6.10 et 6.11 (règle « Livrer ») | `content/blog` | **ajouté en 6.11.2** (`45-base-avancee-paliers-bonus.md`) |
| SP-6 | ℹ️ | Règle n° 2 : registre de 64 groupes (6.10.3 et 6.11.0 en ajoutent 5) ; chaque nouveau chiffre a son champ dans l'admin | `ruleRegistry.test.ts` | rien |

## Bilan
- La feuille de route de printemps est close.
- Les lots qui demandent la production restent à faire dès que l'utilisateur ouvre la PR et donne un accès de lecture (Q12).
- La suite est proposée dans `docs/proposals/feuille-de-route-2027-ete.md`.
