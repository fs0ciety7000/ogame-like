# 5.9 : prompts Midjourney (article « Passkeys, connexion Google et classement »)

Illustrations pour l'article du devblog et l'annonce dans le jeu.

- **Couverture** : format 16:9, exportée en 1600 × 900, WebP qualité 85.
- **Visuels secondaires** : format 3:2.

Tous les visuels reprennent l'ambiance du jeu : espace sombre, néons cyan et or, interfaces holographiques. Aucun texte n'est demandé dans l'image : Midjourney écrit mal, et les titres sont ajoutés par l'article.

## Couverture : le commandant qui entre sans clé

Un pilote pose le pouce sur un scanner holographique, et la porte blindée d'un poste de commandement s'ouvre sur la galaxie. Il ne présente ni carte ni clé : le scanner lui suffit.

```
/imagine prompt: cinematic sci-fi illustration, a starship commander in a sleek dark armored flight suit presses a glowing fingerprint onto a floating holographic biometric scanner, the scanner rings pulse cyan #4be8ff, a massive blast door of a space command bridge slides open revealing a vast spiral galaxy and a fleet in orbit, volumetric light spilling through the door, deep navy and black palette with gold #ffd86b accents, highly detailed, painterly concept art, dramatic rim lighting, no text, no letters --ar 16:9 --v 7 --s 250
```

Variante plus graphique (bannière, carte Discord) :

```
/imagine prompt: sci-fi key art, a glowing holographic padlock dissolving into particles of light in front of a dark starfield, inside the dissolving lock a cyan #4be8ff fingerprint pattern shaped like a galaxy spiral, thin gold #ffd86b HUD rings and interface brackets around it, minimal composition, centered, high contrast, cinematic lighting, no text, no letters --ar 16:9 --v 7 --style raw --s 200
```

## Passkeys : la clé dans le téléphone

Pour la section « Connexion sans mot de passe ».

```
/imagine prompt: sci-fi illustration, close-up of a gloved hand holding a futuristic smartphone, from the screen a holographic crystal key unfolds in cyan #4be8ff light and slots into a floating lock made of hexagonal shields, dark spaceship interior bokeh background with tiny gold #ffd86b console lights, shallow depth of field, cinematic, painterly concept art, no text, no letters --ar 3:2 --v 7 --s 200
```

## Connexion Google : la passerelle

Pour la section « Connexion avec Google ». Le logo Google n'est pas demandé, car Midjourney le reproduit mal et l'usage du logo est encadré : l'image évoque seulement quatre faisceaux de couleur.

```
/imagine prompt: sci-fi illustration, a slender orbital gateway ring floating in space, four light beams in soft blue, red, yellow and green converge into its center and merge into a single white-cyan portal, a small starship glides through the portal toward a glowing space station, dark starfield, elegant minimal composition, cinematic lighting, painterly concept art, no logos, no text, no letters --ar 3:2 --v 7 --s 200
```

## Classement : le podium des commandants

Pour la section « Classement relooké ».

```
/imagine prompt: epic sci-fi illustration, three tiered holographic podiums floating above a space station deck, the center podium tallest with a radiant gold #ffd86b rank emblem hovering above it, left podium silver emblem, right podium bronze emblem, each emblem a winged chevron insignia with a glowing gem, light beams rising from the podiums, crowd of tiny silhouettes and ranked holographic lines fading into the distance below, deep navy space background with nebula, cinematic, highly detailed concept art, no text, no numbers, no letters --ar 16:9 --v 7 --s 250
```

Variante centrée sur l'insigne (vignette, réseaux sociaux) :

```
/imagine prompt: game key art, a single ornate military rank insignia floating in space, winged chevrons around a glowing orange core gem, gold and platinum metal with cyan #4be8ff energy lines, a faint progress ring of light circling it, dark starfield background with soft nebula, centered, symmetrical, dramatic rim light, ultra detailed, no text, no letters --ar 1:1 --v 7 --style raw --s 200
```

## Astuces

- Pour garder le même personnage d'une image à l'autre, ajoute la couverture en référence : `--oref <url de l'image> --ow 100` (la référence de personnage de la v7).
- Si l'image paraît trop « photo », retire `--style raw` ou monte `--s` à 400.
- Recadre ensuite en 1600 × 900 pour la couverture de l'article : c'est le format des aperçus sur Discord.
