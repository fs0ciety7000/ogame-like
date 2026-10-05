import { useEffect, useState } from "react";
import { ArrowUpRight, Newspaper } from "lucide-react";
import { blogCategory, blogDate } from "@/game/blog";
import { pb, pbConfigured } from "@/lib/pocketbase";
import { BLOG_URL } from "@/services/blogService";
import { BlogCategoryIcon } from "@/components/blog/BlogCategoryIcon";

/* v5.8 : derniers articles du devblog (page de connexion, nouveautés). */

interface LatestPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  version: string;
  publishedAt: string;
  url: string;
  cover: string;
}

export function BlogLatest({ limit = 3, className = "" }: { limit?: number; className?: string }) {
  const [posts, setPosts] = useState<LatestPost[] | null>(null);
  useEffect(() => {
    if (!pbConfigured) return;
    let alive = true;
    fetch(`${pb.baseURL.replace(/\/+$/, "")}/api/cosmic/blog/posts?limite=${limit}`)
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((d: { posts?: LatestPost[] }) => alive && setPosts(d.posts ?? []))
      .catch(() => alive && setPosts([]));
    return () => {
      alive = false;
    };
  }, [limit]);

  if (!posts || posts.length === 0) return null;
  return (
    <section className={`border border-cyan-glow/15 bg-space-950/60 backdrop-blur-sm ${className}`}>
      <header className="flex items-center justify-between gap-2 border-b border-cyan-glow/10 px-4 py-2.5">
        <span className="hud-eyebrow flex items-center gap-2 text-cyan-glow">
          <Newspaper className="h-3.5 w-3.5" /> Devblog
        </span>
        <a href={BLOG_URL} target="_blank" rel="noopener" className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 transition hover:text-cyan-glow">
          Tout lire <ArrowUpRight className="h-3 w-3" />
        </a>
      </header>
      <ul className="divide-y divide-cyan-glow/10">
        {posts.map((p) => {
          const cat = blogCategory(p.category);
          return (
            <li key={p.slug}>
              <a href={p.url} target="_blank" rel="noopener" className="group flex gap-3 px-4 py-3 transition hover:bg-cyan-glow/5">
                {p.cover ? (
                  <img src={p.cover} alt="" loading="lazy" className="h-12 w-16 shrink-0 border border-cyan-glow/15 object-cover" />
                ) : (
                  <span className="flex h-12 w-16 shrink-0 items-center justify-center border border-cyan-glow/15 text-xl" style={{ background: `color-mix(in srgb, ${cat.color} 10%, transparent)` }}>
                    <BlogCategoryIcon category={p.category} className="h-7 w-7" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: cat.color }}>
                    {cat.label}
                    <span className="text-slate-600">· {blogDate(Date.parse(p.publishedAt))}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-slate-100 group-hover:text-cyan-glow">{p.title}</span>
                  {p.excerpt && <span className="line-clamp-1 text-xs text-slate-400">{p.excerpt}</span>}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
