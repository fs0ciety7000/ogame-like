import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/* 6.14.55 (UX-2, AD-1 et AD-12) : garde des jetons de couleur des 13 thèmes (src/index.css).
   1. Contraste : `--th-text-500` (texte secondaire, `text-slate-500`) ≥ 4,5:1 (WCAG AA) sur `--th-space-600`,
      plus proche du fond réel des panneaux que `space-700` (6.14.96, TH-L4).
   2. Écart (CIEDE2000) entre les couleurs de sens (DESIGN.md « couleur = sens ») : accent, violet (`--th-accent2`),
      ok, danger, or, ember ≥ 15, et accent / texte (`--th-text-100`) ≥ 12. Constellation, thème de toutes les captures,
      respecte tout. Les confusions voulues d'autres thèmes (monochromes : Cockpit, Holo…) sont listées avec leur écart
      actuel : le test échoue si une nouvelle confusion apparaît ou si une confusion listée se resserre. */

type Tokens = Record<string, string>;

function readThemes(): Record<string, Tokens> {
  const css = readFileSync("src/index.css", "utf8");
  const re = /:root(?:,\s*:root)?\[data-theme="([a-z]+)"\]\s*\{([^}]*)\}/g;
  const decl = /--th-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g;
  const out: Record<string, Tokens> = {};
  for (let m = re.exec(css); m; m = re.exec(css)) {
    const t: Tokens = {};
    decl.lastIndex = 0;
    for (let d = decl.exec(m[2]); d; d = decl.exec(m[2])) t[d[1]] = d[2].toLowerCase();
    out[m[1]] = t;
  }
  return out;
}

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (h: string) => {
  const [r, g, b] = rgb(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function lab(h: string): [number, number, number] {
  const [r, g, b] = rgb(h).map(lin);
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
/** Écart perçu entre deux couleurs (CIEDE2000) : < 10 se confond, > 20 se distingue sans effort. */
function deltaE(h1: string, h2: string): number {
  const [L1, a1, b1] = lab(h1);
  const [L2, a2, b2] = lab(h2);
  const rad = Math.PI / 180;
  const Cb = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const hue = (a: number, b: number) => (a === 0 && b === 0 ? 0 : (Math.atan2(b, a) / rad + 360) % 360);
  const h1p = hue(a1p, b1);
  const h2p = hue(a2p, b2);
  const dL = L2 - L1;
  const dC = C2p - C1p;
  let dh = 0;
  if (C1p * C2p) {
    dh = h2p - h1p;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh / 2) * rad);
  const Lb = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hb = h1p + h2p;
  if (C1p * C2p) {
    if (Math.abs(h1p - h2p) > 180) hb += h1p + h2p < 360 ? 360 : -360;
    hb /= 2;
  }
  const T = 1 - 0.17 * Math.cos((hb - 30) * rad) + 0.24 * Math.cos(2 * hb * rad) + 0.32 * Math.cos((3 * hb + 6) * rad) - 0.2 * Math.cos((4 * hb - 63) * rad);
  const dTh = 30 * Math.exp(-(((hb - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTh * rad) * Rc;
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh));
}

const THEMES = readThemes();
const SENSE = ["accent", "accent2", "ok", "danger", "gold", "ember"] as const;
const SENSE_MIN = 15;
const ACCENT_TEXT_MIN = 12;
const TEXT_500_MIN = 4.5;

/** Confusions voulues hors Constellation (identité du thème), avec l'écart mesuré en 6.14.55. À ne pas resserrer. */
const KNOWN: Record<string, Record<string, number>> = {
  holo: { "accent/accent2": 0, "gold/ember": 7.8 },
  cockpit: { "accent/accent2": 0, "accent/ember": 0, "accent2/ember": 0 },
  // netrunner : accent/or et violet/danger levées en 6.14.100 (TH-L5, Q233)
  aurora: { "accent2/ember": 0 }, // 6.14.90 (TH-3) : accent/danger levée (10,1 → 19,5)
  voyageur: { "accent/text-100": 7 },
  omni: { "accent/ember": 7.1, "gold/ember": 11.3 },
  spartan: { "accent2/ok": 7.7 },
  ishimura: { "accent/ember": 14.1, "danger/ember": 14.5 },
  matrice: { "accent/ok": 0 },
};

function pairs(t: Tokens): Record<string, number> {
  const out: Record<string, number> = {};
  for (let i = 0; i < SENSE.length; i++) {
    for (let j = i + 1; j < SENSE.length; j++) out[`${SENSE[i]}/${SENSE[j]}`] = deltaE(t[SENSE[i]], t[SENSE[j]]);
  }
  out["accent/text-100"] = deltaE(t.accent, t["text-100"]);
  return out;
}
const minFor = (pair: string) => (pair === "accent/text-100" ? ACCENT_TEXT_MIN : SENSE_MIN);

describe("6.14.55 : jetons de couleur des thèmes", () => {
  it("lit les 13 thèmes et leurs jetons", () => {
    expect(Object.keys(THEMES).sort()).toEqual(
      ["atlas", "aurora", "cockpit", "constellation", "holo", "ishimura", "matrice", "netrunner", "omni", "signal", "spartan", "tactique", "voyageur"],
    );
    for (const t of Object.values(THEMES)) {
      for (const k of [...SENSE, "text-100", "text-400", "text-500", "space-600", "space-700"]) expect(t[k], k).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("--th-text-500 atteint 4,5:1 sur le fond des panneaux dans chaque thème (AD-12)", () => {
    const low = Object.entries(THEMES)
      .map(([n, t]) => [n, contrast(t["text-500"], t["space-600"])] as const)
      .filter(([, c]) => c < TEXT_500_MIN)
      .map(([n, c]) => `${n} ${c.toFixed(2)}:1`);
    expect(low).toEqual([]);
  });

  it("--th-danger se lit comme texte : ≥ 4,5:1 sur le fond des panneaux (6.14.90, TH-5)", () => {
    // 6.14.148 (revue AU28, TH-danger) : mesuré sur space-600 comme le texte secondaire (7 thèmes à 4,1-4,45:1 relevés).
    const low = Object.entries(THEMES)
      .map(([n, t]) => [n, contrast(t.danger, t["space-600"])] as const)
      .filter(([, c]) => c < TEXT_500_MIN)
      .map(([n, c]) => `${n} ${c.toFixed(2)}:1`);
    expect(low).toEqual([]);
  });

  it("la hiérarchie du texte reste lisible : 400 plus contrasté que 500, lui-même plus que 600", () => {
    for (const [n, t] of Object.entries(THEMES)) {
      const bg = t["space-600"];
      expect(contrast(t["text-400"], bg), n).toBeGreaterThan(contrast(t["text-500"], bg));
      expect(contrast(t["text-500"], bg), n).toBeGreaterThan(contrast(t["text-600"], bg));
    }
  });

  it("ember proche de l'accent : la forme d'attention couvre le thème (6.14.101, TH-L6)", () => {
    const css = readFileSync("src/index.css", "utf8");
    const rule = /:root:is\(([^)]*)\) \.hud-chip\[data-tone="ember"\]/.exec(css);
    expect(rule, "règle de forme de l'ember introuvable").not.toBeNull();
    const covered = new Set([...rule![1].matchAll(/data-theme="([a-z]+)"/g)].map((m) => m[1]));
    const close = Object.entries(THEMES).filter(([, t]) => deltaE(t.accent, t.ember) < SENSE_MIN).map(([n]) => n);
    expect(close.filter((n) => !covered.has(n))).toEqual([]);
  });

  it("Constellation : violet ≠ ember ≠ danger ≠ or, accent ≠ texte (AD-1)", () => {
    const bad = Object.entries(pairs(THEMES.constellation))
      .filter(([p, d]) => d < minFor(p))
      .map(([p, d]) => `${p} ${d.toFixed(1)}`);
    expect(bad).toEqual([]);
  });

  it("aucun thème ne confond deux couleurs de sens hors des confusions listées, et aucune ne se resserre", () => {
    const bad: string[] = [];
    for (const [n, t] of Object.entries(THEMES)) {
      if (n === "constellation") continue;
      for (const [p, d] of Object.entries(pairs(t))) {
        if (d >= minFor(p)) continue;
        const known = KNOWN[n]?.[p];
        if (known === undefined) bad.push(`${n} ${p} ${d.toFixed(1)} (nouvelle confusion)`);
        else if (d < known - 0.5) bad.push(`${n} ${p} ${d.toFixed(1)} < ${known} (resserrée)`);
      }
    }
    expect(bad).toEqual([]);
  });
});
