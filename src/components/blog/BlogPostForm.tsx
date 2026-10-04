import { useEffect, useMemo, useRef, useState } from "react";
import { BlogCategoryIcon } from "@/components/blog/BlogCategoryIcon";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock, Copy, ExternalLink, FileUp, ImagePlus, Loader2, Pin, Save, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MarkdownEditor } from "@/components/blog/MarkdownEditor";
import { BlogPreview } from "@/components/blog/BlogPreview";
import { BLOG_CATEGORIES, BLOG_RULES, isPublic, normalizeTags, slugify, type BlogPost } from "@/game/blog";
import { BLOG_URL, createBlogPost, deleteBlogPost, removeBlogImage, slugTaken, updateBlogPost, uploadBlogImage, type BlogDraft } from "@/services/blogService";
import { pb } from "@/lib/pocketbase";
import { cn, alpha } from "@/lib/utils";

/* v5.8 : écriture d'un article du devblog (création ou modification). */

type Mode = "draft" | "now" | "schedule";
type View = "write" | "preview" | "split";

const EMPTY: BlogDraft = { slug: "", title: "", excerpt: "", body: "", category: "notes", tags: [], status: "draft", publishedAtMs: 0, pinned: false, version: "" };

function toLocalInput(ms: number): string {
  if (!ms) return "";
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

export function BlogPostForm({ initial, images: initialImages, authorPseudo, onBack, onSaved }: { initial: BlogPost | null; images: string[]; authorPseudo: string; onBack: () => void; onSaved: () => void }) {
  const [id, setId] = useState(initial?.id ?? "");
  const [d, setD] = useState<BlogDraft>(() =>
    initial
      ? { slug: initial.slug, title: initial.title, excerpt: initial.excerpt, body: initial.body, category: initial.category, tags: initial.tags, status: initial.status, publishedAtMs: initial.publishedAtMs, pinned: initial.pinned, version: initial.version }
      : EMPTY,
  );
  const [slugEdited, setSlugEdited] = useState(!!initial);
  const [tagInput, setTagInput] = useState("");
  const [coverFile, setCoverFile] = useState<File | null | undefined>(undefined);
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [images, setImages] = useState<string[]>(initialImages);
  const [mode, setMode] = useState<Mode>(() => (!initial || initial.status === "draft" ? "draft" : initial.publishedAtMs > Date.now() ? "schedule" : "now"));
  const [scheduleAt, setScheduleAt] = useState(() => toLocalInput(initial && initial.publishedAtMs > Date.now() ? initial.publishedAtMs : Date.now() + 86_400_000));
  const [view, setView] = useState<View>("split");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);
  const localKey = `devblog:brouillon:${initial?.id ?? "nouveau"}`;

  const set = (patch: Partial<BlogDraft>) => {
    setD((cur) => ({ ...cur, ...patch }));
    setDirty(true);
  };

  // Sauvegarde locale de secours (onglet fermé, coupure).
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(localKey, JSON.stringify({ d, at: Date.now() }));
      } catch {
        /* stockage plein ou navigation privée */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [d, dirty, localKey]);
  const [restore, setRestore] = useState<{ d: BlogDraft; at: number } | null>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(localKey) ?? "null") as { d: BlogDraft; at: number } | null;
      return raw && raw.at > (initial?.updatedAtMs ?? 0) + 5000 && raw.d.body !== (initial?.body ?? "") ? raw : null;
    } catch {
      return null;
    }
  });

  // Quitter avec des modifications non enregistrées : le navigateur prévient.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const coverPreview = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : coverFile === null ? "" : coverUrl), [coverFile, coverUrl]);
  const publishedAtMs = mode === "draft" ? d.publishedAtMs : mode === "schedule" ? new Date(scheduleAt).getTime() || Date.now() : d.status === "published" && d.publishedAtMs && d.publishedAtMs <= Date.now() ? d.publishedAtMs : Date.now();
  const status: BlogDraft["status"] = mode === "draft" ? "draft" : "published";
  // État enregistré (mis à jour après chaque enregistrement, création comprise).
  const [saved, setSaved] = useState<{ status: BlogDraft["status"]; publishedAtMs: number } | null>(initial ? { status: initial.status, publishedAtMs: initial.publishedAtMs } : null);
  const liveNow = saved ? isPublic(saved, Date.now()) : false;

  /** Enregistre et renvoie l'identifiant (création au besoin). */
  const save = async (opts: { quiet?: boolean; forceDraft?: boolean } = {}): Promise<string | null> => {
    const title = d.title.trim();
    if (!title) {
      toast.error("Donne un titre à l'article.");
      return null;
    }
    const slug = slugify(d.slug || title);
    if (!slug) {
      toast.error("Adresse de l'article invalide.");
      return null;
    }
    if (await slugTaken(slug, id || undefined)) {
      toast.error(`L'adresse « ${slug} » est déjà prise : change-la.`);
      return null;
    }
    const draft: BlogDraft = { ...d, title, slug, tags: normalizeTags(d.tags), status: opts.forceDraft ? "draft" : status, publishedAtMs: opts.forceDraft ? d.publishedAtMs : publishedAtMs };
    setSaving(true);
    try {
      let saved = id;
      if (id) await updateBlogPost(id, draft, coverFile);
      else {
        saved = await createBlogPost(draft, authorPseudo, coverFile);
        setId(saved);
      }
      setD(draft);
      setSaved({ status: draft.status, publishedAtMs: draft.publishedAtMs });
      setCoverFile(undefined);
      setDirty(false);
      try {
        localStorage.removeItem(localKey);
      } catch {
        /* rien à nettoyer */
      }
      if (!opts.quiet) {
        toast.success(draft.status === "draft" ? "Brouillon enregistré." : draft.publishedAtMs > Date.now() ? "Article programmé." : "Article publié !", draft.status === "published" ? { description: `${BLOG_URL}/p/${slug}` } : undefined);
        onSaved();
      }
      return saved;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const target = id || (await save({ quiet: true, forceDraft: true }));
    if (!target) throw new Error("Enregistre d'abord l'article (titre requis).");
    const url = await uploadBlogImage(target, file);
    setImages((cur) => [...cur, url.split("/").pop()!]);
    return url;
  };

  const remove = async () => {
    if (!id || !window.confirm("Supprimer définitivement cet article et ses images ?")) return;
    await deleteBlogPost(id);
    toast.success("Article supprimé.");
    onSaved();
    onBack();
  };

  const importChangelog = async () => {
    const { CHANGELOG } = await import("@/lib/changelogEntries");
    return CHANGELOG;
  };
  const [changelog, setChangelog] = useState<Awaited<ReturnType<typeof importChangelog>>>([]);
  useEffect(() => {
    void importChangelog().then(setChangelog);
  }, []);
  const fromChangelog = (entryId: string) => {
    const e = changelog.find((x) => x.id === entryId);
    if (!e) return;
    const [intro, ...rest] = e.body.split(/\n\s*\n/);
    set({
      title: e.version ? `Mise à jour ${e.version} : ${e.title}` : e.title,
      excerpt: intro.replace(/[*_`]/g, "").slice(0, BLOG_RULES.excerptMax),
      body: rest.join("\n\n"),
      version: e.version?.replace(/\.0$/, "") ?? "",
      category: "mises-a-jour",
      tags: normalizeTags([...d.tags, "patch"]),
    });
    if (!slugEdited) setSlugEdited(false);
    toast.success("Contenu repris du journal des mises à jour.");
  };

  const fileUrl = (name: string) => `${pb.baseURL.replace(/\/+$/, "")}/api/files/blog_posts/${id}/${name}`;
  const slugShown = slugEdited ? d.slug : slugify(d.title);
  const addTag = () => {
    const next = normalizeTags([...d.tags, ...tagInput.split(",")]);
    set({ tags: next });
    setTagInput("");
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* Barre d'actions */}
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-2 border-b border-white/5 bg-space-950/90 px-1 py-2 backdrop-blur">
        <Button size="sm" variant="ghost" onClick={() => (!dirty || window.confirm("Quitter sans enregistrer ?")) && onBack()}>
          <ArrowLeft className="h-4 w-4" /> Articles
        </Button>
        <span className={cn("font-mono text-[10px] uppercase tracking-[0.16em]", liveNow ? "text-mint-glow" : saved?.status === "published" ? "text-gold-glow" : "text-slate-500")}>
          {!saved ? "Nouvel article" : liveNow ? "En ligne" : saved.status === "published" ? "Programmé" : "Brouillon"}
          {dirty && " · modifié"}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="hidden border border-white/10 lg:flex">
            {(["write", "split", "preview"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} className={cn("px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em]", view === v ? "bg-cyan-glow/15 text-cyan-glow" : "text-slate-500 hover:text-slate-300")}>
                {v === "write" ? "Écrire" : v === "split" ? "Les deux" : "Aperçu"}
              </button>
            ))}
          </div>
          <div className="flex border border-white/10 lg:hidden">
            {(["write", "preview"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} className={cn("px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em]", view === v || (view === "split" && v === "write") ? "bg-cyan-glow/15 text-cyan-glow" : "text-slate-500")}>
                {v === "write" ? "Écrire" : "Aperçu"}
              </button>
            ))}
          </div>
          {liveNow && (
            <a href={`${BLOG_URL}/p/${d.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 border border-white/10 px-2.5 py-1.5 text-xs text-slate-300 hover:text-cyan-glow">
              <ExternalLink className="h-3.5 w-3.5" /> Voir
            </a>
          )}
          <Button size="sm" variant="secondary" disabled={saving} onClick={() => void save({ forceDraft: mode === "draft" })}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
          </Button>
          {mode !== "draft" && (
            <Button size="sm" disabled={saving} onClick={() => void save()}>
              {mode === "schedule" ? <CalendarClock className="h-4 w-4" /> : <Send className="h-4 w-4" />} {mode === "schedule" ? "Programmer" : liveNow ? "Mettre à jour" : "Publier"}
            </Button>
          )}
        </div>
      </div>

      {restore && (
        <div className="flex flex-wrap items-center gap-3 border border-gold-glow/40 bg-gold-glow/[0.06] px-3 py-2 text-sm text-gold-glow">
          Une version plus récente de ce texte est restée sur cet appareil.
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setD(restore.d);
              setDirty(true);
              setRestore(null);
            }}
          >
            Restaurer
          </Button>
          <button type="button" className="text-xs text-slate-400 hover:text-white" onClick={() => setRestore(null)}>
            Ignorer
          </button>
        </div>
      )}

      <div className={cn("grid min-w-0 gap-5", view === "split" ? "xl:grid-cols-2" : "grid-cols-1")}>
        {view !== "preview" && (
          <div className="flex min-w-0 flex-col gap-4">
            {/* Titre et adresse */}
            <input
              value={d.title}
              onChange={(e) => {
                set({ title: e.target.value.slice(0, BLOG_RULES.titleMax), ...(slugEdited ? {} : { slug: slugify(e.target.value) }) });
              }}
              placeholder="Titre de l'article"
              className="w-full border-b border-cyan-glow/20 bg-transparent pb-2 font-display text-2xl font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-glow/60 sm:text-3xl"
            />
            <label className="flex min-w-0 items-center gap-1 font-mono text-xs text-slate-500">
              <span className="shrink-0">{BLOG_URL.replace(/^https?:\/\//, "")}/p/</span>
              <input
                value={slugShown}
                onChange={(e) => {
                  setSlugEdited(true);
                  set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, BLOG_RULES.slugMax) });
                }}
                className="min-w-0 flex-1 border-b border-white/10 bg-transparent py-0.5 text-cyan-glow outline-none focus:border-cyan-glow/50"
                aria-label="Adresse de l'article"
              />
            </label>

            {/* Catégorie */}
            <div className="flex flex-wrap gap-1.5">
              {BLOG_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => set({ category: c.id })}
                  className={cn("border px-2.5 py-1.5 text-xs transition-colors", d.category === c.id ? "text-white" : "border-white/10 text-slate-400 hover:text-white")}
                  style={d.category === c.id ? { borderColor: c.color, background: `${alpha(c.color, 10)}`, color: c.color } : undefined}
                  title={c.description}
                >
                  <BlogCategoryIcon category={c.id} /> {c.label}
                </button>
              ))}
            </div>

            {/* Extrait */}
            <label className="flex flex-col gap-1">
              <span className="flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Chapeau (aperçus, réseaux, RSS) <span>{d.excerpt.length} / {BLOG_RULES.excerptMax}</span>
              </span>
              <textarea value={d.excerpt} maxLength={BLOG_RULES.excerptMax} rows={2} onChange={(e) => set({ excerpt: e.target.value })} placeholder="Une ou deux phrases qui donnent envie de lire." className="resize-y border border-cyan-glow/15 bg-space-900/60 p-2.5 text-sm text-slate-100 outline-none focus:border-cyan-glow/50" />
            </label>

            {/* Corps */}
            <MarkdownEditor value={d.body} onChange={(v) => set({ body: v })} onUploadImage={uploadImage} onSave={() => void save({ forceDraft: mode === "draft" })} />

            {/* Réglages */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Tags ({d.tags.length} / {BLOG_RULES.tagsMax})</span>
                <div className="flex flex-wrap gap-1">
                  {d.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 border border-cyan-glow/25 bg-cyan-glow/[0.06] px-2 py-0.5 font-mono text-[11px] text-cyan-glow">
                      #{t}
                      <button type="button" aria-label={`Retirer ${t}`} onClick={() => set({ tags: d.tags.filter((x) => x !== t) })}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => (e.key === "Enter" || e.key === ",") && (e.preventDefault(), addTag())} onBlur={() => tagInput.trim() && addTag()} placeholder="pvp, colonies… (Entrée)" className="h-9" />
              </div>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Version du jeu (facultatif)</span>
                  <Input value={d.version} onChange={(e) => set({ version: e.target.value.slice(0, 20) })} placeholder="5.8" className="h-9" />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={d.pinned} onChange={(e) => set({ pinned: e.target.checked })} className="accent-cyan-400" />
                  <Pin className="h-3.5 w-3.5 text-gold-glow" /> Épingler en tête du blog
                </label>
              </div>
            </div>

            {/* Couverture */}
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Image de couverture (aperçus Discord, en-tête) · 16:9 conseillé</span>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => coverInput.current?.click()} className="grid aspect-video w-56 place-items-center overflow-hidden border border-dashed border-cyan-glow/30 bg-space-900/60 bg-cover bg-center text-xs text-slate-500 hover:border-cyan-glow/60" style={coverPreview ? { backgroundImage: `url('${coverPreview}')` } : undefined}>
                  {!coverPreview && (
                    <span className="flex flex-col items-center gap-1">
                      <ImagePlus className="h-5 w-5" /> Choisir une image
                    </span>
                  )}
                </button>
                {coverPreview && (
                  <Button size="sm" variant="ghost" onClick={() => (setCoverFile(null), setCoverUrl(""), setDirty(true))}>
                    <Trash2 className="h-4 w-4" /> Retirer
                  </Button>
                )}
                <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 5 * 1024 * 1024) toast.error("5 Mo au plus.");
                    else {
                      setCoverFile(f);
                      setDirty(true);
                    }
                  }
                  e.target.value = "";
                }} />
              </div>
            </div>

            {/* Publication */}
            <div className="flex flex-col gap-2 border border-white/10 bg-black/20 p-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Publication</span>
              <div className="flex flex-wrap gap-1.5">
                {([
                  ["draft", "Brouillon"],
                  ["now", liveNow ? "En ligne" : "Publier maintenant"],
                  ["schedule", "Programmer"],
                ] as const).map(([m, label]) => (
                  <button key={m} type="button" onClick={() => (setMode(m), setDirty(true))} className={cn("border px-3 py-1.5 text-xs", mode === m ? "border-cyan-glow/60 bg-cyan-glow/10 text-cyan-glow" : "border-white/10 text-slate-400 hover:text-white")}>
                    {label}
                  </button>
                ))}
              </div>
              {mode === "schedule" && (
                <label className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                  Mise en ligne le
                  <input type="datetime-local" value={scheduleAt} onChange={(e) => (setScheduleAt(e.target.value), setDirty(true))} className="border border-cyan-glow/20 bg-space-900 px-2 py-1 font-mono text-xs text-white [color-scheme:dark]" />
                </label>
              )}
              <p className="text-[11px] text-slate-500">
                {mode === "draft" ? "Visible seulement par la rédaction." : mode === "schedule" ? "L'article apparaîtra tout seul à l'heure dite (heure de ton appareil)." : "L'article est visible par tout le monde sur le devblog et dans le flux RSS."}
              </p>
            </div>

            {/* Médiathèque */}
            {images.length > 0 && id && (
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Images de l'article ({images.length})</span>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {images.map((name) => (
                    <div key={name} className="group relative aspect-square overflow-hidden border border-white/10 bg-cover bg-center" style={{ backgroundImage: `url('${fileUrl(name)}')` }}>
                      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button type="button" title="Copier le markdown" onClick={() => void navigator.clipboard?.writeText(`![](${fileUrl(name)})`).then(() => toast.success("Markdown copié."))} className="p-1 text-slate-300 hover:text-cyan-glow">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" title="Supprimer l'image" onClick={() => void removeBlogImage(id, name).then(() => setImages((cur) => cur.filter((x) => x !== name)))} className="p-1 text-slate-300 hover:text-danger-glow">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <FileUp className="h-4 w-4" /> Reprendre une version du journal
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-80 overflow-y-auto">
                  {changelog.slice(0, 30).map((e) => (
                    <DropdownMenuItem key={e.id} onSelect={() => fromChangelog(e.id)}>
                      {e.version ? `${e.version} · ` : ""}
                      {e.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {id && (
                <Button size="sm" variant="ghost" className="ml-auto text-danger-glow" onClick={() => void remove()}>
                  <Trash2 className="h-4 w-4" /> Supprimer l'article
                </Button>
              )}
            </div>
          </div>
        )}
        {view !== "write" && (
          <div className={cn("min-w-0", view === "split" && "hidden xl:block")}>
            <div className="xl:sticky xl:top-16">
              <BlogPreview title={d.title} excerpt={d.excerpt} body={d.body} category={d.category} cover={coverPreview} author={initial?.authorPseudo || authorPseudo} publishedAtMs={mode === "draft" ? 0 : publishedAtMs} version={d.version} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
