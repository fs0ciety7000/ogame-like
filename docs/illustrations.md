# Illustrations : du prompt Midjourney au fichier du jeu

Maillon 13 de la chaîne de contenu (`docs/WORKFLOW.md` §7). L'utilisateur génère les images sur mobile. Il ne peut pas commiter : il dépose
les rendus sur une page, Claude fait le reste.

## Les pièces

| Pièce | Rôle |
|:--|:--|
| `scripts/illustrations.json` | **source unique** : une ligne par image (`id`, `group`, `name`, `target`, `width`, `height` (0 = proportions gardées), `cutout` (détourage), `quality`, `prompt`, `done`) |
| Page « Atelier d'illustrations » | https://claude.ai/artifact/8Kp43jpwwjxw5sydUUcccX (privée) : prompt à copier et bouton « Envoyer l'image » par ligne. Les rendus vont dans le stockage de la page (`assets`), et une ligne `uploads/<id>` (`db`) garde `assetId`, `fileName` et `status` (`envoyée`, `intégrée`) |
| `scripts/illustrations-page.html` | gabarit de la page ; `python3 scripts/illustrations.py --page <fichier>` le remplit avec la liste |
| `scripts/illustrations.py` | traitement : détourage (rembg s'il est installé, sinon fond sombre retiré depuis les bords), recadrage, redimensionnement, WebP, écriture dans `target`, `done` daté |

## Côté utilisateur (mobile)

1. Ouvrir la page, filtre « À faire ».
2. « Copier le prompt », le coller dans Midjourney, choisir la variante, « Upscale », enregistrer l'image.
3. « Envoyer l'image » sur la même ligne (PNG, JPEG ou WebP, 20 Mo au plus).
4. Écrire « images envoyées » dans la session.

## Côté Claude (intégration)

1. Lire les dépôts : `ArtifactData` `list` sur `uploads`. On ne traite que `status = "envoyée"`.
2. Pour chaque ligne, `Artifact` `read` avec `path` = `assetId`, dans le scratchpad. Copier le fichier sous `<scratchpad>/illu-in/<id>.<ext>`.
3. `python3 scripts/illustrations.py <scratchpad>/illu-in --dry-run`, puis sans `--dry-run`. Regarder chaque image produite (Read), surtout
   le détourage : un fond resté visible, ou un objet rongé, se refait (tolérance, ou rembg).
4. Brancher dans le code selon le groupe :
   - **Technologies** : `image: "/assets/technologies/<id>.webp"` dans `DEFAULT_TECHNOLOGIES`. Ajouter aussi une migration de contenu
     qui pose `image` sur les technos du contenu personnalisé quand le champ est vide (`CONTENT_MIGRATIONS`, `cosmic_db.js`).
   - **Comptoir** : identifiant ajouté à `SHOP_ITEM_ART` (`src/pages/BountiesPage.tsx`).
   - **Annonce, lune, bâtiments** : même nom de fichier ; augmenter `ASSET_VERSION` (`src/lib/assets.ts`) pour vider le cache des
     navigateurs.
5. Fiche `docs/changes/`, validation, commit, push. Vérifier sur la pré-prod avec `scripts/preprod-capture.mjs`.
6. Clore côté page :
   - `ArtifactData` `batch` : `update` de chaque `uploads/<id>` avec `status: "intégrée"` et `commit`, en épinglant `if_version` ;
   - republier la page (`--page`, même fichier), pour que les `done` du JSON y figurent.

Nouvelle image à produire : ajouter une ligne dans `illustrations.json` (prompt écrit selon le style de `docs/DESIGN.md`, sans texte dans
l'image ; fond sombre et neutre si `cutout`), puis republier la page. Les `docs/prompts-*.md` restent l'historique des prompts.
