import { useCallback, useEffect, useMemo, useState } from "react";
import { BlogCategoryIcon } from "@/components/blog/BlogCategoryIcon";
import { toast } from "sonner";
import { ExternalLink, Loader2, PenSquare, Pin, Plus, Rss, Search, Trash2, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HudTag } from "@/components/ui/hud";
import { BlogPostForm } from "@/components/blog/BlogPostForm";
import { BLOG_CATEGORIES, blogCategory, blogDate, blogDateTime, isPublic, readingMinutes, type BlogPost } from "@/game/blog";
import { addBlogAuthor, authorAvatarUrl, BLOG_URL, fetchAllBlogPosts, fetchBlogAuthors, gameAvatarBlob, removeBlogAuthor, saveMyAuthorProfile, useBlogAccess, type BlogAuthor } from "@/services/blogService";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/lib/utils";

/* v5.8 : espace rédaction du devblog (auteurs et administrateurs). */

type Filter = "all" | "published" | "scheduled" | "draft";

function statusOf(p: BlogPost, now: number): { label: string; tone: "mint" | "gold" | "accent" } {
  if (isPublic(p, now)) return { label: "En ligne", tone: "mint" };
  if (p.status === "published") return { label: "Programmé", tone: "gold" };
  return { label: "Brouillon", tone: "accent" };
}

export function BlogEditorPage() {
  const access = useBlogAccess();
  const player = usePlayerStore((s) => s.player);
  const [posts, setPosts] = useState<{ post: BlogPost; images: string[] }[] | null>(null);
  const [editing, setEditing] = useState<{ post: BlogPost | null; images: string[] } | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);

  const load = useCallback(async () => {
    try {
      const [list, au] = await Promise.all([fetchAllBlogPosts(), fetchBlogAuthors()]);
      setPosts(list);
      setAuthors(au);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chargement impossible.");
      setPosts([]);
    }
  }, []);
  useEffect(() => {
    if (access.author || access.admin) void load();
  }, [access.author, access.admin, load]);

  const now = Date.now();
  const shown = useMemo(() => {
    const words = q.trim().toLowerCase();
    return (posts ?? []).filter(({ post: p }) => {
      const st = statusOf(p, now).label;
      if (filter === "published" && st !== "En ligne") return false;
      if (filter === "scheduled" && st !== "Programmé") return false;
      if (filter === "draft" && st !== "Brouillon") return false;
      return !words || `${p.title} ${p.tags.join(" ")} ${p.authorPseudo}`.toLowerCase().includes(words);
    });
  }, [posts, filter, q, now]);

  if (access.loading) return <p className="flex items-center gap-2 p-6 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Vérification des accès…</p>;
  if (!access.author && !access.admin)
    return (
      <div className="flex flex-col gap-4">
        <PageHeader eyebrow="Devblog" title="Rédaction" />
        <Card className="p-6 text-sm text-slate-300">
          L'espace rédaction est réservé aux auteurs du devblog. Demande à un administrateur de t'ajouter, ou lis les articles sur{" "}
          <a className="text-cyan-glow underline" href={BLOG_URL} target="_blank" rel="noreferrer">{BLOG_URL.replace(/^https?:\/\//, "")}</a>.
        </Card>
      </div>
    );

  const pseudo = player?.pseudo ?? "Équipe";
  if (editing) return <BlogPostForm initial={editing.post} images={editing.images} authorPseudo={pseudo} onBack={() => setEditing(null)} onSaved={() => void load()} />;

  const count = (f: Filter) => (posts ?? []).filter(({ post: p }) => f === "all" || statusOf(p, now).label === { published: "En ligne", scheduled: "Programmé", draft: "Brouillon" }[f]).length;
  const me = authors.find((a) => a.id === player?.uid);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PageHeader
        eyebrow="Devblog"
        title="Rédaction"
        description="Écris les annonces, les notes de mise à jour et les coulisses du jeu. Les articles paraissent sur le devblog, dans son flux RSS et en aperçu sur Discord."
        right={
          <div className="flex flex-wrap gap-2">
            <a href={BLOG_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 border border-white/10 px-3 py-2 text-xs text-slate-300 hover:text-cyan-glow">
              <ExternalLink className="h-3.5 w-3.5" /> Ouvrir le devblog
            </a>
            <Button size="sm" onClick={() => setEditing({ post: null, images: [] })}>
              <Plus className="h-4 w-4" /> Nouvel article
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="flex min-w-0 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "published", "scheduled", "draft"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={cn("border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em]", filter === f ? "border-cyan-glow/60 bg-cyan-glow/10 text-cyan-glow" : "border-white/10 text-slate-500 hover:text-slate-300")}>
                {{ all: "Tous", published: "En ligne", scheduled: "Programmés", draft: "Brouillons" }[f]} · {count(f)}
              </button>
            ))}
            <label className="ml-auto flex min-w-0 items-center gap-1.5 border border-white/10 px-2">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher" className="h-8 w-36 min-w-0 bg-transparent text-sm text-white outline-none" />
            </label>
          </div>
          {posts === null ? (
            <p className="flex items-center gap-2 py-6 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-slate-400">
              <PenSquare className="h-8 w-8 text-cyan-glow/60" />
              {posts.length === 0 ? "Aucun article pour l'instant : écris le premier !" : "Aucun article ne correspond."}
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-white/5">
              {shown.map(({ post: p, images }) => {
                const st = statusOf(p, now);
                const cat = blogCategory(p.category);
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                    <button type="button" onClick={() => setEditing({ post: p, images })} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="h-14 w-24 shrink-0 border border-white/10 bg-space-900 bg-cover bg-center" style={p.coverUrl ? { backgroundImage: `url('${p.coverUrl}')` } : undefined} />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <HudTag tone={st.tone}>{st.label}</HudTag>
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: cat.color }}>
                            <BlogCategoryIcon category={cat.id} className="h-3.5 w-3.5" /> {cat.label}
                          </span>
                          {p.pinned && <Pin className="h-3 w-3 text-gold-glow" />}
                        </span>
                        <span className="mt-1 block truncate font-display text-base text-white">{p.title}</span>
                        <span className="block font-mono text-[11px] text-slate-500">
                          {p.authorPseudo} · {st.label === "Brouillon" ? `modifié le ${blogDate(p.updatedAtMs)}` : st.label === "Programmé" ? `sortie ${blogDateTime(p.publishedAtMs)}` : blogDate(p.publishedAtMs)} · {readingMinutes(p.body)} min{p.tags.length ? ` · #${p.tags.join(" #")}` : ""}
                        </span>
                      </span>
                    </button>
                    {st.label === "En ligne" && (
                      <a href={`${BLOG_URL}/p/${p.slug}`} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-cyan-glow" title="Voir sur le devblog">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          {me && <AuthorProfileCard me={me} onSaved={() => void load()} />}
          <Card className="flex flex-col gap-2 p-4 text-sm text-slate-300">
            <p className="hud-eyebrow text-[10px] text-slate-500">Catégories</p>
            {BLOG_CATEGORIES.map((c) => (
              <p key={c.id} className="flex gap-2 text-xs">
                <BlogCategoryIcon category={c.id} />
                <span>
                  <b className="text-white">{c.label}</b> : {c.description}
                </span>
              </p>
            ))}
            <a href={`${BLOG_URL}/rss.xml`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-xs text-cyan-glow hover:underline">
              <Rss className="h-3.5 w-3.5" /> Flux RSS du devblog
            </a>
          </Card>
          {access.admin && <AuthorsCard authors={authors} onChange={() => void load()} />}
        </div>
      </div>
    </div>
  );
}

function AuthorProfileCard({ me, onSaved }: { me: BlogAuthor; onSaved: () => void }) {
  const [role, setRole] = useState(me.role);
  const [bio, setBio] = useState(me.bio);
  const [busy, setBusy] = useState(false);
  const save = async (avatar?: Blob | null) => {
    setBusy(true);
    try {
      await saveMyAuthorProfile(me.id, { role, bio }, avatar);
      toast.success("Profil d'auteur enregistré.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };
  const takeGameAvatar = async () => {
    const blob = await gameAvatarBlob(me.id);
    if (!blob) {
      toast.error("Pas d'avatar sur ta fiche de jeu (Profil → Avatar).");
      return;
    }
    await save(blob);
  };
  const avatar = authorAvatarUrl(me);
  return (
    <Card className="flex flex-col gap-3 p-4">
      <p className="hud-eyebrow text-[10px] text-slate-500">Mon profil d'auteur</p>
      <div className="flex items-center gap-3">
        <span className="h-12 w-12 shrink-0 border border-white/10 bg-space-900 bg-cover bg-center" style={avatar ? { backgroundImage: `url('${avatar}')` } : undefined} />
        <div className="min-w-0">
          <p className="font-display text-white">{me.pseudo}</p>
          <button type="button" disabled={busy} onClick={() => void takeGameAvatar()} className="text-xs text-cyan-glow hover:underline">
            Reprendre mon avatar du jeu
          </button>
        </div>
      </div>
      <Input value={role} maxLength={60} onChange={(e) => setRole(e.target.value)} placeholder="Rôle (Game designer, Développeur…)" className="h-9" />
      <textarea value={bio} maxLength={300} rows={2} onChange={(e) => setBio(e.target.value)} placeholder="Une courte présentation" className="resize-y border border-cyan-glow/15 bg-space-900/60 p-2 text-sm text-slate-100 outline-none focus:border-cyan-glow/50" />
      <Button size="sm" variant="secondary" disabled={busy} onClick={() => void save()}>
        Enregistrer
      </Button>
    </Card>
  );
}

function AuthorsCard({ authors, onChange }: { authors: BlogAuthor[]; onChange: () => void }) {
  const [pseudo, setPseudo] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async () => {
    if (!pseudo.trim()) return;
    setBusy(true);
    try {
      const a = await addBlogAuthor(pseudo, "");
      toast.success(`${a.pseudo} peut maintenant écrire sur le devblog.`);
      setPseudo("");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ajout impossible.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="flex flex-col gap-3 p-4">
      <p className="hud-eyebrow flex items-center gap-1.5 text-[10px] text-slate-500">
        <Users className="h-3.5 w-3.5" /> Auteurs ({authors.length}) · administrateurs
      </p>
      <ul className="flex flex-col gap-1.5">
        {authors.map((a) => (
          <li key={a.id} className="flex items-center gap-2 text-sm">
            <span className="h-7 w-7 shrink-0 border border-white/10 bg-space-900 bg-cover bg-center" style={a.avatar ? { backgroundImage: `url('${authorAvatarUrl(a)}')` } : undefined} />
            <span className="min-w-0 flex-1 truncate text-slate-200">
              {a.pseudo} <span className="text-[11px] text-slate-500">{a.role}</span>
            </span>
            <button
              type="button"
              title="Retirer"
              className="p-1 text-slate-500 hover:text-danger-glow"
              onClick={() => window.confirm(`Retirer ${a.pseudo} des auteurs ? Ses articles restent en ligne.`) && void removeBlogAuthor(a.id).then(onChange)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input value={pseudo} onChange={(e) => setPseudo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void add()} placeholder="Pseudo du joueur" className="h-9" />
        <Button size="sm" disabled={busy || !pseudo.trim()} onClick={() => void add()}>
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[11px] text-slate-500">Les administrateurs du jeu peuvent toujours écrire, même sans être dans cette liste.</p>
    </Card>
  );
}
