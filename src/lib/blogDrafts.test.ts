import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { parseBlogDraft } from "./blogDrafts";
import { BLOG_CATEGORIES } from "@/game/blog";

describe("parseBlogDraft", () => {
  it("reads the front matter and the body", () => {
    const d = parseBlogDraft("x.md", `---\nslug: mon-article\ntitle: "Titre : avec deux-points"\ntags: [a, "b c"]\npinned: true\ncover: /assets/x.webp\n---\nCorps **gras**\n`);
    expect(d).toMatchObject({ slug: "mon-article", title: "Titre : avec deux-points", tags: ["a", "b c"], pinned: true, cover: "/assets/x.webp", category: "annonces", body: "Corps **gras**" });
  });

  it("keeps every bundled article valid", () => {
    const dir = "content/blog";
    const slugs = new Set<string>();
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".md"))) {
      const d = parseBlogDraft(f, readFileSync(`${dir}/${f}`, "utf8"));
      expect(d.slug, f).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      // Limites du schéma blog_posts.
      expect(d.slug.length, f).toBeLessThanOrEqual(80);
      expect(d.title.length, f).toBeLessThanOrEqual(140);
      expect(d.excerpt.length, f).toBeLessThanOrEqual(300);
      expect(d.title.length, f).toBeGreaterThan(5);
      expect(d.excerpt.length, f).toBeGreaterThan(20);
      expect(BLOG_CATEGORIES.some((c) => c.id === d.category), f).toBe(true);
      expect(d.body.length, f).toBeGreaterThan(200);
      expect(slugs.has(d.slug), f).toBe(false);
      slugs.add(d.slug);
    }
  });
});
