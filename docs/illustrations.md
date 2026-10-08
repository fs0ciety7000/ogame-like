# Illustrations : du prompt Midjourney au fichier du jeu

Maillon 13 de la chaîne de contenu (`docs/WORKFLOW.md` §7). Depuis 6.14.91, les illustrations restantes sont **générées par l'API
d'images d'OpenAI** (section « Génération par API » ci-dessous). Le circuit Midjourney (rendus envoyés par l'utilisateur sur
`test.fs0ciety.org/img`, reconnus, détourés, convertis et rangés par Claude) reste en place pour un rendu fait à la main.

## Les pièces

| Pièce | Rôle |
|:--|:--|
| `scripts/illustrations.json` | **source unique** : une ligne par image (`id`, `group`, `name`, `target`, `width`, `height` (0 = proportions gardées), `cutout` (détourage), `quality`, `prompt`, `done`) |
| **`https://test.fs0ciety.org/img`** (6.14.23) | page de la pré-prod, réservée aux admins du jeu (`IllustrationsPage.tsx`). Elle liste les images à faire, avec le prompt à copier. Elle lit `illustrations.json` au build : chaque push sur la branche la met à jour. L'envoi se fait **par lot** (toutes les images d'un coup, dans n'importe quel ordre) vers la collection `illustration_uploads` (`fileName`, `status` : `envoyée`, `attribuée`, `intégrée` ou `refusée` ; `slotId`) |
| `scripts/preprod-illustrations.mjs` | côté Claude : `pull <dossier>` télécharge les envois et reconnaît chaque image d'après son nom de fichier Midjourney (`illustrations-match.mjs` : début du nom comparé au début de chaque prompt). Puis `assign`, `reject`, `integrated` |
| `scripts/generate-illustrations.mjs` (6.14.91) | génération par l'API d'images d'OpenAI (`gpt-image-1`) : écrit `<dossier>/<id>.png`, l'entrée de `illustrations.py` ; fonctions pures dans `scripts/illustrations-api.mjs` |
| `scripts/illustrations.py` | traitement : détourage (sauté si le rendu a déjà un fond transparent ; sinon rembg s'il est installé (`pip install "rembg[cpu]"`, modèle `isnet-general-use`, ~180 Mo au premier lancement), sinon fond sombre retiré depuis les bords), recadrage, redimensionnement, WebP, écriture dans `target`, `done` daté |
| Page « Atelier d'illustrations » (artifact) | secours, si la pré-prod est arrêtée : https://claude.ai/artifact/8Kp43jpwwjxw5sydUUcccX (`--page` pour la régénérer ; envois dans `uploads`, lus par `ArtifactData`) |

## En production

La page `/img` existe aussi en production (admins du jeu) : même liste, mêmes états, mais pas de dépôt. Un bouton renvoie vers
`test.fs0ciety.org/img`. Les images intégrées arrivent en production avec le front, à la fusion sur `main` (Q29).

## Côté utilisateur (mobile)

1. Ouvrir `test.fs0ciety.org/img`, connecté avec son compte admin.
2. Pour chaque image « À faire » : « Copier le prompt », le coller dans Midjourney, faire « Upscale » et enregistrer.
3. « Choisir les images » : sélectionner tout le lot d'un coup. Garder le nom de fichier de Midjourney si possible : il sert à la reconnaissance.
4. C'est tout : la tâche planifiée (ci-dessous) les prend dans l'heure. « images envoyées » dans la session lance le traitement tout de suite.

## Tâche planifiée (6.14.26)

Une routine claude.ai (« Illustrations /img : intégration automatique », `trig_01YYCSf7tQdBikosym8habog`) réveille la session de
travail **toutes les heures** (minute 57). Elle lance `node scripts/preprod-illustrations.mjs check`. À 0, elle s'arrête sans rien
commiter ; sinon, elle déroule l'intégration ci-dessous et résume ce qui a été fait. L'utilisateur n'a plus besoin d'écrire « images
envoyées ». Le traitement ne tourne pas sur le serveur : rembg, le commit et le push demandent la session. On l'arrête ou on change son
rythme dans les routines de claude.ai.

## Génération par API (6.14.91)

Décision de l'utilisateur (2026-10-07) : toutes les illustrations restantes sont générées par une API officielle, OpenAI `gpt-image-1`.
Prérequis : la clé dans la variable d'environnement `OPENAI_API_KEY` (jamais dans le dépôt, jamais journalisée) et l'hôte
`api.openai.com` autorisé dans le réseau de l'environnement. Aucune dépendance npm : `fetch` natif de Node 22.

```bash
node scripts/generate-illustrations.mjs --dry-run                         # liste, tailles, coût estimé (ni clé ni réseau)
node scripts/generate-illustrations.mjs --dry-run --prompts --ids <id>    # + le prompt d'API complet
node scripts/generate-illustrations.mjs --group reliques --limit 3        # génère dans le dossier de travail
node scripts/generate-illustrations.mjs --ids tech-tech16,tech-tech17 --integrate   # génère puis lance illustrations.py
```

Options : `--group` (sous-chaîne sans casse ni accents), `--ids a,b`, `--limit N`, `--all` (refaire une image déjà intégrée),
`--quality low|medium|high` (défaut `medium`), `--n N` (variantes), `--concurrency N` (défaut 3), `--model`, `--style "<texte>"` ou
`--no-style`, `--out <dossier>` (défaut : `$ILLU_API_OUT`, sinon `<scratchpad>/illu-api`), `--force` (régénérer une image déjà dans le dossier).

Ce que fait le script :
- **sélection** : emplacements de `scripts/illustrations.json` à `done` vide (89 au 2026-10-07), filtrés ;
- **prompt** : le prompt Midjourney perd ses paramètres (`--ar`, `--v`, `--style`, `--s`…) et ses « no text » ; il reçoit en tête le
  **préfixe de style commun** (`STYLE_PREFIX` de `scripts/illustrations-api.mjs`, réécrit en 6.14.119 à la demande de l'utilisateur :
  concept art de jeu spatial haut de gamme, technologie avancée, alliages futuristes, hologrammes, étoiles et nébuleuses, rien de
  médiéval ni de fantasy ; accents cyan `#4be8ff` et or `#ffd86b`) et en fin « No text, no letters, no numbers… » ; un emplacement `cutout`
  demande un objet isolé sur fond transparent (paramètre `background: "transparent"`, le « dark neutral background » du prompt devient
  « transparent background ») ;
- **taille** : la taille d'API la plus proche du `--ar` du prompt (`1024x1024`, `1536x1024`, `1024x1536`). `illustrations.py` recadre
  ensuite au format final ; un emplacement à hauteur libre (`height` 0, bannières 21:9) est recadré au centre au rapport du `--ar` dès
  la génération (original dans `brut/`), et le prompt demande alors de garder le sujet au centre ;
- **appel** : `POST https://api.openai.com/v1/images/generations`, réponse en base64 ; reprise sur 429, 5xx et erreur réseau (attente
  exponentielle 2 s, 4 s, 8 s… plafonnée à 60 s, ou `retry-after`, 6 essais) ; arrêt du lot sur 401/403 ; une erreur 400 (modération,
  prompt refusé) passe à l'image suivante ;
- **sorties** : `<dossier>/<id>.png` (variante 1), `variantes/<id>-<k>.png`, `journal.jsonl` (coût estimé par la grille `PRICES`,
  coût mesuré d'après `usage`). Une image déjà présente dans le dossier est sautée : on ne paie pas deux fois ;
- **`--integrate`** : lance `python3 scripts/illustrations.py <dossier>` (le détourage est sauté pour un rendu déjà transparent), puis
  rappelle le branchement de chaque groupe (étape 3 ci-dessous).

La grille de prix en tête de `scripts/illustrations-api.mjs` est approximative : la vérifier sur la page des prix d'OpenAI avant un gros
lot. Ensuite, la suite est celle du circuit Midjourney : regarder chaque image, brancher, fiche, validation, commit, push.

## Côté Claude (intégration)

Nouveau prompt ou image ajoutée à `scripts/illustrations.json` : `node scripts/live-docs.mjs push` la fait apparaître sur `/img` tout
de suite (6.14.42), sans attendre le déploiement ; le commit suit avec le lot.

1. `node scripts/preprod-illustrations.mjs pull <scratchpad>/illu-in`.
   - Les images reconnues sont écrites sous `<id>.<ext>` et l'envoi passe à `attribuée`.
   - Les autres vont dans `a-identifier/` : les regarder (Read), comparer aux prompts, puis `assign <envoi> <id>` et les renommer. Un doublon
     ou une image hors liste reçoit `reject`.
2. `python3 scripts/illustrations.py <scratchpad>/illu-in --dry-run`, puis sans `--dry-run`. Regarder chaque image produite, surtout le
   détourage : un fond resté visible, ou un objet rongé, se refait (tolérance, ou rembg).
3. Brancher dans le code selon le groupe :
   - **Technologies** : ajouter l'identifiant à `TECH_ART` (`technologies.ts`). Le Codex prend alors `/assets/technologies/<id>.webp`,
     même sur un contenu personnalisé ; le champ « Image (Codex) » de l'admin reste prioritaire.
   - **Offres de la semaine** : rien à faire, la carte lit `weekly-<id>.webp`.
   - **Annonces** (6.14.36) : une annonce illustrée porte `artSlot` (identifiant de l'image) et `pendingArt: true` tant que l'image
     manque : elle reste cachée (ni modale, ni `/game/annonces`). À l'intégration, retirer `pendingArt` : l'annonce est publiée au
     déploiement suivant. `illustrations.test.ts` vérifie la cohérence.
   - **Comptoir** : identifiant ajouté à `SHOP_ITEM_ART` (`src/pages/BountiesPage.tsx`).
   - **Annonce, lune, bâtiments** : même nom de fichier ; augmenter `ASSET_VERSION` (`src/lib/assets.ts`) pour vider le cache des
     navigateurs.
   - **Lune : phalange, porte de saut et leurs reliques** (6.14.69) : images provisoires dans le code. `phalanx` et `jumpgate` : remplacer
     `image: "/assets/moon/lune.webp"` des fiches `legend:phalange` et `legend:porte_saut` (`codex.ts`) par la cible ;
     `relic-lentille-selene` et `relic-cle-seuil` : retirer le champ `image` de `lentille_selene` et `cle_seuil` (`DEFAULT_RELICS`), la
     relique prend alors `/assets/relics/<id>.webp` (liste personnalisée : une migration `patches` de `CONTENT_MIGRATIONS` remplace
     l'ancien `image` par le nouveau) ; `announce-phalange` : retirer `pendingArt` de l'annonce `v6.14-lune-veille`.
   - **Factions** (6.14.93) : `banner` et `emblem` de la faction (`pirates.ts`) ; liste personnalisée : migration `run` sur `factions`.
   - **Boss d'alliance** (6.14.93) : `image` de `DEFAULT_ALLIANCE_BOSSES` ; règles enregistrées : migration `run` sur `rules`.
   - **Passe** (6.14.93) : thème → `image` de `PASS_THEMES` (ancienne image dans `PASS_THEME_OLD_IMAGES`) ; portrait de saison →
     mois ajouté à `SEASON_PORTRAITS` (`passSeasons.ts`) ; saisons déjà écrites : migration `run` sur `passSeasons`.
     6.14.138 : illustration d'année `passe-theme-<thème>-<année>` → identifiant de la saison (`<thème>_<année>`) ajouté à
     `SEASON_THEME_ART` (`passSeasons.ts`) : le générateur la prend pour les passes suivants (et pour les saisons générées qui
     prolongent cette saison) ; un brouillon déjà écrit garde l'image du thème (migration `run` sur `passSeasons`, nouvel identifiant,
     si on veut le changer). Portraits `officier-s-<mois>` : comme ci-dessus (`SEASON_PORTRAITS`).
   - **Chroniques générées** (6.14.138) : second boss `chroniques-boss2-<faction>` → identifiant de l'archétype ajouté à `AUTO_ART_2`
     (`procedural.ts`) : les boss de rang impair (2e et 4e nom, puis la réserve un sur deux) le prennent dans les chapitres générés
     ensuite ; un chapitre écrit garde son image.
   - **En-têtes** (6.14.93) : `backdrop="/assets/headers/<page>.webp"` du `PageHeader` de la page.
   - **Devblog** : `cover:` du billet dans `content/blog/` ; un billet déjà publié se règle dans Admin → Devblog.
   - **Classes, modules** : pas encore de champ d'image (Q240), le fichier attend son lot d'affichage. **Spécialisations de colonie** :
     fiches du Codex depuis 6.14.115 (`colonySpecImage`, même nom de fichier).
   - **Biomes de colonie** (6.14.115) : `colonie-biome-<id>` → ajouter l'identifiant de la ressource rare à `BIOME_ART` (`colonies.ts`) ;
     la fiche du Codex quitte alors l'icône de la ressource (image provisoire) pour `/assets/colonies/biome-<id>.webp`.
   - **Prestige** (6.14.85) : `prestige-monument` → remplacer la valeur de `PRESTIGE_IMAGE` (`src/game/prestige.ts`, image provisoire
     `/assets/buildings/fonderie_quantique.webp`) par `/assets/prestige/monument.webp` : page Prestige et fiche du Codex suivent.
   - **Paliers de bâtiments** (6.14.146) : `palier-<famille>-<rôle>` → ajouter la clé `<famille>-<rôle>` (ou `foundry-slot`) à
     `TIER_ART` (`src/game/buildingTiers.ts`) : la ligne « Paliers » de la carte et Ctrl+K quittent l'image du bâtiment (provisoire)
     pour `/assets/tiers/<clé>.webp`.
4. Fiche `docs/changes/`, validation, commit, push. `node scripts/preprod-illustrations.mjs integrated <id> …`. Vérifier sur la pré-prod
   (`scripts/preprod-capture.mjs` ; 4e argument : textes jusqu'où défiler pour capturer un contenu bas dans la page).

**À chaque contenu qui demande une image** (règle n° 4) :
- ajouter sa ligne dans `illustrations.json` : prompt au style de `docs/DESIGN.md`, sans texte dans l'image, fond sombre et neutre si
  `cutout` ;
- commencer le prompt par le sujet propre à l'image, pour que le début du nom de fichier Midjourney soit unique ;
- pousser : la page `/img` affiche la nouvelle ligne.

Une restauration de la pré-prod efface les envois non intégrés : les intégrer avant de réimporter une copie de la prod.

Les `docs/prompts-*.md` restent l'historique des prompts.
