/* Avatars prédéfinis : galerie proposée dans Profil → Avatar.
   Les images vont dans public/assets/avatars/presets/<id>.webp (carré,
   512 px conseillé). Une image absente est simplement masquée de la galerie :
   on peut donc livrer la liste avant les illustrations. Prompts Midjourney :
   docs/prompts-avatars.md. */

export interface AvatarPreset {
  id: string;
  label: string;
  src: string;
}

export interface AvatarPresetGroup {
  id: string;
  label: string;
  presets: AvatarPreset[];
}

const preset = (id: string, label: string): AvatarPreset => ({ id, label, src: `/assets/avatars/presets/${id}.webp` });

export const AVATAR_PRESET_GROUPS: AvatarPresetGroup[] = [
  {
    id: "commandants",
    label: "Commandants",
    presets: [
      preset("amirale", "Amirale vétérane"),
      preset("pilote", "Pilote mercenaire"),
      preset("ingenieure", "Ingénieure cybernétique"),
      preset("ouvrier", "Ouvrier des chantiers"),
      preset("negociante", "Négociante du marché"),
      preset("eclaireuse", "Éclaireuse des confins"),
      preset("medecin", "Médecin de bord"),
      preset("veteran", "Vétéran à l'œil bionique"),
    ],
  },
  {
    id: "factions",
    label: "Factions",
    presets: [
      preset("keshvaar", "Chasseur kesh'vaar"),
      preset("varan", "Pirate de Varan"),
      preset("choeur", "Mystique du Chœur"),
      preset("gravhorn", "Courtier du Gravhorn"),
      preset("inquisition", "Inquisitrice"),
      preset("meute", "Traqueur de la Meute"),
    ],
  },
  {
    id: "machines",
    label: "Machines",
    presets: [
      preset("androide", "Androïde diplomate"),
      preset("robot", "Robot éclaireur"),
      preset("ia", "Conscience d'IA"),
      preset("drone", "Drone de combat"),
    ],
  },
  {
    // Portraits déjà présents dans le jeu : la galerie n'est jamais vide.
    id: "officiers",
    label: "Officiers",
    presets: [
      { id: "officier-admiral", label: "Amiral", src: "/assets/commanders/admiral.webp" },
      { id: "officier-engineer", label: "Ingénieure", src: "/assets/commanders/engineer.webp" },
      { id: "officier-spy", label: "Espionne", src: "/assets/commanders/spy.webp" },
      { id: "officier-steward", label: "Intendant", src: "/assets/commanders/steward.webp" },
      { id: "officier-strategist", label: "Stratège", src: "/assets/commanders/strategist.webp" },
    ],
  },
];
