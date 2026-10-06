# 5.28 : prompt Midjourney de la Cale sèche

En attendant le rendu, `public/assets/buildings/cale_seche.webp` est une copie de l'illustration de l'Atelier de réparation.
Remplacer le fichier suffit (même nom, WebP qualité 85, carré 1024 × 1024, comme les autres bâtiments).

Rappels de style (voir `docs/DESIGN.md` et la skill `space-4x-cockpit-ui`) : vue isométrique, pixel art détaillé, fond sombre, lueurs cyan et ambre, **aucun texte dans l'image**.

## Cale sèche (niveau de base)

```
isometric pixel art sci-fi orbital dry dock, open steel cradles holding three damaged starfighters under repair, robotic welding arms with orange sparks, scaffolding gantries, cyan holographic status panels without text, dark space background, cool cyan and warm amber lighting, highly detailed, game building icon, centered, no text --ar 1:1 --style raw --v 6
```

## Paliers visuels (optionnels : `tierImages` 5, 10, 15, 20)

| Palier | Variante à ajouter au prompt |
|:--|:--|
| 5 (Triage) | `a recycling crusher dismantling a wreck into glowing scrap crates` |
| 10 (Remise automatique) | `automated rails launching a repaired fighter toward a hangar door` |
| 15 (Priorités) | `colored priority beacons above each cradle, sorted heavy ships first` |
| 20 (Cale orbitale) | `the whole dock floating in orbit above a planet, ring of cradles, bright cyan neon trim` |
