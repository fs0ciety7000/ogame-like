# Proposition : emplacements de flotte et « Relancer » (lot H)

Statut : **livrée (5.33.0)** : option B, 10 emplacements, sondes et expéditions hors compte, et « Relancer la dernière mission ». Décision du
2026-10-06 (« fais ce qu'il y a de mieux »). Fiche : `docs/changes/5.33.0-emplacements-flotte.md`.
Constat : E4 de `docs/audit/2026-10-06-audit-global.md`. Lot H de `docs/proposals/feuille-de-route-2026-q4.md`.

## 1. Constat

> « Rien ne rend précieux le choix d'une mission : j'envoie tout, partout. » (audit E4)
> « Je relance la même mission dix fois par jour, en refaisant la composition à chaque fois. »

Production, 2026-10-06, en lecture seule, collection `fleets` :
- flottes simultanées au plus, par joueur (12 joueurs ayant envoyé une flotte) : 1, 4, 4, 5, 5, 5, 6, 6, 7, 7, 8, **11** ;
- missions sur la période : recyclage 241, primes 123, espionnage 119, pirates 70, expéditions 59, attaques 47, transports 17.

## 2. Diagnostic

- Aucune limite de flottes en vol (`performLaunch`), sauf pour les expéditions, qui ont la leur (`expeditionsActive`).
- Les compositions enregistrées existent déjà (raccourcis de flotte) ; il manque le geste « même chose, encore une fois ».

## 3. Benchmark

| Jeu | Règle |
|:--|:--|
| OGame | emplacements = 1 + niveau de la technologie Ordinateur ; expéditions sur des emplacements à part |
| Clash of Clans | une armée à la fois, « Entraîner à nouveau » en un geste |
| Mobiles de gestion | 2 à 5 « marches » simultanées, débloquées par bâtiment |

## 4. Options

| Option | Règle | Effet | Risque |
|:--|:--|:--|:--|
| A | Statu quo, « Relancer » seul | confort | E4 reste ouvert |
| B | **10 emplacements**, sondes et expéditions hors compte ; « Relancer » | la limite ne gêne que le joueur à 11 ; elle existe, se lit (« 4 / 10 ») et pourra se débloquer | faible |
| C | 4 de base + technologie (OGame) | vrai choix de mission | retire de la capacité à 9 joueurs sur 12 (plus de 4 flottes en vol observées) : vécu comme un recul |

## 5. Recommandation

**Option B maintenant**, C plus tard si l'arbitrage manque encore (avec une technologie ou un bâtiment qui débloque des emplacements).
- Règle : `FLEET_RULES.slotsBase = 10`, réglable (Règles → Flottes en vol). Le serveur compte les flottes de l'émetteur qui ne sont pas terminées,
  hors espionnage et expédition (`cosmic_db.js`, `fleetsActive`) ; le moteur refuse le départ (`fleetSlotBlocker`).
- Écran : compteur « n / 10 » dans le panneau Flottes ; il passe en ember quand tout est pris.
- « Relancer la dernière mission » : le dernier départ envoyé par `sendFleet` (cible, vaisseaux, mission, options) est gardé dans le navigateur,
  et un bouton le renvoie. Le serveur revérifie tout (unités, cible, emplacements). Le départ différé n'est pas repris.
- Aucune flotte en vol n'est rappelée : la limite joue au lancement suivant.

## 6. Invariants

- Une flotte ne décolle que si `flottes en vol (hors sondes et expéditions) < emplacements`. Test : `fleetSlots.test.ts`.

## 7. Plan de lots

1. H.1 (5.33.0) : règle, réglage admin, compteur, « Relancer », tests.
1. O (6.3.0) : « Relancer » étendu aux primes, boss, transports et livraisons (`docs/changes/6.3.0-relancer.md`).
2. H.2 (plus tard, si besoin) : emplacements à débloquer, et passage de la base à 6 ou 8.

## 8. Questions ouvertes

1. Faut-il compter les garnisons (flottes stationnées chez un allié) ? Aujourd'hui : oui, elles occupent un emplacement.
