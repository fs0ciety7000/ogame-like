import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { useAuthStore } from "@/store/authStore";
import { blogPostFromRecord, type BlogAuthorInfo, type BlogPost } from "@/game/blog";

/* =====================================================
   v5.8 : espace rédaction du devblog. Les règles PocketBase réservent
   l'écriture aux auteurs (collection blog_authors) et aux administrateurs.
===================================================== */

export const BLOG_URL = (import.meta.env.VITE_BLOG_URL || "https://devblog.fs0ciety.org").replace(/\/+$/, "");

export interface BlogAuthor {
  id: string;
  pseudo: string;
  role: string;
  bio: string;
  avatar: string;
}

export interface BlogDraft {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  status: "draft" | "published";
  publishedAtMs: number;
  pinned: boolean;
  version: string;
}

const filesBase = () => pb.baseURL.replace(/\/+$/, "");

function authorFromRecord(r: Record<string, unknown>): BlogAuthor {
  return { id: String(r.id), pseudo: String(r.pseudo ?? ""), role: String(r.role ?? ""), bio: String(r.bio ?? ""), avatar: String(r.avatar ?? "") };
}

export function authorAvatarUrl(a: BlogAuthor): string {
  return a.avatar ? `${filesBase()}/api/files/blog_authors/${a.id}/${a.avatar}` : "";
}

export async function fetchBlogAuthors(): Promise<BlogAuthor[]> {
  const list = await pb.collection("blog_authors").getFullList({ sort: "pseudo" });
  return list.map((r) => authorFromRecord(r as unknown as Record<string, unknown>));
}

/** L'utilisateur connecté peut-il écrire ? (auteur ou administrateur) */
export async function checkBlogAccess(uid: string): Promise<{ author: boolean; admin: boolean }> {
  const [author, admin] = await Promise.all([
    pb.collection("blog_authors").getOne(uid, { fields: "id" }).then(() => true, () => false),
    pb.collection("admins").getOne(uid, { fields: "id" }).then(() => true, () => false),
  ]);
  return { author, admin };
}

export function useBlogAccess(): { loading: boolean; author: boolean; admin: boolean } {
  const uid = useAuthStore((s) => s.user?.uid);
  const [state, setState] = useState({ loading: true, author: false, admin: false });
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    void checkBlogAccess(uid).then((r) => alive && setState({ loading: false, ...r }));
    return () => {
      alive = false;
    };
  }, [uid]);
  return uid ? state : { loading: false, author: false, admin: false };
}

/** Tous les articles (brouillons compris), visibles par la rédaction. */
export async function fetchAllBlogPosts(): Promise<{ post: BlogPost; images: string[] }[]> {
  const authors: Record<string, BlogAuthorInfo> = {};
  for (const a of await fetchBlogAuthors()) authors[a.id] = { pseudo: a.pseudo, role: a.role, avatarUrl: authorAvatarUrl(a) };
  const list = await pb.collection("blog_posts").getFullList({ sort: "-updatedAtMs" });
  return list.map((r) => {
    const raw = r as unknown as Record<string, unknown>;
    return { post: blogPostFromRecord(raw, filesBase(), authors), images: (raw.images as string[] | undefined) ?? [] };
  });
}

function toForm(d: Partial<BlogDraft>, cover?: File | null): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(d)) {
    if (v === undefined) continue;
    fd.append(k, k === "tags" ? JSON.stringify(v) : String(v));
  }
  fd.append("updatedAtMs", String(Date.now()));
  if (cover) fd.append("cover", cover);
  else if (cover === null) fd.append("cover", "");
  return fd;
}

export async function createBlogPost(d: BlogDraft, authorPseudo: string, cover?: File | null): Promise<string> {
  const uid = pb.authStore.record?.id;
  if (!uid) throw new Error("Connecte-toi pour écrire.");
  const fd = toForm(d, cover);
  fd.append("authorUid", uid);
  fd.append("authorPseudo", authorPseudo);
  const rec = await pb.collection("blog_posts").create(fd);
  return rec.id;
}

export async function updateBlogPost(id: string, d: Partial<BlogDraft>, cover?: File | null): Promise<void> {
  await pb.collection("blog_posts").update(id, toForm(d, cover));
}

export async function deleteBlogPost(id: string): Promise<void> {
  await pb.collection("blog_posts").delete(id);
}

/** Ajoute une image à l'article et renvoie son adresse publique. */
export async function uploadBlogImage(postId: string, file: File): Promise<string> {
  const fd = new FormData();
  fd.append("images+", file);
  const rec = await pb.collection("blog_posts").update(postId, fd);
  const images = (rec as unknown as { images?: string[] }).images ?? [];
  const name = images[images.length - 1];
  return `${filesBase()}/api/files/blog_posts/${postId}/${name}`;
}

export async function removeBlogImage(postId: string, name: string): Promise<void> {
  await pb.collection("blog_posts").update(postId, { "images-": [name] });
}

export async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const list = await pb.collection("blog_posts").getList(1, 1, { filter: pb.filter("slug = {:s}", { s: slug }), fields: "id" });
  return list.items.some((r) => r.id !== exceptId);
}

/* ---------- auteurs ---------- */

export async function saveMyAuthorProfile(uid: string, data: { role?: string; bio?: string; pseudo?: string }, avatar?: Blob | null): Promise<void> {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) if (v !== undefined) fd.append(k, v);
  if (avatar) fd.append("avatar", new File([avatar], "avatar.webp", { type: avatar.type || "image/webp" }));
  await pb.collection("blog_authors").update(uid, fd);
}

/** Reprend l'avatar du jeu (fiche publique) comme avatar d'auteur. */
export async function gameAvatarBlob(uid: string): Promise<Blob | null> {
  const profile = await pb.collection("profiles").getOne(uid, { fields: "id,avatar" }).catch(() => null);
  const file = (profile as unknown as { avatar?: string } | null)?.avatar;
  if (!file) return null;
  const token = pb.authStore.token;
  const url = `${filesBase()}/api/files/profiles/${uid}/${file}`;
  const res = await fetch(url, { headers: token ? { Authorization: token } : {} });
  return res.ok ? res.blob() : null;
}

/** Administrateurs : ajouter un auteur à partir de son pseudo de jeu. */
export async function addBlogAuthor(pseudo: string, role: string): Promise<BlogAuthor> {
  const profile = await pb.collection("profiles").getFirstListItem(pb.filter("pseudo = {:p}", { p: pseudo.trim() }), { fields: "id,pseudo" }).catch(() => null);
  if (!profile) throw new Error(`Aucun joueur nommé « ${pseudo} ».`);
  const rec = await pb.collection("blog_authors").create({ id: profile.id, pseudo: (profile as unknown as { pseudo: string }).pseudo, role: role || "Équipe Cosmic Empires" });
  return authorFromRecord(rec as unknown as Record<string, unknown>);
}

export async function removeBlogAuthor(id: string): Promise<void> {
  await pb.collection("blog_authors").delete(id);
}
