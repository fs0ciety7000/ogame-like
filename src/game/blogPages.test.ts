import { describe, expect, it } from "vitest";
import type { BlogPost } from "@/game/blog";
import { renderBlogList, renderBlogNotFound, renderBlogPost, renderBlogRss, renderBlogSitemap, type BlogSite } from "@/game/blogPages";

const NOW = Date.UTC(2026, 9, 3, 12);
const site: BlogSite = { base: "", origin: "https://devblog.test", gameUrl: "https://jeu.test", now: NOW, emojis: [], assetVersion: "1" };
const post = (i: number, extra: Partial<BlogPost> = {}): BlogPost => ({
  id: `p${i}`, slug: `article-${i}`, title: `Article <${i}>`, excerpt: "", body: `## Partie A\n\nTexte ${i}\n\n## Partie B\n\nFin`, category: i % 2 ? "annonces" : "notes",
  tags: ["flotte", i % 2 ? "pvp" : "eco"], coverUrl: "", status: "published", publishedAtMs: NOW - i * 86_400_000, updatedAtMs: NOW - i * 86_400_000,
  pinned: false, version: "", authorUid: "u", authorPseudo: "Nicotine", authorAvatarUrl: "", authorRole: "Équipe", ...extra,
});
const posts = Array.from({ length: 14 }, (_, i) => post(i + 1, i === 4 ? { pinned: true } : {}));

describe("devblog : pages", () => {
  it("accueil : article épinglé en vedette, pagination, titres échappés", () => {
    const html = renderBlogList(site, { posts, page: 1 });
    expect(html).toContain('class="feature reveal" href="/p/article-5"');
    expect(html).toContain("Article &lt;5&gt;");
    expect(html).not.toContain("Article <5>");
    expect(html).toContain('href="/?page=2"');
    expect(html).toContain('property="og:title" content="Devblog · Cosmic Empires"');
  });

  it("catégorie, tag, recherche", () => {
    expect(renderBlogList(site, { posts, page: 1, category: "notes" })).not.toContain("/p/article-1\"");
    const tag = renderBlogList(site, { posts, page: 1, tag: "eco" });
    expect(tag).toContain("#eco");
    expect(tag).toContain("7 articles");
    const search = renderBlogList(site, { posts, page: 1, q: "texte 12" });
    expect(search).toContain("/p/article-12");
    expect(search).toContain('name="robots" content="noindex"');
  });

  it("article : sommaire, précédent / suivant, aperçus, liés", () => {
    const html = renderBlogPost(site, posts[2], posts);
    expect(html).toContain('<a href="#partie-a">Partie A</a>');
    expect(html).toContain("← Précédent");
    expect(html).toContain("Suivant →");
    expect(html).toContain('property="og:type" content="article"');
    expect(html).toContain("À lire aussi");
    expect(renderBlogPost(site, { ...posts[0], status: "draft" }, posts, { preview: true })).toContain("brouillon");
  });

  it("préfixe /blog hors du sous-domaine, 404, RSS, sitemap", () => {
    const html = renderBlogList({ ...site, base: "/blog" }, { posts, page: 1 });
    expect(html).toContain('href="/blog/p/article-1"');
    expect(html).toContain('href="/blog/assets/blog.css?v=1"');
    expect(renderBlogNotFound(site, posts)).toContain("404");
    const rss = renderBlogRss(site, posts);
    expect(rss).toContain("<link>https://devblog.test/p/article-1</link>");
    expect(rss).toContain("<![CDATA[");
    expect(renderBlogSitemap(site, posts)).toContain("<loc>https://devblog.test/p/article-14</loc>");
  });
});
