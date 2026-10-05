import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/* Design system (docs/DESIGN.md) : les pastilles et encadrés passent par
   HudChip / HudCallout (coins coupés, capitales mono, ton sémantique).
   Garde-fou contre les pilules arrondies écrites à la main. */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : name.endsWith(".tsx") ? [path] : [];
  });
}

describe("design system", () => {
  it("aucune pastille ni encadré arrondi écrit à la main", () => {
    const offenders: string[] = [];
    for (const file of files("src")) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          // Bordure + arrondi lg/md/xl : pastille (px/py) ou encadré (p-*) hors primitives.
          if (/rounded-(?:md|lg|xl)\b[^"`]*\bborder\b(?!-)[^"`]*\b(?:px-|p-)\d/.test(line) || /\bborder\b(?!-)[^"`]*rounded-(?:md|lg|xl)\b[^"`]*\b(?:px-|p-)\d/.test(line)) {
            offenders.push(`${file}:${i + 1}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  it("aucune couleur hex écrite dans un composant (jetons du thème)", () => {
    // Scènes dessinées (planète, boss, nébuleuse, étoiles, vue cockpit), rapport imprimé,
    // logo Google et aperçu d'e-mail : couleurs d'illustration ou de marque, hors thème.
    const allowed = /(HomePlanet|BossStage|ParallaxStars|CockpitViewport|StatsPrintReport|AltSignIn|MailPanel)\.tsx$/;
    const offenders: string[] = [];
    for (const file of files("src")) {
      if (allowed.test(file) || file.includes(".test.")) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?=["'`;,) \]])/.test(line)) offenders.push(`${file}:${i + 1}`);
        });
    }
    expect(offenders).toEqual([]);
  });

  it("aucune boîte native du navigateur (confirm, alert, prompt) : askConfirm", () => {
    // 5.15 : la boîte grise du navigateur sort du thème ; ConfirmHost la remplace.
    const offenders: string[] = [];
    for (const file of files("src")) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/(?:^|[^\w.])(?:window\.)?(?:confirm|alert|prompt)\(/.test(line)) offenders.push(`${file}:${i + 1}`);
        });
    }
    expect(offenders).toEqual([]);
  });

  /** Lignes de .tsx (tests exclus) qui vérifient `bad`, hors `allow`. */
  function scan(bad: (line: string) => boolean, allow: RegExp = /$^/): string[] {
    const offenders: string[] = [];
    for (const file of files("src")) {
      if (file.includes(".test.") || allow.test(file)) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (bad(line)) offenders.push(`${file}:${i + 1}`);
        });
    }
    return offenders;
  }

  it("5.16 : aucune couleur Tailwind hors thème (red-400, violet-300…) : jetons du thème", () => {
    const palette = /\b(?:bg|text|border|from|to|via|ring|fill|stroke|outline|accent|decoration)-(?:red|amber|emerald|green|blue|sky|indigo|purple|pink|orange|yellow|teal|rose|zinc|gray|neutral|stone|lime|fuchsia|violet|cyan)-\d{2,3}\b/;
    expect(scan((l) => palette.test(l))).toEqual([]);
  });

  it("5.15 : ni gros arrondis ni ombres lourdes (coins coupés : hud-cut)", () => {
    expect(scan((l) => /\brounded-(?:2xl|3xl)\b/.test(l))).toEqual([]);
    expect(scan((l) => /\bshadow-(?:lg|xl|2xl)\b/.test(l))).toEqual([]);
  });

  it("5.15 : pas de pilule (pastille arrondie avec du texte) : HudChip ou carré", () => {
    expect(scan((l) => /\brounded-full\b[^"`]*\bpx-\d/.test(l) || /\bpx-\d[^"`]*\brounded-full\b/.test(l))).toEqual([]);
  });

  it("5.15 : libellés en capitales en police mono (ou titre / bouton du HUD)", () => {
    const re = /className="([^"]*)"/g;
    expect(
      scan((l) =>
        [...l.matchAll(re)].some(([, c]) => /(?<![\w:-])uppercase\b/.test(c) && !/font-mono|hud-eyebrow|hud-title|font-display|hud-chip/.test(c)),
      ),
    ).toEqual([]);
  });

  it("5.15 : nombres via formatNumber / formatDecimal, pas toLocaleString", () => {
    expect(scan((l) => /\.toLocaleString\(/.test(l) && !/Date\(|dateStyle|timeStyle|weekday|hour:|month:|day:/.test(l))).toEqual([]);
  });
});

