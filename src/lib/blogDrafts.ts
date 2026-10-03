/* Articles prêts à importer (content/blog/*.md) : en-tête simple entre
   deux lignes « --- » (clé: valeur, listes [a, b], booléens), puis le corps
   markdown. L'espace rédaction les propose en un clic, en brouillon. */

export interface BlogDraftFile {
  file: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  version: string;
  /** Image du jeu (/assets/…) à reprendre comme couverture. */
  cover: string;
  pinned: boolean;
  body: string;
}

function unquote(v: string): string {
  const t = v.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1).replace(/\\"/g, '"');
  return t;
}

export function parseBlogDraft(file: string, raw: string): BlogDraftFile {
  const text = raw.replace(/\r\n/g, "\n");
  const meta: Record<string, string> = {};
  let body = text;
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (m) {
    body = text.slice(m[0].length);
    for (const line of m[1].split("\n")) {
      const i = line.indexOf(":");
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  const list = (v = "") => {
    const t = v.trim();
    const inner = t.startsWith("[") && t.endsWith("]") ? t.slice(1, -1) : t;
    return inner.split(",").map(unquote).filter(Boolean);
  };
  return {
    file,
    slug: unquote(meta.slug ?? ""),
    title: unquote(meta.title ?? ""),
    excerpt: unquote(meta.excerpt ?? ""),
    category: unquote(meta.category ?? "annonces"),
    tags: list(meta.tags),
    version: unquote(meta.version ?? ""),
    cover: unquote(meta.cover ?? ""),
    pinned: unquote(meta.pinned ?? "") === "true",
    body: body.trim(),
  };
}

/** Tous les articles du dossier content/blog, dans l'ordre des fichiers. */
export function bundledBlogDrafts(): BlogDraftFile[] {
  const files = import.meta.glob("/content/blog/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
  return Object.keys(files)
    .sort()
    .map((path) => parseBlogDraft(path.split("/").pop() ?? path, files[path]));
}
