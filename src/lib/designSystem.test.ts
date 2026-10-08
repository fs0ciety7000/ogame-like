import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/* Design system (docs/DESIGN.md) : les pastilles et encadrés passent par
   HudChip / HudCallout (coins coupés, capitales mono, ton sémantique).
   Garde-fou contre les pilules arrondies écrites à la main. */
function files(dir: string, ext: RegExp = /\.tsx$/): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path, ext) : ext.test(name) ? [path] : [];
  });
}

/** Lignes fautives regroupées par fichier : `{ fichier: nombre }`. */
function byFile(offenders: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const o of offenders) {
    const f = o.slice(0, o.lastIndexOf(":"));
    out[f] = (out[f] ?? 0) + 1;
  }
  return out;
}

/** Cliquet (6.14.83) : un fichier en attente garde au plus son compte d'écarts ; tout autre fichier n'en a aucun.
 *  Une fois le fichier repris, on retire sa ligne (le compte ne peut que baisser). */
function expectRatchet(offenders: string[], pending: Record<string, number>) {
  const found = byFile(offenders);
  const over = Object.entries(found).filter(([f, n]) => n > (pending[f] ?? 0)).map(([f, n]) => `${f} : ${n} (permis ${pending[f] ?? 0})`);
  expect(over).toEqual([]);
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
    // Exceptions gardées (6.14.156, R7) : scènes dessinées en SVG ou canvas (planète, boss, étoiles, verrière du cockpit :
    // le canvas lit les jetons du thème et ne garde un hex qu'en repli ou pour la lumière d'une étoile), rapport imprimé
    // (HTML autonome, sans feuille de style du thème), logo Google (couleurs de marque) et aperçu d'e-mail (fond du client
    // de messagerie, hors thème du jeu).
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

  it("5.16.2 : texte clair via le jeton du thème (text-slate-100), jamais text-white", () => {
    // Voyageur, Constellation… ont leur propre « blanc » (ivoire, os) : text-white l'ignore.
    expect(scan((l) => /(?<![\w-])text-white\b/.test(l))).toEqual([]);
  });

  it("5.16.2 : aucune couleur rgba() écrite dans un composant : color-mix(var(--color-…))", () => {
    // Exceptions gardées (6.14.156, R7) : canvas de la neige et de la verrière du cockpit (un dégradé de canvas ne lit pas
    // color-mix) et rapport imprimé (HTML autonome) : couleurs d'illustration.
    expect(scan((l) => /rgba\(\s*\d/.test(l), /(StatsPrintReport|Snowfall|CockpitViewport)\.tsx$/)).toEqual([]);
  });

  /* 6.14.83 (UX-10) : fichiers modifiés par une autre tâche pendant le lot : écarts comptés (cliquet), à reprendre quand
     ils seront libres. 6.14.86 puis 6.14.156 (R7, UX-13) les ont tous repris : listes vides. */

  it("6.14.83 : arrondis md/lg/xl interdits (coins coupés : hud-cut, hud-cut-sm)", () => {
    const offenders = scan((l) => /\brounded-(?:md|lg|xl)\b/.test(l));
    expectRatchet(offenders, PENDING_ROUNDED);
  });

  it("6.14.82 : pas d'emoji dans le code de l'interface (icônes lucide ou GameIcon ; Q-AD-6 : les données en gardent)", () => {
    // ★ ☆ ↔ sont des signes typographiques (police du texte), pas des emoji.
    const emoji = /(?![★☆↔])\p{Extended_Pictographic}/u;
    const offenders = scan((l) => emoji.test(l));
    expectRatchet(offenders, PENDING_EMOJI);
  });

  it("6.14.83 : plancher de 11 px pour le texte, hors admin (dessins SVG en unités du dessin exceptés)", () => {
    const small = /\btext-\[(?:[0-9]|10)(?:\.\d+)?px\]/;
    const offenders = scan((l) => small.test(l) && !/<text\b|fill-slate/.test(l), /src\/pages\/admin\/|src\/pages\/AdminPage\.tsx$/);
    expectRatchet(offenders, PENDING_SMALL_TEXT);
  });

  it("6.14.156 : plancher de 11 px aussi dans index.css (vue cockpit comprise), hors décor du thème Signal", () => {
    // Bloc CSS (sélecteur + déclarations) dont la taille de police est sous 11 px ; seuls .signal-tag et .signal-barcode,
    // décor du thème Signal (code-barres, étiquette), y échappent (6.14.83).
    const css = readFileSync("src/index.css", "utf8");
    const offenders: string[] = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(css))) {
      const size = /font-size:\s*(\d+(?:\.\d+)?)px/.exec(m[2]);
      if (size && Number(size[1]) < 11 && !/\.signal-(?:tag|barcode)\b/.test(m[1])) offenders.push(m[1].trim());
    }
    expect(offenders).toEqual([]);
  });

  it("6.14.83 : text-slate-600 réservé au décor (icône, filet, séparateur), jamais un texte qui porte une information", () => {
    const decor = (l: string) =>
      /<line\b/.test(l) || /<[A-Z]\w*\s[^>]*className=[^>]*\bh-[\d.]+\b[^>]*\bw-[\d.]+/.test(l) || /<[A-Z]\w*\s+className=\{cn\("h-/.test(l) || /"text-slate-600">(?:\/\/?|—)<\/span>/.test(l);
    const offenders = scan((l) => /(?<![\w-])(?:placeholder:)?text-slate-600\b/.test(l) && !decor(l), /src\/pages\/admin\/|src\/pages\/AdminPage\.tsx$/);
    expectRatchet(offenders, PENDING_SLATE_600);
  });

  it("6.14.83 : dates par formatDateTime (@/lib/utils), jamais toLocale*String dans un composant", () => {
    const offenders: string[] = [];
    for (const file of [...files("src/components", /\.tsx?$/), ...files("src/pages", /\.tsx?$/), ...files("src/lib", /\.tsx?$/), ...files("src/hooks", /\.tsx?$/), ...files("src/services", /\.tsx?$/)]) {
      if (file.includes(".test.") || /src\/lib\/utils\.ts$/.test(file)) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/\.toLocale(?:Date|Time)?String\(/.test(line)) offenders.push(`${file}:${i + 1}`);
        });
    }
    expectRatchet(offenders, PENDING_DATES);
  });

  it("6.14.83 : un décompte passe par useNowTicker / useNowEvery, jamais setInterval(() => setNow(…))", () => {
    // Les intervalles de rafraîchissement de données (rechargement d'un classement…) restent permis.
    const offenders = [...files("src", /\.tsx?$/)].flatMap((file) =>
      file.includes(".test.") || file.includes("src/game/")
        ? []
        : readFileSync(file, "utf8")
            .split("\n")
            .flatMap((line, i) => (/setInterval\(\s*\(\)\s*=>\s*set(?:Now|Tick|Time)\(/.test(line) ? [`${file}:${i + 1}`] : [])),
    );
    // 6.14.86 (UX-11) : la Galaxie lit useNowEvery(1000) ; plus aucune exception.
    expect(offenders).toEqual([]);
  });

  it("6.14.83 : corps de useEffect entre accolades (doublé par la règle eslint no-restricted-syntax)", () => {
    const offenders = [...files("src", /\.tsx?$/)].flatMap((file) =>
      file.includes(".test.")
        ? []
        : readFileSync(file, "utf8")
            .split("\n")
            .flatMap((line, i) => (/\buseEffect\(\s*\(\)\s*=>\s*(?![\s{])/.test(line) ? [`${file}:${i + 1}`] : [])),
    );
    // 6.14.86 : les 3 fichiers de l'admin repris ; la règle eslint est en erreur partout.
    expect(offenders).toEqual([]);
  });
});

/* 6.14.156 (R7, UX-13) : l'admin, la vue cockpit, l'accueil et les Succès sont repris ; plus aucune exception comptée.
   Le cliquet reste prêt pour un prochain lot qui ne pourrait pas tout reprendre d'un coup. */
const PENDING_ROUNDED: Record<string, number> = {};
const PENDING_EMOJI: Record<string, number> = {};
const PENDING_SMALL_TEXT: Record<string, number> = {};
const PENDING_SLATE_600: Record<string, number> = {};
const PENDING_DATES: Record<string, number> = {};
