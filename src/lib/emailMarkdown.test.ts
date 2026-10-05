import { describe, expect, it } from "vitest";
import { EMAIL_MARKDOWN_TEMPLATE, markdownToEmail, parseFrontmatter } from "@/lib/emailMarkdown";

describe("campagne e-mail en Markdown (5.15.14)", () => {
  it("lit l'en-tête : objet, expéditeur, libellé, image", () => {
    const { meta, body } = parseFrontmatter("---\nsubject: Bonjour\nfrom: Thomas\ntag: Info\nimage: /assets/email/x.jpg\n---\n# Titre");
    expect(meta).toMatchObject({ subject: "Bonjour", from: "Thomas", tag: "Info", image: "/assets/email/x.jpg" });
    expect(body.trim()).toBe("# Titre");
  });

  it("produit le HTML habillé et la version texte, avec pseudo et désinscription", () => {
    const out = markdownToEmail(EMAIL_MARKDOWN_TEMPLATE);
    expect(out.html).toContain("COSMIC EMPIRES");
    expect(out.html).toContain("{{PSEUDO}}");
    expect(out.html).toContain("{{UNSUBSCRIBE_URL}}");
    expect(out.html).toContain("https://empire.fs0ciety.org/assets/email/demenagement.jpg");
    expect(out.text).toContain("Rejoindre mon empire : https://empire.fs0ciety.org");
    expect(out.text).not.toContain("**");
  });

  it("échappe le HTML et neutralise les liens dangereux", () => {
    const out = markdownToEmail("<script>x</script> [clic](javascript:alert(1))");
    expect(out.html).not.toContain("<script>");
    expect(out.html).not.toContain("javascript:");
  });
});
