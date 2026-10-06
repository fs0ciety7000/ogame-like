import type { CustomEmoji } from "@/game/emojis";
import { slugify } from "@/game/blog";

/* =====================================================
   v5.8 : markdown du devblog, écrit à la main (aucune dépendance) pour
   tourner pareil dans l'éditeur et dans PocketBase. Le HTML brut n'est
   jamais repris : tout le texte est échappé, les liens sont filtrés.

   Pris en charge :
   - titres # et ## (section), ### (sous-section), #### (intertitre), paragraphes, sauts de ligne (deux espaces ou « \ »)
   - **gras**, *italique*, ~~barré~~, ==surligné==, `code`, [[touche]]
   - liens, liens bruts, images (seule sur sa ligne → figure + légende)
   - listes à puces, numérotées, imbriquées, cases à cocher
   - citations et encadrés > [!NOTE] / [!TIP] / [!WARNING] / [!DANGER] / [!LORE]
   - tableaux avec alignement, séparateur ---
   - blocs de code colorés (js, ts, json, bash, http, css, html…)
   - ```api : route de l'API présentée en carte, testable en direct (GET publics)
   - :::spoiler Titre … ::: (bloc repliable), :::grid … ::: (galerie d'images)
   - emojis du jeu :code: et quelques raccourcis courants (:rocket:, :fire:…)
===================================================== */

export interface MarkdownOptions {
  /** Emojis personnalisés (jeu + équipe). */
  emojis?: CustomEmoji[];
  /** Préfixe des images locales « /assets/… » (adresse du jeu). */
  assetBase?: string;
}

export interface MarkdownHeading {
  level: number;
  id: string;
  text: string;
}

export interface MarkdownResult {
  html: string;
  headings: MarkdownHeading[];
}

const SHORTCODES: Record<string, string> = {
  rocket: "🚀", fire: "🔥", tada: "🎉", warning: "⚠️", star: "⭐", sparkles: "✨", heart: "❤️", check: "✅", x: "❌", eyes: "👀",
  wrench: "🔧", gear: "⚙️", trophy: "🏆", crown: "👑", skull: "💀", boom: "💥", shield: "🛡️", swords: "⚔️", gem: "💎", moneybag: "💰",
  chart: "📈", bug: "🐛", bulb: "💡", memo: "📝", megaphone: "📣", calendar: "📅", clock: "⏰", lock: "🔒", key: "🔑", gift: "🎁",
  planet: "🪐", satellite: "🛰️", ufo: "🛸", alien: "👽", thumbsup: "👍", thumbsdown: "👎", clap: "👏", wave: "👋", salute: "🫡", thinking: "🤔",
};

export function escapeHtml(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Adresse sûre : http(s), mailto, chemin relatif ou ancre. Sinon « # ». */
export function safeUrl(raw: string, assetBase = ""): string {
  const url = String(raw ?? "").trim();
  if (/^(https?:\/\/|mailto:)/i.test(url)) return url;
  if (url.startsWith("/assets/")) return `${assetBase}${url}`;
  if (url.startsWith("/") || url.startsWith("#") || url.startsWith("./")) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return "#";
  return url;
}

/* ---------- coloration du code ---------- */

const KEYWORDS: Record<string, string[]> = {
  js: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "of", "in", "new", "await", "async", "import", "from", "export", "default", "class", "extends", "try", "catch", "throw", "true", "false", "null", "undefined", "typeof", "this"],
  ts: ["interface", "type", "enum", "implements", "readonly", "as", "keyof", "public", "private"],
  bash: ["curl", "echo", "export", "if", "then", "fi", "for", "do", "done", "cd", "npm", "npx", "node", "git"],
  css: ["!important"],
};

const LANG_ALIASES: Record<string, string> = { javascript: "js", typescript: "ts", tsx: "ts", jsx: "js", sh: "bash", shell: "bash", zsh: "bash", jsonc: "json" };

/** Coloration minimale : commentaires, chaînes, nombres, mots-clés, méthodes HTTP. */
export function highlight(code: string, langRaw: string): string {
  const lang = LANG_ALIASES[langRaw] ?? langRaw;
  const words = new Set([...(KEYWORDS[lang] ?? []), ...(lang === "ts" ? KEYWORDS.js : [])]);
  const commentRe = lang === "bash" ? /#[^\n]*/y : lang === "css" || lang === "html" ? /\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/y : /\/\/[^\n]*|\/\*[\s\S]*?\*\//y;
  const rules: [RegExp, string][] = [
    [commentRe, "c"],
    [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/y, "s"],
    [/\b(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/y, "k"],
    [/-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/y, "n"],
    [/[A-Za-z_$][\w$-]*/y, "w"],
  ];
  if (lang === "" || lang === "text" || lang === "txt") return escapeHtml(code);
  let out = "";
  let i = 0;
  while (i < code.length) {
    let matched = false;
    for (const [re, kind] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (!m || m[0].length === 0) continue;
      const text = m[0];
      if (kind === "w") out += words.has(text) || (lang === "json" && (text === "true" || text === "false" || text === "null")) ? `<span class="tk-k">${escapeHtml(text)}</span>` : escapeHtml(text);
      else if (kind === "s" && lang === "json" && code.slice(i + text.length).match(/^\s*:/)) out += `<span class="tk-p">${escapeHtml(text)}</span>`;
      else out += `<span class="tk-${kind}">${escapeHtml(text)}</span>`;
      i += text.length;
      matched = true;
      break;
    }
    if (!matched) {
      out += escapeHtml(code[i]);
      i += 1;
    }
  }
  return out;
}

/* ---------- en ligne ---------- */

function renderInline(src: string, opts: MarkdownOptions): string {
  const emojis = new Map((opts.emojis ?? []).map((e) => [e.code, e]));
  const assetBase = opts.assetBase ?? "";
  // Code en ligne mis de côté avant tout le reste.
  const stash: string[] = [];
  const keep = (html: string) => `\uE000${stash.push(html) - 1}\uE000`;
  let s = src.replace(/`([^`\n]+)`/g, (_, code: string) => keep(`<code>${escapeHtml(code)}</code>`));
  // Images et liens (avant l'échappement, sur le texte brut).
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, alt: string, url: string, title?: string) =>
    keep(`<img src="${escapeHtml(safeUrl(url, assetBase))}" alt="${escapeHtml(alt)}"${title ? ` title="${escapeHtml(title)}"` : ""} loading="lazy">`),
  );
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, text: string, url: string) => {
    const href = safeUrl(url, assetBase);
    const ext = /^https?:\/\//i.test(href);
    return keep(`<a href="${escapeHtml(href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${renderInline(text, opts)}</a>`);
  });
  s = s.replace(/<(https?:\/\/[^>\s]+)>/g, (_, url: string) => keep(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`));
  s = escapeHtml(s);
  // Liens bruts restants.
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:!?])/g, (_, pre: string, url: string) => `${pre}<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
  s = s
    .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+?)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<em>$2</em>")
    .replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!\w)/g, "$1<em>$2</em>")
    .replace(/~~([^~]+?)~~/g, "<del>$1</del>")
    .replace(/==([^=]+?)==/g, "<mark>$1</mark>")
    .replace(/\[\[([^\]]{1,20})\]\]/g, "<kbd>$1</kbd>");
  s = s.replace(/:([a-z0-9_+-]{2,24}):/g, (all, code: string) => {
    const e = emojis.get(code);
    if (e) return `<img class="emoji" src="${escapeHtml(safeUrl(e.url, assetBase))}" alt=":${code}:" title="${escapeHtml(e.label ?? code)}">`;
    return SHORTCODES[code] ?? all;
  });
  return s.replace(/\uE000(\d+)\uE000/g, (_, i: string) => stash[Number(i)]);
}

/* ---------- blocs ---------- */

const CALLOUTS: Record<string, { label: string; icon: string }> = {
  note: { label: "Note", icon: "ℹ️" },
  info: { label: "Info", icon: "ℹ️" },
  tip: { label: "Astuce", icon: "💡" },
  warning: { label: "Attention", icon: "⚠️" },
  danger: { label: "Danger", icon: "🚨" },
  important: { label: "Important", icon: "❗" },
  lore: { label: "Archives", icon: "📜" },
};

/** Carte « route de l'API » : 1re ligne « GET /api/… », puis « auth: … » et une description. */
function renderApi(code: string, opts: MarkdownOptions): string {
  const lines = code.split("\n");
  const head = (lines.shift() ?? "").trim();
  const m = /^(GET|POST|PUT|PATCH|DELETE)\s+(\S+)/i.exec(head);
  if (!m) return `<pre class="code"><code>${escapeHtml(code)}</code></pre>`;
  const method = m[1].toUpperCase();
  const path = m[2];
  let auth = "public";
  const desc: string[] = [];
  const body: string[] = [];
  let inBody = false;
  for (const line of lines) {
    const a = /^auth:\s*(\w+)/i.exec(line.trim());
    if (a && !inBody) auth = a[1].toLowerCase();
    else if (/^body:\s*$/i.test(line.trim())) inBody = true;
    else if (inBody) body.push(line);
    else if (line.trim()) desc.push(line.trim());
  }
  const authLabel = auth === "admin" ? "Administrateur" : auth === "player" || auth === "joueur" ? "Joueur connecté" : "Public";
  const tryable = method === "GET" && auth === "public" && path.startsWith("/api/");
  return `<div class="api-card" data-method="${method}" data-path="${escapeHtml(path)}">
<div class="api-head"><span class="api-method api-${method.toLowerCase()}">${method}</span><code class="api-path">${escapeHtml(path)}</code><span class="api-auth api-auth-${auth === "public" ? "public" : "private"}">${authLabel}</span></div>
${desc.length ? `<p class="api-desc">${renderInline(desc.join(" "), opts)}</p>` : ""}${body.length ? `<pre class="code api-body"><code>${highlight(body.join("\n"), "json")}</code></pre>` : ""}${tryable ? `<div class="api-try"><button type="button" class="api-run">Essayer la route</button><span class="api-status"></span></div><pre class="code api-out" hidden><code></code></pre>` : ""}
</div>`;
}

interface ListItem {
  text: string[];
  checked: boolean | null;
  children: string[];
}

function renderList(lines: string[], opts: MarkdownOptions, headings: MarkdownHeading[]): string {
  const ordered = /^\s*\d+[.)]\s/.test(lines[0]);
  const startN = ordered ? Number(/^\s*(\d+)/.exec(lines[0])![1]) : 1;
  const baseIndent = /^\s*/.exec(lines[0])![0].length;
  const items: ListItem[] = [];
  for (const line of lines) {
    const indent = /^\s*/.exec(line)![0].length;
    const m = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (m && indent <= baseIndent + 1) {
      const task = /^\[([ xX])\]\s+(.*)$/.exec(m[1]);
      items.push({ text: [task ? task[2] : m[1]], checked: task ? task[1].toLowerCase() === "x" : null, children: [] });
    } else if (items.length > 0) {
      if (indent > baseIndent + 1) items[items.length - 1].children.push(line);
      else items[items.length - 1].text.push(line.trim());
    }
  }
  const tag = ordered ? "ol" : "ul";
  const hasTasks = items.some((i) => i.checked !== null);
  const lis = items
    .map((it) => {
      const box = it.checked === null ? "" : `<span class="task${it.checked ? " done" : ""}" aria-hidden="true">${it.checked ? "✓" : ""}</span>`;
      const nested = it.children.length ? renderBlocks(it.children.map((l) => l.slice(Math.min(/^\s*/.exec(l)![0].length, baseIndent + 2))), opts, headings) : "";
      return `<li${it.checked !== null ? ' class="task-item"' : ""}>${box}${renderInline(it.text.join(" "), opts)}${nested}</li>`;
    })
    .join("");
  return `<${tag}${ordered && startN !== 1 ? ` start="${startN}"` : ""}${hasTasks ? ' class="tasks"' : ""}>${lis}</${tag}>`;
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

function renderTable(lines: string[], opts: MarkdownOptions): string {
  const head = splitRow(lines[0]);
  const aligns = splitRow(lines[1]).map((c) => (/^:-+:$/.test(c) ? "center" : /^-+:$/.test(c) ? "right" : /^:-+$/.test(c) ? "left" : ""));
  const cell = (tag: string, text: string, i: number) => `<${tag}${aligns[i] ? ` style="text-align:${aligns[i]}"` : ""}>${renderInline(text, opts)}</${tag}>`;
  const rows = lines.slice(2).map((l) => `<tr>${splitRow(l).map((c, i) => cell("td", c, i)).join("")}</tr>`).join("");
  return `<div class="table-wrap"><table><thead><tr>${head.map((c, i) => cell("th", c, i)).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function uniqueId(base: string, headings: MarkdownHeading[]): string {
  const id = base || "section";
  let n = 1;
  let out = id;
  while (headings.some((h) => h.id === out)) out = `${id}-${++n}`;
  return out;
}

const isBlank = (l: string) => l.trim() === "";
const isFence = (l: string) => /^\s{0,3}(```|~~~)/.test(l);
const isHeading = (l: string) => /^\s{0,3}#{1,6}\s/.test(l);
const isHr = (l: string) => /^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(l);
const isQuote = (l: string) => /^\s{0,3}>/.test(l);
const isListItem = (l: string) => /^\s*(?:[-*+]|\d+[.)])\s+/.test(l);
const isTableSep = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) && l.includes("-");
const isDirective = (l: string) => /^\s*:::/.test(l);

function renderBlocks(lines: string[], opts: MarkdownOptions, headings: MarkdownHeading[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) {
      i++;
      continue;
    }
    // Bloc de code.
    if (isFence(line)) {
      const fence = /^\s*(```|~~~)/.exec(line)![1];
      const lang = line.trim().slice(3).trim().toLowerCase();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) code.push(lines[i++]);
      i++;
      const text = code.join("\n");
      if (lang === "api") out.push(renderApi(text, opts));
      else out.push(`<div class="code-block">${lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : ""}<button type="button" class="code-copy" aria-label="Copier le code">Copier</button><pre class="code"><code>${highlight(text, lang)}</code></pre></div>`);
      continue;
    }
    // Directives :::spoiler / :::grid.
    if (isDirective(line)) {
      const head = line.trim().slice(3).trim();
      const inner: string[] = [];
      i++;
      let depth = 1;
      while (i < lines.length) {
        if (isDirective(lines[i])) {
          if (lines[i].trim() === ":::") depth--;
          else depth++;
          if (depth === 0) break;
        }
        inner.push(lines[i++]);
      }
      i++;
      const [kind, ...rest] = head.split(/\s+/);
      const content = renderBlocks(inner, opts, headings);
      if (kind === "grid") out.push(`<div class="md-grid">${content}</div>`);
      else out.push(`<details class="spoiler"><summary>${renderInline(rest.join(" ") || "Afficher", opts)}</summary><div class="spoiler-body">${content}</div></details>`);
      continue;
    }
    if (isHeading(line)) {
      const m = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line)!;
      const level = Math.min(4, Math.max(2, m[1].length));
      const text = m[2];
      const id = uniqueId(slugify(text), headings);
      headings.push({ level, id, text: text.replace(/[*_`~=]/g, "") });
      out.push(`<h${level} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${renderInline(text, opts)}</h${level}>`);
      i++;
      continue;
    }
    if (isHr(line)) {
      out.push("<hr>");
      i++;
      continue;
    }
    if (isQuote(line)) {
      const inner: string[] = [];
      while (i < lines.length && isQuote(lines[i])) inner.push(lines[i++].replace(/^\s{0,3}>\s?/, ""));
      const callout = /^\[!(\w+)\]\s*(.*)$/.exec(inner[0]?.trim() ?? "");
      if (callout && CALLOUTS[callout[1].toLowerCase()]) {
        const type = callout[1].toLowerCase();
        const c = CALLOUTS[type];
        const title = callout[2] || c.label;
        out.push(`<aside class="callout callout-${type}"><p class="callout-title"><span aria-hidden="true">${c.icon}</span> ${renderInline(title, opts)}</p>${renderBlocks(inner.slice(1), opts, headings)}</aside>`);
      } else out.push(`<blockquote>${renderBlocks(inner, opts, headings)}</blockquote>`);
      continue;
    }
    if (isListItem(line)) {
      const block: string[] = [];
      while (i < lines.length && (isListItem(lines[i]) || (!isBlank(lines[i]) && /^\s+/.test(lines[i])) || (isBlank(lines[i]) && i + 1 < lines.length && /^\s+(?:[-*+]|\d+[.)])\s/.test(lines[i + 1])))) {
        if (!isBlank(lines[i])) block.push(lines[i]);
        i++;
      }
      out.push(renderList(block, opts, headings));
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const block = [lines[i], lines[i + 1]];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && !isBlank(lines[i])) block.push(lines[i++]);
      out.push(renderTable(block, opts));
      continue;
    }
    // Image seule : figure avec légende (titre, sinon texte alternatif).
    const fig = /^\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/.exec(line);
    if (fig) {
      const caption = fig[3] || fig[1];
      // 5.24 : une vidéo (.mp4, .webm) s'écrit comme une image ; le texte alternatif sert de libellé.
      if (/\.(mp4|webm)(\?.*)?$/i.test(fig[2])) {
        out.push(`<figure><video src="${escapeHtml(safeUrl(fig[2], opts.assetBase))}" controls playsinline preload="metadata" aria-label="${escapeHtml(fig[1])}"></video>${caption ? `<figcaption>${renderInline(caption, opts)}</figcaption>` : ""}</figure>`);
        i++;
        continue;
      }
      out.push(`<figure><img src="${escapeHtml(safeUrl(fig[2], opts.assetBase))}" alt="${escapeHtml(fig[1])}" loading="lazy">${caption ? `<figcaption>${renderInline(caption, opts)}</figcaption>` : ""}</figure>`);
      i++;
      continue;
    }
    // Paragraphe.
    const para: string[] = [];
    while (i < lines.length && !isBlank(lines[i]) && !isFence(lines[i]) && !isHeading(lines[i]) && !isQuote(lines[i]) && !isListItem(lines[i]) && !isHr(lines[i]) && !isDirective(lines[i]) && !(lines[i].includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1]))) para.push(lines[i++]);
    const html = para.map((l, k) => renderInline(l.replace(/(\s{2,}|\\)$/, ""), opts) + (k < para.length - 1 ? (/(\s{2,}|\\)$/.test(l) ? "<br>" : " ") : "")).join("");
    out.push(`<p>${html}</p>`);
  }
  return out.join("\n");
}

export function renderMarkdown(markdown: string, opts: MarkdownOptions = {}): MarkdownResult {
  const headings: MarkdownHeading[] = [];
  const lines = String(markdown ?? "").replace(/\r\n?/g, "\n").replace(/\t/g, "  ").split("\n");
  return { html: renderBlocks(lines, opts, headings), headings };
}
