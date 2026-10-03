# Annonce 5.7 « Ton empire a changé d'échelle » : prompts Midjourney

L'annonce récapitule tout ce qui a été ajouté depuis la 4.9 :
- colonies à biomes ;
- sagas et territoires d'alliance ;
- commerce ;
- chapitres générés ;
- fin de partie ;
- statistiques et cartes à partager.

Elle utilise pour l'instant une copie de la bannière du Chœur (`public/assets/story/v5-recap.webp`).

Pour mettre la vraie illustration :
1. Choisis une image, en 16:9 pour l'ordinateur. La 9:16 pour le téléphone est facultative.
2. Envoie-la-moi, ou exporte-la en WebP (qualité 80, 1920 px de large).
3. Remplace `public/assets/story/v5-recap.webp`. Pour le téléphone, ajoute `v5-recap-mobile.webp` et indique-le dans `artMobile`, dans `src/components/game/Announcement.tsx`.
4. Augmente `ASSET_VERSION` dans `src/lib/assets.ts` pour que les navigateurs rechargent l'image.

Le texte de l'annonce s'affiche sur le tiers gauche, sur un dégradé sombre. Garde donc l'action principale à droite, avec un ciel ou un fond calme à gauche.

## Ordinateur (16:9) : trois pistes

Piste A : l'empire vu d'en haut. Planète mère, colonies et routes commerciales.
```
/imagine prompt: sci-fi strategy game key art, a sprawling interstellar empire seen from high orbit, a glowing home planet on the right connected by luminous trade routes to several distinct colony worlds (rusty iron world, crystalline ice moon, toxic green jungle planet), fleets of tiny ships following the routes, holographic tactical overlay lines and numbers floating in space, calm dark starfield on the left third, cyan and warm gold palette, cinematic wide shot, volumetric light, painterly digital illustration, highly detailed --ar 16:9 --v 7 --style raw
```

Piste B : la salle de commandement. Un commandant devant la carte holographique de son empire.
```
/imagine prompt: sci-fi strategy game key art, a lone fleet commander seen from behind standing in a dark command bridge, facing a giant holographic star map of their empire with planets, colonies, alliance territories as glowing hexagonal sectors and fleet routes, floating holo panels showing charts and statistics, large window onto space with a massive dreadnought passing by, deep shadows on the left, cyan hologram light and gold accents, cinematic, volumetric lighting, painterly digital illustration, highly detailed --ar 16:9 --v 7 --style raw
```

Piste C : l'alliance rassemblée. Plusieurs flottes sous des bannières différentes, en formation devant une station-marché.
```
/imagine prompt: sci-fi strategy game key art, several allied fleets under different glowing banners gathering in formation around a colossal orbital trading station covered in neon market signs, cargo haulers streaming in and out, a giant ringed planet on the right, a war fleet silhouette on the horizon, quiet dark nebula on the left third, cyan magenta and gold palette, epic scale, cinematic wide shot, volumetric light, painterly digital illustration, highly detailed --ar 16:9 --v 7 --style raw
```

## Téléphone (9:16), facultatif

Le texte occupe la moitié basse : garde le sujet en haut.
```
/imagine prompt: sci-fi strategy game key art, vertical composition, a glowing home planet at the top connected by luminous trade routes to smaller colony worlds below it, tiny fleets along the routes, holographic statistic overlays, the lower half fading into calm dark space, cyan and warm gold palette, volumetric light, painterly digital illustration, highly detailed --ar 9:16 --v 7 --style raw
```

## Fond de carte de partage (facultatif, 1200 × 630)

Aujourd'hui, la carte d'empire et de profil reprend la bannière choisie par le joueur. Si tu veux un fond par défaut plus travaillé pour les joueurs qui n'en ont pas choisi :
```
/imagine prompt: abstract sci-fi HUD background, dark navy deep space with a subtle hexagonal grid, faint holographic star map lines and orbit rings on the right side, soft cyan glow in the top right corner, very dark and empty on the left two thirds for text, minimal, clean, no text, no characters --ar 40:21 --v 7 --style raw
```
