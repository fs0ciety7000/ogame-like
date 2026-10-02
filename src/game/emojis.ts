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
