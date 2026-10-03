import { useDeferredValue, useMemo } from "react";
import { BlogCategoryIcon } from "@/components/blog/BlogCategoryIcon";
import { blogCategory, blogDateTime, readingMinutes } from "@/game/blog";
import { renderMarkdown } from "@/game/blogMarkdown";
import { BLOG_VARS, PROSE_CSS } from "@/game/blogStyles";
import { GAME_EMOJIS } from "@/game/emojis";
import { KESH_EMOJIS } from "@/game/bounties";
import { useEmojiStore } from "@/services/emojiService";

/* v5.8 : aperçu fidèle d'un article : même rendu et même feuille de style
   que le devblog public (classe .prose). */

const STYLE = `.blog-preview{${BLOG_VARS};color:var(--t2);font-family:var(--f-body)}${PROSE_CSS.replace(/\.prose/g, ".blog-preview .prose")}`;

export function BlogPreview({ title, excerpt, body, category, cover, author, publishedAtMs, version }: { title: string; excerpt: string; body: string; category: string; cover?: string; author: string; publishedAtMs: number; version: string }) {
  const custom = useEmojiStore((s) => s.emojis);
  const deferred = useDeferredValue(body);
  const html = useMemo(() => renderMarkdown(deferred, { emojis: [...GAME_EMOJIS, ...KESH_EMOJIS, ...custom] }).html, [deferred, custom]);
  const cat = blogCategory(category);
  return (
    <div className="blog-preview min-w-0">
      <style>{STYLE}</style>
      <div className="relative overflow-hidden border border-cyan-glow/20">
        {cover && <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url('${cover}')`, maskImage: "linear-gradient(180deg,#000 30%,transparent)" }} />}
        <div className="relative px-6 pb-6 pt-10">
          <span className="inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: cat.color, borderColor: cat.color }}>
            <BlogCategoryIcon category={cat.id} /> {cat.label}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">{title || "Titre de l'article"}</h1>
          {excerpt && <p className="mt-2 max-w-2xl text-base text-slate-300">{excerpt}</p>}
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-slate-500">
            <span className="text-slate-300">{author}</span>
            <span>{publishedAtMs > 0 ? blogDateTime(publishedAtMs) : "Brouillon"}</span>
            <span>{readingMinutes(body)} min de lecture</span>
            {version && <span className="border border-cyan-glow/30 px-1.5 text-cyan-glow">v{version}</span>}
          </p>
        </div>
      </div>
      <div className="border border-t-0 border-cyan-glow/20 bg-space-950/70 px-6 py-6">
        {body.trim() ? <div className="prose" dangerouslySetInnerHTML={{ __html: html }} /> : <p className="text-sm text-slate-500">L'aperçu s'affiche ici pendant que tu écris.</p>}
      </div>
    </div>
  );
}
