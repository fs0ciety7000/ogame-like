# Illustrations : du prompt Midjourney au fichier du jeu

Maillon 13 de la chaîne de contenu (`docs/WORKFLOW.md` §7). L'utilisateur génère les images sur mobile et les envoie par lot sur la pré-prod
(`test.fs0ciety.org/img`), sans commit. Claude reconnaît chaque image, la détoure, la convertit et la range dans le jeu.

## Les pièces

| Pièce | Rôle |
|:--|:--|
| `scripts/illustrations.json` | **source unique** : une ligne par image (`id`, `group`, `name`, `target`, `width`, `height` (0 = proportions gardées), `cutout` (détourage), `quality`, `prompt`, `done`) |
| **`https://test.fs0ciety.org/img`** (6.14.23) | page de la pré-prod, réservée aux admins du jeu (`IllustrationsPage.tsx`). Elle liste les images à faire, avec le prompt à copier. Elle lit `illustrations.json` au build : chaque push sur la branche la met à jour. L'envoi se fait **par lot** (toutes les images d'un coup, dans n'importe quel ordre) vers la collection `illustration_uploads` (`fileName`, `status` : `envoyée`, `attribuée`, `intégrée` ou `refusée` ; `slotId`) |
| `scripts/preprod-illustrations.mjs` | côté Claude : `pull <dossier>` télécharge les envois et reconnaît chaque image d'après son nom de fichier Midjourney (`illustrations-match.mjs` : début du nom comparé au début de chaque prompt). Puis `assign`, `reject`, `integrated` |
| `scripts/illustrations.py` | traitement : détourage (rembg s'il est installé (`pip install "rembg[cpu]"`, modèle `isnet-general-use`, ~180 Mo au premier lancement), sinon fond sombre retiré depuis les bords), recadrage, redimensionnement, WebP, écriture dans `target`, `done` daté |
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

## Côté Claude (intégration)

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
4. Fiche `docs/changes/`, validation, commit, push. `node scripts/preprod-illustrations.mjs integrated <id> …`. Vérifier sur la pré-prod
   (`scripts/preprod-capture.mjs`).

**À chaque contenu qui demande une image** (règle n° 4) :
- ajouter sa ligne dans `illustrations.json` : prompt au style de `docs/DESIGN.md`, sans texte dans l'image, fond sombre et neutre si
  `cutout` ;
- commencer le prompt par le sujet propre à l'image, pour que le début du nom de fichier Midjourney soit unique ;
- pousser : la page `/img` affiche la nouvelle ligne.

Une restauration de la pré-prod efface les envois non intégrés : les intégrer avant de réimporter une copie de la prod.

Les `docs/prompts-*.md` restent l'historique des prompts.
