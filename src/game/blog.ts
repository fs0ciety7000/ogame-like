import { parisOffsetMs } from "@/game/events";

/* =====================================================
   v5.8 : devblog (devblog.fs0ciety.org). Modèle partagé entre l'espace
   rédaction (navigateur) et les pages publiques rendues par PocketBase.
   Pas d'Intl ici : ce code tourne aussi dans les hooks (goja).
===================================================== */

export interface BlogCategory {
  id: string;
  label: string;
  emoji: string;
  /** Couleur d'accent (chips, liserés). */
  color: string;
  description: string;
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  { id: "annonces", label: "Annonces", emoji: "📣", color: "#ffd86b", description: "Les grandes nouvelles du secteur : nouvelles saisons, événements, rendez-vous." },
  { id: "mises-a-jour", label: "Mises à jour", emoji: "🛠️", color: "#4be8ff", description: "Le détail de chaque version : nouveautés, équilibrages, corrections." },
  { id: "notes", label: "Notes du staff", emoji: "📝", color: "#5cf2b0", description: "Petits mots de l'équipe : conseils, coups de cœur, réponses à vos questions." },
  { id: "coulisses", label: "Coulisses", emoji: "🔭", color: "#b18cff", description: "Comment le jeu est fabriqué : technique, outils, routes de l'API." },
  { id: "equilibrage", label: "Équilibrage", emoji: "⚖️", color: "#ff8a4c", description: "Les chiffres derrière les combats, l'économie et la progression." },
  { id: "evenements", label: "Événements", emoji: "🎉", color: "#ff5c7a", description: "Week-ends, boss de saison, défis et récompenses à venir." },
];

export function blogCategory(id: string): BlogCategory {
  return BLOG_CATEGORIES.find((c) => c.id === id) ?? BLOG_CATEGORIES[2];
}

export type BlogStatus = "draft" | "published";

/** Article tel que les pages le reçoivent (champs déjà lus en base). */
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  coverUrl: string;
  status: BlogStatus;
  publishedAtMs: number;
  updatedAtMs: number;
  pinned: boolean;
  /** Version du jeu concernée (« 5.7 »), facultative. */
  version: string;
  authorUid: string;
  authorPseudo: string;
  authorAvatarUrl: string;
  authorRole: string;
}

export const BLOG_RULES = {
  perPage: 9,
  titleMax: 140,
  excerptMax: 300,
  tagsMax: 8,
  tagMax: 32,
  slugMax: 80,
  bodyMax: 100_000,
};

const ACCENTS: Record<string, string> = {
  à: "a", â: "a", ä: "a", á: "a", ã: "a", å: "a", æ: "ae", ç: "c", é: "e", è: "e", ê: "e", ë: "e", í: "i", ì: "i", î: "i", ï: "i",
  ñ: "n", ó: "o", ò: "o", ô: "o", ö: "o", õ: "o", ø: "o", œ: "oe", ú: "u", ù: "u", û: "u", ü: "u", ý: "y", ÿ: "y", ß: "ss",
};

/** « Patch 5.7 : l'Été des Furets ! » → « patch-5-7-l-ete-des-furets ». */
export function slugify(text: string, max = BLOG_RULES.slugMax): string {
  const lower = String(text ?? "").toLowerCase();
  let out = "";
  for (const ch of lower) out += ACCENTS[ch] ?? ch;
  return out
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");
}

/** Tags normalisés : minuscules, sans doublon, 8 au plus. */
export function normalizeTags(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of list) {
    const tag = slugify(String(t), BLOG_RULES.tagMax);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= BLOG_RULES.tagsMax) break;
  }
  return out;
}

/** Texte brut d'un markdown (pour l'extrait, la recherche et le temps de lecture). */
export function plainText(markdown: string): string {
  return String(markdown ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_~=`|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Minutes de lecture (220 mots par minute, 1 au moins). */
export function readingMinutes(markdown: string): number {
  const words = plainText(markdown).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Extrait : celui saisi, sinon le début du texte coupé au mot. */
export function excerptOf(post: Pick<BlogPost, "excerpt" | "body">, max = 220): string {
  if (post.excerpt.trim()) return post.excerpt.trim();
  const text = plainText(post.body);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 30))}…`;
}

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** « 3 octobre 2026 » à l'heure de Paris. */
export function blogDate(ms: number): string {
  const d = new Date(ms + parisOffsetMs(ms));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** « 3 oct. 2026 à 18:05 ». */
export function blogDateTime(ms: number): string {
  const d = new Date(ms + parisOffsetMs(ms));
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${blogDate(ms)} à ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** Un article est visible du public s'il est publié et que sa date est passée. */
export function isPublic(post: Pick<BlogPost, "status" | "publishedAtMs">, now: number): boolean {
  return post.status === "published" && post.publishedAtMs > 0 && post.publishedAtMs <= now;
}

/** Articles proches : même catégorie et tags communs d'abord. */
export function relatedPosts(post: BlogPost, all: BlogPost[], n = 3): BlogPost[] {
  return all
    .filter((p) => p.id !== post.id)
    .map((p) => ({ p, score: (p.category === post.category ? 2 : 0) + p.tags.filter((t) => post.tags.includes(t)).length * 3 }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.publishedAtMs - a.p.publishedAtMs)
    .slice(0, n)
    .map((x) => x.p);
}

/** Recherche simple : tous les mots dans le titre, l'extrait, les tags ou le texte. */
export function searchPosts(posts: BlogPost[], q: string): BlogPost[] {
  const words = slugify(q).split("-").filter((w) => w.length >= 2);
  if (words.length === 0) return posts;
  return posts.filter((p) => {
    const hay = slugify(`${p.title} ${p.excerpt} ${p.tags.join(" ")} ${plainText(p.body)}`, 1_000_000);
    return words.every((w) => hay.includes(w));
  });
}

export interface BlogAuthorInfo {
  pseudo: string;
  role: string;
  avatarUrl: string;
}

/** Enregistrement PocketBase → article (adresses des fichiers comprises). */
export function blogPostFromRecord(r: Record<string, unknown>, filesBase: string, authors: Record<string, BlogAuthorInfo>): BlogPost {
  const id = String(r.id ?? "");
  const authorUid = String(r.authorUid ?? "");
  const author = authors[authorUid];
  const cover = String(r.cover ?? "");
  return {
    id,
    slug: String(r.slug ?? ""),
    title: String(r.title ?? ""),
    excerpt: String(r.excerpt ?? ""),
    body: String(r.body ?? ""),
    category: String(r.category ?? "notes"),
    tags: normalizeTags(r.tags),
    coverUrl: cover ? `${filesBase}/api/files/blog_posts/${id}/${cover}` : "",
    status: r.status === "published" ? "published" : "draft",
    publishedAtMs: Number(r.publishedAtMs) || 0,
    updatedAtMs: Number(r.updatedAtMs) || 0,
    pinned: r.pinned === true,
    version: String(r.version ?? ""),
    authorUid,
    authorPseudo: author?.pseudo || String(r.authorPseudo ?? "Équipe"),
    authorAvatarUrl: author?.avatarUrl ?? "",
    authorRole: author?.role ?? "",
  };
}

/** Articles publics, épinglés d'abord puis du plus récent au plus ancien. */
export function publicPosts(posts: BlogPost[], now: number): BlogPost[] {
  return posts.filter((p) => isPublic(p, now)).sort((a, b) => b.publishedAtMs - a.publishedAtMs);
}

/** Empreinte courte d'un texte (version des fichiers CSS / JS du blog). */
export function shortHash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
