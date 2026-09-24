export interface MentionSegment {
  text: string;
  isMention: boolean;
}

/** Découpe un message de chat en segments, en repérant les "@pseudo" qui
 *  correspondent à un membre connu de l'alliance (les pseudos pouvant
 *  contenir des espaces, on ne peut pas se contenter d'un \w+ générique —
 *  on cherche directement les pseudos connus, le plus long d'abord pour
 *  éviter qu'un pseudo préfixe d'un autre ne coupe la correspondance). */
export function splitMentions(text: string, pseudos: string[]): MentionSegment[] {
  const needles = [...new Set(pseudos)]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((p) => `@${p}`);

  if (needles.length === 0) return [{ text, isMention: false }];

  const segments: MentionSegment[] = [];
  let i = 0;
  while (i < text.length) {
    const match = needles.find((n) => text.startsWith(n, i));
    if (match) {
      segments.push({ text: match, isMention: true });
      i += match.length;
      continue;
    }
    let j = i + 1;
    while (j < text.length && !needles.some((n) => text.startsWith(n, j))) j++;
    segments.push({ text: text.slice(i, j), isMention: false });
    i = j;
  }
  return segments;
}
