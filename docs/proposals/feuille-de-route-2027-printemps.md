# Proposition : feuille de route de printemps 2027

Statut : **en cours** (2026-10-07, clôture d'AU13). Ordre provisoire noté en Q11 (`docs/QUESTIONS.md`), modifiable à tout moment.
Règle n° 3 : les lots s'enchaînent sans attendre de validation. Écrire en production, pousser sur `main` et ouvrir une PR restent hors du
travail automatique : Z0 et Z1 sont sautés et notés (Q12), les lots qui en dépendent prennent l'option prudente.

## 1. D'où viennent les lots
- Questions ouvertes de `QUESTIONS.md` (Q1 à Q10).
- Constats restants des revues AU1 à AU13 (UI-3 pages longues, PERF-1, BOSS-2, PRG-1, PRG-2).
- Suites des lots livrés (Y : défense de colonie par la base, Q9).

## 2. Planning proposé

| # | Lot | Contenu | Taille | Dépend de |
|:--|:--|:--|:--|:--|
| 1 | Z0 | Mise en production de `claude/hiver-k-s` : PR unique, « Mettre à jour les hooks », redémarrage, lecture des relevés (santé, commerce, passe) | S | décision utilisateur |
| 2 | Z1 | Mesures de production (lecture seule) : PRG-1 (points d'octobre), BOSS-2, COM-3 réels, usage des bases avancées ; réponses à Q3 et Q8 | S | Z0 |
| 3 | Z2 | Pages longues (UI-3) : Menaces, Bâtiments, Unités, Formules en onglets ou blocs repliables, cible < 5 000 px à 375 px | M | livré 6.10.2 (Menaces 2 148, Bâtiments 5 456, Unités 5 651 px ; Formules gardée) |
| 4 | Z3 | Passe : paliers bonus après le dernier palier (PRG-2, Q4), proposition chiffrée puis lot | M | Z1 |
| 5 | Z4 | Base avancée, suite (Q9) : la base défend la colonie (combat de colonie avec la flotte basée), proposition puis lot | L | Z1 (usage réel) |
| 6 | Z5 | Constantes de règle restantes (Q7) : inventaire final et conversion vers les objets de règles | M | livré 6.10.3 |
| 7 | Z6 | Performance, si les Web Vitals de production le justifient (Q8) : textes lourds du contenu chargés après le premier affichage | M | Z1 |
| 8 | AU14 | Revue de printemps : même grille que AU1 à AU13 sur les systèmes touchés | M | fin des lots |

## 3. Recommandation
Commencer par Z0 et Z1 : plusieurs décisions (Q1, Q3, Q4, Q8, Q9) attendent des chiffres réels. Z2 et Z5 ne dépendent de rien et
peuvent avancer en parallèle.
