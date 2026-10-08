# Cosmic Empires

**Un jeu de stratégie spatiale 4X en temps réel, dans le navigateur : bâtis ton empire, lance tes flottes et affronte d'autres commandants.**

Jouer : [empire.fs0ciety.org](https://empire.fs0ciety.org)

## Le jeu

Cosmic Empires est un jeu de gestion et de conquête spatiale par navigateur, dans la lignée d'OGame. Le joueur développe une
planète mère (huit ressources, treize bâtiments, un laboratoire de trente technologies), puis arme un chantier naval de plus de
vingt vaisseaux et défenses. Les flottes partent espionner, piller ou défendre sur une carte galactique partagée, contre d'autres
joueurs comme contre des empires tenus par le jeu. Tout avance en temps réel, même hors ligne : on lance ses files, on revient,
et l'empire a grandi.

## Fonctionnalités clés

- **Économie et progression** : ressources communes et rares, bâtiments à paliers, arbre technologique interactif, colonies
  avec leurs propres stocks et spécialisations, puis l'Ascension (retour au niveau 1 contre des talents permanents).
- **Flottes et combats** : carte galactique, espionnage, raids, postures de défense, débris à recycler, simulateur de combat et
  rapports partageables. Un atelier répare les vaisseaux sauvés d'une défaite.
- **Un univers vivant** : dix Seigneurs de guerre tenus par le jeu, qui grandissent, attaquent et répondent aux provocations ;
  un boss mondial chaque semaine et un boss de saison que tout le serveur combat ensemble.
- **Saisons et rendez-vous** : objectifs du jour, passe de saison de 30 paliers, Chroniques mensuelles (une histoire qui suit
  le serveur), primes, concours et guerres de territoire entre alliances.
- **Social** : alliances avec recherches communes et secteurs à conquérir, messagerie, marché et enchères entre joueurs,
  palmarès, Codex de plus de 170 fiches à compléter.
- **Chaque nombre s'explique** : une page Formules et des infobulles détaillent l'origine de chaque chiffre ; le serveur fait
  foi, et aucun avantage de combat ne s'achète.

## Stack technique

- **Front** : React 18, TypeScript, Vite, Tailwind CSS v4, Radix UI, Framer Motion, GSAP, Three.js (scènes 3D),
  état client avec zustand.
- **Serveur** : PocketBase auto-hébergé (comptes, passkeys, base de données, temps réel). Chaque action passe par des hooks
  JavaScript exécutés par goja.
- **Moteur de jeu pur** (`src/game`) : TypeScript sans DOM ni réseau, partagé entre le client (affichage, anticipation) et le
  serveur (le même code, empaqueté pour les hooks PocketBase, applique les règles). Le serveur fait autorité.
- **Réglages en direct** : chaque chiffre de jeu (coûts, durées, bonus, calendriers) est modifiable depuis un panel
  d'administration, sans redéploiement.
- **Qualité** : Vitest (tests unitaires du moteur et tests d'intégration contre un vrai PocketBase), ESLint, Playwright.

## Statut

- En ligne : [empire.fs0ciety.org](https://empire.fs0ciety.org) (production).
- Pré-production : test.fs0ciety.org (copie de test, chaque version y passe avant la production).
- Développement actif : production en 5.27, version 6.14 en pré-production (octobre 2026), mises à jour régulières, devblog et notes de version intégrés au jeu.
- Année : 2026 (premières notes de version datées de septembre 2026).

## Captures

Toutes les captures viennent d'un serveur local de démonstration (joueurs fictifs), en thème Constellation, fenêtre 1600 × 1000.

| Fichier | Légende |
|:--|:--|
| `01-accueil.png` | Page d'accueil publique : « Bâtis. Conquiers. Règne. », accès commandement et bande-annonce. |
| `02-empire.png` | Poste de commandement d'un empire de milieu de partie : ressources en direct, files de construction, recherche et chantier naval en cours, trois flottes en vol, planète en 3D et puissance de l'empire. |
| `03-galaxie.png` | Carte galactique : secteurs, empires voisins, trajectoires des flottes d'attaque et d'espionnage en route. |
| `04-illustration.png` | Illustration officielle du jeu : un commandant face à sa flotte depuis la baie d'observation de sa station. |
