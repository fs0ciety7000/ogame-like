import { BLOG_CATEGORIES, BLOG_RULES, blogCategory, blogDate, blogDateTime, excerptOf, readingMinutes, relatedPosts, searchPosts, type BlogPost } from "@/game/blog";
import { escapeHtml, renderMarkdown } from "@/game/blogMarkdown";
import type { CustomEmoji } from "@/game/emojis";

/* =====================================================
   v5.8 : pages HTML du devblog, rendues par PocketBase (aperçus Discord,
   référencement, flux RSS) : accueil, catégorie, tag, recherche, article,
   404, RSS et plan du site.
===================================================== */

export interface BlogSite {
  /** "" sur devblog.fs0ciety.org, "/blog" ailleurs (aperçu, tests). */
  base: string;
  /** Adresse absolue du blog (liens canoniques, RSS, aperçus). */
  origin: string;
  /** Adresse du jeu (images /assets, bouton Jouer, espace rédaction). */
  gameUrl: string;
  now: number;
  emojis: CustomEmoji[];
  /** Version des fichiers CSS / JS (cache). */
  assetVersion: string;
}

const e = escapeHtml;
const url = (site: BlogSite, path: string) => `${site.base}${path}`;
const abs = (site: BlogSite, path: string) => `${site.origin}${site.base}${path}`;
const asset = (site: BlogSite, path: string) => (path.startsWith("/assets/") ? `${site.gameUrl}${path}` : path);

function head(site: BlogSite, o: { title: string; description: string; image?: string; canonical: string; type?: string; noindex?: boolean }): string {
  const image = o.image || `${site.gameUrl}/assets/logo/logo.webp`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(o.title)}</title><meta name="description" content="${e(o.description)}">
<link rel="canonical" href="${e(o.canonical)}">${o.noindex ? '<meta name="robots" content="noindex">' : ""}
<meta property="og:site_name" content="Cosmic Empires · Devblog"><meta property="og:type" content="${o.type ?? "website"}"><meta property="og:title" content="${e(o.title)}"><meta property="og:description" content="${e(o.description)}"><meta property="og:url" content="${e(o.canonical)}"><meta property="og:image" content="${e(image)}"><meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${e(image)}"><meta name="theme-color" content="#4be8ff">
<link rel="icon" href="${site.gameUrl}/assets/logo/logo.webp"><link rel="alternate" type="application/rss+xml" title="Devblog Cosmic Empires" href="${abs(site, "/rss.xml")}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap">
<link rel="stylesheet" href="${url(site, `/assets/blog.css?v=${site.assetVersion}`)}"></head><body>`;
}

function topbar(site: BlogSite, active: string): string {
  const nav = [`<a href="${url(site, "/")}"${active === "home" ? ' class="on"' : ""}>Accueil</a>`, ...BLOG_CATEGORIES.map((c) => `<a href="${url(site, `/c/${c.id}`)}"${active === c.id ? ' class="on"' : ""}>${e(c.label)}</a>`)].join("");
  return `<a class="skip" href="#contenu">Aller au contenu</a><header class="topbar"><div class="wrap">
<a class="brand" href="${url(site, "/")}"><img src="${site.gameUrl}/assets/logo/logo.webp" alt=""><b>COSMIC EMPIRES</b><span>DEVBLOG</span></a>
<nav class="nav" aria-label="Catégories">${nav}</nav><a class="play" href="${site.gameUrl}">Jouer</a></div></header>`;
}

function footer(site: BlogSite): string {
  return `<footer class="footer"><div class="wrap"><div><a class="brand" href="${url(site, "/")}"><img src="${site.gameUrl}/assets/logo/logo.webp" alt=""><b>COSMIC EMPIRES</b><span>DEVBLOG</span></a>
<p>Annonces, mises à jour et notes de l'équipe. Le jeu de stratégie spatiale où chaque empire écrit sa légende.</p></div>
<nav aria-label="Liens"><a href="${site.gameUrl}">Jouer</a><a href="${site.gameUrl}/bible">Bible du jeu</a><a href="${site.gameUrl}/formules">Formules</a><a href="${url(site, "/rss.xml")}">Flux RSS</a></nav></div></footer>
<script src="${url(site, `/assets/blog.js?v=${site.assetVersion}`)}" defer></script></body></html>`;
}

/** Icône illustrée de la catégorie (public/assets/blog/<id>.webp), l'emoji tant qu'elle n'existe pas. */
function categoryIcon(site: BlogSite, catId: string): string {
  const c = blogCategory(catId);
  return `<img class="cat-ico" src="${site.gameUrl}/assets/blog/${c.id}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${c.emoji}'))">`;
}

function chip(site: BlogSite, catId: string): string {
  const c = blogCategory(catId);
  return `<a class="chip" href="${url(site, `/c/${c.id}`)}" style="color:${c.color}">${categoryIcon(site, c.id)} ${e(c.label)}</a>`;
}

function chipSpan(site: BlogSite, catId: string): string {
  const c = blogCategory(catId);
  return `<span class="chip" style="color:${c.color}">${categoryIcon(site, c.id)} ${e(c.label)}</span>`;
}

function avatar(site: BlogSite, p: BlogPost): string {
  const src = p.authorAvatarUrl || `${site.gameUrl}/assets/avatars/default.webp`;
  return `<img class="avatar" src="${e(src)}" alt="" loading="lazy">`;
}

function cover(site: BlogSite, p: BlogPost): string {
  return p.coverUrl ? asset(site, p.coverUrl) : `${site.gameUrl}/assets/story/choeur-banner.webp`;
}

function card(site: BlogSite, p: BlogPost): string {
  return `<a class="card reveal" href="${url(site, `/p/${p.slug}`)}"><div class="cover" style="background-image:url('${e(cover(site, p))}')">${chipSpan(site, p.category)}${p.pinned ? '<span class="pin">ÉPINGLÉ</span>' : ""}</div>
<div class="body"><h2>${e(p.title)}</h2><p>${e(excerptOf(p, 160))}</p>
<div class="meta"><span class="who">${avatar(site, p)}${e(p.authorPseudo)}</span><span>${blogDate(p.publishedAtMs)}</span><span>${readingMinutes(p.body)} min</span>${p.version ? `<span class="vtag">v${e(p.version)}</span>` : ""}</div></div></a>`;
}

function feature(site: BlogSite, p: BlogPost): string {
  return `<a class="feature reveal" href="${url(site, `/p/${p.slug}`)}"><div class="cover" style="background-image:url('${e(cover(site, p))}')"></div>
<div class="body">${chipSpan(site, p.category)}<h2>${e(p.title)}</h2><p>${e(excerptOf(p, 260))}</p>
<div class="meta"><span class="who">${avatar(site, p)}${e(p.authorPseudo)}</span><span>${blogDate(p.publishedAtMs)}</span><span>${readingMinutes(p.body)} min de lecture</span>${p.version ? `<span class="vtag">v${e(p.version)}</span>` : ""}</div></div></a>`;
}

function sidebar(site: BlogSite, posts: BlogPost[], o: { q?: string; tag?: string; category?: string }): string {
  const counts = new Map<string, number>();
  const tags = new Map<string, number>();
  for (const p of posts) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    for (const t of p.tags) tags.set(t, (tags.get(t) ?? 0) + 1);
  }
  const topTags = [...tags.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 24);
  return `<aside class="side">
<form class="search panel" action="${url(site, "/recherche")}" method="get" role="search" style="padding:0"><input type="search" name="q" placeholder="Rechercher un article…" value="${e(o.q ?? "")}" aria-label="Rechercher"><button type="submit" aria-label="Rechercher">⌕</button></form>
<div class="panel"><h3>Catégories</h3><ul class="cats">${BLOG_CATEGORIES.map((c) => `<li><a href="${url(site, `/c/${c.id}`)}"${o.category === c.id ? ' style="color:#fff"' : ""}><span class="dot" style="background:${c.color};box-shadow:0 0 8px ${c.color}"></span>${categoryIcon(site, c.id)} ${e(c.label)}<span class="n">${counts.get(c.id) ?? 0}</span></a></li>`).join("")}</ul></div>
${topTags.length ? `<div class="panel"><h3>Tags</h3><div class="tagcloud">${topTags.map(([t]) => `<a class="tag${o.tag === t ? " on" : ""}" href="${url(site, `/t/${t}`)}">${e(t)}</a>`).join("")}</div></div>` : ""}
<div class="panel"><h3>Rejoindre le secteur</h3><p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:var(--t3)">Bâtis ton empire, forge des alliances et écris ton nom dans les Chroniques.</p><a class="play cta" href="${site.gameUrl}">Jouer gratuitement</a><p style="margin:12px 0 0;text-align:center"><a class="tag" style="border:0" href="${url(site, "/rss.xml")}">flux RSS</a></p></div>
</aside>`;
}

function pager(site: BlogSite, path: string, page: number, pages: number, extra = ""): string {
  if (pages <= 1) return "";
  const link = (n: number) => `${url(site, path)}?page=${n}${extra}`;
  const items: string[] = [];
  if (page > 1) items.push(`<a href="${link(page - 1)}" rel="prev">←</a>`);
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) items.push(n === page ? `<span class="cur">${n}</span>` : `<a href="${link(n)}">${n}</a>`);
    else if (Math.abs(n - page) === 2) items.push("<span>…</span>");
  }
  if (page < pages) items.push(`<a href="${link(page + 1)}" rel="next">→</a>`);
  return `<nav class="pager" aria-label="Pages">${items.join("")}</nav>`;
}

export interface BlogListInput {
  /** Articles publics, du plus récent au plus ancien. */
  posts: BlogPost[];
  page: number;
  category?: string;
  tag?: string;
  q?: string;
}

/** Accueil, catégorie, tag ou recherche. */
export function renderBlogList(site: BlogSite, input: BlogListInput): string {
  const all = input.posts;
  const cat = input.category ? BLOG_CATEGORIES.find((c) => c.id === input.category) : undefined;
  let list = all;
  if (cat) list = list.filter((p) => p.category === cat.id);
  if (input.tag) list = list.filter((p) => p.tags.includes(input.tag!));
  if (input.q !== undefined) list = searchPosts(list, input.q);
  const isHome = !cat && !input.tag && input.q === undefined;
  const featured = isHome && input.page === 1 ? (list.find((p) => p.pinned) ?? list[0]) : undefined;
  const rest = featured ? list.filter((p) => p.id !== featured.id) : list;
  const pages = Math.max(1, Math.ceil(rest.length / BLOG_RULES.perPage));
  const page = Math.min(Math.max(1, input.page), pages);
  const shown = rest.slice((page - 1) * BLOG_RULES.perPage, page * BLOG_RULES.perPage);

  const path = cat ? `/c/${cat.id}` : input.tag ? `/t/${input.tag}` : input.q !== undefined ? "/recherche" : "/";
  const title = cat ? `${cat.label} · Devblog Cosmic Empires` : input.tag ? `#${input.tag} · Devblog Cosmic Empires` : input.q !== undefined ? `Recherche « ${input.q} » · Devblog Cosmic Empires` : "Devblog · Cosmic Empires";
  const description = cat ? cat.description : input.tag ? `Tous les articles du devblog sur ${input.tag}.` : "Annonces, mises à jour, coulisses et notes de l'équipe de Cosmic Empires.";
  const hero = cat
    ? `<p class="crumbs"><a href="${url(site, "/")}">Devblog</a> / Catégorie</p><p class="eyebrow" style="color:${cat.color}">${categoryIcon(site, cat.id)} Catégorie</p><h1>${e(cat.label)}</h1><p class="lead">${e(cat.description)}</p>`
    : input.tag
      ? `<p class="crumbs"><a href="${url(site, "/")}">Devblog</a> / Tag</p><p class="eyebrow">Tag</p><h1>#${e(input.tag)}</h1><p class="lead">${list.length} article${list.length > 1 ? "s" : ""}.</p>`
      : input.q !== undefined
        ? `<p class="crumbs"><a href="${url(site, "/")}">Devblog</a> / Recherche</p><p class="eyebrow">Recherche</p><h1>« ${e(input.q || "…")} »</h1><p class="lead">${list.length} résultat${list.length > 1 ? "s" : ""}.</p>`
        : `<p class="eyebrow">Journal de bord de l'équipe</p><h1>Devblog</h1><p class="lead">Annonces, mises à jour, coulisses du développement et petites notes du staff. Tout ce qui se passe dans le secteur, de première main.</p>`;
  const body = shown.length === 0 && !featured ? `<div class="panel empty"><b>Aucun article</b>${input.q !== undefined ? "Essaie d'autres mots-clés." : "Rien de publié ici pour le moment. Repasse bientôt !"}</div>` : `${featured ? feature(site, featured) : ""}${shown.length ? `${featured ? '<p class="section-title">Derniers articles</p>' : ""}<div class="grid">${shown.map((p) => card(site, p)).join("")}</div>` : ""}${pager(site, path, page, pages, input.q !== undefined ? `&q=${encodeURIComponent(input.q)}` : "")}`;
  return `${head(site, { title, description, canonical: abs(site, path === "/" ? "/" : path), image: featured ? cover(site, featured) : undefined, noindex: input.q !== undefined })}${topbar(site, cat ? cat.id : isHome ? "home" : "")}
<main id="contenu"><section class="hero wrap">${hero}</section><div class="wrap layout"><div>${body}</div>${sidebar(site, all, { q: input.q, tag: input.tag, category: cat?.id })}</div></main>${footer(site)}`;
}

/** Page d'un article (public, ou aperçu d'un brouillon pour son auteur). */
export function renderBlogPost(site: BlogSite, post: BlogPost, all: BlogPost[], opts: { preview?: boolean } = {}): string {
  const { html, headings } = renderMarkdown(post.body, { emojis: site.emojis, assetBase: site.gameUrl });
  const cat = blogCategory(post.category);
  const idx = all.findIndex((p) => p.id === post.id);
  const newer = idx > 0 ? all[idx - 1] : undefined;
  const older = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : undefined;
  const related = relatedPosts(post, all);
  const link = abs(site, `/p/${post.slug}`);
  const toc = headings.filter((h) => h.level <= 3);
  const updated = post.updatedAtMs > post.publishedAtMs + 3_600_000 ? `<span>Mis à jour le ${blogDate(post.updatedAtMs)}</span>` : "";
  const date = post.publishedAtMs > 0 ? blogDateTime(post.publishedAtMs) : "Non publié";
  const ld = JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, datePublished: new Date(post.publishedAtMs || site.now).toISOString(), dateModified: new Date(post.updatedAtMs || site.now).toISOString(), author: { "@type": "Person", name: post.authorPseudo }, image: cover(site, post), description: excerptOf(post), mainEntityOfPage: link }).replace(/</g, "\\u003c");
  return `${head(site, { title: `${post.title} · Devblog Cosmic Empires`, description: excerptOf(post), image: cover(site, post), canonical: link, type: "article", noindex: opts.preview })}
<script type="application/ld+json">${ld}</script><div class="progress" aria-hidden="true"></div>${topbar(site, cat.id)}
<main id="contenu"><header class="post-hero"><div class="bg" style="background-image:url('${e(cover(site, post))}')"></div><div class="wrap">
<p class="crumbs"><a href="${url(site, "/")}">Devblog</a> / <a href="${url(site, `/c/${cat.id}`)}">${e(cat.label)}</a></p>${chip(site, post.category)}
<h1>${e(post.title)}</h1>${post.excerpt ? `<p class="lead">${e(post.excerpt)}</p>` : ""}
<div class="meta"><span class="who">${avatar(site, post)}<span><b>${e(post.authorPseudo)}</b><small>${e(post.authorRole || "Équipe Cosmic Empires")}</small></span></span><span>${date}</span>${updated}<span>${readingMinutes(post.body)} min de lecture</span>${post.version ? `<span class="vtag">v${e(post.version)}</span>` : ""}</div>
${opts.preview ? `<p class="draft-banner">Aperçu : ${post.status === "draft" ? "brouillon, visible seulement par la rédaction" : `programmé pour le ${blogDateTime(post.publishedAtMs)}`}</p>` : ""}</div></header>
<div class="wrap layout"><div><article class="panel article"><div class="prose">${html}</div>
<div class="post-foot">${post.tags.map((t) => `<a class="tag" href="${url(site, `/t/${t}`)}">${e(t)}</a>`).join("")}<div class="share"><button type="button" class="btn" data-copy="${e(link)}">Copier le lien</button><a class="btn" target="_blank" rel="noopener noreferrer" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(link)}">Partager</a></div></div></article>
${newer || older ? `<nav class="prevnext">${older ? `<a href="${url(site, `/p/${older.slug}`)}"><small>← Précédent</small><b>${e(older.title)}</b></a>` : ""}${newer ? `<a class="next" href="${url(site, `/p/${newer.slug}`)}"><small>Suivant →</small><b>${e(newer.title)}</b></a>` : ""}</nav>` : ""}
${related.length ? `<p class="section-title" style="margin-top:36px">À lire aussi</p><div class="grid">${related.map((p) => card(site, p)).join("")}</div>` : ""}</div>
<aside class="side">${toc.length >= 2 ? `<nav class="panel toc" aria-label="Sommaire"><h3>Sommaire</h3><ol>${toc.map((h) => `<li class="l${h.level}"><a href="#${h.id}">${e(h.text)}</a></li>`).join("")}</ol></nav>` : sidebar(site, all, { category: cat.id })}</aside></div></main>${footer(site)}`;
}

export function renderBlogNotFound(site: BlogSite, posts: BlogPost[]): string {
  return `${head(site, { title: "Page introuvable · Devblog Cosmic Empires", description: "Cette page n'existe pas (ou plus).", canonical: abs(site, "/"), noindex: true })}${topbar(site, "")}
<main id="contenu"><section class="hero wrap"><p class="eyebrow" style="color:var(--danger)">Erreur 404 · Signal perdu</p><h1>Page introuvable</h1><p class="lead">Ce secteur est vide : l'article a peut-être été déplacé ou retiré.</p><p style="margin-top:22px"><a class="play" href="${url(site, "/")}">Retour au devblog</a></p></section>
${posts.length ? `<div class="wrap" style="padding-bottom:48px"><p class="section-title">Derniers articles</p><div class="grid">${posts.slice(0, 3).map((p) => card(site, p)).join("")}</div></div>` : ""}</main>${footer(site)}`;
}

const xml = (s: string) => e(s);

export function renderBlogRss(site: BlogSite, posts: BlogPost[]): string {
  const items = posts
    .slice(0, 30)
    .map((p) => {
      const { html } = renderMarkdown(p.body, { emojis: site.emojis, assetBase: site.gameUrl });
      return `<item><title>${xml(p.title)}</title><link>${xml(abs(site, `/p/${p.slug}`))}</link><guid isPermaLink="true">${xml(abs(site, `/p/${p.slug}`))}</guid><pubDate>${new Date(p.publishedAtMs).toUTCString()}</pubDate><category>${xml(blogCategory(p.category).label)}</category><dc:creator>${xml(p.authorPseudo)}</dc:creator><description>${xml(excerptOf(p))}</description><content:encoded><![CDATA[${html.replace(/\]\]>/g, "]]&gt;")}]]></content:encoded></item>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Devblog Cosmic Empires</title><link>${xml(abs(site, "/"))}</link><description>Annonces, mises à jour et notes de l'équipe.</description><language>fr</language><atom:link href="${xml(abs(site, "/rss.xml"))}" rel="self" type="application/rss+xml"/>${posts[0] ? `<lastBuildDate>${new Date(posts[0].publishedAtMs).toUTCString()}</lastBuildDate>` : ""}${items}</channel></rss>`;
}

export function renderBlogSitemap(site: BlogSite, posts: BlogPost[]): string {
  const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  const urls = [`<url><loc>${xml(abs(site, "/"))}</loc><changefreq>daily</changefreq></url>`, ...BLOG_CATEGORIES.map((c) => `<url><loc>${xml(abs(site, `/c/${c.id}`))}</loc></url>`), ...posts.map((p) => `<url><loc>${xml(abs(site, `/p/${p.slug}`))}</loc><lastmod>${day(p.updatedAtMs || p.publishedAtMs)}</lastmod></url>`)];
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
}

export function renderBlogRobots(site: BlogSite): string {
  return `User-agent: *\nAllow: /\nDisallow: ${site.base}/recherche\nSitemap: ${abs(site, "/sitemap.xml")}\n`;
}
