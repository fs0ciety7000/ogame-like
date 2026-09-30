import type { ReactNode } from "react";

/* Rendu Markdown minimal et sûr (aucun HTML injecté) pour le changelog :
 * titres ## / ###, listes « - », paragraphes, **gras**, `code`, [lien](url). */

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
    else if (token.startsWith("`")) out.push(<code key={key} className="rounded bg-space-800 px-1 font-mono text-[0.85em] text-cyan-glow">{token.slice(1, -1)}</code>);
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

export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (list.length) {
      const items = list;
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="ml-4 list-disc space-y-1 marker:text-cyan-glow/60">
          {items.map((it, i) => (
            <li key={i}>{inline(it, `li-${blocks.length}-${i}`)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
    if (paragraph.length) {
      blocks.push(<p key={`p-${blocks.length}`}>{inline(paragraph.join(" "), `p-${blocks.length}`)}</p>);
      paragraph = [];
    }
  };

  for (const rawLine of source.split("\n")) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flush();
    } else if (line.startsWith("### ")) {
      flush();
      blocks.push(<h4 key={`h4-${blocks.length}`} className="mt-2 text-sm font-semibold text-slate-100">{inline(line.slice(4), `h4-${blocks.length}`)}</h4>);
    } else if (line.startsWith("## ")) {
      flush();
      blocks.push(<h3 key={`h3-${blocks.length}`} className="mt-3 font-display text-sm text-cyan-glow">{inline(line.slice(3), `h3-${blocks.length}`)}</h3>);
    } else if (/^\s*[-*] /.test(line)) {
      if (paragraph.length) flush();
      list.push(line.replace(/^\s*[-*] /, ""));
    } else {
      if (list.length) flush();
      paragraph.push(line.trim());
    }
  }
  flush();

  return <div className="flex flex-col gap-2 text-sm leading-relaxed text-slate-300">{blocks}</div>;
}
