# Proposition : feuille de route 2026, 4e trimestre

Statut : **ordre A → B → C validé** (2026-10-06, « Go lot A, puis B et C »). Lot A livré en 5.28.1 (`docs/changes/5.28.1-correctifs.md`), lot B en 5.29.0 (`docs/changes/5.29.0-performance.md`), lot C en 5.30.0 (option 1 de `docs/proposals/journal-de-bord.md`), lot D en 5.31.0. Lots E et F livrés ensemble en 5.32.0 (`docs/changes/5.32.0-entrepot-chantiers.md`) ; option B du lot E (butin) à simuler. Lots G, H et I livrés ensemble en 5.33.0 (`docs/changes/5.33.0-*.md`, propositions `alliances-grandes.md`, `flottes-emplacements.md`, `routes-logistiques.md`) ; reste du lot I (flotte basée, route inverse) plus tard. Lot J.1 (classes) livré en 6.0.0 (`docs/changes/6.0.0-classes-empire.md`) ; J.2 (unités de classe) attend les illustrations.
Question 2 sans réponse : le lot C affiche contrats et missions du jour ensemble, sans fusionner leurs règles ; la fusion reste à décider.

Sources :
- audit `docs/audit/2026-10-06-audit-global.md`, constats C, E, Q, P, D ;
- fiches `docs/systems/`.

Objectif de l'utilisateur :
> « améliorer ce jeu, le développer, le rendre performant avec une bonne QoL, que les gens prennent du plaisir »

## Principes de priorisation

1. **D'abord ce qui fausse le jeu** (bugs de cohérence), puis ce qui se ressent à chaque session (QoL, performance), puis l'équilibre
   (avec des données de production), enfin le nouveau contenu.
2. Un lot = une PR = une fiche `docs/changes/`. Un lot d'équilibre ou de nouveau système a d'abord sa proposition détaillée.
3. Rien qui retire du progrès aux joueurs sans compensation ni annonce (règle 3 du GDD).

## Les lots

| Lot | Version | Thème | Contenu | Constats | Taille | Proposition détaillée avant ? |
|:--|:--|:--|:--|:--|:--|:--|
| **A** | 5.28.1 | Cohérence | épave d'expédition dans le plafond (C1) ; remise automatique au retour des flottes (C2) ; `homeLevels` (C3) ; couche empire de `fleetUpkeep` et `buildingDiscount` + test de garde « chaque stat est lue » (C5) ; README à jour (D1) | C1 C2 C3 C5 D1 | S | non (correctifs) |
| **B** | 5.29.0 | Performance | découpe du bundle principal et du changelog ; ticks mémoïsés ; regroupement des tâches planifiées, avec mesure avant/après dans les métriques serveur | P1 P2 P3 | M | non (technique) |
| **C** | 5.30.0 | Journal de bord | un seul écran « Ordres du jour » : contrats et missions du jour fusionnés, série, primes, expéditions, vote d'alliance, rendez-vous de la semaine, « Tout réclamer » ; badge unique dans la barre latérale | Q1 Q4 | M | **oui** |
| **D** | 5.31.0 | Lisibilité | portefeuille unique (monnaies et jauges, d'où elles viennent, à quoi elles servent) ; « d'où vient ce chiffre » sur les valeurs clés ; nommage des saisons unifié | Q2 Q3 | M | oui (court) |
| **E** | 5.32.0 | Risque et récompense | protection de l'entrepôt en heures de production (≈ 8 h) au lieu de 10 % de la capacité ; courbe d'entrepôt recalée ; plafond global de sauvetage 95 % → 80 % ; aperçu « ce que tu risques » sur la page Bâtiments | E1 E2 | M | **oui**, avec données de production |
| **F** | 5.32.0 | Constructeurs | second constructeur de bâtiments (déblocage chiffré) ; recherche : 2 files de base, 3e et 4e à débloquer | E3 | M | **oui** |
| **G** | 5.33.0 | Alliances plus grandes | 6 → 12 → 20 membres par recherche d'alliance ; coûts et boss d'alliance proportionnels à la taille ; garnisons et territoires recalés | E5 | L | **oui** |
| **H** | 5.33.0 | Flottes | emplacements de flotte (base généreuse + technologie), emplacement d'expédition séparé ; presets et « relancer la dernière mission » | E4 | M | **oui** |
| **I** | 5.33.0 (routes) | Colonies vivantes | routes logistiques automatiques (transport récurrent), file de défense coloniale améliorée ; flotte basée plus tard | E6 | L | **oui** |
| **J** | 6.0.0 (J.1) | Classes d'empire | choisir une identité (Industriel, Seigneur de guerre, Explorateur) avec un bonus et une unité propres, changeable contre de l'Ambre ; inspiré des classes d'OGame | — | XL | **oui** |

Taille : S ≤ 1 jour, M 2 à 3 jours, L ≈ 1 semaine, XL plusieurs semaines.

## Ordre recommandé

**A → B → C**, puis **E** dès que les données de production sont collectées. **D**, **F** et **H** peuvent s'intercaler. **G**, **I** et **J**
viennent ensuite, ce sont les gros chantiers de contenu.

Pourquoi cet ordre :
- A corrige ce qui est faux, à faible risque.
- B et C se sentent à chaque session et ne cassent aucun équilibre.
- E change l'économie de tous les joueurs : il lui faut des chiffres réels.

## Données à collecter avant le lot E

À relever dans Admin → Équilibrage et Rétention, ou à exporter :

- par joueur actif :
  - stock moyen et stock protégé ;
  - production horaire ;
  - butin moyen par attaque gagnée ;
- nombre d'attaques JcJ par semaine ;
- taux de victoire par type de combat ;
- part des hangars à plus de 90 % et en surcharge ;
- taux de sauvetage effectif moyen.

## Questions à trancher

1. Valides-tu l'ordre **A → B → C** ? Je peux lancer **A** tout de suite (correctifs, sans changement d'équilibre).
2. Pour **C** (Journal de bord) : fusionner contrats du jour et missions du jour, ou seulement les afficher ensemble ?
3. Pour **E** : es-tu d'accord pour rendre le pillage plus risqué (moins de stock à l'abri) ? C'est le plus gros levier pour que le JcJ
   compte, mais il touche tous les joueurs.
4. Pour **G** : jusqu'où agrandir les alliances (12 ou 20) ?
5. **J** (classes d'empire) t'intéresse-t-il comme grand chantier de la 6.0 ?
