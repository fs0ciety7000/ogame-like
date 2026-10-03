import { describe, expect, it } from "vitest";
import { renderMarkdown, safeUrl } from "@/game/blogMarkdown";
import { excerptOf, normalizeTags, readingMinutes, searchPosts, slugify } from "@/game/blog";

const md = (s: string) => renderMarkdown(s, { assetBase: "https://jeu", emojis: [{ code: "varan", url: "/assets/emojis/varan.webp", label: "Varan" }] }).html;

describe("devblog : markdown", () => {
  it("échappe le HTML et filtre les liens dangereux", () => {
    const html = md('<script>alert(1)</script> [clic](javascript:alert(1)) <img src=x onerror=1>');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain('href="#"');
    expect(safeUrl("data:text/html,x")).toBe("#");
    expect(safeUrl("/assets/a.webp", "https://jeu")).toBe("https://jeu/assets/a.webp");
  });

  it("titres avec ancres et sommaire, emphase, emojis", () => {
    const r = renderMarkdown("# Bonjour l'Été\n\nDu **gras**, de l'*italique*, ~~barré~~, ==surligné==, `code` et :varan: :rocket:", { assetBase: "https://jeu", emojis: [{ code: "varan", url: "/assets/emojis/varan.webp" }] });
    expect(r.headings).toEqual([{ level: 2, id: "bonjour-l-ete", text: "Bonjour l'Été" }]);
    expect(r.html).toContain('<h2 id="bonjour-l-ete">');
    expect(r.html).toContain("<strong>gras</strong>");
    expect(r.html).toContain("<em>italique</em>");
    expect(r.html).toContain("<del>barré</del>");
    expect(r.html).toContain("<mark>surligné</mark>");
    expect(r.html).toContain("<code>code</code>");
    expect(r.html).toContain('src="https://jeu/assets/emojis/varan.webp"');
    expect(r.html).toContain("🚀");
  });

  it("listes imbriquées, cases à cocher, listes numérotées", () => {
    const html = md("- un\n  - sous\n- [x] fait\n- [ ] à faire\n\n3. trois\n4. quatre");
    expect(html).toMatch(/<ul class="tasks"><li>un<ul><li>sous<\/li><\/ul><\/li>/);
    expect(html).toContain('class="task done"');
    expect(html).toContain('<ol start="3">');
  });

  it("tableaux alignés, encadrés, citations, séparateurs, figures", () => {
    const html = md('| Unité | ATK |\n|:--|--:|\n| Frégate | 12 |\n\n> [!WARNING] Prudence\n> Texte\n\n> citation\n\n---\n\n![Planète](/assets/p.webp "La planète mère")');
    expect(html).toContain('<th style="text-align:left">Unité</th>');
    expect(html).toContain('<td style="text-align:right">12</td>');
    expect(html).toContain('class="callout callout-warning"');
    expect(html).toContain("Prudence");
    expect(html).toContain("<blockquote><p>citation</p></blockquote>");
    expect(html).toContain("<hr>");
    expect(html).toContain("<figcaption>La planète mère</figcaption>");
  });

  it("code coloré, bloc API testable, spoiler", () => {
    const html = md('```js\nconst a = "x"; // note\n```\n\n```api\nGET /api/health\nÉtat du serveur.\n```\n\n```api\nPOST /api/cosmic/action\nauth: player\n```\n\n:::spoiler Révéler\nSecret\n:::');
    expect(html).toContain('<span class="tk-k">const</span>');
    expect(html).toContain('<span class="tk-s">&quot;x&quot;</span>');
    expect(html).toContain('<span class="tk-c">// note</span>');
    expect(html).toContain('data-path="/api/health"');
    expect(html).toContain("Essayer la route");
    expect(html.split("Essayer la route").length).toBe(2);
    expect(html).toContain("Joueur connecté");
    expect(html).toContain("<details class=\"spoiler\"><summary>Révéler</summary>");
  });

  it("paragraphes, sauts de ligne, liens externes", () => {
    const html = md("ligne un  \nligne deux\nsuite\n\nvoir https://exemple.org et [doc](https://doc.org)");
    expect(html).toContain("ligne un<br>ligne deux suite");
    expect(html).toContain('<a href="https://exemple.org" target="_blank"');
    expect(html).toContain('<a href="https://doc.org" target="_blank" rel="noopener noreferrer">doc</a>');
  });
});

describe("devblog : outils", () => {
  it("slug, tags, lecture, extrait, recherche", () => {
    expect(slugify("Patch 5.7 : l'Été des Furets !")).toBe("patch-5-7-l-ete-des-furets");
    expect(normalizeTags("Équilibrage, PvP, pvp, Flottes")).toEqual(["equilibrage", "pvp", "flottes"]);
    expect(readingMinutes("mot ".repeat(660))).toBe(3);
    expect(excerptOf({ excerpt: "", body: "# Titre\n\nUn **texte** court." })).toBe("Titre Un texte court.");
    const p = (id: string, title: string) => ({ id, slug: id, title, excerpt: "", body: "", category: "notes", tags: [], coverUrl: "", status: "published" as const, publishedAtMs: 1, updatedAtMs: 1, pinned: false, version: "", authorUid: "", authorPseudo: "", authorAvatarUrl: "", authorRole: "" });
    expect(searchPosts([p("a", "Les Furets"), p("b", "Le Léviathan")], "léviathan").map((x) => x.id)).toEqual(["b"]);
  });
});
