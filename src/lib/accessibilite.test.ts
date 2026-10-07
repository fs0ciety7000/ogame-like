import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/* 6.14.68 (UX-7, AD-11, AD-19, AD-26) : un bouton ou un onglet qui n'affiche qu'une icône a un
   nom (aria-label) ; le title seul ne s'affiche pas au toucher et n'est pas lu partout. Et les
   cibles tactiles s'étendent à 44 px sur écran tactile seulement (DESIGN.md, Q-AD-5). */

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : name.endsWith(".tsx") && !name.includes(".test.") ? [path] : [];
  });
}

/** Balise ouvrante d'un bouton ou d'un onglet (attributs JSX sur plusieurs lignes, accolades imbriquées). */
const OPEN_TAG = /<(button|Button|TabsTrigger|motion\.button)\b((?:[^>"'{}]|"[^"]*"|'[^']*'|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*?)(\/?)>/g;
/** Composants d'icône du projet (en plus des icônes importées de lucide-react). */
const PROJECT_ICONS = ["ResourceIcon", "GameIcon", "EmojiIcon", "TokenIcon"];

function lucideNames(src: string): Set<string> {
  const names = new Set(PROJECT_ICONS);
  const m = /import\s*\{([^}]*)\}\s*from\s*"lucide-react"/.exec(src);
  if (m) for (const part of m[1].split(",")) names.add(part.trim().split(/\s+as\s+/).pop() ?? "");
  return names;
}

/** Liste « fichier:ligne » des boutons à icône seule sans aria-label. */
function iconOnlyWithoutLabel(file: string, src: string): string[] {
  const icons = lucideNames(src);
  const isIcon = (el: string) => {
    const m = /^<([A-Z][\w.]*)\b[^<>]*\/>$/.exec(el.trim());
    return !!m && icons.has(m[1]);
  };
  const out: string[] = [];
  OPEN_TAG.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = OPEN_TAG.exec(src))) {
    const [all, tag, attrs, selfClosing] = m;
    if (selfClosing || /aria-label(ledby)?=/.test(attrs) || /\{\.\.\./.test(attrs) || /\basChild\b/.test(attrs)) continue;
    const close = src.indexOf(`</${tag}>`, m.index + all.length);
    if (close < 0) continue;
    const body = src.slice(m.index + all.length, close).trim();
    const ternary = /^\{[^{}<>]*\?\s*(<[A-Z][^<>]*\/>)\s*:\s*(<[A-Z][^<>]*\/>)\s*\}$/.exec(body);
    if (isIcon(body) || (ternary && isIcon(ternary[1]) && isIcon(ternary[2]))) out.push(`${file}:${src.slice(0, m.index).split("\n").length}`);
  }
  return out;
}

/* Exceptions comptées (cliquet : le nombre ne peut que baisser). Le panel admin (outil de bureau) et
   les Réglages, modifiés par une autre tâche pendant le lot, sont à reprendre (fiche 6.14.68, Suites). */
const ALLOWED: Record<string, number> = {
  "src/pages/SettingsPage.tsx": 2,
  "src/pages/admin/AnnouncementsPanel.tsx": 3,
  "src/pages/admin/BackupsCard.tsx": 1,
  "src/pages/admin/BannersPanel.tsx": 1,
  "src/pages/admin/CasinoAdmin.tsx": 1,
  "src/pages/admin/ChatModerationPanel.tsx": 1,
  "src/pages/admin/PassPanel.tsx": 2,
  "src/pages/admin/PassSeasonsPanel.tsx": 3,
  "src/pages/admin/TechEffectsEditor.tsx": 3,
  "src/pages/admin/WorldBossesPanel.tsx": 1,
  "src/pages/admin/eventsFields.tsx": 1,
  "src/pages/admin/fields.tsx": 1,
  "src/pages/admin/panels.tsx": 1,
};

describe("accessibilité (UX-7)", () => {
  it("le balayage repère un bouton à icône seule sans nom, et accepte un aria-label", () => {
    const src = `import { Loader2, Mail, X } from "lucide-react";\n<Button size="sm" onClick={go}>\n  <Mail className="h-3.5 w-3.5" />\n</Button>\n<button type="button" aria-label="Fermer"><X /></button>\n<Button>{busy ? <Loader2 /> : <Mail />}</Button>\n<Button><Mail /> Écrire</Button>`;
    expect(iconOnlyWithoutLabel("x.tsx", src)).toEqual(["x.tsx:2", "x.tsx:6"]);
  });

  it("aucun bouton ni onglet à icône seule sans aria-label (src/components, src/pages)", () => {
    const counts: Record<string, number> = {};
    for (const file of [...files("src/components"), ...files("src/pages")]) {
      const found = iconOnlyWithoutLabel(file, readFileSync(file, "utf8"));
      if (found.length) counts[file.replace(/\\/g, "/")] = found.length;
    }
    const over = Object.entries(counts).filter(([f, n]) => n > (ALLOWED[f] ?? 0));
    expect(over).toEqual([]);
  });

  it("Button, TabsTrigger et HudChip cliquable portent la zone sensible hud-hit", () => {
    expect(readFileSync("src/components/ui/button.tsx", "utf8")).toMatch(/"hud-cut hud-hit /);
    expect(readFileSync("src/components/ui/tabs.tsx", "utf8")).toMatch(/"hud-hit shrink-0/);
    expect(readFileSync("src/components/ui/hud.tsx", "utf8")).toMatch(/"hud-chip-action hud-hit"/);
  });

  it("la zone sensible n'existe que sur écran tactile (rien ne bouge à la souris)", () => {
    const css = readFileSync("src/index.css", "utf8");
    const start = css.indexOf("6.14.68 (UX-7, Q-AD-5)");
    expect(start).toBeGreaterThan(0);
    // Hors du bloc UX-7, aucune règle .hud-hit ; dans le bloc, chaque règle est sous (pointer: coarse).
    const noComments = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(noComments(css.slice(0, start))).not.toMatch(/\.hud-hit/);
    const block = noComments(css.slice(css.indexOf("*/", start) + 2));
    const coarse = block.split("@media (pointer: coarse)").slice(1).join("");
    const outside = block.split("@media (pointer: coarse)")[0];
    expect(outside).not.toMatch(/\.hud-hit[^-\w]/);
    expect(coarse).toMatch(/\.hud-hit::before\s*\{[^}]*content: ""/);
    expect(coarse).toMatch(/50% - 22px/);
  });

  it("les icônes de l'en-tête font 44 px sur écran tactile et ont un nom", () => {
    const shell = readFileSync("src/components/layout/AppShell.tsx", "utf8");
    expect(shell).toMatch(/pointer-coarse:h-11 pointer-coarse:w-11/);
    expect(shell).toMatch(/title=\{title\} aria-label=\{title\}/);
    expect(readFileSync("src/components/layout/NotificationBell.tsx", "utf8")).toMatch(/pointer-coarse:h-11 pointer-coarse:w-11/);
  });
});
