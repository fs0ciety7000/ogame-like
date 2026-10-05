import { escapeHtml } from "@/game/blogMarkdown";

/* 5.15.14 : campagne e-mail écrite en Markdown (déposée en .md ou tapée dans
   l'administration). Le texte devient le même e-mail que les campagnes
   maison : tableaux de 600 px, styles en ligne, couleurs du jeu (les boîtes
   mail ignorent les feuilles de style), plus une version texte de secours.

   En-tête facultatif :
     ---
     subject: Objet de l'e-mail
     from: Thomas & Nicolas · Cosmic Empires
     title: Nom dans la liste des campagnes
     tag: MISE À JOUR            (petit libellé en haut à droite)
     image: /assets/email/demenagement.jpg   (bannière, JPG ou PNG)
     ---

   Corps : # titre, ## intertitre, paragraphes, **gras**, *italique*, [lien](url),
   listes (- ou 1.), > encadré, --- séparateur, ![texte](image),
   [[Libellé du bouton|https://…]] pour un bouton. {{PSEUDO}} est remplacé
   par le pseudo de chaque joueur. */

export const EMAIL_SITE = "https://empire.fs0ciety.org";

const C = {
  page: "#03040a",
  card: "#05070f",
  line: "#12324a",
  text: "#cbd5e1",
  muted: "#94a3b8",
  white: "#ffffff",
  cyan: "#4be8ff",
  gold: "#ffd86b",
  mint: "#5cf2b0",
  box: "#0a0e1c",
};
const DISPLAY = "'Chakra Petch',Arial,sans-serif";
const BODY = "'Saira',Arial,sans-serif";
const MONO = "'Courier New',monospace";

export interface EmailMeta {
  subject?: string;
  from?: string;
  title?: string;
  tag?: string;
  image?: string;
}

export interface EmailDraft {
  meta: EmailMeta;
  html: string;
  text: string;
}

/** Sépare l'en-tête `---` (clé: valeur) du corps. */
export function parseFrontmatter(md: string): { meta: EmailMeta; body: string } {
  const src = md.replace(/\r\n?/g, "\n");
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  if (!m) return { meta: {}, body: src };
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = /^\s*([A-Za-z]+)\s*:\s*(.*)$/.exec(line);
    if (kv) meta[kv[1].toLowerCase()] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return { meta: { subject: meta.subject, from: meta.from ?? meta.fromname, title: meta.title, tag: meta.tag, image: meta.image }, body: src.slice(m[0].length) };
}

/** URL absolue (les images et liens relatifs pointent vers le jeu) ; rien d'exécutable. */
function absUrl(raw: string): string {
  const u = raw.trim();
  if (u === "{{UNSUBSCRIBE_URL}}") return u;
  if (/^(https?:|mailto:)/i.test(u)) return u;
  if (u.startsWith("/")) return EMAIL_SITE + u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return "#";
  return `${EMAIL_SITE}/${u}`;
}
const attr = (s: string) => escapeHtml(s).replace(/"/g, "&quot;");

function inline(raw: string): string {
  let s = escapeHtml(raw);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt: string, url: string) => `<img src="${attr(absUrl(url))}" alt="${alt}" style="max-width:100%;height:auto;border:0;">`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, url: string) => `<a href="${attr(absUrl(url))}" style="color:${C.cyan};text-decoration:underline;">${label}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${C.white};">$1</strong>`);
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  s = s.replace(/`([^`]+)`/g, `<span style="font-family:${MONO};color:${C.gold};">$1</span>`);
  return s;
}

function plain(raw: string): string {
  return raw
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, l: string, u: string) => `${l} (${absUrl(u)})`)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1");
}

const row = (inner: string, pad = "0 32px 18px 32px") => `<tr><td class="px" style="padding:${pad};font-family:${BODY};">${inner}</td></tr>`;
const P = `margin:0;font-size:16px;line-height:26px;color:${C.text};`;

type Block = { kind: "h1" | "h2" | "p" | "quote"; text: string } | { kind: "ul" | "ol"; items: string[] } | { kind: "hr" } | { kind: "button"; label: string; url: string } | { kind: "img"; alt: string; url: string };

function blocks(body: string): Block[] {
  const out: Block[] = [];
  const lines = body.split("\n");
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push({ kind: "p", text: para.join(" ") });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const t = line.trim();
    if (!t) {
      flush();
      continue;
    }
    let m: RegExpExecArray | null;
    if ((m = /^\[\[([^|\]]+)\|([^\]]+)\]\]$/.exec(t))) {
      flush();
      out.push({ kind: "button", label: m[1].trim(), url: m[2].trim() });
    } else if ((m = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(t))) {
      flush();
      out.push({ kind: "img", alt: m[1], url: m[2] });
    } else if ((m = /^(#{1,3})\s+(.*)$/.exec(t))) {
      flush();
      out.push({ kind: m[1].length === 1 ? "h1" : "h2", text: m[2] });
    } else if (/^(-{3,}|\*{3,})$/.test(t)) {
      flush();
      out.push({ kind: "hr" });
    } else if (t.startsWith(">")) {
      flush();
      const q = [t.replace(/^>\s?/, "")];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith(">")) q.push(lines[++i].trim().replace(/^>\s?/, ""));
      out.push({ kind: "quote", text: q.join(" ") });
    } else if (/^([-*+]|\d+[.)])\s+/.test(t)) {
      flush();
      const ordered = /^\d/.test(t);
      const items = [t.replace(/^([-*+]|\d+[.)])\s+/, "")];
      while (i + 1 < lines.length && /^([-*+]|\d+[.)])\s+/.test(lines[i + 1].trim())) items.push(lines[++i].trim().replace(/^([-*+]|\d+[.)])\s+/, ""));
      out.push({ kind: ordered ? "ol" : "ul", items });
    } else para.push(t);
  }
  flush();
  return out;
}

function blockHtml(b: Block): string {
  switch (b.kind) {
    case "h1":
      return row(`<h1 class="h1" style="margin:0;font-family:${DISPLAY};font-size:32px;line-height:38px;font-weight:700;color:${C.white};">${inline(b.text)}</h1>`, "8px 32px 16px 32px");
    case "h2":
      return row(`<div style="font-family:${MONO};font-size:12px;letter-spacing:3px;color:${C.cyan};text-transform:uppercase;">◆ ${inline(b.text)}</div>`, "10px 32px 10px 32px");
    case "p":
      return row(`<p style="${P}">${inline(b.text)}</p>`);
    case "quote":
      return row(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.box};border-left:3px solid ${C.mint};"><tr><td style="padding:16px 20px;font-family:${BODY};font-size:15px;line-height:24px;color:${C.text};">${inline(b.text)}</td></tr></table>`,
      );
    case "ul":
    case "ol":
      return row(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${b.items
          .map(
            (it, k) =>
              `<tr><td width="28" valign="top" style="padding:4px 0;font-family:${DISPLAY};font-size:14px;font-weight:700;color:${C.cyan};">${b.kind === "ol" ? `${k + 1}.` : "◆"}</td><td valign="top" style="padding:4px 0;font-family:${BODY};font-size:16px;line-height:24px;color:${C.text};">${inline(it)}</td></tr>`,
          )
          .join("")}</table>`,
      );
    case "hr":
      return row(`<div style="height:1px;line-height:1px;font-size:1px;background:${C.line};">&nbsp;</div>`, "8px 32px 22px 32px");
    case "button":
      return row(
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:${C.cyan};"><a href="${attr(absUrl(b.url))}" style="display:inline-block;padding:14px 28px;font-family:${DISPLAY};font-size:14px;font-weight:700;letter-spacing:3px;color:${C.page};text-decoration:none;text-transform:uppercase;">${escapeHtml(b.label)} →</a></td></tr></table>`,
        "6px 32px 26px 32px",
      );
    case "img":
      return row(`<img src="${attr(absUrl(b.url))}" width="536" alt="${attr(b.alt)}" style="display:block;width:100%;max-width:536px;height:auto;border:0;">`);
  }
}

function blockText(b: Block): string {
  switch (b.kind) {
    case "h1":
      return `${plain(b.text).toUpperCase()}\n`;
    case "h2":
      return `◆ ${plain(b.text).toUpperCase()}`;
    case "p":
      return plain(b.text);
    case "quote":
      return `> ${plain(b.text)}`;
    case "ul":
    case "ol":
      return b.items.map((it, k) => `${b.kind === "ol" ? `${k + 1}.` : "-"} ${plain(it)}`).join("\n");
    case "hr":
      return "----";
    case "button":
      return `${b.label} : ${absUrl(b.url)}`;
    case "img":
      return "";
  }
}

/** Markdown → e-mail HTML (habillage du jeu) + version texte. */
export function markdownToEmail(md: string): EmailDraft {
  const { meta, body } = parseFrontmatter(md);
  const list = blocks(body);
  const tag = meta.tag ? escapeHtml(meta.tag.toUpperCase()) : "";
  const banner = meta.image
    ? `<tr><td style="background:${C.card};"><a href="${EMAIL_SITE}"><img src="${attr(absUrl(meta.image))}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></a></td></tr>`
    : "";
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">
<title>${escapeHtml(meta.subject ?? "Cosmic Empires")}</title>
<style>@media (max-width:620px){.container{width:100%!important}.px{padding-left:20px!important;padding-right:20px!important}.h1{font-size:26px!important;line-height:32px!important}.hide-mobile{display:none!important}}</style>
</head><body style="margin:0;padding:0;background:${C.page};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};"><tr><td align="center" style="padding:24px 0;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:${C.card};border:1px solid ${C.line};">
<tr><td class="px" style="padding:22px 32px;border-bottom:1px solid ${C.line};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="56" valign="middle"><img src="${EMAIL_SITE}/assets/email/logo.png" width="48" height="48" alt="Cosmic Empires" style="display:block;border:0;"></td>
<td valign="middle" style="font-family:${DISPLAY};"><div style="font-size:20px;font-weight:700;letter-spacing:3px;color:${C.white};">COSMIC EMPIRES</div><div style="font-family:${MONO};font-size:10px;letter-spacing:3px;color:${C.cyan};">TRANSMISSION DU COMMANDEMENT</div></td>
${tag ? `<td align="right" valign="middle" class="hide-mobile" style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:${C.gold};">${tag}</td>` : ""}
</tr></table></td></tr>
${banner}
<tr><td style="height:22px;line-height:22px;font-size:1px;">&nbsp;</td></tr>
${list.map(blockHtml).join("\n")}
<tr><td class="px" style="padding:18px 32px 26px 32px;border-top:1px solid ${C.line};font-family:${BODY};font-size:12px;line-height:19px;color:${C.muted};">
Vous recevez cet e-mail parce que vous jouez à Cosmic Empires, commandant {{PSEUDO}}.<br>
<a href="${EMAIL_SITE}" style="color:${C.cyan};">Rejoindre le jeu</a> · <a href="{{UNSUBSCRIBE_URL}}" style="color:${C.muted};">Ne plus recevoir ces e-mails</a>
</td></tr>
</table></td></tr></table>
</body></html>`;
  const text = [
    "COSMIC EMPIRES · TRANSMISSION DU COMMANDEMENT",
    "",
    ...list.map(blockText).filter((t) => t !== ""),
    "",
    "----",
    `Rejoindre le jeu : ${EMAIL_SITE}`,
    "Ne plus recevoir ces e-mails : {{UNSUBSCRIBE_URL}}",
  ].join("\n\n").replace(/\n{3,}/g, "\n\n");
  return { meta, html, text };
}

/** Modèle proposé quand on écrit une campagne de zéro. */
export const EMAIL_MARKDOWN_TEMPLATE = `---
subject: Du nouveau dans le secteur, commandant
from: Thomas & Nicolas · Cosmic Empires
tag: Mise à jour
image: /assets/email/demenagement.jpg
---

# Du nouveau dans le secteur

Commandant **{{PSEUDO}}**,

Voici ce qui change cette semaine dans Cosmic Empires.

## Les nouveautés

- **Première nouveauté** : ce qu'elle apporte.
- **Deuxième nouveauté** : ce qu'elle apporte.

> Astuce : un encadré pour mettre une information en avant.

[[Rejoindre mon empire|https://empire.fs0ciety.org]]

On se retrouve dans le secteur.

**Thomas & Nicolas**
`;
