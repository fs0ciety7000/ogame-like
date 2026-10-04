# Direction artistique

## Principes extraits des références
| Référence | À retenir | À éviter |
|---|---|---|
| Cyberpunk 2077 | noir profond + 1 accent saturé, capitales condensées, coins coupés (clip-path), glitch bref, micro-texte technique (coordonnées, ID, versions) | glitch permanent, texte illisible |
| Star Citizen | panneaux verre fumé, bordures 1px lumineuses, grille holographique, onglets de MFD, données denses, teinte froide | surcharge sans hiérarchie |
| GTA VI | gradient chaud saturé, grosse typo éditoriale, plein cadre, parallaxe, révélation au scroll | pastiche des visuels officiels |

## Palettes (point de départ, à ajuster au contraste réel)
- **Frontière froide** (Star Citizen) : fond `#05080F`, panneaux `#0B1220`, accent `#38E1FF`, positif `#3DFFA8`, alerte `#FFB020`, danger `#FF4D5E`, texte `#E6F1FF` / `#8CA3BF`.
- **Néon corpo** (Cyberpunk) : fond `#0A0A0F`, panneaux `#14121C`, accent `#FCEE0A` (jaune), accent2 `#00F0FF`, danger `#FF2A6D`, texte `#F5F5F0` / `#9A97A8`.
- **Coucher de soleil orbital** (GTA VI) : fond `#120A1F`, panneaux `#1C1030`, accent `#FF5E8A`, accent2 `#FFA64D`, or `#FFD36B`, texte `#FFF4EC` / `#B9A6C9`.

Règle : fond 90 % de la surface, panneaux 8 %, accent < 2 %. Un accent, un seul à la fois par vue.

## Typographies (Google Fonts, libres)
- Titres/affichage : **Orbitron** (SF), **Rajdhani** ou **Chakra Petch** (plus lisibles), **Oxanium**, **Michroma** (large). Éditorial : **Anton** / **Bebas Neue**.
- Corps : **Inter**, **Exo 2**, **Barlow Semi Condensed**.
- Données : **JetBrains Mono**, **IBM Plex Mono**, **Share Tech Mono** avec `font-variant-numeric: tabular-nums`.
Pairing sûr : Chakra Petch (titres) + Inter (corps) + JetBrains Mono (nombres). Limiter à 3 familles.

## Langage de formes
- Coins coupés : `clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))`.
- Brackets d'angle, réticules, graduations, séparateurs hachurés, étiquettes `[ SECTEUR 07 ]`.
- Texture : bruit léger (opacité 3-6 %), scanlines, vignette, grille de fond.
- Glow : `box-shadow: 0 0 12px color-mix(in oklab, var(--accent) 40%, transparent)` ; jamais plus d'un glow fort par vue.

## Iconographie
Icônes monoligne 1.5px (lucide ou set maison), uniformes ; pictogrammes de ressources distincts par silhouette ET par couleur.
