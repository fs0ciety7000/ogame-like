/* Découpage en blocs du Markdown minimal du changelog (titres ## / ###, listes « - », paragraphes).
   6.14.161 (NJ-18) : une ligne indentée qui suit un élément de liste le continue (« une mission se / termine » s'affichait
   en deux morceaux : l'élément coupé, puis un paragraphe). */

export type MarkdownBlock = { kind: "h3" | "h4" | "p"; text: string } | { kind: "ul"; items: string[] };

export function markdownBlocks(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let list: string[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (list.length) blocks.push({ kind: "ul", items: list });
    if (paragraph.length) blocks.push({ kind: "p", text: paragraph.join(" ") });
    list = [];
    paragraph = [];
  };
  for (const rawLine of source.split("\n")) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flush();
    } else if (line.startsWith("### ")) {
      flush();
      blocks.push({ kind: "h4", text: line.slice(4) });
    } else if (line.startsWith("## ")) {
      flush();
      blocks.push({ kind: "h3", text: line.slice(3) });
    } else if (/^\s*[-*] /.test(line)) {
      if (paragraph.length) flush();
      list.push(line.replace(/^\s*[-*] /, ""));
    } else if (list.length && /^\s/.test(line)) {
      // Suite indentée de l'élément de liste précédent.
      list[list.length - 1] += ` ${line.trim()}`;
    } else {
      if (list.length) flush();
      paragraph.push(line.trim());
    }
  }
  flush();
  return blocks;
}
