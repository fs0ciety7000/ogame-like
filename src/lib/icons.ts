import { assetUrl } from "@/lib/assets";

/** Icônes illustrées du jeu (public/assets/icons/{nom}.webp). Les huit
 *  ressources portent le même nom que leur identifiant. */
export const GAME_ICONS = [
  "scrap",
  "energy",
  "nano",
  "data",
  "reinforcedSteel",
  "cyberModule",
  "syntheticNanites",
  "aiFragment",
  "xp",
  "duration",
  "storage",
  "shield",
  "attack",
  "spy",
  "recycle",
  "repair",
  "lock",
  "reward",
  "threat",
  "trophy",
  "alliance",
  "patrol",
  "event",
  "mission",
  "build",
  "research",
  "fleet",
  "rankup",
] as const;

export type GameIconName = (typeof GAME_ICONS)[number];

export function isGameIcon(name: string): name is GameIconName {
  return (GAME_ICONS as readonly string[]).includes(name);
}

export function iconUrl(name: GameIconName): string {
  return assetUrl(`/assets/icons/${name}.webp`);
}

/** Emojis encore présents dans les textes et les données (événements,
 *  notifications, recherches d'alliance…) remplacés par une illustration à
 *  l'affichage. Clés sans le sélecteur de variante U+FE0F. */
export const EMOJI_ICONS: Record<string, GameIconName> = {
  "🔩": "scrap",
  "⛏": "scrap",
  "⚡": "energy",
  "🧬": "nano",
  "📡": "data",
  "🛠": "reinforcedSteel",
  "🧩": "cyberModule",
  "🤖": "syntheticNanites",
  "🧠": "aiFragment",
  "⭐": "xp",
  "★": "xp",
  "⏱": "duration",
  "⏳": "duration",
  "📦": "storage",
  "🛡": "shield",
  "⚔": "attack",
  "🛰": "spy",
  "🔍": "spy",
  "♻": "recycle",
  "🔧": "repair",
  "🔒": "lock",
  "🎁": "reward",
  "💎": "reward",
  "☠": "threat",
  "🏆": "trophy",
  "🤝": "alliance",
  "🚩": "alliance",
  "🌀": "patrol",
  "🎉": "event",
  "🌪": "event",
  "🧭": "mission",
  "🏗": "build",
  "🏭": "build",
  "🔬": "research",
  "🚀": "fleet",
  "🛸": "fleet",
};

export function emojiIcon(emoji: string): GameIconName | undefined {
  return EMOJI_ICONS[emoji.replace(/️/g, "")];
}

/** Découpe un texte en morceaux : chaînes, et icônes à la place des emojis
 *  connus. */
export function splitEmojiText(text: string): (string | { icon: GameIconName })[] {
  const keys = Object.keys(EMOJI_ICONS).sort((a, b) => b.length - a.length);
  const re = new RegExp(`(${keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\uFE0F?`, "gu");
  const out: (string | { icon: GameIconName })[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ icon: EMOJI_ICONS[m[1]] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
