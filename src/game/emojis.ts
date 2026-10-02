/* =====================================================
   Emojis des discussions (v3.8) : emojis standards proposés dans un
   sélecteur, et emojis personnalisés ajoutés par l'équipe (image +
   code, écrits :code: dans les messages). Liste dans game_config
   (clé « emojis »).
===================================================== */

export const EMOJIS_KEY = "emojis";
export const EMOJI_CODE_RE = /^[a-z0-9_]{2,24}$/;
export const MAX_CUSTOM_EMOJIS = 60;

export interface CustomEmoji {
  code: string;
  url: string;
  label?: string;
}

export const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: "Humeur", emojis: ["😀", "😂", "🤣", "😅", "😉", "😎", "🤔", "😏", "😮", "😱", "😡", "🤬", "😭", "🥲", "🤯", "🥳", "😴", "🤝", "👍", "👎", "👏", "🙏", "💪", "🫡"] },
  { label: "Combat", emojis: ["⚔️", "🗡️", "🛡️", "💥", "🔥", "💣", "🎯", "☠️", "💀", "🏴‍☠️", "🚨", "⚠️", "🩸", "🪖"] },
  { label: "Espace", emojis: ["🚀", "🛸", "🛰️", "🌌", "🪐", "🌍", "☄️", "🌑", "⭐", "✨", "👾", "👽", "🐙", "🦑"] },
  { label: "Empire", emojis: ["🏆", "👑", "💎", "💰", "📈", "📉", "⏰", "🔧", "⚙️", "📦", "🎁", "🎉", "✅", "❌", "❓", "❗"] },
];

/** Emojis du jeu (v3.9), disponibles pour tous : portraits des factions,
 *  ressources, insignes. Images dans public/assets/emojis. */
const e = (code: string, label: string): CustomEmoji => ({ code, url: `/assets/emojis/${code}.webp`, label });

export const GAME_EMOJI_GROUPS: { label: string; emojis: CustomEmoji[] }[] = [
  {
    label: "Factions",
    emojis: [
      e("varan", "Capitaine Orsk Varan"),
      e("silencieux", "Le Silencieux"),
      e("gravhorn", "Oggrath le Pisteur"),
      e("unite_ambre", "L'Unité Ambre"),
      e("inquisiteur", "Haut-Juge Séraphin Vol"),
      e("automate", "Automate de l'Aube Blanche"),
      e("vashti", "Madame Vashti Kor"),
      e("ysgrim", "Ysgrim Crocs-de-Fer"),
      e("chaperon", "Le Chaperon"),
      e("archonte", "L'Archonte Vesper"),
      e("leviathan", "Le Léviathan"),
    ],
  },
  {
    label: "Empire",
    emojis: [
      e("ferraille", "Ferraille"),
      e("energie", "Énergie"),
      e("nano", "Nanocomposants"),
      e("donnees", "Données anciennes"),
      e("fragment_ia", "Fragment d'IA"),
      e("ambre", "Ambre de Ruche"),
      e("butin", "Butin"),
      e("xp", "Expérience"),
    ],
  },
  {
    label: "Combat et gloire",
    emojis: [
      e("attaque", "Attaque"),
      e("bouclier", "Bouclier"),
      e("flotte", "Flotte"),
      e("espion", "Espionnage"),
      e("menace", "Menace"),
      e("alliance", "Alliance"),
      e("chasseur", "Chasseur"),
      e("etoile_noire", "Étoile Noire"),
      e("trophee", "Trophée"),
      e("challenger", "Challenger"),
      e("grand_maitre", "Grand maître"),
      e("legende", "Légendaire"),
    ],
  },
];

export const GAME_EMOJIS: CustomEmoji[] = GAME_EMOJI_GROUPS.flatMap((g) => g.emojis);

export function normalizeCustomEmojis(raw: unknown): CustomEmoji[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw
    .filter((e): e is CustomEmoji => !!e && typeof e === "object" && EMOJI_CODE_RE.test(String((e as CustomEmoji).code)) && typeof (e as CustomEmoji).url === "string")
    .filter((e) => (seen.has(e.code) ? false : (seen.add(e.code), true)))
    .slice(0, MAX_CUSTOM_EMOJIS);
}

export type EmojiToken = { type: "text"; text: string } | { type: "emoji"; emoji: CustomEmoji };

/** « gg :leviathan: » → texte + emoji personnalisé (codes inconnus laissés tels quels). */
export function splitCustomEmojis(text: string, emojis: CustomEmoji[]): EmojiToken[] {
  if (emojis.length === 0 || !text.includes(":")) return [{ type: "text", text }];
  const byCode = new Map(emojis.map((e) => [e.code, e]));
  const out: EmojiToken[] = [];
  let last = 0;
  for (const m of text.matchAll(/:([a-z0-9_]{2,24}):/g)) {
    const emoji = byCode.get(m[1]);
    if (!emoji) continue;
    if (m.index! > last) out.push({ type: "text", text: text.slice(last, m.index) });
    out.push({ type: "emoji", emoji });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}
