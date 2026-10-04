# Jetons du casino : d'où ils viennent, où ils vont (5.14.2)

Réglages par défaut (modifiables dans Administration → Casino). Tous les jetons arrivent par le serveur.

## Entrées

| Source | Jetons | Quand | Où c'est versé |
|---|---|---|---|
| Jeton du jour | 1 | une fois par jour, **seulement quand le casino est ouvert**, tant qu'on a moins de 20 jetons | page Casino, bouton « Récupérer » (`claimDailyTokens`) |
| Passe de saison | selon les paliers « Jetons du casino » | à la réclamation du palier | `grantPassReward` (kind `tokens`) |
| Défi hebdomadaire | 1 (palier 1), 2 (palier 2) | à la réclamation | `/api/cosmic/challenge/claim` |
| Boss mondial, boss de saison, boss d'alliance abattu | 1 par participant ; +2 au 1er en dégâts, +1 aux 2e et 3e | à la distribution des récompenses | `bossTokens` |
| Boss retiré (pas abattu) | 0 | — | `bossTokens` |
| **Proie d'élite des primes abattue** (nouveau) | 2 par chasseur récompensé | à la distribution de la traque | `distributeElite` |
| **Seigneur de guerre pillé** (nouveau) | 1 par attaque gagnée contre un seigneur | à l'arrivée de la flotte | `resolveAttackArrival` |
| Tournoi du casino | 5 / 3 / 2 au podium | à la fermeture du casino | `tournamentResult` |
| Cerise au tirage | le jeton est rendu | 15 % des tirages | `applySpin` |
| Administration | 1 à 100, à un joueur ou à tous | à la demande | Admin → Casino → « Offrir des jetons » |

Le plafond de 20 ne bloque que le jeton du jour : les autres sources peuvent dépasser 20.

## Sorties

Un tirage coûte un jeton. Le 7-7-7 sort à 0,5 % par tirage. Avec la cerise qui rend le jeton, il faut en moyenne
**170 jetons** (médiane 118). Le gros lot verse **90 % de chaque ressource du pot commun**. L'entrepôt ne plafonne pas
un gain reçu d'un coup : seule la production s'arrête au-delà de la capacité. Le gagnant reçoit aussi le titre
« Main d'or », le succès mythique du même nom, la bannière et le sceau du 7-7-7, et l'entrée « La Main d'or » du codex.
