# 5.14 : prompts Midjourney (officiers rares, saisons, boss mondiaux)

Même ambiance que le reste du jeu : espace sombre, néons cyan `#4be8ff` et or `#ffd86b`, interfaces holographiques,
coins coupés (voir `docs/DESIGN.md`). Aucun texte dans l'image.

Portraits : format 4:5, exportés en 640 × 800, WebP qualité 85, dans `public/assets/commanders/<id>.webp`. Tant qu'un
portrait manque, la page affiche l'icône du rôle sur un dégradé à sa couleur.

## Les sept officiers rares

Ils ne se recrutent pas : un commandant de saison de leur rôle au dernier palier d'un passe, ou une trouvaille très rare
sur un boss (0,2 % par participant, 0,5 % sur le podium).

### Tamsin Okoro, Logisticienne (`logistician.webp`)

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a focused woman in her thirties, close-cropped hair, dark skin, a fleet logistics officer in a utilitarian grey flight jacket with cyan #4be8ff route lines glowing on a holographic wrist display, star chart reflections in her eyes, centered, facing the viewer, dramatic rim light, dark deep-space background with faint cargo convoy lights, painterly digital illustration, highly detailed face, clean silhouette, no text --ar 4:5 --v 7 --style raw --s 200
```

### Brann Kessel, Mécanicien (`mechanic.webp`)

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a broad-shouldered bearded man in his fifties, starship mechanic with grease-streaked face, welding goggles pushed up on his forehead, heavy orange-ember work harness, a glowing ember #ff8a3d spark reflected on his cheek, centered, facing the viewer, dramatic rim light, dark shipyard hangar background with a half-built hull, painterly digital illustration, highly detailed face, clean silhouette, no text --ar 4:5 --v 7 --style raw --s 200
```

### Livia Marchetti, Gouverneure (`governor.webp`)

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, an elegant woman in her forties with dark hair in a tight braid, colonial governor in a high-collared mint green and white coat with a small planet-shaped brooch, calm confident gaze, a terraformed colony planet glowing softly behind her, centered, facing the viewer, dramatic rim light, painterly digital illustration, highly detailed face, clean silhouette, no text --ar 4:5 --v 7 --style raw --s 200
```

### Dax Morrow, Corsaire (`corsair.webp`)

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a roguish man in his thirties with a scar across one eyebrow and a short beard, space corsair in a worn crimson long coat with brass buckles, a gold #ffd86b coin glinting between his fingers, red danger lights from a boarding corridor behind him, centered, facing the viewer, dramatic rim light, painterly digital illustration, highly detailed face, clean silhouette, no text --ar 4:5 --v 7 --style raw --s 200
```

### Ysolde Grey, Gardienne (`warden.webp`)

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a stern woman in her fifties with silver hair tied back, vault warden in heavy gold #ffd86b and gunmetal armor with a large shield emblem on the chest, a sealed blast door with glowing locks behind her, centered, facing the viewer, dramatic rim light, painterly digital illustration, highly detailed face, clean silhouette, no text --ar 4:5 --v 7 --style raw --s 200
```

### Auren Sol, Diplomate (`diplomat.webp`)

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, an androgynous diplomat in their thirties with shaved sides and a long top knot, flowing violet #a78bfa and white robes with a translucent holographic sash, a faint smile, two allied fleet banners as holograms behind them, centered, facing the viewer, dramatic rim light, dark space station hall background, painterly digital illustration, highly detailed face, clean silhouette, no text --ar 4:5 --v 7 --style raw --s 200
```

### Kaelen Voss, Chasseur de colosses (`hunter.webp`)

```
/imagine prompt: sci-fi strategy game character portrait, head and shoulders, a weathered man in his forties with a cybernetic targeting eye glowing red, colossus hunter wearing a trophy tooth of a giant space beast on a cord, dark armored coat with harpoon cannon straps, the silhouette of an enormous creature in the dark behind him, centered, facing the viewer, dramatic rim light, painterly digital illustration, highly detailed face, clean silhouette, no text --ar 4:5 --v 7 --style raw --s 200
```
