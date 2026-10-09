import { alpha } from "@/lib/utils";
import type { ReactNode } from "react";
import { splitBadge, type ChangelogBadge } from "@/lib/changelogBadges";
import { markdownBlocks } from "@/lib/markdownBlocks";

/* Rendu Markdown minimal et sûr (aucun HTML injecté) pour le changelog :
 * titres ## / ###, listes « - », paragraphes, **gras**, `code`, [lien](url),
 * pastilles « [Fix] », « [Nouveau] »… en début d'élément de liste. */

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(pattern)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    const token = m[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**")) out.push(<strong key={key} className="text-slate-100">{token.slice(2, -2)}</strong>);
    else if (token.startsWith("`")) out.push(<code key={key} className="bg-space-800 px-1 font-mono text-[0.85em] text-cyan-glow">{token.slice(1, -1)}</code>);
    else {
      const [, label, href] = token.match(/\[([^\]]+)\]\(([^)]+)\)/)!;
      const safe = /^(https?:\/\/|\/)/.test(href) ? href : "#";
      out.push(
        <a key={key} href={safe} target={safe.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-cyan-glow hover:underline">
          {label}
        </a>,
      );
    }
    last = m.index! + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Pastille de type (changelog v5.9) : « [Fix] … » en début d'élément de liste. */
export function ChangelogBadgePill({ badge, className = "" }: { badge: ChangelogBadge; className?: string }) {
  return (
    <span
      className={`mr-1.5 inline-flex items-center border px-1.5 py-px align-[1px] font-mono text-[11px] font-semibold uppercase tracking-wider ${className}`}
      style={{ color: badge.color, borderColor: `${alpha(badge.color, 40)}`, background: `${alpha(badge.color, 8)}` }}
    >
      {badge.label}
    </span>
  );
}

function listItem(text: string, key: string): ReactNode[] {
  const found = splitBadge(text);
  if (!found) return inline(text, key);
  return [<ChangelogBadgePill key={`${key}-badge`} badge={found.badge} />, ...inline(found.rest, key)];
}

export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = markdownBlocks(source).map((b, n) => {
    if (b.kind === "ul")
      return (
        <ul key={`ul-${n}`} className="ml-4 list-disc space-y-1 marker:text-cyan-glow/60">
          {b.items.map((it, i) => (
            <li key={i}>{listItem(it, `li-${n}-${i}`)}</li>
          ))}
        </ul>
      );
    if (b.kind === "h3")
      return (
        <h3 key={`h3-${n}`} className="mt-3 font-display text-sm text-cyan-glow">
          {inline(b.text, `h3-${n}`)}
        </h3>
      );
    if (b.kind === "h4")
      return (
        <h4 key={`h4-${n}`} className="mt-2 text-sm font-semibold text-slate-100">
          {inline(b.text, `h4-${n}`)}
        </h4>
      );
    return <p key={`p-${n}`}>{inline(b.text, `p-${n}`)}</p>;
  });

  return <div className="flex flex-col gap-2 text-sm leading-relaxed text-slate-300">{blocks}</div>;
}
